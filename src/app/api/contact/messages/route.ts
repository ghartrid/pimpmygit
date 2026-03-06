import { NextRequest, NextResponse } from "next/server";
import { getContactMessages } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const messages = await getContactMessages();
  return NextResponse.json({ messages });
}
