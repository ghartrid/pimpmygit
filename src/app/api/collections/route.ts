import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getPublicCollections, getCollectionsByUser, createCollection } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user");

  if (userId) {
    const uid = parseInt(userId, 10);
    const isOwner = session?.userId === uid;
    const collections = await getCollectionsByUser(uid, isOwner);
    return NextResponse.json({ collections });
  }

  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
  const collections = await getPublicCollections(limit, offset);
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to create collections" }, { status: 401 });
  }

  const rl = rateLimit(`create-collection:${session.userId}`, 10, 3600000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const title = (body.title as string || "").trim();
  const description = (body.description as string || "").trim();

  if (!title || title.length > 100) {
    return NextResponse.json({ error: "Title is required (max 100 chars)" }, { status: 400 });
  }
  if (description.length > 500) {
    return NextResponse.json({ error: "Description too long (max 500 chars)" }, { status: 400 });
  }

  const id = await createCollection(session.userId, title, description);
  return NextResponse.json({ id }, { status: 201 });
}
