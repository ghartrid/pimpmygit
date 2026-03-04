import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { boostRepo, getRepoById, getUserById } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to boost" }, { status: 401 });
  }

  // Rate limit: 5 boosts per hour per user
  const rl = rateLimit(`boost:${session.userId}`, 5, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many boost attempts. Try again later." }, { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id);
  if (!Number.isFinite(repoId) || repoId < 1) {
    return NextResponse.json({ error: "Invalid repo ID" }, { status: 400 });
  }
  const repo = await getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const success = await boostRepo(session.userId, repoId);
  if (!success) {
    return NextResponse.json({ error: "Not enough credits (need 10)" }, { status: 400 });
  }

  const user = await getUserById(session.userId);
  return NextResponse.json({
    success: true,
    credits: user?.credits ?? 0,
  });
}
