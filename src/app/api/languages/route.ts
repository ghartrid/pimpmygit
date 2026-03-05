import { NextResponse } from "next/server";
import { getLanguages } from "@/lib/db";

export async function GET() {
  const languages = await getLanguages();
  return NextResponse.json({ languages });
}
