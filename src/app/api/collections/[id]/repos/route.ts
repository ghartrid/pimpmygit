import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { addRepoToCollection, removeRepoFromCollection } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  const body = await req.json();
  const repoId = parseInt(body.repoId, 10);

  if (!collectionId || !repoId) {
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
  }

  const added = await addRepoToCollection(collectionId, repoId, session.userId);
  if (!added) {
    return NextResponse.json({ error: "Failed to add (not your collection or already added)" }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  const body = await req.json();
  const repoId = parseInt(body.repoId, 10);

  if (!collectionId || !repoId) {
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
  }

  const removed = await removeRepoFromCollection(collectionId, repoId, session.userId);
  if (!removed) {
    return NextResponse.json({ error: "Failed to remove" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
