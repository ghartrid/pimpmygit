import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    siteKey: process.env.HCAPTCHA_SITE_KEY || "",
  });
}
