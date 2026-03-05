import { NextResponse } from "next/server";
import { getRepos } from "@/lib/db";

export async function GET() {
  const repos = await getRepos({ sort: "trending", limit: 30 });

  const items = repos
    .map((r) => {
      const pubDate = new Date(r.created_at + "Z").toUTCString();
      const desc = (r.description || "No description")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      return `    <item>
      <title>${r.owner}/${r.name}</title>
      <link>https://pimpmygit.com/repo/${r.id}</link>
      <description>${desc} | ${r.stars} stars | ${r.language || "Unknown"} | ${r.upvote_count} votes</description>
      <pubDate>${pubDate}</pubDate>
      <guid>https://pimpmygit.com/repo/${r.id}</guid>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PimpMyGit - Trending Repos</title>
    <link>https://pimpmygit.com</link>
    <description>Trending GitHub repositories on PimpMyGit</description>
    <atom:link href="https://pimpmygit.com/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
