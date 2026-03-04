import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { addCredits, getUserById, capturePaypalOrder } from "@/lib/db";

const PACKAGES: Record<string, { credits: number; price: string }> = {
  small: { credits: 10, price: "5.00" },
  medium: { credits: 25, price: "10.00" },
  large: { credits: 50, price: "18.00" },
};

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to buy credits" }, { status: 401 });
  }

  const body = await req.json();
  const orderID = body.orderID as string;

  if (!orderID) {
    return NextResponse.json({ error: "Missing orderID" }, { status: 400 });
  }

  // Look up order-package binding from DB (prevents client from choosing package)
  // Also marks as captured atomically (prevents replay/double-credit)
  const order = await capturePaypalOrder(orderID);
  if (!order) {
    return NextResponse.json({ error: "Order not found or already captured" }, { status: 400 });
  }

  // Verify the order belongs to this user
  if (order.userId !== session.userId) {
    return NextResponse.json({ error: "Order does not belong to you" }, { status: 403 });
  }

  const pkg = PACKAGES[order.packageId];
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getPayPalAccessToken();
  } catch {
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }

  // Capture the payment
  const captureRes = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const captureData = await captureRes.json();

  if (!captureRes.ok || captureData.status !== "COMPLETED") {
    return NextResponse.json({ error: "Payment capture failed" }, { status: 500 });
  }

  // Verify the captured amount and currency match the package price
  const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
  const capturedAmount = parseFloat(capture?.amount?.value);
  const capturedCurrency = capture?.amount?.currency_code;
  if (isNaN(capturedAmount) || capturedAmount !== parseFloat(pkg.price)) {
    return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
  }
  if (capturedCurrency !== "USD") {
    return NextResponse.json({ error: "Invalid payment currency" }, { status: 400 });
  }

  // Payment verified — add credits
  await addCredits(session.userId, pkg.credits);
  const user = await getUserById(session.userId);

  return NextResponse.json({
    success: true,
    credits: user?.credits ?? 0,
    purchased: pkg.credits,
  });
}
