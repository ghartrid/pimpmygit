import { NextRequest, NextResponse } from "next/server";
import { logChat, getRepos, getLanguages, getReposCount, getPageViews } from "@/lib/db";

interface Intent {
  id: string;
  keywords: string[];
  response: string | ((ctx: Context) => string | Promise<string>);
}

interface Context {
  totalRepos: number;
  totalVotes: number;
  pageViews: number;
  topLangs: string[];
  topRepo: { name: string; votes: number } | null;
}

async function getContext(): Promise<Context> {
  const [repos, totalRepos, languages, pageViews] = await Promise.all([
    getRepos({ sort: "trending", limit: 20, offset: 0 }),
    getReposCount({}),
    getLanguages(),
    getPageViews(),
  ]);
  const totalVotes = repos.reduce((s, r) => s + ((r.upvote_count as number) || 0), 0);
  const topLangs = languages.slice(0, 5).map((l) => l.language);
  const topRepo = repos[0] ? { name: `${repos[0].owner}/${repos[0].name}`, votes: repos[0].upvote_count as number } : null;
  return { totalRepos, totalVotes, pageViews, topLangs, topRepo };
}

// ── Intent definitions with keyword matching ──
// Each keyword that appears in the user message scores +1.
// The intent with the highest score wins. Minimum 1 keyword must match.

