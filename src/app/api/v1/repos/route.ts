import { NextRequest, NextResponse } from "next/server";
import { getRepos, getReposCount } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`api-v1:${ip}`, 60, 60000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, {
      status: 429,
      headers: { "X-RateLimit-Remaining": "0" },
    });
  }

  const { searchParams } = new URL(req.url);
  const sort = (searchParams.get("sort") as "trending" | "new" | "top") || "trending";
  const search = searchParams.get("search") || undefined;
  const language = searchParams.get("language") || undefined;
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30), 100);
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);

  const [repos, total] = await Promise.all([
    getRepos({ sort, search, language, limit, offset }),
    getReposCount({ search, language }),
  ]);

  const data = repos.map((r) => ({
    id: r.id,
    github_url: r.github_url,
    owner: r.owner,
    name: r.name,
    description: r.description,
    stars: r.stars,
    language: r.language,
    upvote_count: r.upvote_count,
    is_boosted: r.boost_until ? new Date(r.boost_until + "Z") > new Date() : false,
    submitted_by: r.submitted_by_username,
    created_at: r.created_at,
  }));

  return NextResponse.json(
    { data, meta: { total, limit, offset } },
    { headers: { "X-RateLimit-Remaining": String(rl.remaining) } }
  );
}
