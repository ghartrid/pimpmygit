import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { deleteComment } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { commentId } = await params;
  const cid = parseInt(commentId, 10);
  if (!cid || !Number.isFinite(cid)) {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  const deleted = await deleteComment(cid, session.userId);
  if (!deleted) {
    return NextResponse.json({ error: "Comment not found or not yours" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
