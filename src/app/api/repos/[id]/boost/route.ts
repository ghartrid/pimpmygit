import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { boostRepo, getRepoById, getUserById } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to boost" }, { status: 401 });
  }

  const { id } = await params;
  const repoId = parseInt(id);
  const repo = getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const success = boostRepo(session.userId, repoId);
  if (!success) {
    return NextResponse.json({ error: "Not enough credits (need 10)" }, { status: 400 });
  }

  const user = getUserById(session.userId);
  return NextResponse.json({
    success: true,
    credits: user?.credits ?? 0,
  });
}
