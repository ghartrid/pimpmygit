import { NextResponse } from "next/server";
import { incrementPageViews, getPageViews } from "@/lib/db";

export async function POST() {
  const count = await incrementPageViews();
  return NextResponse.json({ count });
}

export async function GET() {
  const count = await getPageViews();
  return NextResponse.json({ count });
}
