import { NextResponse } from "next/server";
import { getRepos, getReposCount, getLanguages, getPageViews } from "@/lib/db";

export async function GET() {
  const [allRepos, totalRepos, languages, pageViews] = await Promise.all([
    getRepos({ sort: "new", limit: 200, offset: 0 }),
    getReposCount({}),
    getLanguages(),
    getPageViews(),
  ]);

  // Determine the week window (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStart = weekAgo.toISOString().split("T")[0];
  const weekEnd = now.toISOString().split("T")[0];

  // Filter repos added this week
  const thisWeekRepos = allRepos.filter((r) => {
    const created = String(r.created_at || "");
    return created >= weekStart;
  });

  // Top voted this week
  const topVoted = [...thisWeekRepos]
    .sort((a, b) => ((b.upvote_count as number) || 0) - ((a.upvote_count as number) || 0))
    .slice(0, 5)
    .map((r) => ({
      owner: r.owner,
      name: r.name,
      description: ((r.description as string) || "").slice(0, 120),
      language: r.language,
      stars: r.stars,
      votes: r.upvote_count,
      id: r.id,
    }));

  // All new repos this week
  const newRepos = thisWeekRepos.slice(0, 10).map((r) => ({
    owner: r.owner,
    name: r.name,
    description: ((r.description as string) || "").slice(0, 120),
    language: r.language,
    stars: r.stars,
    votes: r.upvote_count,
    id: r.id,
    created_at: r.created_at,
  }));

  // This week's stats
  const weekVotes = thisWeekRepos.reduce((s, r) => s + ((r.upvote_count as number) || 0), 0);

  // Language breakdown for new repos this week
  const langMap: Record<string, number> = {};
  for (const r of thisWeekRepos) {
    const lang = (r.language as string) || "Unknown";
    langMap[lang] = (langMap[lang] || 0) + 1;
  }
  const weekLanguages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language, count]) => ({ language, count }));

  return NextResponse.json({
    weekStart,
    weekEnd,
    newCount: thisWeekRepos.length,
    weekVotes,
    totalRepos,
    pageViews,
    topLanguages: languages.slice(0, 5),
    weekLanguages,
    topVoted,
    newRepos,
  });
}
