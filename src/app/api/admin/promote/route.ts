import { NextRequest, NextResponse } from "next/server";
import { getRepos, getReposCount, getPageViews } from "@/lib/db";
import { checkAdminAuth } from "@/lib/rate-limit";

// ── Competitor Intelligence ──
const COMPETITORS = [
  { name: "GitHub Trending", weakness: "Repos rotate off daily, no voting, no persistence", advantage: "PimpMyGit has permanent listings with community voting" },
  { name: "Product Hunt", weakness: "Not GitHub-focused, one-day window, saturated with SaaS", advantage: "PimpMyGit is exclusively for repos with persistent visibility" },
  { name: "awesome-* lists", weakness: "Static PRs, no engagement metrics, fragmented", advantage: "PimpMyGit is dynamic with real-time voting and trending" },
  { name: "LibHunt", weakness: "Aggregator feel, ad-heavy, language-siloed", advantage: "PimpMyGit has community curation and cross-language browsing" },
  { name: "Hacker News", weakness: "Repos compete with all content, brief window", advantage: "PimpMyGit is dedicated to repos with language filters and boosting" },
];

// ── Audience Personas ──
const AUDIENCES = [
  { name: "Open Source Maintainer", hook: "Your repo deserves more visibility. Submit it, get upvotes, climb trending.", platforms: "X, Reddit, HN, DEV.to" },
  { name: "Developer / Browser", hook: "GitHub has 300M+ repos. Finding the good ones is the hard part. We built a front page.", platforms: "X, Reddit, HN, DEV.to, LinkedIn" },
  { name: "Indie Hacker", hook: "Free distribution for your open-source project. Built by an indie hacker, for indie hackers.", platforms: "X, Reddit, LinkedIn, DEV.to" },
  { name: "Tech Lead / CTO", hook: "Community-curated repos. See what developers are actually voting for.", platforms: "LinkedIn, HN" },
];

// ── Outreach Targets ──
const OUTREACH = [
  { name: "TLDR Newsletter", relevance: "high", pitch: "Community-curated GitHub repo discovery (like Product Hunt for open source)" },
  { name: "JavaScript Weekly", relevance: "high", pitch: "Trending JS repos voted by the community" },
  { name: "Console.dev", relevance: "high", pitch: "Open-source GitHub repo discovery platform (MIT)" },
  { name: "Changelog", relevance: "high", pitch: "Community-driven GitHub repo curation. Open source, free, growing." },
  { name: "Hacker Newsletter", relevance: "high", pitch: "Product Hunt for GitHub repos" },
  { name: "Python Weekly", relevance: "medium", pitch: "Python repos curated by the developer community" },
  { name: "Bytes (UI.dev)", relevance: "medium", pitch: "The missing discovery layer for GitHub repos" },
  { name: "Rust This Week", relevance: "low", pitch: "Community-voted Rust repos on PimpMyGit" },
];

// ── SEO Keywords ──
const SEO_KEYWORDS = {
  primary: [
    "discover github repos", "best github repositories", "trending github repos",
    "github repo discovery", "upvote github repos", "open source discovery",
    "product hunt for github", "find github projects", "github repo ranking",
    "community curated github", "best open source projects",
  ],
  longTail: [
    "how to promote github repo", "get more github stars", "github repo visibility",
    "submit github project for review", "github repo promotion free",
    "curated list of github repos", "alternative to github trending",
    "find underrated github repos", "github project discovery platform",
  ],
};

