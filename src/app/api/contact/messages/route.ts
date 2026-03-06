import { NextRequest, NextResponse } from "next/server";
import { getContactMessages } from "@/lib/db";
import { checkAdminAuth } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const messages = await getContactMessages();
  return NextResponse.json({ messages });
}
