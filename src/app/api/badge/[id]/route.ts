import { NextRequest, NextResponse } from "next/server";
import { getRepoById } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = rateLimit(`badge:${ip}`, 120, 60000);
  if (!rl.ok) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const repo = await getRepoById(repoId);
  if (!repo) {
    return new NextResponse("Not found", { status: 404 });
  }

  const leftText = "Featured on PimpMyGit";
  const rightText = `${repo.upvote_count} votes`;
  const leftWidth = 150;
  const rightWidth = 60;
  const totalWidth = leftWidth + rightWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#d29922"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="#30363d"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${rightText}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
