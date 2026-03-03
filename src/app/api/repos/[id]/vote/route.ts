import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { toggleVote, getRepoById } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });
  }

  const { id } = await params;
  const repoId = parseInt(id);
  const repo = getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const voted = toggleVote(session.userId, repoId);
  const updatedRepo = getRepoById(repoId);

  return NextResponse.json({
    voted,
    upvote_count: updatedRepo?.upvote_count ?? 0,
  });
}
