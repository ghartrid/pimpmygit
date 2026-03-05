import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getActiveSponsored, createSponsoredSlot, getRepoById, getUserById, SPONSORED_TIERS } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const slots = await getActiveSponsored();
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to sponsor" }, { status: 401 });
  }

  const rl = rateLimit(`sponsor:${session.userId}`, 3, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const repoId = parseInt(body.repoId, 10);
  const slot = parseInt(body.slot, 10);
  const duration = body.duration as string;

  if (!repoId || !Number.isFinite(repoId)) {
    return NextResponse.json({ error: "Invalid repo ID" }, { status: 400 });
  }
  if (slot !== 1 && slot !== 2) {
    return NextResponse.json({ error: "Slot must be 1 or 2" }, { status: 400 });
  }
  if (!(duration in SPONSORED_TIERS)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const repo = await getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const tierInfo = SPONSORED_TIERS[duration as keyof typeof SPONSORED_TIERS];
  const success = await createSponsoredSlot(repoId, session.userId, slot, duration);
  if (!success) {
    return NextResponse.json({ error: `Slot taken or not enough credits (need ${tierInfo.credits})` }, { status: 400 });
  }

  const user = await getUserById(session.userId);
  return NextResponse.json({ success: true, credits: user?.credits ?? 0 });
}
