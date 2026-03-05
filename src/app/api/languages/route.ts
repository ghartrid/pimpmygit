import { NextRequest, NextResponse } from "next/server";
import { getLanguages } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`languages:${ip}`, 60, 60000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const languages = await getLanguages();
  return NextResponse.json({ languages });
}
