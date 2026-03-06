import { NextRequest, NextResponse } from "next/server";
import { logChat, getRepos, getLanguages, getReposCount, getPageViews } from "@/lib/db";

interface Rule {
  intent: string;
  patterns: RegExp[];
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

const RULES: Rule[] = [
  {
    intent: "greeting",
    patterns: [/^(hi|hello|hey|sup|yo|howdy|greetings)/i, /^what'?s up/i],
    response: "Hey! I'm the PimpMyGit bot. I can help you discover repos, explain how the site works, or point you in the right direction. What are you looking for?",
  },
  {
    intent: "what_is",
    patterns: [/what is (pimpmygit|this site|this)/i, /what does (pimpmygit|this) do/i, /tell me about (pimpmygit|this site)/i, /explain/i],
    response: "PimpMyGit is a community-curated discovery platform for GitHub repos. Think \"Product Hunt, but for open source.\" You can submit repos, upvote the best ones, and browse by trending, new, or top. It's free, open source, and built for developers.",
  },
  {
    intent: "how_submit",
    patterns: [/how (do i|to|can i) submit/i, /submit a repo/i, /add (a |my )?repo/i, /post (a |my )?repo/i],
    response: "To submit a repo, click \"Submit\" in the nav bar (or go to /submit). Just paste the GitHub URL and we'll pull in the details automatically. You'll need to sign in with GitHub first — it takes 2 seconds.",
  },
  {
    intent: "how_vote",
    patterns: [/how (do i|to|can i) (vote|upvote)/i, /upvot/i, /voting/i],
    response: "Just click the upvote arrow on any repo card! You need to be signed in with GitHub. Each user gets one vote per repo. Your votes help repos climb the trending page.",
  },
  {
    intent: "how_boost",
    patterns: [/boost/i, /promot(e|ing|ion)/i, /visibility/i, /more (views|exposure)/i],
    response: "Boosting pushes your repo to the top of listings. It costs credits: 10 credits for 24h, 25 for 3 days, or 50 for a week. You can buy credits via PayPal on your profile page. Boosted repos get a special badge too.",
  },
  {
    intent: "trending",
    patterns: [/trending/i, /what'?s (hot|popular)/i, /top repo/i, /best repo/i],
    response: async (ctx) => {
      if (ctx.topRepo) {
        return `Right now, ${ctx.topRepo.name} is trending with ${ctx.topRepo.votes} votes! Check the homepage (sorted by Trending) to see what the community is upvoting. We have ${ctx.totalRepos} repos listed.`;
      }
      return "Check the homepage sorted by 'Trending' to see the most upvoted repos. Submit yours to join the rankings!";
    },
  },
  {
    intent: "languages",
    patterns: [/language/i, /what lang/i, /python|javascript|typescript|rust|go|java|ruby|c\+\+|c#/i],
    response: async (ctx) => {
      if (ctx.topLangs.length > 0) {
        return `Our top languages are: ${ctx.topLangs.join(", ")}. You can filter repos by language using the language dropdown on the homepage, or browse /language to see all categories.`;
      }
      return "You can filter repos by language on the homepage or browse /language to see all categories.";
    },
  },
  {
    intent: "stats",
    patterns: [/stats|statistics|numbers|how (big|many)/i, /how many repo/i, /page views/i],
    response: async (ctx) => {
      return `PimpMyGit currently has ${ctx.totalRepos} repos, ${ctx.totalVotes} community votes, and ${ctx.pageViews.toLocaleString()} page views. Check /stats for the full community dashboard!`;
    },
  },
  {
    intent: "collections",
    patterns: [/collection/i, /curated list/i, /list of repo/i],
    response: "Collections let you create curated lists of repos. You can make them public or private. Check out /collections to browse community-created collections, or create your own from your profile.",
  },
  {
    intent: "api",
    patterns: [/\bapi\b/i, /developer|programmat/i, /endpoint/i],
    response: "We have a public API at /api/v1/repos — no auth required. You can filter by sort (trending/new/top), language, and search. Full docs at /api-docs. There's also an RSS feed at /feed.xml.",
  },
  {
    intent: "badges",
    patterns: [/badge/i, /embed/i, /readme/i],
    response: "You can embed a PimpMyGit vote badge in your repo's README! Go to any repo page on PimpMyGit and click the badge icon to get the embed code (Markdown or HTML).",
  },
  {
    intent: "open_source",
    patterns: [/open source|license|mit|source code|github repo/i, /is (it|this) (free|open)/i],
    response: "Yes! PimpMyGit is 100% open source under the MIT license. The source code is at github.com/ghartrid/pimpmygit. Contributions welcome!",
  },
  {
    intent: "sign_in",
    patterns: [/sign (in|up)|log ?in|register|account/i, /github (auth|login|oauth)/i],
    response: "Click 'Sign in' in the top nav — it uses GitHub OAuth so there's no separate account to create. One click and you're in. You need to sign in to submit repos, vote, comment, or create collections.",
  },
  {
    intent: "contact",
    patterns: [/contact|support|help|feedback|bug|issue|report/i],
    response: "You can reach us at /contact — there's a form to send a message directly. For bugs or feature requests, you can also open an issue on our GitHub repo.",
  },
  {
    intent: "sponsored",
    patterns: [/sponsor/i, /advertis/i, /homepage slot/i, /paid/i],
    response: "Sponsored slots put your repo front-and-center on the homepage. Pricing: 100 credits for 1 day, 250 for 3 days, or 400 for a week. Contact us if you want to discuss larger campaigns.",
  },
  {
    intent: "weekly",
    patterns: [/weekly|digest|newsletter|this week/i],
    response: "Check /weekly for the auto-generated weekly digest — it shows the top-voted repos of the week, new additions, and language trends. Updated every time you visit!",
  },
  {
    intent: "thanks",
    patterns: [/thank|thanks|thx|cheers|appreciate/i],
    response: "You're welcome! If you have more questions, just ask. And if you find a cool repo, submit it to PimpMyGit!",
  },
];

const FALLBACK = "I'm not sure I understand that one. I can help with: submitting repos, voting, boosting, browsing by language, collections, the API, badges, and general site info. What would you like to know?";

function matchIntent(message: string): Rule | null {
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(message)) return rule;
    }
  }
  return null;
}

// Simple rate limiting per session
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // messages per minute
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

  const rule = matchIntent(message);
  let reply: string;
  let intent = "unknown";

  if (rule) {
    intent = rule.intent;
    if (typeof rule.response === "function") {
      const ctx = await getContext();
      reply = await rule.response(ctx);
    } else {
      reply = rule.response;
    }
  } else {
    reply = FALLBACK;
  }

  // Log asynchronously — don't block the response
  logChat(sessionId, message, reply, intent).catch(() => {});

  return NextResponse.json({ reply, intent });
}
