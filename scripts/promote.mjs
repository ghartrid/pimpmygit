#!/usr/bin/env node
/**
 * PimpMyGit Promotion Agent
 *
 * Fetches live site data, builds a knowledge base, and generates
 * platform-specific promotional content.
 *
 * Usage:
 *   node scripts/promote.mjs                  # full run: fetch + generate
 *   node scripts/promote.mjs --fetch          # just update knowledge base
 *   node scripts/promote.mjs --generate       # just generate content from existing knowledge
 *   node scripts/promote.mjs --platform x     # generate for specific platform
 *   node scripts/promote.mjs --history        # show promotion history
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_PATH = path.join(__dirname, "promotion-knowledge.json");
const SITE_URL = "https://pimpmygit.com";
const API_URL = `${SITE_URL}/api/v1/repos`;

// ── Knowledge Base ──

function loadKnowledge() {
  try {
    return JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf-8"));
  } catch {
    return {
      site: {
        name: "PimpMyGit",
        url: SITE_URL,
        tagline: "The Missing Front Page for GitHub",
        description: "Discover, upvote, and boost the best GitHub repositories. Like Product Hunt, but for open-source repos.",
        launched: "2026-03",
        productHunt: "https://www.producthunt.com/products/pimpmygit",
        github: "https://github.com/ghartrid/pimpmygit",
        features: [
          "Submit and upvote GitHub repos",
          "Trending/New/Top sorting with search",
          "Boost repos for visibility (credits system)",
          "Sponsored homepage slots",
          "Threaded comments",
          "User collections (curated lists)",
          "Embeddable vote badges",
          "Public API for developers",
          "RSS feed",
          "Language-filtered browsing",
          "Dark/light theme",
          "Per-repo OG social cards",
          "Dynamic sitemap for SEO",
          "GitHub OAuth sign-in",
        ],
        stack: "Next.js, TypeScript, SQLite, Tailwind CSS, Railway",
        differentiators: [
          "Focused solely on GitHub repos (not general products)",
          "Free to submit and vote",
          "Open source (MIT license)",
          "Built by a solo developer",
          "No sign-up required to browse",
          "Lightweight and fast",
        ],
      },
      snapshots: [],
      promotions: [],
      talkingPoints: [],
    };
  }
}

function saveKnowledge(kb) {
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(kb, null, 2));
}

// ── Data Fetching ──

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function fetchSiteData() {
  console.log("Fetching site data...");

  const [trending, newest, top, viewsRes] = await Promise.all([
    fetchJSON(`${API_URL}?sort=trending&limit=100`),
    fetchJSON(`${API_URL}?sort=new&limit=20`),
    fetchJSON(`${API_URL}?sort=top&limit=20`),
    fetchJSON(`${SITE_URL}/api/views`).catch(() => ({ count: 0 })),
  ]);

  const allRepos = trending.data || [];
  const totalRepos = trending.meta?.total || allRepos.length;

  // Language breakdown
  const langs = {};
  for (const r of allRepos) {
    const lang = r.language || "Unknown";
    langs[lang] = (langs[lang] || 0) + 1;
  }
  const topLanguages = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([lang, count]) => ({ lang, count }));

  // Stars stats
  const totalStars = allRepos.reduce((s, r) => s + (r.stars || 0), 0);
  const avgStars = allRepos.length ? Math.round(totalStars / allRepos.length) : 0;
  const maxStars = allRepos.length ? Math.max(...allRepos.map((r) => r.stars || 0)) : 0;

  // Votes stats
  const totalVotes = allRepos.reduce((s, r) => s + (r.upvote_count || 0), 0);
  const mostVoted = [...allRepos].sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0)).slice(0, 5);

  // Unique submitters
  const submitters = new Set(allRepos.map((r) => r.submitted_by).filter(Boolean));

  // Recently added
  const recentRepos = (newest.data || []).slice(0, 5);

  // Boosted repos
  const boosted = allRepos.filter((r) => r.is_boosted);

  return {
    timestamp: new Date().toISOString(),
    totalRepos,
    totalStars,
    avgStars,
    maxStars,
    totalVotes,
    pageViews: viewsRes.count,
    uniqueSubmitters: submitters.size,
    boostedRepos: boosted.length,
    topLanguages,
    mostVoted: mostVoted.map((r) => ({
      name: `${r.owner}/${r.name}`,
      votes: r.upvote_count,
      stars: r.stars,
      language: r.language,
    })),
    recentRepos: recentRepos.map((r) => ({
      name: `${r.owner}/${r.name}`,
      description: r.description?.slice(0, 100),
      stars: r.stars,
      language: r.language,
    })),
    trendingTop3: (trending.data || []).slice(0, 3).map((r) => ({
      name: `${r.owner}/${r.name}`,
      votes: r.upvote_count,
      stars: r.stars,
    })),
  };
}

// ── Content Generation ──

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTalkingPoints(kb, snapshot) {
  const points = [];
  const prev = kb.snapshots.length > 1 ? kb.snapshots[kb.snapshots.length - 2] : null;

  // Growth metrics
  if (prev) {
    const repoGrowth = snapshot.totalRepos - prev.totalRepos;
    const voteGrowth = snapshot.totalVotes - prev.totalVotes;
    const viewGrowth = snapshot.pageViews - prev.pageViews;
    if (repoGrowth > 0) points.push(`${repoGrowth} new repos added since last check`);
    if (voteGrowth > 0) points.push(`${voteGrowth} new votes cast`);
    if (viewGrowth > 0) points.push(`${viewGrowth} new page views`);
  }

  // Milestone callouts
  const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  for (const m of milestones) {
    if (snapshot.totalRepos >= m && (!prev || prev.totalRepos < m)) {
      points.push(`MILESTONE: Crossed ${m} repos on the platform!`);
    }
    if (snapshot.totalVotes >= m && (!prev || prev.totalVotes < m)) {
      points.push(`MILESTONE: ${m}+ community votes!`);
    }
    if (snapshot.pageViews >= m && (!prev || prev.pageViews < m)) {
      points.push(`MILESTONE: ${m}+ page views!`);
    }
  }

  // Content highlights
  if (snapshot.mostVoted.length) {
    const top = snapshot.mostVoted[0];
    points.push(`Top repo: ${top.name} with ${top.votes} votes and ${top.stars.toLocaleString()} stars`);
  }
  if (snapshot.topLanguages.length) {
    points.push(`Most popular language: ${snapshot.topLanguages[0].lang} (${snapshot.topLanguages[0].count} repos)`);
  }
  if (snapshot.recentRepos.length) {
    const recent = snapshot.recentRepos[0];
    points.push(`Latest addition: ${recent.name} — ${recent.description || recent.language}`);
  }

  points.push(`${snapshot.totalRepos} repos | ${snapshot.totalVotes} votes | ${snapshot.uniqueSubmitters} contributors | ${snapshot.pageViews.toLocaleString()} views`);

  return points;
}

function generateTwitterPost(kb, snapshot, points) {
  const templates = [
    // Stats showcase
    () => {
      const top = snapshot.mostVoted[0];
      return `${snapshot.totalRepos} GitHub repos. ${snapshot.totalVotes} community votes. ${snapshot.pageViews.toLocaleString()} views.\n\nPimpMyGit is the front page for open source.\n\nTrending now: ${top ? top.name : "amazing repos"}\n\n${SITE_URL}`;
    },
    // New repo spotlight
    () => {
      const repo = pickRandom(snapshot.recentRepos);
      if (!repo) return null;
      return `Just submitted to PimpMyGit:\n\n${repo.name} — ${repo.description || "Check it out"}\n${repo.stars ? `${repo.stars.toLocaleString()} stars` : ""} ${repo.language ? `| ${repo.language}` : ""}\n\nDiscover repos the community loves:\n${SITE_URL}`;
    },
    // Language angle
    () => {
      const lang = snapshot.topLanguages[0];
      if (!lang) return null;
      return `${lang.lang} developers are building amazing things.\n\n${lang.count} ${lang.lang} repos on PimpMyGit — discover, upvote, and boost the best ones.\n\n${SITE_URL}/language/${encodeURIComponent(lang.lang)}`;
    },
    // Feature highlight
    () => {
      const feature = pickRandom(kb.site.features);
      return `Did you know PimpMyGit has ${feature.toLowerCase()}?\n\nIt's like Product Hunt, but focused entirely on GitHub repos.\n\nFree to submit. Free to vote. Open source.\n\n${SITE_URL}`;
    },
    // Call to action
    () => `Your GitHub repo deserves more visibility.\n\nSubmit it to PimpMyGit — get upvotes, climb the trending page, and reach developers who care.\n\n${snapshot.totalRepos} repos already listed. Join them.\n\n${SITE_URL}/submit`,
    // Community growth
    () => `The PimpMyGit community keeps growing:\n\n📦 ${snapshot.totalRepos} repos\n⬆️ ${snapshot.totalVotes} votes\n👥 ${snapshot.uniqueSubmitters} contributors\n👀 ${snapshot.pageViews.toLocaleString()} views\n\nWhat repo should be trending next?\n\n${SITE_URL}`,
    // Differentiator
    () => {
      const diff = pickRandom(kb.site.differentiators);
      return `Why PimpMyGit?\n\n${diff}.\n\nDiscover the GitHub repos developers are actually excited about.\n\n${SITE_URL}`;
    },
  ];

  const posts = [];
  for (const t of templates) {
    const post = t();
    if (post && post.length <= 280) posts.push(post);
    else if (post) posts.push(post.slice(0, 277) + "...");
  }
  return posts;
}

function generateRedditPost(kb, snapshot) {
  const posts = [
    {
      subreddits: ["r/opensource", "r/github", "r/programming", "r/webdev", "r/sideproject"],
      title: `I built PimpMyGit — a "Product Hunt for GitHub repos" where you can discover and upvote the best open-source projects`,
      body: `Hey everyone,

I built PimpMyGit (${SITE_URL}) as a discovery platform specifically for GitHub repositories.

**The idea:** GitHub has millions of repos but no great way to surface hidden gems. PimpMyGit lets the community submit, upvote, and curate the best ones.

**Current stats:**
- ${snapshot.totalRepos} repos listed
- ${snapshot.totalVotes} community votes
- ${snapshot.uniqueSubmitters} contributors
- Top languages: ${snapshot.topLanguages.slice(0, 5).map((l) => l.lang).join(", ")}

**Features:**
- Trending/New/Top sorting
- Language filtering
- Threaded comments
- Curated collections
- Embeddable vote badges for your README
- Public API
- RSS feed
- Dark/light theme
- Completely free and open source (MIT)

Built with Next.js + TypeScript, hosted on Railway.

Would love feedback from the community. What features would make this more useful for discovering repos?

${SITE_URL}`,
    },
    {
      subreddits: ["r/SideProject", "r/indiehackers"],
      title: `PimpMyGit — the front page for GitHub repos (${snapshot.totalRepos} repos, ${snapshot.pageViews.toLocaleString()} views)`,
      body: `Sharing an update on PimpMyGit, a platform I built for discovering and promoting GitHub repos.

**What it does:** Think Product Hunt but exclusively for GitHub repositories. Submit your repo, get upvotes from the community, boost for extra visibility.

**Traction so far:**
- ${snapshot.totalRepos} repos submitted
- ${snapshot.totalVotes} votes cast
- ${snapshot.pageViews.toLocaleString()} page views
- Launched on Product Hunt

**Stack:** Next.js 16, TypeScript, SQLite (sql.js), Tailwind CSS, Railway

**Revenue model:** Credit-based boosts and sponsored slots (optional — listing and voting is free)

Happy to answer any questions about the build or growth strategy.

${SITE_URL}`,
    },
  ];

  // Repo spotlight for language subreddits
  for (const lang of snapshot.topLanguages.slice(0, 3)) {
    const langRepos = snapshot.mostVoted.filter((r) => r.language === lang.lang);
    if (langRepos.length === 0) continue;
    const subredditMap = {
      JavaScript: "r/javascript",
      TypeScript: "r/typescript",
      Python: "r/Python",
      Rust: "r/rust",
      Go: "r/golang",
      Java: "r/java",
      "C#": "r/csharp",
      Ruby: "r/ruby",
      PHP: "r/PHP",
      Swift: "r/swift",
      Kotlin: "r/Kotlin",
    };
    const sub = subredditMap[lang.lang];
    if (sub) {
      posts.push({
        subreddits: [sub],
        title: `Discover trending ${lang.lang} repos on PimpMyGit — ${lang.count} ${lang.lang} projects and counting`,
        body: `PimpMyGit (${SITE_URL}) now has ${lang.count} ${lang.lang} repositories listed.\n\nBrowse them here: ${SITE_URL}/language/${encodeURIComponent(lang.lang)}\n\nTop voted ${lang.lang} repos:\n${langRepos.map((r) => `- ${r.name} (${r.stars.toLocaleString()} stars, ${r.votes} votes)`).join("\n")}\n\nSubmit your ${lang.lang} project or vote on existing ones — it's free.`,
      });
    }
  }

  return posts;
}

function generateHNPost(kb, snapshot) {
  return [
    {
      type: "Show HN",
      title: `Show HN: PimpMyGit – Discover and upvote the best GitHub repos`,
      url: SITE_URL,
      comment: `I built PimpMyGit as a discovery layer for GitHub. ${snapshot.totalRepos} repos listed so far with ${snapshot.totalVotes} community votes.\n\nThe idea is simple: GitHub is great for hosting code, but terrible for discovering it. Stars help, but there's no "trending" or community curation beyond awesome-lists.\n\nPimpMyGit adds: trending/new/top sorting, upvoting, comments, collections, language filtering, embeddable badges, and a public API.\n\nBuilt with Next.js + TypeScript + SQLite. Open source (MIT): ${kb.site.github}\n\nFeedback welcome.`,
    },
  ];
}

function generateLinkedInPost(kb, snapshot) {
  return [
    `Excited to share PimpMyGit — a platform I built to help developers discover the best GitHub repositories.

Think of it as Product Hunt, but focused entirely on open-source projects.

The problem: GitHub has 300M+ repositories, but finding quality projects is still hard. Stars help, but they don't tell the whole story.

PimpMyGit adds a community curation layer:
→ Submit repos you love
→ Upvote the best ones
→ Browse by trending, new, or top
→ Filter by programming language
→ Create themed collections

Current traction:
• ${snapshot.totalRepos} repositories listed
• ${snapshot.totalVotes} community votes
• ${snapshot.uniqueSubmitters} contributors
• ${snapshot.pageViews.toLocaleString()} page views

The entire platform is open source (MIT) and free to use.

If you build or use open source, I'd love your feedback: ${SITE_URL}

#OpenSource #GitHub #WebDevelopment #IndieHacker`,

    `Every great open-source project deserves to be discovered.

That's why I built PimpMyGit — a community-driven platform where developers submit, upvote, and curate the best GitHub repositories.

${snapshot.totalRepos} repos. ${snapshot.totalVotes} votes. Growing every day.

Whether you're looking for your next favorite tool or want more eyes on your own project — check it out: ${SITE_URL}

#OpenSource #Developer #GitHub`,
  ];
}

function generateDevToPost(kb, snapshot) {
  return {
    title: "I built PimpMyGit — Product Hunt for GitHub repos",
    tags: ["opensource", "github", "webdev", "showdev"],
    body: `## What is PimpMyGit?

[PimpMyGit](${SITE_URL}) is a community-driven platform for discovering and promoting GitHub repositories. Think Product Hunt, but exclusively for open-source projects.

## Why I built it

GitHub has hundreds of millions of repos, but discovering quality projects is still surprisingly hard. Stars are a noisy signal, awesome-lists go stale, and trending pages are dominated by big names.

PimpMyGit adds a community curation layer — developers submit repos they love, others upvote, and the best ones rise to the top.

## Current stats

- **${snapshot.totalRepos}** repos listed
- **${snapshot.totalVotes}** community votes
- **${snapshot.uniqueSubmitters}** contributors
- **Top languages:** ${snapshot.topLanguages.slice(0, 5).map((l) => l.lang).join(", ")}

## Features

- Trending / New / Top sorting
- Language-filtered browsing
- Threaded comments
- Curated collections
- Embeddable vote badges for your README
- Public API + RSS feed
- Credit-based boosts for extra visibility
- Dark/light theme
- Dynamic OG social cards

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- SQLite via sql.js
- Tailwind CSS v4
- Hosted on Railway

## It's open source

The entire platform is MIT-licensed: [${kb.site.github}](${kb.site.github})

## Try it out

Submit your repo, vote on others, or just browse: [${SITE_URL}](${SITE_URL})

I'd love feedback from the DEV community — what features would make this more useful for you?`,
  };
}

// ── Main ──

async function main() {
  const args = process.argv.slice(2);
  const fetchOnly = args.includes("--fetch");
  const generateOnly = args.includes("--generate");
  const showHistory = args.includes("--history");
  const platformFlag = args.indexOf("--platform");
  const platform = platformFlag >= 0 ? args[platformFlag + 1] : null;

  const kb = loadKnowledge();

  if (showHistory) {
    console.log("\n=== Promotion History ===\n");
    if (!kb.promotions.length) {
      console.log("No promotions tracked yet. Run with --generate first.");
    }
    for (const p of kb.promotions.slice(-20)) {
      console.log(`[${p.date}] ${p.platform} — ${p.title || p.type}`);
    }
    console.log(`\n=== Talking Points ===\n`);
    for (const pt of kb.talkingPoints.slice(-10)) {
      console.log(`  • ${pt}`);
    }
    return;
  }

  // Fetch phase
  let snapshot;
  if (!generateOnly) {
    try {
      snapshot = await fetchSiteData();
      kb.snapshots.push(snapshot);
      // Keep last 30 snapshots
      if (kb.snapshots.length > 30) kb.snapshots = kb.snapshots.slice(-30);

      const points = generateTalkingPoints(kb, snapshot);
      kb.talkingPoints = points;
      saveKnowledge(kb);

      console.log(`\nSnapshot saved (${snapshot.timestamp})`);
      console.log(`  Repos: ${snapshot.totalRepos} | Votes: ${snapshot.totalVotes} | Views: ${snapshot.pageViews.toLocaleString()}`);
      console.log(`  Top languages: ${snapshot.topLanguages.slice(0, 5).map((l) => `${l.lang}(${l.count})`).join(", ")}`);
      console.log(`  Submitters: ${snapshot.uniqueSubmitters} | Boosted: ${snapshot.boostedRepos}`);
    } catch (e) {
      console.error("Failed to fetch site data:", e.message);
      if (!kb.snapshots.length) {
        console.error("No existing data to generate from. Fix the fetch error and retry.");
        process.exit(1);
      }
    }
  }

  if (fetchOnly) return;

  // Use latest snapshot
  snapshot = snapshot || kb.snapshots[kb.snapshots.length - 1];
  if (!snapshot) {
    console.error("No snapshot data. Run with --fetch first.");
    process.exit(1);
  }

  console.log("\n══════════════════════════════════════════");
  console.log("  PIMPMYGIT PROMOTION CONTENT");
  console.log("══════════════════════════════════════════");

  // Talking points
  console.log("\n── Talking Points ──\n");
  for (const pt of kb.talkingPoints) {
    console.log(`  • ${pt}`);
  }

  // Platform-specific content
  if (!platform || platform === "x" || platform === "twitter") {
    console.log("\n── Twitter/X Posts ──\n");
    const tweets = generateTwitterPost(kb, snapshot, kb.talkingPoints);
    tweets.forEach((t, i) => {
      console.log(`--- Tweet ${i + 1} (${t.length} chars) ---`);
      console.log(t);
      console.log();
    });
  }

  if (!platform || platform === "reddit") {
    console.log("\n── Reddit Posts ──\n");
    const reddits = generateRedditPost(kb, snapshot);
    reddits.forEach((r, i) => {
      console.log(`--- Reddit ${i + 1} [${r.subreddits.join(", ")}] ---`);
      console.log(`Title: ${r.title}`);
      console.log(`\n${r.body}\n`);
    });
  }

  if (!platform || platform === "hn" || platform === "hackernews") {
    console.log("\n── Hacker News ──\n");
    const hn = generateHNPost(kb, snapshot);
    hn.forEach((h) => {
      console.log(`--- ${h.type} ---`);
      console.log(`Title: ${h.title}`);
      console.log(`URL: ${h.url}`);
      console.log(`\n${h.comment}\n`);
    });
  }

  if (!platform || platform === "linkedin") {
    console.log("\n── LinkedIn Posts ──\n");
    const li = generateLinkedInPost(kb, snapshot);
    li.forEach((post, i) => {
      console.log(`--- LinkedIn ${i + 1} ---`);
      console.log(post);
      console.log();
    });
  }

  if (!platform || platform === "devto" || platform === "dev") {
    console.log("\n── DEV.to Article ──\n");
    const devto = generateDevToPost(kb, snapshot);
    console.log(`Title: ${devto.title}`);
    console.log(`Tags: ${devto.tags.join(", ")}`);
    console.log(`\n${devto.body}\n`);
  }

  // Track this generation
  kb.promotions.push({
    date: new Date().toISOString().split("T")[0],
    platform: platform || "all",
    type: "content-generated",
    title: `Generated content (${snapshot.totalRepos} repos, ${snapshot.totalVotes} votes)`,
  });
  saveKnowledge(kb);

  console.log("══════════════════════════════════════════");
  console.log("Content generated. Knowledge base updated.");
  console.log(`Run again anytime — stats refresh automatically.`);
  console.log(`Track: node scripts/promote.mjs --history`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
