import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getRepoById, getUserVotes } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const repo = await getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  let hasVoted = false;
  if (session?.userId) {
    const votes = await getUserVotes(session.userId);
    hasVoted = votes.includes(repoId);
  }

  return NextResponse.json({
    repo: {
      ...repo,
      hasVoted,
      isBoosted: repo.boost_until ? new Date(repo.boost_until + "Z") > new Date() : false,
    },
  });
}
