import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getCommentsByRepo, createComment, getRepoById } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = rateLimit(`comments-read:${ip}`, 60, 60000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return NextResponse.json({ error: "Invalid repo ID" }, { status: 400 });
  }

  const comments = await getCommentsByRepo(repoId);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }

  const rl = rateLimit(`comments-write:${session.userId}`, 10, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many comments. Try again later." }, { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return NextResponse.json({ error: "Invalid repo ID" }, { status: 400 });
  }

  const repo = await getRepoById(repoId);
  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const body = await req.json();
  const text = (body.body as string || "").trim();
  if (!text || text.length > 1000) {
    return NextResponse.json({ error: "Comment must be 1-1000 characters" }, { status: 400 });
  }

  const parentId = body.parentId ? parseInt(body.parentId, 10) : undefined;

  const commentId = await createComment(repoId, session.userId, text, parentId);
  if (!commentId) {
    return NextResponse.json({ error: "Failed to create comment" }, { status: 400 });
  }

  return NextResponse.json({ id: commentId }, { status: 201 });
}
