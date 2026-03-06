import { NextResponse } from "next/server";
import { getRepos, getReposCount, getLanguages, getPageViews } from "@/lib/db";

export async function GET() {
  const [repos, totalRepos, languages, pageViews] = await Promise.all([
    getRepos({ sort: "trending", limit: 100, offset: 0 }),
    getReposCount({}),
    getLanguages(),
    getPageViews(),
  ]);

  const totalVotes = repos.reduce((s, r) => s + ((r.upvote_count as number) || 0), 0);
  const totalStars = repos.reduce((s, r) => s + ((r.stars as number) || 0), 0);
  const submitters = new Set(repos.map((r) => r.submitted_by_username).filter(Boolean)).size;

  const topLangs = languages.slice(0, 10);

  const trending = repos.slice(0, 5).map((r) => ({
    owner: r.owner,
    name: r.name,
    description: ((r.description as string) || "").slice(0, 120),
    language: r.language,
    stars: r.stars,
    votes: r.upvote_count,
    id: r.id,
  }));

  const newest = [...repos]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 5)
    .map((r) => ({
      owner: r.owner,
      name: r.name,
      description: ((r.description as string) || "").slice(0, 120),
      language: r.language,
      stars: r.stars,
      votes: r.upvote_count,
      id: r.id,
      created_at: r.created_at,
    }));

  return NextResponse.json({
    totalRepos,
    totalVotes,
    totalStars,
    pageViews,
    submitters,
    topLanguages: topLangs,
    trending,
    newest,
  });
}
