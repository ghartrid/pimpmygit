import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { createPaypalOrder } from "@/lib/db";

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
  const packageId = body.package as string;
  const pkg = PACKAGES[packageId];
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 });
  }

  let accessToken: string;
  try {
    accessToken = await getPayPalAccessToken();
  } catch {
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 503 });
  }

  const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: pkg.price,
          },
          description: `PimpMyGit - ${pkg.credits} credits`,
        },
      ],
    }),
  });

  const order = await orderRes.json();

  if (!orderRes.ok) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  // Store order-package binding server-side
  await createPaypalOrder(order.id, session.userId, packageId);

  return NextResponse.json({ id: order.id });
}
