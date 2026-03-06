import { NextRequest, NextResponse } from "next/server";
import {
  getAdminStats,
  adminGetAllRepos,
  adminGetAllUsers,
  adminGetAllComments,
  adminDeleteRepo,
  adminDeleteComment,
  getContactMessages,
} from "@/lib/db";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;
  return !!token && auth === `Bearer ${token}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "stats";

  switch (section) {
    case "stats":
      return NextResponse.json(await getAdminStats());
    case "repos":
      return NextResponse.json({ repos: await adminGetAllRepos() });
    case "users":
      return NextResponse.json({ users: await adminGetAllUsers() });
    case "comments":
      return NextResponse.json({ comments: await adminGetAllComments() });
    case "messages":
      return NextResponse.json({ messages: await getContactMessages() });
    default:
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, id } = body;

  if (!id || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  switch (type) {
    case "repo":
      return NextResponse.json({ deleted: await adminDeleteRepo(id) });
    case "comment":
      return NextResponse.json({ deleted: await adminDeleteComment(id) });
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
}
