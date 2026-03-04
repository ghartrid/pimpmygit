import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { addCredits, getUserById } from "@/lib/db";

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
  const packageId = body.package as string;

  if (!orderID || !packageId) {
    return NextResponse.json({ error: "Missing orderID or package" }, { status: 400 });
  }

  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  const accessToken = await getPayPalAccessToken();

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
    console.error("PayPal capture error:", captureData);
    return NextResponse.json({ error: "Payment capture failed" }, { status: 500 });
  }

  // Verify the captured amount matches the package price
  const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
  const capturedAmount = capture?.amount?.value;
  if (capturedAmount !== pkg.price) {
    console.error("Amount mismatch:", capturedAmount, "vs", pkg.price);
    return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
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