const INTENTS: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "sup", "yo", "howdy", "greetings", "hiya", "whats up", "good morning", "good afternoon", "good evening", "hola", "aloha"],
    response: "Hey! I'm the PimpMyGit bot. I can help you discover repos, explain how the site works, or point you in the right direction. What are you looking for?",
  },
  {
    id: "what_is",
    keywords: ["what is", "what does", "about", "purpose", "explain", "tell me", "how does it work", "what is this", "what is pimpmygit", "overview", "introduction", "intro", "description", "meaning", "concept", "idea behind"],
    response: "PimpMyGit is a community-curated discovery platform for GitHub repos. Think \"Product Hunt, but for open source.\" You can submit repos, upvote the best ones, and browse by trending, new, or top. It's free, open source, and built for developers.",
  },
  {
    id: "how_submit",
    keywords: ["submit", "add repo", "add my", "post repo", "share repo", "upload", "list my", "put my", "get my repo", "add project", "share project", "publish", "how to add", "how to submit", "submission", "contribute"],
    response: "To submit a repo, click \"Submit\" in the nav bar (or go to /submit). Just paste the GitHub URL and we'll pull in the details automatically. You'll need to sign in with GitHub first — it takes 2 seconds.",
  },
  {
    id: "how_vote",
    keywords: ["vote", "upvote", "downvote", "like", "voting", "thumbs up", "rate", "rating", "how to vote", "can i vote", "upvoting"],
    response: "Just click the upvote arrow on any repo card! You need to be signed in with GitHub. Each user gets one vote per repo. Your votes help repos climb the trending page.",
  },
  {
    id: "how_boost",
    keywords: ["boost", "promote", "promotion", "visibility", "exposure", "featured", "highlight", "spotlight", "more views", "more stars", "get noticed", "increase visibility", "top of list"],
    response: "Boosting pushes your repo to the top of listings. It costs credits: 10 credits for 24h, 25 for 3 days, or 50 for a week. You can buy credits via PayPal on your profile page. Boosted repos get a special badge too.",
  },
  {
    id: "credits",
    keywords: ["credits", "credit", "buy credits", "purchase", "cost", "price", "pricing", "how much", "pay", "payment", "paypal", "money", "currency", "coins", "tokens"],
    response: "Credits are the currency on PimpMyGit. You can buy them via PayPal on your profile page. They're used for boosting repos (10-50 credits) and sponsored homepage slots (100-400 credits). Sign in with GitHub to see your credit balance.",
  },
  {
    id: "trending",
    keywords: ["trending", "popular", "hot", "top repo", "best repo", "most voted", "whats trending", "discover", "find repos", "explore", "browse", "recommendations", "recommend", "suggest", "good repos", "cool repos", "interesting", "awesome"],
    response: async (ctx) => {
      if (ctx.topRepo) {
        return `Right now, ${ctx.topRepo.name} is trending with ${ctx.topRepo.votes} votes! Check the homepage (sorted by Trending) to see what the community is upvoting. We have ${ctx.totalRepos} repos listed.`;
      }
      return "Check the homepage sorted by 'Trending' to see the most upvoted repos. Submit yours to join the rankings!";
    },
  },
  {
    id: "languages",
    keywords: ["language", "languages", "python", "javascript", "typescript", "rust", "go", "golang", "java", "ruby", "c++", "cpp", "c#", "csharp", "swift", "kotlin", "php", "scala", "dart", "lua", "r", "perl", "filter", "category", "categories", "what languages"],
    response: async (ctx) => {
      if (ctx.topLangs.length > 0) {
        return `Our top languages are: ${ctx.topLangs.join(", ")}. You can filter repos by language using the language dropdown on the homepage, or browse /language to see all categories.`;
      }
      return "You can filter repos by language on the homepage or browse /language to see all categories.";
    },
  },
  {
    id: "stats",
    keywords: ["stats", "statistics", "numbers", "how big", "how many", "count", "total", "page views", "metrics", "growth", "data", "analytics", "dashboard"],
    response: async (ctx) => {
      return `PimpMyGit currently has ${ctx.totalRepos} repos, ${ctx.totalVotes} community votes, and ${ctx.pageViews.toLocaleString()} page views. Check /stats for the full community dashboard!`;
    },
  },
  {
    id: "collections",
    keywords: ["collection", "collections", "curated", "list", "lists", "organize", "group", "playlist", "bookmark", "save", "saved", "favorites", "favourites"],
    response: "Collections let you create curated lists of repos. You can make them public or private. Check out /collections to browse community-created collections, or create your own from your profile.",
  },
  {
    id: "api",
    keywords: ["api", "developer", "programmatic", "endpoint", "integration", "webhook", "rest", "json", "fetch", "curl", "automate", "automation", "build with", "developer access"],
    response: "We have a public API at /api/v1/repos — no auth required. You can filter by sort (trending/new/top), language, and search. Full docs at /api-docs. There's also an RSS feed at /feed.xml.",
  },
  {
    id: "rss",
    keywords: ["rss", "feed", "subscribe", "follow", "notifications", "updates", "notify", "alert"],
    response: "You can subscribe to PimpMyGit via RSS at /feed.xml — it includes the latest trending repos. Add it to your favorite RSS reader to stay updated!",
  },
  {
    id: "badges",
    keywords: ["badge", "badges", "embed", "readme", "widget", "button", "shield", "sticker", "svg"],
    response: "You can embed a PimpMyGit vote badge in your repo's README! Go to any repo page on PimpMyGit and click the badge icon to get the embed code (Markdown or HTML).",
  },
  {
    id: "open_source",
    keywords: ["open source", "opensource", "license", "mit", "source code", "code", "free", "github repo", "is it free", "is it open", "contribute", "contribution", "fork"],
    response: "Yes! PimpMyGit is 100% open source under the MIT license. The source code is at github.com/ghartrid/pimpmygit. Contributions welcome!",
  },
  {
    id: "sign_in",
    keywords: ["sign in", "signin", "sign up", "signup", "login", "log in", "register", "account", "auth", "authentication", "oauth", "github login", "create account", "join", "get started"],
    response: "Click 'Sign in' in the top nav — it uses GitHub OAuth so there's no separate account to create. One click and you're in. You need to sign in to submit repos, vote, comment, or create collections.",
  },
  {
    id: "comments",
    keywords: ["comment", "comments", "discuss", "discussion", "reply", "thread", "conversation", "talk", "chat about", "opinions", "review", "reviews", "feedback on repo"],
    response: "Every repo page has a comment section! Sign in with GitHub and leave your thoughts. Comments support threading (replies), so you can have real discussions about repos.",
  },
  {
    id: "search",
    keywords: ["search", "find", "look for", "looking for", "where is", "how to find", "search for", "locate", "specific repo", "particular"],
    response: "Use the search bar on the homepage to find repos by name, description, or owner. You can also combine search with language filters and sorting (trending/new/top) to narrow results.",
  },
  {
    id: "sorting",
    keywords: ["sort", "sorting", "order", "trending vs", "new vs", "top vs", "difference between", "how does trending work", "algorithm", "ranking", "ranked"],
    response: "PimpMyGit has three sort modes: Trending (most upvoted + recent activity), New (latest submissions), and Top (all-time most voted). Use the tabs on the homepage to switch between them.",
  },
  {
    id: "contact",
    keywords: ["contact", "support", "help me", "feedback", "bug", "issue", "report", "problem", "broken", "not working", "error", "wrong", "fix", "complaint", "reach out", "email", "message"],
    response: "You can reach us at /contact — there's a form to send a message directly. For bugs or feature requests, you can also open an issue on our GitHub repo at github.com/ghartrid/pimpmygit.",
  },
  {
    id: "sponsored",
    keywords: ["sponsor", "sponsored", "advertise", "advertising", "ad", "homepage slot", "paid placement", "feature my repo", "premium", "pro"],
    response: "Sponsored slots put your repo front-and-center on the homepage. Pricing: 100 credits for 1 day, 250 for 3 days, or 400 for a week. Contact us if you want to discuss larger campaigns.",
  },
  {
    id: "weekly",
    keywords: ["weekly", "digest", "newsletter", "this week", "weekly report", "roundup", "recap", "summary", "highlights", "whats new"],
    response: "Check /weekly for the auto-generated weekly digest — it shows the top-voted repos of the week, new additions, and language trends. Updated every time you visit!",
  },
  {
    id: "leaderboard",
    keywords: ["leaderboard", "leader board", "top users", "top contributors", "ranking", "rank", "scoreboard", "who has most", "most active"],
    response: "Check out /leaderboard to see the most active contributors — users ranked by repos submitted, votes cast, and community engagement!",
  },
  {
    id: "profile",
    keywords: ["profile", "my profile", "my account", "my repos", "my votes", "my collections", "settings", "preferences", "edit profile"],
    response: "After signing in, click your avatar in the nav to access your profile. There you can see your submitted repos, your votes, your collections, and manage your credits.",
  },
  {
    id: "dark_mode",
    keywords: ["dark mode", "light mode", "theme", "dark theme", "light theme", "toggle theme", "switch theme", "appearance", "color scheme", "night mode"],
    response: "PimpMyGit supports both dark and light themes! Click the sun/moon toggle icon in the navigation bar to switch. Your preference is saved automatically.",
  },
  {
    id: "delete",
    keywords: ["delete", "remove", "remove my", "delete my", "take down", "unlist", "how to delete", "can i remove"],
    response: "You can delete your own repos from PimpMyGit. Go to the repo page, and if you're the one who submitted it, you'll see a delete option. Need help? Contact us at /contact.",
  },
  {
    id: "stars",
    keywords: ["stars", "github stars", "star count", "stargazers", "how many stars", "star"],
    response: "PimpMyGit shows each repo's GitHub star count alongside community votes. Stars are synced from GitHub periodically. Votes on PimpMyGit are separate from GitHub stars — they represent our community's opinion!",
  },
  {
    id: "who_built",
    keywords: ["who built", "who made", "who created", "creator", "founder", "developer", "built by", "made by", "team", "behind this"],
    response: "PimpMyGit was built by a solo indie developer. It's a passion project for the open-source community. The source code is on GitHub at github.com/ghartrid/pimpmygit — contributions are welcome!",
  },
  {
    id: "how_it_works",
    keywords: ["how it works", "how does it work", "how does this work", "walkthrough", "tutorial", "guide", "getting started", "start", "begin", "new here", "first time", "newbie", "beginner"],
    response: "Here's the quick start:\n1. Browse repos on the homepage (sort by trending/new/top)\n2. Sign in with GitHub (one click)\n3. Upvote repos you like\n4. Submit your own repos at /submit\n5. Create collections to organize favorites\n\nThat's it! No sign-up forms, no email verification.",
  },
  {
    id: "why_use",
    keywords: ["why use", "why should i", "benefit", "benefits", "advantage", "advantages", "better than", "compared to", "vs", "versus", "why not just", "point of", "reason"],
    response: "GitHub has 300M+ repos but no great way to surface hidden gems. PimpMyGit adds what's missing: community voting, persistent rankings, language filtering, collections, and a public API. Think of it as the missing front page for GitHub.",
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "thx", "cheers", "appreciate", "ty", "tyvm", "grateful", "awesome", "great", "cool", "nice", "love it", "amazing", "perfect", "wonderful", "excellent"],
    response: "Glad I could help! If you find a cool repo, submit it to PimpMyGit so others can discover it too.",
  },
  {
    id: "goodbye",
    keywords: ["bye", "goodbye", "see ya", "later", "gotta go", "cya", "peace", "take care", "good night"],
    response: "See you around! Happy repo hunting.",
  },
  {
    id: "bot_identity",
    keywords: ["are you a bot", "are you real", "are you ai", "are you human", "who are you", "your name", "what are you"],
    response: "I'm the PimpMyGit bot — a helpful assistant built into the site. I'm not AI-powered (no LLM behind me), just a well-trained rule-based bot that knows everything about PimpMyGit. Ask me anything about the site!",
  },
];

