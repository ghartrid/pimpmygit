import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getCollectionById, getCollectionRepos, deleteCollection } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (!collectionId || !Number.isFinite(collectionId)) {
    return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
  }

  const collection = await getCollectionById(collectionId);
  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  // Private collections only visible to owner
  if (!collection.is_public) {
    const session = (await getServerSession(authOptions)) as ExtendedSession | null;
    if (collection.user_id !== session?.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
  }

  const repos = await getCollectionRepos(collectionId);
  return NextResponse.json({ collection, repos });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = parseInt(id, 10);
  if (!collectionId || !Number.isFinite(collectionId)) {
    return NextResponse.json({ error: "Invalid collection ID" }, { status: 400 });
  }

  const deleted = await deleteCollection(collectionId, session.userId);
  if (!deleted) {
    return NextResponse.json({ error: "Collection not found or not yours" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
