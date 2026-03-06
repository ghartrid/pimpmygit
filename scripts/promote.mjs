#!/usr/bin/env node
/**
 * PimpMyGit Promotion Agent v2 — Intelligent Growth Engine
 *
 * Usage:
 *   node scripts/promote.mjs                  # full run: fetch + analyze + generate
 *   node scripts/promote.mjs --fetch          # just update knowledge base
 *   node scripts/promote.mjs --generate       # generate from existing data
 *   node scripts/promote.mjs --platform x     # specific platform (x/reddit/hn/linkedin/devto)
 *   node scripts/promote.mjs --analyze        # deep analysis only (trends, recommendations)
 *   node scripts/promote.mjs --outreach       # outreach targets + pitch templates
 *   node scripts/promote.mjs --seo            # SEO keyword + meta suggestions
 *   node scripts/promote.mjs --history        # promotion history + angle usage
 *   node scripts/promote.mjs --best           # top-scored content only
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_PATH = path.join(__dirname, "promotion-knowledge.json");
const SITE_URL = "https://pimpmygit.com";
const API_URL = `${SITE_URL}/api/v1/repos`;

// ═══════════════════════════════════════════
//  KNOWLEDGE BASE
// ═══════════════════════════════════════════

function loadKnowledge() {
  try {
    const kb = JSON.parse(fs.readFileSync(KNOWLEDGE_PATH, "utf-8"));
    // Migrate older knowledge bases
    if (!kb.angles) kb.angles = {};
    if (!kb.spotlighted) kb.spotlighted = [];
    if (!kb.competitors) kb.competitors = getCompetitors();
    if (!kb.audiences) kb.audiences = getAudiences();
    if (!kb.outreachLog) kb.outreachLog = [];
    return kb;
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
          "Admin panel for site management",
          "Retro visitor counter",
        ],
        stack: "Next.js 16, TypeScript, SQLite (sql.js), Tailwind CSS v4, Railway",
        differentiators: [
          "Focused solely on GitHub repos (not general products)",
          "Free to submit and vote",
          "Open source (MIT license)",
          "Built by a solo developer",
          "No sign-up required to browse",
          "Lightweight and fast",
          "Embeddable badges for your README",
          "Public API — build on top of it",
          "Community-driven curation, not algorithmic",
        ],
      },
      snapshots: [],
      promotions: [],
      talkingPoints: [],
      angles: {},         // angle_id → { lastUsed, useCount }
      spotlighted: [],    // repo names already featured
      competitors: getCompetitors(),
      audiences: getAudiences(),
      outreachLog: [],    // { target, date, status }
    };
  }
}

function saveKnowledge(kb) {
  fs.writeFileSync(KNOWLEDGE_PATH, JSON.stringify(kb, null, 2));
}

// ═══════════════════════════════════════════
//  COMPETITOR INTELLIGENCE
// ═══════════════════════════════════════════

function getCompetitors() {
  return [
    {
      name: "GitHub Trending",
      url: "https://github.com/trending",
      type: "built-in",
      weaknesses: ["Only shows recent activity spikes", "No community voting", "No persistence — repos rotate off daily", "No comments or collections"],
      ourAdvantage: "PimpMyGit is community-curated with permanent listings, voting, comments, and collections",
    },
    {
      name: "Product Hunt",
      url: "https://producthunt.com",
      type: "platform",
      weaknesses: ["Broad scope — not GitHub-focused", "One-day visibility window", "Saturated with SaaS/apps", "Repos get lost among products"],
      ourAdvantage: "PimpMyGit is exclusively for GitHub repos with persistent visibility and boosting",
    },
    {
      name: "awesome-* lists",
      url: "https://github.com/topics/awesome",
      type: "community",
      weaknesses: ["Static — PRs languish for weeks", "No voting or engagement metrics", "Fragmented across thousands of lists", "No discovery beyond the list topic"],
      ourAdvantage: "PimpMyGit is dynamic with real-time voting, trending, and cross-language discovery",
    },
    {
      name: "LibHunt",
      url: "https://www.libhunt.com",
      type: "platform",
      weaknesses: ["Aggregator feel — less community", "No submission workflow", "Ad-heavy", "Language-siloed"],
      ourAdvantage: "PimpMyGit has active community submission, voting, and cross-language browsing",
    },
    {
      name: "Hacker News (Show HN)",
      url: "https://news.ycombinator.com",
      type: "community",
      weaknesses: ["Repos compete with all content types", "Brief visibility window", "No categorization", "Can't boost or sustain presence"],
      ourAdvantage: "PimpMyGit is dedicated to repos with persistent rankings, language filters, and boosting",
    },
  ];
}

// ═══════════════════════════════════════════
//  AUDIENCE PERSONAS
// ═══════════════════════════════════════════

function getAudiences() {
  return {
    openSourceMaintainer: {
      name: "Open Source Maintainer",
      painPoints: ["Struggling to get visibility for their project", "GitHub stars grow slowly", "Hard to reach users outside existing network"],
      messaging: "Get your repo in front of developers who care. Submit it, get upvotes, climb trending.",
      platforms: ["x", "reddit", "hn", "devto"],
      hooks: [
        "Your repo deserves more stars",
        "Stop waiting for GitHub's algorithm",
        "The missing distribution channel for open source",
      ],
    },
    developer: {
      name: "Developer / Browser",
      painPoints: ["Hard to find quality tools", "GitHub search is noisy", "Awesome-lists are stale", "Don't know what's trending"],
      messaging: "Discover repos the community actually rates. Trending, curated, and language-filtered.",
      platforms: ["x", "reddit", "hn", "devto", "linkedin"],
      hooks: [
        "GitHub has 300M+ repos. Finding the good ones is the hard part",
        "What if there was a front page for GitHub?",
        "The repos developers are actually excited about",
      ],
    },
    indieHacker: {
      name: "Indie Hacker / Builder",
      painPoints: ["Needs to promote their open-source tool", "Limited marketing budget", "Wants organic developer traffic"],
      messaging: "Free visibility for your GitHub project. Built by an indie hacker, for indie hackers.",
      platforms: ["x", "reddit", "linkedin", "devto"],
      hooks: [
        "I built this in public and it's working",
        "Free distribution for open-source projects",
        "The growth hack for GitHub repos nobody talks about",
      ],
    },
    techLead: {
      name: "Tech Lead / CTO",
      painPoints: ["Evaluating tools for the team", "Needs community-vetted options", "Wants to compare alternatives"],
      messaging: "Community-curated GitHub repos. See what developers are actually voting for.",
      platforms: ["linkedin", "hn"],
      hooks: [
        "Let the developer community vet your next dependency",
        "Community votes > GitHub stars for quality signal",
        "Curated collections of the best tools by category",
      ],
    },
  };
}

// ═══════════════════════════════════════════
//  DATA FETCHING
// ═══════════════════════════════════════════

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

  // High-star repos (potential spotlight)
  const highStar = [...allRepos].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 5);

  // Repos with descriptions (better for content)
  const descriptive = allRepos.filter((r) => r.description && r.description.length > 20);

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
      description: r.description?.slice(0, 120),
      url: `${SITE_URL}/repo/${r.id}`,
    })),
    recentRepos: recentRepos.map((r) => ({
      name: `${r.owner}/${r.name}`,
      description: r.description?.slice(0, 120),
      stars: r.stars,
      language: r.language,
      url: `${SITE_URL}/repo/${r.id}`,
    })),
    highStarRepos: highStar.map((r) => ({
      name: `${r.owner}/${r.name}`,
      stars: r.stars,
      votes: r.upvote_count,
      language: r.language,
      description: r.description?.slice(0, 120),
    })),
    descriptiveRepos: descriptive.length,
    trendingTop3: (trending.data || []).slice(0, 3).map((r) => ({
      name: `${r.owner}/${r.name}`,
      votes: r.upvote_count,
      stars: r.stars,
    })),
  };
}

// ═══════════════════════════════════════════
//  TREND ANALYSIS ENGINE
// ═══════════════════════════════════════════

function analyzeTrends(kb, snapshot) {
  const analysis = {
    stage: "launch",       // launch | early | growth | scaling
    momentum: "neutral",   // declining | stagnant | neutral | growing | surging
    growthRate: {},         // per-metric daily rates
    projections: {},       // where metrics will be in 7/30 days
    insights: [],          // human-readable insights
    recommendations: [],   // actionable next steps
    strengths: [],
    weaknesses: [],
    opportunities: [],
  };

  const snaps = kb.snapshots;
  if (snaps.length < 2) {
    analysis.stage = "launch";
    analysis.momentum = "neutral";
    analysis.insights.push("First snapshot — no trends yet. Run again after more activity to unlock trend analysis.");
    analysis.recommendations.push("Submit more repos to build initial content");
    analysis.recommendations.push("Share the site in developer communities");
    analysis.recommendations.push("Post on r/SideProject and r/opensource");
    return analysis;
  }

  // Calculate daily growth rates from last 7 snapshots (or all available)
  const recent = snaps.slice(-7);
  const oldest = recent[0];
  const daySpan = Math.max(1, (new Date(snapshot.timestamp) - new Date(oldest.timestamp)) / 86400000);

  const metrics = ["totalRepos", "totalVotes", "pageViews", "uniqueSubmitters", "totalStars"];
  for (const m of metrics) {
    const delta = (snapshot[m] || 0) - (oldest[m] || 0);
    const dailyRate = delta / daySpan;
    analysis.growthRate[m] = { delta, dailyRate: Math.round(dailyRate * 100) / 100, period: `${Math.round(daySpan)}d` };
    analysis.projections[m] = {
      day7: Math.round((snapshot[m] || 0) + dailyRate * 7),
      day30: Math.round((snapshot[m] || 0) + dailyRate * 30),
    };
  }

  // Determine momentum
  const repoRate = analysis.growthRate.totalRepos?.dailyRate || 0;
  const voteRate = analysis.growthRate.totalVotes?.dailyRate || 0;
  const viewRate = analysis.growthRate.pageViews?.dailyRate || 0;

  const momentumScore = (repoRate > 0 ? 1 : 0) + (voteRate > 0 ? 1 : 0) + (viewRate > 1 ? 1 : 0);
  if (repoRate >= 5 && voteRate >= 10) analysis.momentum = "surging";
  else if (momentumScore >= 2) analysis.momentum = "growing";
  else if (momentumScore === 1) analysis.momentum = "neutral";
  else if (repoRate === 0 && voteRate === 0) analysis.momentum = "stagnant";
  else analysis.momentum = "declining";

  // Determine stage
  if (snapshot.totalRepos < 20) analysis.stage = "launch";
  else if (snapshot.totalRepos < 100) analysis.stage = "early";
  else if (snapshot.totalRepos < 500) analysis.stage = "growth";
  else analysis.stage = "scaling";

  // Generate insights
  if (repoRate > 0) {
    analysis.insights.push(`Growing at ${analysis.growthRate.totalRepos.dailyRate} repos/day — projected ${analysis.projections.totalRepos.day30} repos in 30 days`);
  }
  if (viewRate > 0) {
    analysis.insights.push(`${Math.round(viewRate)} views/day — projected ${analysis.projections.pageViews.day30.toLocaleString()} views in 30 days`);
  }
  if (snapshot.totalVotes > 0 && snapshot.totalRepos > 0) {
    const votesPerRepo = (snapshot.totalVotes / snapshot.totalRepos).toFixed(1);
    analysis.insights.push(`Engagement: ${votesPerRepo} votes per repo on average`);
    if (votesPerRepo < 1) analysis.insights.push("Low engagement — repos need more voters");
  }
  if (snapshot.uniqueSubmitters > 0 && snapshot.totalRepos > 0) {
    const reposPerSubmitter = (snapshot.totalRepos / snapshot.uniqueSubmitters).toFixed(1);
    analysis.insights.push(`${reposPerSubmitter} repos per submitter — ${snapshot.uniqueSubmitters > snapshot.totalRepos * 0.7 ? "good diversity" : "power users dominating"}`);
  }

  // Language diversity
  const langCount = snapshot.topLanguages.length;
  if (langCount >= 5) analysis.strengths.push(`Good language diversity (${langCount} languages)`);
  else analysis.weaknesses.push(`Low language diversity (${langCount}) — actively recruit Python/Rust/Go repos`);

  // SWOT-lite
  if (snapshot.totalStars > 100) analysis.strengths.push("Repos with strong GitHub traction listed");
  if (snapshot.boostedRepos > 0) analysis.strengths.push("Revenue signal: repos being boosted");
  if (snapshot.totalRepos < 50) analysis.weaknesses.push("Low content volume — need more repos for discovery value");
  if (snapshot.uniqueSubmitters < 5) analysis.weaknesses.push("Small submitter base — need more users contributing");
  analysis.opportunities.push("Cross-post trending repos to language-specific communities");
  analysis.opportunities.push("Reach out to awesome-list maintainers");
  analysis.opportunities.push("Create weekly 'Top 5 repos' newsletter/thread");
  if (langCount < 5) analysis.opportunities.push("Target underrepresented language communities");

  // Stage-specific recommendations
  switch (analysis.stage) {
    case "launch":
      analysis.recommendations.push("PRIORITY: Seed content — submit 20+ quality repos across 5+ languages");
      analysis.recommendations.push("Get 5+ unique submitters (ask developer friends to submit their repos)");
      analysis.recommendations.push("Post daily on X with repo spotlights");
      analysis.recommendations.push("Submit to Show HN once you have 20+ repos");
      analysis.recommendations.push("Comment on GitHub trending repos: 'Listed on PimpMyGit'");
      break;
    case "early":
      analysis.recommendations.push("Start a weekly 'Trending on PimpMyGit' thread on X");
      analysis.recommendations.push("Reach out to newsletter authors (see --outreach)");
      analysis.recommendations.push("Create language-specific collections to share in those communities");
      analysis.recommendations.push("Add PimpMyGit badge to your own repos' READMEs");
      break;
    case "growth":
      analysis.recommendations.push("Launch 'Repo of the Week' series across all platforms");
      analysis.recommendations.push("Build partnerships with dev influencers");
      analysis.recommendations.push("Consider a blog/changelog for SEO content");
      analysis.recommendations.push("Explore GitHub Sponsors or similar for sustainability");
      break;
    case "scaling":
      analysis.recommendations.push("Automate social posting with trending repo updates");
      analysis.recommendations.push("Add email digest for users (weekly trending)");
      analysis.recommendations.push("Explore API partnerships");
      break;
  }

  return analysis;
}

// ═══════════════════════════════════════════
//  ANGLE ROTATION (avoid repetitive content)
// ═══════════════════════════════════════════

const CONTENT_ANGLES = {
  stats_showcase:     { weight: 3, cooldown: 3, label: "Stats Showcase" },
  repo_spotlight:     { weight: 5, cooldown: 1, label: "Repo Spotlight" },
  language_focus:     { weight: 3, cooldown: 2, label: "Language Focus" },
  feature_highlight:  { weight: 2, cooldown: 4, label: "Feature Highlight" },
  cta_submit:         { weight: 3, cooldown: 3, label: "Submit CTA" },
  community_growth:   { weight: 3, cooldown: 2, label: "Community Growth" },
  differentiator:     { weight: 2, cooldown: 4, label: "Why Us" },
  problem_solution:   { weight: 4, cooldown: 3, label: "Problem → Solution" },
  milestone:          { weight: 5, cooldown: 0, label: "Milestone" },
  behind_scenes:      { weight: 2, cooldown: 5, label: "Behind the Scenes" },
  user_story:         { weight: 4, cooldown: 2, label: "User Story" },
  comparison:         { weight: 2, cooldown: 5, label: "Competitor Comparison" },
  question_hook:      { weight: 4, cooldown: 2, label: "Question Hook" },
  hot_take:           { weight: 3, cooldown: 4, label: "Hot Take" },
  weekly_roundup:     { weight: 3, cooldown: 6, label: "Weekly Roundup" },
};

function pickAngle(kb, preferredAngles = null) {
  const now = Date.now();
  const candidates = [];

  for (const [id, config] of Object.entries(CONTENT_ANGLES)) {
    if (preferredAngles && !preferredAngles.includes(id)) continue;
    const usage = kb.angles[id] || { lastUsed: 0, useCount: 0 };
    const daysSince = (now - usage.lastUsed) / 86400000;
    // Higher score = more likely to be picked
    let score = config.weight;
    if (daysSince > config.cooldown) score += 3;       // past cooldown, boost
    else score -= (config.cooldown - daysSince) * 2;    // in cooldown, penalize
    if (usage.useCount === 0) score += 5;               // never used, big boost
    else score -= Math.min(usage.useCount * 0.5, 3);    // diminishing returns
    candidates.push({ id, config, score: Math.max(score, 0.1) });
  }

  // Weighted random selection
  const total = candidates.reduce((s, c) => s + c.score, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.score;
    if (r <= 0) return c.id;
  }
  return candidates[candidates.length - 1]?.id || "stats_showcase";
}

function recordAngleUse(kb, angleId) {
  if (!kb.angles[angleId]) kb.angles[angleId] = { lastUsed: 0, useCount: 0 };
  kb.angles[angleId].lastUsed = Date.now();
  kb.angles[angleId].useCount++;
}

// ═══════════════════════════════════════════
//  CONTENT SCORING
// ═══════════════════════════════════════════

function scoreContent(text, platform) {
  let score = 50; // base
  const lower = text.toLowerCase();

  // Engagement signals
  if (lower.includes("?")) score += 8;                    // questions drive replies
  if (/\d/.test(text)) score += 5;                         // numbers are concrete
  if (lower.includes("free")) score += 3;
  if (lower.includes("open source") || lower.includes("mit")) score += 4;
  if (text.includes("\n\n")) score += 3;                   // readable formatting

  // Platform-specific
  if (platform === "x") {
    if (text.length <= 200) score += 5;                    // shorter tweets perform better
    if (text.length > 250) score -= 5;
    if (text.includes("🔥") || text.includes("📦") || text.includes("⬆️")) score += 2;
  }
  if (platform === "reddit") {
    if (lower.includes("feedback")) score += 5;            // reddit loves being asked
    if (lower.includes("i built")) score += 3;
    if (text.length > 200) score += 3;                     // reddit likes detail
  }
  if (platform === "hn") {
    if (!text.includes("!")) score += 3;                   // HN prefers understated
    if (lower.includes("show hn")) score += 5;
    if (text.length < 500) score += 3;
  }
  if (platform === "linkedin") {
    if (lower.includes("#")) score += 2;
    if (text.includes("→")) score += 2;                    // linkedin loves arrows
    if (text.length > 300) score += 3;
  }

  // Freshness penalty (similar to recently generated content)
  // (tracked via angle rotation, not text comparison)

  // Call-to-action presence
  if (lower.includes(SITE_URL)) score += 5;
  if (lower.includes("/submit")) score += 3;

  return Math.min(100, Math.max(0, score));
}

// ═══════════════════════════════════════════
//  CONTENT GENERATION ENGINE
// ═══════════════════════════════════════════

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFreshRepo(snapshot, kb) {
  // Pick a repo not yet spotlighted
  const all = [...(snapshot.recentRepos || []), ...(snapshot.mostVoted || []), ...(snapshot.highStarRepos || [])];
  const fresh = all.filter((r) => !kb.spotlighted.includes(r.name));
  if (fresh.length > 0) return pickRandom(fresh);
  // If all spotlighted, reset and start over
  kb.spotlighted = [];
  return pickRandom(all);
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
    if (snapshot.totalRepos >= m && (!prev || prev.totalRepos < m))
      points.push(`MILESTONE: Crossed ${m} repos!`);
    if (snapshot.totalVotes >= m && (!prev || prev.totalVotes < m))
      points.push(`MILESTONE: ${m}+ community votes!`);
    if (snapshot.pageViews >= m && (!prev || prev.pageViews < m))
      points.push(`MILESTONE: ${m}+ page views!`);
  }

  // Content highlights
  if (snapshot.mostVoted.length) {
    const top = snapshot.mostVoted[0];
    points.push(`Top repo: ${top.name} (${top.votes} votes, ${(top.stars || 0).toLocaleString()} stars)`);
  }
  if (snapshot.topLanguages.length) {
    points.push(`Top language: ${snapshot.topLanguages[0].lang} (${snapshot.topLanguages[0].count} repos)`);
  }
  if (snapshot.recentRepos.length) {
    const recent = snapshot.recentRepos[0];
    points.push(`Latest: ${recent.name} — ${recent.description || recent.language}`);
  }

  points.push(`Summary: ${snapshot.totalRepos} repos | ${snapshot.totalVotes} votes | ${snapshot.uniqueSubmitters} contributors | ${snapshot.pageViews.toLocaleString()} views`);

  return points;
}

// ── Twitter/X Content ──

function generateTwitterPosts(kb, snapshot, analysis) {
  const posts = [];

  function addPost(angleId, text) {
    if (!text) return;
    const truncated = text.length > 280 ? text.slice(0, 277) + "..." : text;
    posts.push({
      angle: angleId,
      text: truncated,
      score: scoreContent(truncated, "x"),
      chars: truncated.length,
    });
  }

  // Stats showcase
  addPost("stats_showcase", (() => {
    const top = snapshot.mostVoted[0];
    return `${snapshot.totalRepos} GitHub repos. ${snapshot.totalVotes} community votes. ${snapshot.pageViews.toLocaleString()} page views.\n\nPimpMyGit is the front page for open source.\n\n${top ? `Trending: ${top.name}` : ""}\n\n${SITE_URL}`;
  })());

  // Repo spotlight (fresh repo)
  const spotRepo = pickFreshRepo(snapshot, kb);
  if (spotRepo) {
    kb.spotlighted.push(spotRepo.name);
    addPost("repo_spotlight", `Spotlight: ${spotRepo.name}\n\n${spotRepo.description || ""}\n${spotRepo.stars ? `⭐ ${spotRepo.stars.toLocaleString()} stars` : ""} ${spotRepo.language ? `| ${spotRepo.language}` : ""}\n\nDiscover it on PimpMyGit:\n${SITE_URL}`);
  }

  // Language focus
  if (snapshot.topLanguages.length) {
    const lang = pickRandom(snapshot.topLanguages.slice(0, 3));
    addPost("language_focus", `${lang.lang} developers: ${lang.count} ${lang.lang} repos on PimpMyGit.\n\nDiscover, upvote, and boost the best ones.\n\n${SITE_URL}/language/${encodeURIComponent(lang.lang)}`);
  }

  // Problem → Solution
  addPost("problem_solution", `GitHub has 300M+ repos.\nFinding the good ones? That's the hard part.\n\nPimpMyGit: community-curated discovery for GitHub repos.\n\nTrending. Voted. Filtered by language.\n\n${SITE_URL}`);

  // Question hook
  const questions = [
    `What's the most underrated GitHub repo you've found this year?\n\nShare it on PimpMyGit and let the community decide:\n${SITE_URL}/submit`,
    `How do you discover new GitHub repos?\n\nGitHub trending? Awesome lists? Word of mouth?\n\nWe built something better: ${SITE_URL}`,
    `Should there be a "front page" for GitHub repos?\n\nWe built one. ${snapshot.totalRepos} repos. ${snapshot.totalVotes} votes. Community-driven.\n\n${SITE_URL}`,
  ];
  addPost("question_hook", pickRandom(questions));

  // CTA submit
  addPost("cta_submit", `Your open-source project deserves more eyes.\n\nSubmit it to PimpMyGit:\n→ Get community upvotes\n→ Climb the trending page\n→ Reach developers who care\n\nFree. Takes 30 seconds.\n\n${SITE_URL}/submit`);

  // Community growth (with emoji)
  addPost("community_growth", `PimpMyGit community update:\n\n📦 ${snapshot.totalRepos} repos\n⬆️ ${snapshot.totalVotes} votes\n👥 ${snapshot.uniqueSubmitters} contributors\n👀 ${snapshot.pageViews.toLocaleString()} views\n\nWhat should be trending next?\n\n${SITE_URL}`);

  // Differentiator
  const diff = pickRandom(kb.site.differentiators);
  addPost("differentiator", `Why PimpMyGit over GitHub trending?\n\n${diff}.\n\nPlus: voting, comments, collections, badges, API.\n\n${SITE_URL}`);

  // Feature highlight
  const feature = pickRandom(kb.site.features);
  addPost("feature_highlight", `PimpMyGit now has ${feature.toLowerCase()}.\n\nIt's like Product Hunt, but just for GitHub repos.\n\nFree to submit. Free to vote. MIT licensed.\n\n${SITE_URL}`);

  // Hot take
  const hotTakes = [
    `Hot take: GitHub stars are a vanity metric.\n\nCommunity votes on PimpMyGit are a better signal of quality.\n\n${SITE_URL}`,
    `Awesome-lists are the Yellow Pages of open source.\n\nStatic. Stale. Unranked.\n\nPimpMyGit is the alternative: live, voted, trending.\n\n${SITE_URL}`,
    `The best GitHub repos aren't the ones with the most stars.\n\nThey're the ones real developers actually use and vote for.\n\nDiscover them: ${SITE_URL}`,
  ];
  addPost("hot_take", pickRandom(hotTakes));

  // Behind the scenes
  addPost("behind_scenes", `Built PimpMyGit as a solo dev:\n\n→ Next.js 16 + TypeScript\n→ SQLite (no external DB needed)\n→ Deployed on Railway\n→ MIT open source\n\nThe whole stack for a community platform in one repo.\n\n${kb.site.github}`);

  // Milestone (only if applicable)
  for (const pt of kb.talkingPoints) {
    if (pt.startsWith("MILESTONE:")) {
      addPost("milestone", `🎉 ${pt}\n\nPimpMyGit keeps growing. Thanks to every developer who submitted and voted.\n\n${SITE_URL}`);
    }
  }

  // Sort by score descending
  posts.sort((a, b) => b.score - a.score);

  return posts;
}

// ── Reddit Content ──

function generateRedditPosts(kb, snapshot, analysis) {
  const posts = [];

  // Main launch/update post
  posts.push({
    angle: "problem_solution",
    subreddits: ["r/opensource", "r/github", "r/programming", "r/webdev", "r/SideProject"],
    title: `I built PimpMyGit — a "Product Hunt for GitHub repos" where devs discover and upvote the best open-source projects`,
    body: `Hey everyone,

I built [PimpMyGit](${SITE_URL}) because GitHub has millions of repos but no great way to surface hidden gems. Stars are noisy, awesome-lists go stale, and trending rotates daily.

PimpMyGit adds a community curation layer: submit repos you love, upvote the best, and browse by trending/new/top.

**Current state:**
- ${snapshot.totalRepos} repos across ${snapshot.topLanguages.length} languages
- ${snapshot.totalVotes} community votes from ${snapshot.uniqueSubmitters} contributors
- ${snapshot.pageViews.toLocaleString()} page views

**Features:** Trending/New/Top sorting, language filtering, threaded comments, curated collections, embeddable vote badges, public API, RSS feed, dark/light theme.

**Stack:** Next.js 16, TypeScript, SQLite (sql.js), Tailwind, Railway. Open source (MIT): ${kb.site.github}

What features would make this actually useful for you? I'm building this based on community feedback.

${SITE_URL}`,
    score: scoreContent("reddit feedback open source", "reddit"),
  });

  // Indie hacker angle
  posts.push({
    angle: "behind_scenes",
    subreddits: ["r/SideProject", "r/indiehackers", "r/webdev"],
    title: `Built and launched PimpMyGit in public — the front page for GitHub repos (${snapshot.totalRepos} repos, ${snapshot.pageViews.toLocaleString()} views)`,
    body: `Sharing a progress update on PimpMyGit.

**What:** Product Hunt but exclusively for GitHub repositories. Submit, upvote, boost.

**Traction:** ${snapshot.totalRepos} repos, ${snapshot.totalVotes} votes, ${snapshot.pageViews.toLocaleString()} views, launched on [Product Hunt](${kb.site.productHunt}).

**Stack:** Next.js 16, TypeScript, sql.js (pure JS SQLite — no native modules), Tailwind CSS v4, Railway Docker.

**Revenue model:** Optional credit-based boosts and sponsored homepage slots. Listing and voting is completely free.

**What I learned:**
- sql.js > better-sqlite3 for Railway (native modules fail in Docker)
- Inline theme scripts prevent FOUC with dark/light toggle
- hCaptcha's React package breaks SSR — use manual script loading
- Per-repo OG images via \`ImageResponse\` drive social clicks

Happy to answer questions about the build, stack, or growth strategy.

${SITE_URL}`,
    score: scoreContent("built in public stack", "reddit"),
  });

  // Language-specific subreddit posts
  const subredditMap = {
    JavaScript: "r/javascript", TypeScript: "r/typescript", Python: "r/Python",
    Rust: "r/rust", Go: "r/golang", Java: "r/java", "C#": "r/csharp",
    Ruby: "r/ruby", PHP: "r/PHP", Swift: "r/swift", Kotlin: "r/Kotlin",
    C: "r/C_Programming", "C++": "r/cpp",
  };

  for (const lang of snapshot.topLanguages.slice(0, 3)) {
    const sub = subredditMap[lang.lang];
    if (!sub) continue;
    const langRepos = snapshot.mostVoted.filter((r) => r.language === lang.lang);
    if (!langRepos.length) continue;
    posts.push({
      angle: "language_focus",
      subreddits: [sub],
      title: `Discover trending ${lang.lang} repos on PimpMyGit — community-curated, not algorithmic`,
      body: `PimpMyGit (${SITE_URL}) has ${lang.count} ${lang.lang} repositories listed so far.\n\nBrowse them: ${SITE_URL}/language/${encodeURIComponent(lang.lang)}\n\nTop voted:\n${langRepos.map((r) => `- **${r.name}** — ${r.description || ""} (${(r.stars || 0).toLocaleString()} stars, ${r.votes} votes)`).join("\n")}\n\nSubmit your ${lang.lang} project or vote on existing ones — completely free.\n\nIt's like Product Hunt but focused on GitHub repos. Open source (MIT).`,
      score: scoreContent("language repos trending", "reddit"),
    });
  }

  posts.sort((a, b) => b.score - a.score);
  return posts;
}

// ── Hacker News Content ──

function generateHNPosts(kb, snapshot, analysis) {
  return [
    {
      angle: "problem_solution",
      type: "Show HN",
      title: "Show HN: PimpMyGit – Community-curated discovery for GitHub repos",
      url: SITE_URL,
      comment: `I built PimpMyGit as a discovery layer for GitHub. ${snapshot.totalRepos} repos listed, ${snapshot.totalVotes} community votes.

The problem: GitHub is great for hosting code but poor for discovering it. Stars are a noisy signal, trending rotates daily, and awesome-lists are static.

PimpMyGit adds: community voting, trending/new/top sorting, language filtering, threaded comments, curated collections, embeddable badges, and a public API.

It's intentionally simple — no accounts required to browse, free to submit and vote, no ads.

Built with Next.js + TypeScript + SQLite (sql.js for zero native dependencies). Open source (MIT): ${kb.site.github}

Feedback welcome — what would make this useful to you?`,
      score: scoreContent("show hn discovery feedback", "hn"),
    },
  ];
}

// ── LinkedIn Content ──

function generateLinkedInPosts(kb, snapshot, analysis) {
  const posts = [];

  posts.push({
    angle: "problem_solution",
    text: `The open-source discovery problem is real.

GitHub has 300M+ repositories. Finding quality tools? Still mostly word of mouth.

I built PimpMyGit to fix this.

It's a community-curated platform where developers:
→ Submit repos they love
→ Upvote the best ones
→ Browse trending, new, and top
→ Filter by programming language
→ Create themed collections

Current traction:
• ${snapshot.totalRepos} repositories listed
• ${snapshot.totalVotes} community votes
• ${snapshot.uniqueSubmitters} contributors
• ${snapshot.pageViews.toLocaleString()} page views
• Launched on Product Hunt

The entire platform is open source (MIT) and free to use.

If you build or use open source, I'd love your feedback: ${SITE_URL}

#OpenSource #GitHub #WebDevelopment #IndieHacker #SideProject`,
    score: 0,
  });

  posts.push({
    angle: "community_growth",
    text: `Every great open-source project starts with zero stars.

The difference between 0 and 1,000 stars? Distribution.

That's why I built PimpMyGit — a community-driven platform where developers discover and promote the best GitHub repositories.

Think of it as the "front page" GitHub never built.

${snapshot.totalRepos} repos. ${snapshot.totalVotes} votes. Growing every day.

Submit your project or discover your next favorite tool: ${SITE_URL}

#OpenSource #Developer #GitHub #BuildInPublic`,
    score: 0,
  });

  posts.push({
    angle: "behind_scenes",
    text: `What I learned building PimpMyGit as a solo developer:

1. sql.js > better-sqlite3 for Docker deployments (native modules break)
2. Per-repo OG images drive 3x more social clicks
3. Inline theme scripts prevent the dark mode "flash" problem
4. hCaptcha's React package breaks SSR — manual script loading works
5. Community curation beats algorithmic trending for quality

The platform is live, open source, and growing: ${SITE_URL}

Sometimes the best features are the simplest ones — a submit button, an upvote arrow, and a trending page.

#WebDev #NextJS #TypeScript #IndieHacker #BuildInPublic`,
    score: 0,
  });

  for (const p of posts) p.score = scoreContent(p.text, "linkedin");
  posts.sort((a, b) => b.score - a.score);
  return posts;
}

// ── DEV.to Content ──

function generateDevToPost(kb, snapshot, analysis) {
  const topRepoSection = snapshot.mostVoted.length
    ? `\n## Trending right now\n\n${snapshot.mostVoted.slice(0, 3).map((r) => `- **[${r.name}](https://github.com/${r.name})** — ${r.description || r.language || "Check it out"} (${(r.stars || 0).toLocaleString()} stars, ${r.votes} votes)`).join("\n")}\n`
    : "";

  return {
    angle: "problem_solution",
    title: "I built PimpMyGit — the missing front page for GitHub repos",
    tags: ["opensource", "github", "webdev", "showdev"],
    body: `## The problem

GitHub has 300M+ repositories. Finding quality ones is still surprisingly hard:
- **Stars** are a noisy signal (bots, old projects, name recognition)
- **Trending** rotates daily — miss it and it's gone
- **Awesome-lists** go stale — PRs sit for weeks
- **Search** is keyword-based — no quality ranking

## The solution

[PimpMyGit](${SITE_URL}) is a community-driven discovery platform for GitHub repositories.

Developers submit repos they love. Others upvote. The best ones rise to the top.

## How it works

1. **Submit** any GitHub repo (auto-fetches stars, language, description)
2. **Vote** on repos you like
3. **Browse** by trending, new, or top — filtered by language
4. **Boost** repos for extra visibility (optional, credit-based)
${topRepoSection}
## Features

| Feature | Description |
|---------|-------------|
| Trending/New/Top | Three sorting modes |
| Language filter | Browse by ${snapshot.topLanguages.slice(0, 3).map((l) => l.lang).join(", ")}, and more |
| Comments | Threaded discussions on each repo |
| Collections | User-curated themed lists |
| Vote badges | Embeddable SVG for your README |
| Public API | Build on top of PimpMyGit |
| RSS feed | Subscribe to trending repos |
| OG cards | Auto-generated social preview images |
| Dark/light | Toggle with zero flash |

## Current stats

- **${snapshot.totalRepos}** repos listed
- **${snapshot.totalVotes}** community votes
- **${snapshot.uniqueSubmitters}** contributors
- **${snapshot.topLanguages.length}** programming languages
- **${snapshot.pageViews.toLocaleString()}** page views

## Tech stack

- Next.js 16 (App Router) + TypeScript
- SQLite via sql.js (pure JS — no native modules)
- Tailwind CSS v4
- GitHub OAuth (NextAuth)
- Hosted on Railway (Docker)

## It's open source

The entire platform is MIT-licensed: [${kb.site.github}](${kb.site.github})

## What's next

Building based on community feedback. Current ideas:
- Weekly trending digest email
- GitHub Actions integration
- "Similar repos" recommendations

**What features would make this useful to you?**

Try it: [${SITE_URL}](${SITE_URL})`,
    score: scoreContent("open source github discovery built", "devto"),
  };
}

// ═══════════════════════════════════════════
//  SEO KEYWORD ENGINE
// ═══════════════════════════════════════════

function generateSEOKeywords(snapshot) {
  const base = [
    "discover github repos",
    "best github repositories",
    "trending github repos",
    "github repo discovery",
    "upvote github repos",
    "open source discovery",
    "product hunt for github",
    "find github projects",
    "github repo ranking",
    "community curated github",
    "best open source projects",
    "github alternatives to awesome lists",
  ];

  // Language-specific keywords
  const langKeywords = snapshot.topLanguages.map((l) => [
    `best ${l.lang.toLowerCase()} github repos`,
    `trending ${l.lang.toLowerCase()} repositories`,
    `top ${l.lang.toLowerCase()} open source projects`,
  ]).flat();

  // Long-tail keywords
  const longTail = [
    "how to promote github repo",
    "get more github stars",
    "github repo visibility",
    "submit github project for review",
    "github repo promotion free",
    "curated list of github repos",
    "weekly trending github repos",
    "github project discovery platform",
    "alternative to github trending",
    "find underrated github repos",
  ];

  // Meta descriptions
  const metaDescriptions = [
    `Discover the best GitHub repositories, voted by developers. ${snapshot.totalRepos} repos across ${snapshot.topLanguages.length} languages. Submit yours free.`,
    `PimpMyGit: Community-curated GitHub repo discovery. Browse trending, new, and top repos. Upvote, comment, and create collections. Open source.`,
    `The front page for GitHub repos. ${snapshot.totalRepos} repositories, ${snapshot.totalVotes} community votes. Find your next favorite open-source tool.`,
  ];

  return { base, langKeywords, longTail, metaDescriptions };
}

// ═══════════════════════════════════════════
//  OUTREACH INTELLIGENCE
// ═══════════════════════════════════════════

function generateOutreachTargets(kb, snapshot) {
  return {
    newsletters: [
      { name: "TLDR", url: "https://tldr.tech", pitch: "PimpMyGit: community-curated GitHub repo discovery (like Product Hunt for open source)", relevance: "high" },
      { name: "JavaScript Weekly", url: "https://javascriptweekly.com", pitch: `${snapshot.topLanguages.find((l) => l.lang === "JavaScript")?.count || 0} JS repos on PimpMyGit — trending community picks`, relevance: snapshot.topLanguages.find((l) => l.lang === "JavaScript") ? "high" : "low" },
      { name: "Python Weekly", url: "https://www.pythonweekly.com", pitch: `Python repos curated by the community on PimpMyGit`, relevance: snapshot.topLanguages.find((l) => l.lang === "Python") ? "high" : "medium" },
      { name: "Rust Weekly", url: "https://this-week-in-rust.org", pitch: `Community-voted Rust repos on PimpMyGit`, relevance: snapshot.topLanguages.find((l) => l.lang === "Rust") ? "high" : "low" },
      { name: "Bytes (UI.dev)", url: "https://bytes.dev", pitch: "PimpMyGit — the missing discovery layer for GitHub repos", relevance: "medium" },
      { name: "Console.dev", url: "https://console.dev", pitch: "PimpMyGit: open-source GitHub repo discovery platform (MIT)", relevance: "high" },
      { name: "Changelog", url: "https://changelog.com", pitch: "PimpMyGit: community-driven GitHub repo curation. Open source, free, growing.", relevance: "high" },
      { name: "Hacker Newsletter", url: "https://hackernewsletter.com", pitch: "PimpMyGit — Product Hunt for GitHub repos", relevance: "high" },
    ],
    communities: [
      { name: "r/opensource", platform: "reddit", url: "https://reddit.com/r/opensource", strategy: "Share as a discovery tool for maintainers" },
      { name: "r/github", platform: "reddit", url: "https://reddit.com/r/github", strategy: "Position as 'GitHub trending but community-curated'" },
      { name: "r/webdev", platform: "reddit", url: "https://reddit.com/r/webdev", strategy: "Share tech stack story + ask for feedback" },
      { name: "r/SideProject", platform: "reddit", url: "https://reddit.com/r/SideProject", strategy: "Build in public update with traction numbers" },
      { name: "Hacker News", platform: "hn", url: "https://news.ycombinator.com", strategy: "Show HN post — understated, technical, ask for feedback" },
      { name: "DEV.to", platform: "devto", url: "https://dev.to", strategy: "Technical article about the build + discovery angle" },
      { name: "Indie Hackers", platform: "web", url: "https://www.indiehackers.com", strategy: "Product page + milestone updates" },
      { name: "Lobste.rs", platform: "web", url: "https://lobste.rs", strategy: "Technical angle — must be invited" },
      { name: "GitHub Discussions", platform: "github", url: "https://github.com/community", strategy: "Share in relevant community discussions" },
    ],
    influencers: [
      { type: "Dev YouTubers", examples: "Fireship, Theo, ThePrimeagen, Web Dev Simplified", approach: "DM with unique angle — 'The front page GitHub never built'" },
      { type: "Tech Twitter", examples: "@levelsio, @marc_louvion, @csaborella", approach: "Quote-tweet their open source takes, mention PimpMyGit as relevant tool" },
      { type: "GitHub Stars", examples: "Prolific open-source maintainers", approach: "Submit their repos, tag them when spotlighting their project" },
      { type: "Newsletter authors", examples: "See newsletter list above", approach: "Cold email with stats + why their readers would care" },
    ],
    pitchTemplate: `Hi [Name],

I built PimpMyGit (${SITE_URL}) — a community-driven platform for discovering and promoting GitHub repositories. Think Product Hunt, but exclusively for open source.

We have ${snapshot.totalRepos} repos, ${snapshot.totalVotes} community votes, and are growing organically. The platform is MIT open source.

[PERSONALIZED: Why their audience would care]

Would love to be featured in [publication/channel]. Happy to provide any info or assets you need.

Best,
[Your name]`,
  };
}

// ═══════════════════════════════════════════
//  POSTING SCHEDULE
// ═══════════════════════════════════════════

function generateSchedule(analysis) {
  const schedule = {
    optimal_times: {
      x: { days: "Tue-Thu", times: "9-11am EST, 1-3pm EST", note: "Developer Twitter peaks mid-morning" },
      reddit: { days: "Mon-Wed", times: "8-10am EST", note: "Early morning posts gain momentum through the day" },
      hn: { days: "Tue-Thu", times: "8-10am EST", note: "One shot — repost same URL flagged. Make it count." },
      linkedin: { days: "Tue-Thu", times: "7-9am EST", note: "Before-work scroll, professional tone" },
      devto: { days: "Mon-Wed", times: "Any", note: "Articles have long shelf life via SEO" },
    },
    weekly_cadence: {
      monday: "LinkedIn post (professional growth angle) + seed a Reddit thread",
      tuesday: "X thread (repo spotlight or hot take) — best HN day",
      wednesday: "X post (community stats or question) + Reddit language subreddit",
      thursday: "LinkedIn post (build in public update) + X engagement",
      friday: "DEV.to article publish + X weekly roundup",
    },
    frequency: {
      x: "3-5 posts/week (mix of original + engagement with dev community)",
      reddit: "1-2 posts/week (different subreddits, never crosspost same title)",
      hn: "1 post per month (save for milestones or significant updates)",
      linkedin: "2 posts/week (professional/growth angles)",
      devto: "1 article/2 weeks (deep content, SEO-focused)",
    },
  };

  return schedule;
}

// ═══════════════════════════════════════════
//  DISPLAY
// ═══════════════════════════════════════════

function printSection(title) {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(50)}`);
}

function printPost(post, index, platform) {
  const scoreBar = "█".repeat(Math.round(post.score / 10)) + "░".repeat(10 - Math.round(post.score / 10));
  console.log(`\n  [${index + 1}] Score: ${post.score}/100 ${scoreBar}  |  Angle: ${post.angle}${post.chars ? `  |  ${post.chars} chars` : ""}`);
  if (post.subreddits) console.log(`  Subreddits: ${post.subreddits.join(", ")}`);
  if (post.title) console.log(`  Title: ${post.title}`);
  console.log(`${"·".repeat(50)}`);
  console.log(post.text || post.body || post.comment || "");
}

// ═══════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const fetchOnly = args.includes("--fetch");
  const generateOnly = args.includes("--generate");
  const showHistory = args.includes("--history");
  const showAnalysis = args.includes("--analyze");
  const showOutreach = args.includes("--outreach");
  const showSEO = args.includes("--seo");
  const showBest = args.includes("--best");
  const platformFlag = args.indexOf("--platform");
  const platform = platformFlag >= 0 ? args[platformFlag + 1] : null;

  const kb = loadKnowledge();

  // ── History ──
  if (showHistory) {
    printSection("PROMOTION HISTORY");
    if (!kb.promotions.length) console.log("\n  No promotions tracked yet.");
    for (const p of kb.promotions.slice(-20)) {
      console.log(`  [${p.date}] ${p.platform} — ${p.title || p.type}`);
    }
    printSection("ANGLE USAGE");
    for (const [id, config] of Object.entries(CONTENT_ANGLES)) {
      const usage = kb.angles[id] || { lastUsed: 0, useCount: 0 };
      const daysSince = usage.lastUsed ? ((Date.now() - usage.lastUsed) / 86400000).toFixed(1) + "d ago" : "never";
      const cooldownOk = !usage.lastUsed || (Date.now() - usage.lastUsed) / 86400000 > config.cooldown;
      console.log(`  ${cooldownOk ? "✓" : "⏳"} ${config.label.padEnd(22)} used ${String(usage.useCount).padStart(2)}x  |  last: ${daysSince}`);
    }
    printSection("TALKING POINTS");
    for (const pt of kb.talkingPoints) console.log(`  • ${pt}`);
    return;
  }

  // ── Fetch ──
  let snapshot;
  if (!generateOnly && !showAnalysis && !showOutreach && !showSEO) {
    try {
      snapshot = await fetchSiteData();
      kb.snapshots.push(snapshot);
      if (kb.snapshots.length > 30) kb.snapshots = kb.snapshots.slice(-30);
      kb.talkingPoints = generateTalkingPoints(kb, snapshot);
      saveKnowledge(kb);
      console.log(`\n  Snapshot saved (${snapshot.timestamp})`);
      console.log(`  Repos: ${snapshot.totalRepos} | Votes: ${snapshot.totalVotes} | Views: ${snapshot.pageViews.toLocaleString()}`);
      console.log(`  Languages: ${snapshot.topLanguages.map((l) => `${l.lang}(${l.count})`).join(", ")}`);
      console.log(`  Submitters: ${snapshot.uniqueSubmitters} | Boosted: ${snapshot.boostedRepos}`);
    } catch (e) {
      console.error("  Fetch failed:", e.message);
      if (!kb.snapshots.length) { console.error("  No data. Fix fetch and retry."); process.exit(1); }
    }
  }

  if (fetchOnly) return;

  snapshot = snapshot || kb.snapshots[kb.snapshots.length - 1];
  if (!snapshot) { console.error("No snapshot. Run --fetch first."); process.exit(1); }

  const analysis = analyzeTrends(kb, snapshot);

  // ── Analysis ──
  if (showAnalysis || (!platform && !showOutreach && !showSEO)) {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  PIMPMYGIT INTELLIGENCE REPORT");
    console.log("══════════════════════════════════════════════════════");

    printSection(`STAGE: ${analysis.stage.toUpperCase()}  |  MOMENTUM: ${analysis.momentum.toUpperCase()}`);

    if (Object.keys(analysis.growthRate).length) {
      console.log("\n  Growth Rates:");
      for (const [m, g] of Object.entries(analysis.growthRate)) {
        const proj = analysis.projections[m];
        console.log(`    ${m.padEnd(18)} +${g.delta} over ${g.period} (${g.dailyRate}/day)  →  7d: ${proj.day7}  |  30d: ${proj.day30}`);
      }
    }

    if (analysis.insights.length) {
      console.log("\n  Insights:");
      for (const i of analysis.insights) console.log(`    💡 ${i}`);
    }

    if (analysis.strengths.length || analysis.weaknesses.length || analysis.opportunities.length) {
      if (analysis.strengths.length) { console.log("\n  Strengths:"); for (const s of analysis.strengths) console.log(`    ✅ ${s}`); }
      if (analysis.weaknesses.length) { console.log("\n  Weaknesses:"); for (const w of analysis.weaknesses) console.log(`    ⚠️  ${w}`); }
      if (analysis.opportunities.length) { console.log("\n  Opportunities:"); for (const o of analysis.opportunities) console.log(`    🎯 ${o}`); }
    }

    if (analysis.recommendations.length) {
      console.log("\n  Recommendations:");
      for (let i = 0; i < analysis.recommendations.length; i++) {
        console.log(`    ${i + 1}. ${analysis.recommendations[i]}`);
      }
    }

    if (showAnalysis) return;
  }

  // ── SEO ──
  if (showSEO || (!platform && !showOutreach)) {
    if (showSEO || !platform) {
      const seo = generateSEOKeywords(snapshot);
      printSection("SEO KEYWORDS");
      console.log("\n  Primary Keywords:");
      for (const k of seo.base) console.log(`    • ${k}`);
      console.log("\n  Language Keywords:");
      for (const k of seo.langKeywords.slice(0, 9)) console.log(`    • ${k}`);
      console.log("\n  Long-Tail Keywords:");
      for (const k of seo.longTail) console.log(`    • ${k}`);
      console.log("\n  Meta Descriptions:");
      for (const m of seo.metaDescriptions) console.log(`    → ${m}`);
      if (showSEO) return;
    }
  }

  // ── Outreach ──
  if (showOutreach) {
    const targets = generateOutreachTargets(kb, snapshot);
    printSection("NEWSLETTERS TO PITCH");
    for (const n of targets.newsletters) {
      const badge = n.relevance === "high" ? "🔴" : n.relevance === "medium" ? "🟡" : "⚪";
      console.log(`\n  ${badge} ${n.name} (${n.url})`);
      console.log(`     Pitch: ${n.pitch}`);
    }
    printSection("COMMUNITIES TO TARGET");
    for (const c of targets.communities) {
      console.log(`\n  📍 ${c.name} (${c.platform})`);
      console.log(`     Strategy: ${c.strategy}`);
    }
    printSection("INFLUENCER TYPES");
    for (const inf of targets.influencers) {
      console.log(`\n  🎯 ${inf.type}: ${inf.examples}`);
      console.log(`     Approach: ${inf.approach}`);
    }
    printSection("EMAIL PITCH TEMPLATE");
    console.log(targets.pitchTemplate);
    return;
  }

  // ── Schedule ──
  if (!platform) {
    const schedule = generateSchedule(analysis);
    printSection("POSTING SCHEDULE");
    console.log("\n  Optimal Times:");
    for (const [plat, info] of Object.entries(schedule.optimal_times)) {
      console.log(`    ${plat.padEnd(10)} ${info.days} @ ${info.times}  (${info.note})`);
    }
    console.log("\n  Weekly Cadence:");
    for (const [day, task] of Object.entries(schedule.weekly_cadence)) {
      console.log(`    ${day.charAt(0).toUpperCase() + day.slice(1).padEnd(11)} ${task}`);
    }
    console.log("\n  Frequency:");
    for (const [plat, freq] of Object.entries(schedule.frequency)) {
      console.log(`    ${plat.padEnd(10)} ${freq}`);
    }
  }

  // ── Content Generation ──
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  GENERATED CONTENT");
  console.log("══════════════════════════════════════════════════════");

  const allContent = [];

  if (!platform || platform === "x" || platform === "twitter") {
    printSection("TWITTER/X");
    const tweets = generateTwitterPosts(kb, snapshot, analysis);
    const show = showBest ? tweets.slice(0, 3) : tweets;
    for (let i = 0; i < show.length; i++) printPost(show[i], i, "x");
    allContent.push(...tweets.map((t) => ({ ...t, platform: "x" })));
  }

  if (!platform || platform === "reddit") {
    printSection("REDDIT");
    const reddits = generateRedditPosts(kb, snapshot, analysis);
    const show = showBest ? reddits.slice(0, 2) : reddits;
    for (let i = 0; i < show.length; i++) printPost(show[i], i, "reddit");
    allContent.push(...reddits.map((r) => ({ ...r, platform: "reddit" })));
  }

  if (!platform || platform === "hn" || platform === "hackernews") {
    printSection("HACKER NEWS");
    const hn = generateHNPosts(kb, snapshot, analysis);
    for (let i = 0; i < hn.length; i++) printPost(hn[i], i, "hn");
    allContent.push(...hn.map((h) => ({ ...h, platform: "hn" })));
  }

  if (!platform || platform === "linkedin") {
    printSection("LINKEDIN");
    const li = generateLinkedInPosts(kb, snapshot, analysis);
    const show = showBest ? li.slice(0, 2) : li;
    for (let i = 0; i < show.length; i++) printPost(show[i], i, "linkedin");
    allContent.push(...li.map((l) => ({ ...l, platform: "linkedin" })));
  }

  if (!platform || platform === "devto" || platform === "dev") {
    printSection("DEV.TO");
    const devto = generateDevToPost(kb, snapshot, analysis);
    console.log(`\n  Score: ${devto.score}/100  |  Angle: ${devto.angle}`);
    console.log(`  Title: ${devto.title}`);
    console.log(`  Tags: ${devto.tags.join(", ")}`);
    console.log(`${"·".repeat(50)}`);
    console.log(devto.body);
    allContent.push({ ...devto, platform: "devto" });
  }

  // Record angle usage for the top-scored content
  const topAngles = new Set();
  allContent.sort((a, b) => (b.score || 0) - (a.score || 0));
  for (const c of allContent.slice(0, 5)) {
    if (c.angle && !topAngles.has(c.angle)) {
      recordAngleUse(kb, c.angle);
      topAngles.add(c.angle);
    }
  }

  // Track promotion
  kb.promotions.push({
    date: new Date().toISOString().split("T")[0],
    platform: platform || "all",
    type: "content-generated",
    title: `Generated content (${snapshot.totalRepos} repos, ${snapshot.totalVotes} votes) — ${analysis.stage}/${analysis.momentum}`,
    angles: [...topAngles],
  });
  saveKnowledge(kb);

  console.log("\n══════════════════════════════════════════════════════");
  console.log(`  Knowledge base updated. Stage: ${analysis.stage} | Momentum: ${analysis.momentum}`);
  console.log(`  ${allContent.length} posts generated. Best score: ${allContent[0]?.score || 0}/100`);
  console.log("══════════════════════════════════════════════════════");
}

main().catch((e) => { console.error(e); process.exit(1); });