// ── Keyword matching engine ──

function normalizeMessage(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/[^\w\s+#]/g, " ")  // keep letters, numbers, +, #
    .replace(/\s+/g, " ")
    .trim();
}

function scoreIntent(normalized: string, intent: Intent): number {
  let score = 0;
  for (const kw of intent.keywords) {
    const kwLower = kw.toLowerCase();
    // Multi-word keywords: check if the phrase appears
    if (kwLower.includes(" ")) {
      if (normalized.includes(kwLower)) score += 2; // phrase match worth more
    } else {
      // Single word: check word boundary match
      const wordRegex = new RegExp(`\\b${kwLower.replace(/[+#]/g, "\\$&")}\\b`);
      if (wordRegex.test(normalized)) score += 1;
    }
  }
  return score;
}

function matchIntent(message: string): Intent | null {
  const normalized = normalizeMessage(message);

  let bestIntent: Intent | null = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    const score = scoreIntent(normalized, intent);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  // Require at least score of 1 to match
  return bestScore >= 1 ? bestIntent : null;
}

const FALLBACK = "Hmm, I'm not sure about that one. Here's what I can help with:\n\n- How to submit, vote, or boost repos\n- Trending repos and language filters\n- Collections, badges, and the API\n- Credits, pricing, and sponsored slots\n- Account, profile, and settings\n- Weekly digest and stats\n\nTry asking about any of these!";

// Simple rate limiting per session
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRate(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = String(body.message || "").trim().slice(0, 500);
  const sessionId = String(body.sessionId || "anonymous").slice(0, 64);

  if (!message) {
    return NextResponse.json({ reply: "Say something! I don't bite." });
  }

  if (!checkRate(sessionId)) {
    return NextResponse.json({ reply: "Whoa, slow down! You're sending messages too fast. Try again in a minute." }, { status: 429 });
  }

  const intent = matchIntent(message);
  let reply: string;
  let intentId = "unknown";

  if (intent) {
    intentId = intent.id;
    if (typeof intent.response === "function") {
      const ctx = await getContext();
      reply = await intent.response(ctx);
    } else {
      reply = intent.response;
    }
  } else {
    reply = FALLBACK;
  }

  logChat(sessionId, message, reply, intentId).catch(() => {});

  return NextResponse.json({ reply, intent: intentId });
}