// ── Schedule ──
const SCHEDULE = {
  optimal: [
    { platform: "X / Twitter", days: "Tue-Thu", times: "9-11am EST", note: "Developer Twitter peaks mid-morning" },
    { platform: "Reddit", days: "Mon-Wed", times: "8-10am EST", note: "Early morning gains momentum" },
    { platform: "Hacker News", days: "Tue-Thu", times: "8-10am EST", note: "One shot per URL — make it count" },
    { platform: "LinkedIn", days: "Tue-Thu", times: "7-9am EST", note: "Professional before-work scroll" },
    { platform: "DEV.to", days: "Mon-Wed", times: "Any", note: "Articles have long SEO shelf life" },
  ],
  weekly: [
    { day: "Monday", task: "LinkedIn post (professional angle) + seed a Reddit thread" },
    { day: "Tuesday", task: "X thread (repo spotlight or hot take) — best HN day" },
    { day: "Wednesday", task: "X post (community stats) + Reddit language subreddit" },
    { day: "Thursday", task: "LinkedIn (build in public update) + X engagement" },
    { day: "Friday", task: "DEV.to article + X weekly roundup" },
  ],
};

// ── Content Angle Templates ──
function generateContent(
  totalRepos: number, totalVotes: number, pageViews: number,
  submitters: number, topLangs: { lang: string; count: number }[],
  topRepo: { name: string; votes: number; stars: number } | null,
  recentRepo: { name: string; desc: string; lang: string } | null,
) {
  const url = "https://pimpmygit.com";
  const posts: { platform: string; angle: string; score: number; text: string }[] = [];

  function score(text: string, platform: string): number {
    let s = 50;
    if (text.includes("?")) s += 8;
    if (/\d/.test(text)) s += 5;
    if (text.toLowerCase().includes("free")) s += 3;
    if (text.toLowerCase().includes("open source")) s += 4;
    if (text.includes("\n\n")) s += 3;
    if (platform === "x" && text.length <= 200) s += 5;
    if (platform === "x" && text.length > 250) s -= 5;
    if (platform === "reddit" && text.toLowerCase().includes("feedback")) s += 5;
    if (platform === "reddit" && text.length > 200) s += 3;
    if (platform === "linkedin" && text.includes("#")) s += 2;
    if (text.includes(url)) s += 5;
    return Math.min(100, s);
  }

  // X posts
  const xPosts = [
    { angle: "Stats Showcase", text: `${totalRepos} GitHub repos. ${totalVotes} community votes. ${pageViews.toLocaleString()} views.\n\nPimpMyGit is the front page for open source.\n\n${topRepo ? `Trending: ${topRepo.name}` : ""}\n\n${url}` },
    { angle: "Problem > Solution", text: `GitHub has 300M+ repos.\nFinding the good ones? That's the hard part.\n\nPimpMyGit: community-curated discovery for GitHub repos.\n\nTrending. Voted. Filtered by language.\n\n${url}` },
    { angle: "Question Hook", text: `What's the most underrated GitHub repo you've found this year?\n\nShare it on PimpMyGit and let the community decide:\n${url}/submit` },
    { angle: "Submit CTA", text: `Your open-source project deserves more eyes.\n\nSubmit it to PimpMyGit:\n- Get community upvotes\n- Climb the trending page\n- Reach developers who care\n\nFree. Takes 30 seconds.\n\n${url}/submit` },
    { angle: "Community Growth", text: `PimpMyGit community update:\n\n${totalRepos} repos\n${totalVotes} votes\n${submitters} contributors\n${pageViews.toLocaleString()} views\n\nWhat should be trending next?\n\n${url}` },
    { angle: "Hot Take", text: `GitHub stars are a vanity metric.\n\nCommunity votes on PimpMyGit are a better signal of quality.\n\n${url}` },
    { angle: "Differentiator", text: `Why PimpMyGit over GitHub trending?\n\nCommunity-curated. Persistent. Votable.\nPlus: comments, collections, badges, API.\n\n${url}` },
  ];
  if (recentRepo) {
    xPosts.push({ angle: "Repo Spotlight", text: `Spotlight: ${recentRepo.name}\n\n${recentRepo.desc}\n${recentRepo.lang ? `| ${recentRepo.lang}` : ""}\n\nDiscover it on PimpMyGit:\n${url}` });
  }
  if (topLangs.length) {
    const lang = topLangs[0];
    xPosts.push({ angle: "Language Focus", text: `${lang.lang} developers: ${lang.count} ${lang.lang} repos on PimpMyGit.\n\nDiscover, upvote, and boost the best ones.\n\n${url}/language/${encodeURIComponent(lang.lang)}` });
  }
  for (const p of xPosts) {
    const t = p.text.length > 280 ? p.text.slice(0, 277) + "..." : p.text;
    posts.push({ platform: "X / Twitter", angle: p.angle, score: score(t, "x"), text: t });
  }

  // Reddit
  posts.push({
    platform: "Reddit",
    angle: "Launch Post",
    score: score("feedback open source github discovery", "reddit"),
    text: `Title: I built PimpMyGit — a "Product Hunt for GitHub repos"\n\nSubreddits: r/opensource, r/github, r/webdev, r/SideProject\n\nI built PimpMyGit (${url}) as a discovery platform for GitHub repos.\n\nGitHub has millions of repos but no great way to surface hidden gems. PimpMyGit adds community curation: submit, upvote, and browse by trending/new/top.\n\nCurrent: ${totalRepos} repos, ${totalVotes} votes, ${submitters} contributors.\n\nFeatures: Language filtering, threaded comments, collections, embeddable badges, public API, RSS, dark/light theme. Open source (MIT).\n\nWould love feedback — what features would make this useful?\n\n${url}`,
  });

  // LinkedIn
  posts.push({
    platform: "LinkedIn",
    angle: "Professional Story",
    score: score("open source github discovery #OpenSource", "linkedin"),
    text: `The open-source discovery problem is real.\n\nGitHub has 300M+ repositories. Finding quality tools? Still mostly word of mouth.\n\nI built PimpMyGit to fix this.\n\nA community-curated platform where developers submit repos, upvote the best, and browse trending/new/top.\n\nCurrent traction:\n- ${totalRepos} repositories listed\n- ${totalVotes} community votes\n- ${submitters} contributors\n- ${pageViews.toLocaleString()} page views\n\nOpen source (MIT) and free to use.\n\n${url}\n\n#OpenSource #GitHub #WebDevelopment #IndieHacker`,
  });

  // HN
  posts.push({
    platform: "Hacker News",
    angle: "Show HN",
    score: score("show hn discovery feedback", "hn"),
    text: `Title: Show HN: PimpMyGit - Community-curated discovery for GitHub repos\nURL: ${url}\n\nI built PimpMyGit as a discovery layer for GitHub. ${totalRepos} repos listed, ${totalVotes} community votes.\n\nGitHub is great for hosting code but poor for discovering it. Stars are noisy, trending rotates daily, awesome-lists are static.\n\nPimpMyGit adds: community voting, trending/new/top, language filtering, comments, collections, badges, and a public API.\n\nBuilt with Next.js + TypeScript + SQLite. Open source (MIT).\n\nFeedback welcome.`,
  });

  posts.sort((a, b) => b.score - a.score);
  return posts;
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch live data from DB
  const [allRepos, totalRepos, pageViews] = await Promise.all([
    getRepos({ sort: "trending", limit: 100, offset: 0 }),
    getReposCount({}),
    getPageViews(),
  ]);

  // Compute stats
  const totalVotes = allRepos.reduce((s, r) => s + ((r.upvote_count as number) || 0), 0);
  const totalStars = allRepos.reduce((s, r) => s + ((r.stars as number) || 0), 0);
  const submitters = new Set(allRepos.map((r) => r.submitted_by_username).filter(Boolean)).size;

  const langs: Record<string, number> = {};
  for (const r of allRepos) {
    const lang = (r.language as string) || "Unknown";
    langs[lang] = (langs[lang] || 0) + 1;
  }
  const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([lang, count]) => ({ lang, count }));

  const sorted = [...allRepos].sort((a, b) => ((b.upvote_count as number) || 0) - ((a.upvote_count as number) || 0));
  const topRepo = sorted[0] ? { name: `${sorted[0].owner}/${sorted[0].name}`, votes: sorted[0].upvote_count as number, stars: sorted[0].stars as number } : null;
  const recentRepo = allRepos[0] ? { name: `${allRepos[0].owner}/${allRepos[0].name}`, desc: ((allRepos[0].description as string) || "").slice(0, 100), lang: allRepos[0].language as string } : null;

  // Determine stage
  let stage = "launch";
  if (totalRepos >= 500) stage = "scaling";
  else if (totalRepos >= 100) stage = "growth";
  else if (totalRepos >= 20) stage = "early";

  // Determine momentum (simple heuristic based on current state)
  let momentum = "neutral";
  if (totalRepos < 5 && totalVotes < 10) momentum = "stagnant";
  else if (totalRepos >= 50 && totalVotes >= 100) momentum = "surging";
  else if (totalRepos >= 20 && totalVotes >= 30) momentum = "growing";

  // Strengths / Weaknesses / Opportunities
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];

  if (topLangs.length >= 5) strengths.push(`Good language diversity (${topLangs.length} languages)`);
  else weaknesses.push(`Low language diversity (${topLangs.length}) — recruit Python/Rust/Go repos`);

  if (totalStars > 100) strengths.push("Repos with strong GitHub traction listed");
  if (totalRepos < 50) weaknesses.push("Low content volume — need more repos for discovery value");
  if (submitters < 5) weaknesses.push("Small submitter base — need more users contributing");

  opportunities.push("Cross-post trending repos to language-specific communities");
  opportunities.push("Reach out to awesome-list maintainers");
  opportunities.push("Create weekly 'Top 5 repos' thread on X");
  if (topLangs.length < 5) opportunities.push("Target underrepresented language communities");

  if (stage === "launch") {
    recommendations.push("PRIORITY: Seed content — submit 20+ quality repos across 5+ languages");
    recommendations.push("Get 5+ unique submitters (ask developer friends to submit their repos)");
    recommendations.push("Post daily on X with repo spotlights");
    recommendations.push("Submit to Show HN once you have 20+ repos");
  } else if (stage === "early") {
    recommendations.push("Start a weekly 'Trending on PimpMyGit' thread on X");
    recommendations.push("Reach out to newsletter authors");
    recommendations.push("Create language-specific collections to share in those communities");
    recommendations.push("Add PimpMyGit badge to your own repos' READMEs");
  } else if (stage === "growth") {
    recommendations.push("Launch 'Repo of the Week' series across all platforms");
    recommendations.push("Build partnerships with dev influencers");
    recommendations.push("Consider a blog/changelog for SEO content");
  } else {
    recommendations.push("Automate social posting with trending repo updates");
    recommendations.push("Add email digest for users (weekly trending)");
    recommendations.push("Explore API partnerships");
  }

  // Insights
  const insights: string[] = [];
  if (totalRepos > 0 && totalVotes > 0) {
    const vpr = (totalVotes / totalRepos).toFixed(1);
    insights.push(`${vpr} votes per repo on average`);
  }
  if (submitters > 0 && totalRepos > 0) {
    const rps = (totalRepos / submitters).toFixed(1);
    insights.push(`${rps} repos per submitter — ${submitters > totalRepos * 0.7 ? "good diversity" : "power users dominating"}`);
  }
  insights.push(`${totalRepos} repos | ${totalVotes} votes | ${submitters} contributors | ${pageViews.toLocaleString()} views`);

  // Generate content
  const content = generateContent(totalRepos, totalVotes, pageViews, submitters, topLangs, topRepo, recentRepo);

  // Lang-specific SEO
  const langKeywords = topLangs.slice(0, 5).flatMap((l) => [
    `best ${l.lang.toLowerCase()} github repos`,
    `trending ${l.lang.toLowerCase()} repositories`,
  ]);

  return NextResponse.json({
    stage,
    momentum,
    stats: { totalRepos, totalVotes, totalStars, pageViews, submitters, topLangs },
    insights,
    strengths,
    weaknesses,
    opportunities,
    recommendations,
    content,
    competitors: COMPETITORS,
    audiences: AUDIENCES,
    outreach: OUTREACH,
    schedule: SCHEDULE,
    seo: { ...SEO_KEYWORDS, langKeywords },
  });
}
