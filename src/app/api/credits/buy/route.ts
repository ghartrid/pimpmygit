import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { addCredits, getUserById } from "@/lib/db";

const PACKAGES: Record<string, { credits: number; price: string }> = {
  small: { credits: 10, price: "$5" },
  medium: { credits: 25, price: "$10" },
  large: { credits: 50, price: "$18" },
};

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

  // Mock payment — just add credits
  await addCredits(session.userId, pkg.credits);
  const user = await getUserById(session.userId);

  return NextResponse.json({
    success: true,
    credits: user?.credits ?? 0,
    purchased: pkg.credits,
  });
}
