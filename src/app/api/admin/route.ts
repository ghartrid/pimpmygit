import { NextRequest, NextResponse } from "next/server";
import {
  getAdminStats,
  adminGetAllRepos,
  adminGetAllUsers,
  adminGetAllComments,
  adminDeleteRepo,
  adminDeleteComment,
  getContactMessages,
  getChatLogs,
  getChatInsights,
} from "@/lib/db";
import { checkAdminAuth, rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`admin:${ip}`, 60, 60000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!checkAdminAuth(req)) {
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
    case "chatlog": {
      const [logs, insights] = await Promise.all([getChatLogs(200), getChatInsights()]);
      return NextResponse.json({ logs, insights });
    }
    default:
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
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
