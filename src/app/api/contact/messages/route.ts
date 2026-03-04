import { NextRequest, NextResponse } from "next/server";
import { getContactMessages } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const messages = await getContactMessages();
  return NextResponse.json({ messages });
}
