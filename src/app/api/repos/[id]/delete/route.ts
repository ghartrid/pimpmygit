import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { deleteRepo } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = rateLimit(`delete-repo:${session.userId}`, 10, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return NextResponse.json({ error: "Invalid repo ID" }, { status: 400 });
  }

  const deleted = await deleteRepo(repoId, session.userId);
  if (!deleted) {
    return NextResponse.json({ error: "Repo not found or not yours" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
