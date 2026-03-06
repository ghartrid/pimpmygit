import { NextRequest, NextResponse } from "next/server";
import { logChat, getRepos, getLanguages, getReposCount, getPageViews } from "@/lib/db";

interface Intent {
  id: string;
  keywords: string[];
  followUp?: string[];  // suggested follow-up questions
  response: string | ((ctx: Context) => string | Promise<string>);
}

interface Context {
  totalRepos: number;
  totalVotes: number;
  pageViews: number;
  topLangs: string[];
  topRepo: { name: string; votes: number } | null;
  recentRepos: { name: string; lang: string }[];
}

async function getContext(): Promise<Context> {
  const [trendingRepos, newRepos, totalRepos, languages, pageViews] = await Promise.all([
    getRepos({ sort: "trending", limit: 5, offset: 0 }),
    getRepos({ sort: "new", limit: 3, offset: 0 }),
    getReposCount({}),
    getLanguages(),
    getPageViews(),
  ]);
  const totalVotes = trendingRepos.reduce((s, r) => s + ((r.upvote_count as number) || 0), 0);
  const topLangs = languages.slice(0, 5).map((l) => l.language);
  const topRepo = trendingRepos[0] ? { name: `${trendingRepos[0].owner}/${trendingRepos[0].name}`, votes: trendingRepos[0].upvote_count as number } : null;
  const recentRepos = newRepos.map((r) => ({ name: `${r.owner}/${r.name}`, lang: (r.language as string) || "" }));
  return { totalRepos, totalVotes, pageViews, topLangs, topRepo, recentRepos };
}

// ── Intent definitions ──

const INTENTS: Intent[] = [
  {
    id: "greeting",
    keywords: ["hi", "hello", "hey", "sup", "yo", "howdy", "greetings", "hiya", "whats up", "good morning", "good afternoon", "good evening", "hola", "aloha", "heya", "heyy", "wassup", "wazzup"],
    followUp: ["What is PimpMyGit?", "How do I submit a repo?", "Show me trending repos"],
    response: "Hey! I'm the PimpMyGit bot. I can help you discover repos, explain how the site works, or point you in the right direction. What are you looking for?",
  },
  {
    id: "what_is",
    keywords: ["what is", "what does", "about", "purpose", "explain", "tell me", "how does it work", "what is this", "what is pimpmygit", "overview", "introduction", "intro", "description", "meaning", "concept", "idea behind", "what site", "what platform", "what service"],
    followUp: ["How do I get started?", "How is it different from GitHub Trending?", "Is it free?"],
    response: "PimpMyGit is a community-curated discovery platform for GitHub repos. Think \"Product Hunt, but for open source.\" You can submit repos, upvote the best ones, and browse by trending, new, or top. It's free, open source, and built for developers.",
  },
  {
    id: "how_submit",
    keywords: ["submit", "add repo", "add my", "post repo", "share repo", "upload", "list my", "put my", "get my repo", "add project", "share project", "publish", "how to add", "how to submit", "submission", "contribute", "submit my", "list repo", "post my", "share my"],
    followUp: ["How do I sign in?", "Can I boost my repo?", "How does voting work?"],
    response: "To submit a repo, click \"Submit\" in the nav bar (or go to /submit). Just paste the GitHub URL and we'll pull in the details automatically. You'll need to sign in with GitHub first — it takes 2 seconds.",
  },
  {
    id: "how_vote",
    keywords: ["vote", "upvote", "downvote", "like", "voting", "thumbs up", "rate", "rating", "how to vote", "can i vote", "upvoting", "votes", "heart", "liked"],
    followUp: ["What is trending?", "Can I boost a repo?", "How do collections work?"],
    response: "Just click the upvote arrow on any repo card! You need to be signed in with GitHub. Each user gets one vote per repo. Your votes help repos climb the trending page.",
  },
  {
    id: "how_boost",
    keywords: ["boost", "promote", "promotion", "visibility", "exposure", "featured", "highlight", "spotlight", "more views", "more stars", "get noticed", "increase visibility", "top of list", "promote my", "boost my", "get more"],
    followUp: ["How do credits work?", "What about sponsored slots?", "How do I sign in?"],
    response: "Boosting pushes your repo to the top of listings. It costs credits: 10 credits for 24h, 25 for 3 days, or 50 for a week. You can buy credits via PayPal on your profile page. Boosted repos get a special badge too.",
  },
  {
    id: "credits",
    keywords: ["credits", "credit", "buy credits", "purchase", "cost", "price", "pricing", "how much", "pay", "payment", "paypal", "money", "currency", "coins", "tokens", "balance", "spend", "affordable", "expensive", "cheap"],
    followUp: ["How does boosting work?", "What are sponsored slots?", "Where is my profile?"],
    response: "Credits are the currency on PimpMyGit. You can buy them via PayPal on your profile page. They're used for boosting repos (10-50 credits) and sponsored homepage slots (100-400 credits). Sign in with GitHub to see your credit balance.",
  },
  {
    id: "trending",
    keywords: ["trending", "popular", "hot", "top repo", "best repo", "most voted", "whats trending", "discover", "find repos", "explore", "browse", "recommendations", "recommend", "suggest", "good repos", "cool repos", "interesting", "awesome", "show me", "what should i", "must see", "best of", "top picks"],
    followUp: ["How do I vote?", "Can I filter by language?", "Show me this week's highlights"],
    response: async (ctx) => {
      if (ctx.topRepo) {
        return `Right now, ${ctx.topRepo.name} is trending with ${ctx.topRepo.votes} votes! Check the homepage (sorted by Trending) to see what the community is upvoting. We have ${ctx.totalRepos} repos listed.`;
      }
      return "Check the homepage sorted by 'Trending' to see the most upvoted repos. Submit yours to join the rankings!";
    },
  },
  {
    id: "recent",
    keywords: ["recent", "newest", "latest", "just added", "new repos", "new submissions", "fresh", "just submitted", "recently added", "new today", "new this week"],
    followUp: ["Show me trending repos", "How do I submit mine?", "Check the weekly digest"],
    response: async (ctx) => {
      if (ctx.recentRepos.length > 0) {
        const list = ctx.recentRepos.map((r) => `- ${r.name}${r.lang ? ` (${r.lang})` : ""}`).join("\n");
        return `Recently added repos:\n${list}\n\nSort by 'New' on the homepage to see all the latest submissions!`;
      }
      return "Sort by 'New' on the homepage to see the latest submissions. Be the first to submit one at /submit!";
    },
  },
  {
    id: "languages",
    keywords: ["language", "languages", "python", "javascript", "typescript", "rust", "go", "golang", "java", "ruby", "c++", "cpp", "c#", "csharp", "swift", "kotlin", "php", "scala", "dart", "lua", "r lang", "perl", "filter", "category", "categories", "what languages", "filter by", "specific language", "lang"],
    followUp: ["Show me trending repos", "How do I submit?", "What are collections?"],
    response: async (ctx) => {
      if (ctx.topLangs.length > 0) {
        return `Our top languages are: ${ctx.topLangs.join(", ")}. You can filter repos by language using the language dropdown on the homepage, or browse /language to see all categories.`;
      }
      return "You can filter repos by language on the homepage or browse /language to see all categories.";
    },
  },
  {
    id: "stats",
    keywords: ["stats", "statistics", "numbers", "how big", "how many", "count", "total", "page views", "metrics", "growth", "data", "analytics", "dashboard", "size", "traffic"],
    followUp: ["Show me trending repos", "Check the weekly digest", "How do I submit?"],
    response: async (ctx) => {
      return `PimpMyGit currently has ${ctx.totalRepos} repos, ${ctx.totalVotes} community votes, and ${ctx.pageViews.toLocaleString()} page views. Check /stats for the full community dashboard!`;
    },
  },
  {
    id: "collections",
    keywords: ["collection", "collections", "curated", "organize", "group", "playlist", "bookmark", "save", "saved", "favorites", "favourites", "my list", "want list", "reading list", "watchlist"],
    followUp: ["How do I sign in?", "What is trending?", "How do badges work?"],
    response: "Collections let you create curated lists of repos. You can make them public or private. Check out /collections to browse community-created collections, or create your own from your profile.",
  },
  {
    id: "api",
    keywords: ["api", "developer api", "programmatic", "endpoint", "integration", "webhook", "rest", "json", "fetch data", "curl", "automate", "automation", "build with", "developer access", "machine readable", "scrape"],
    followUp: ["Is there an RSS feed?", "Is it open source?", "Show me the stats"],
    response: "We have a public API at /api/v1/repos — no auth required. You can filter by sort (trending/new/top), language, and search. Full docs at /api-docs. There's also an RSS feed at /feed.xml.",
  },
  {
    id: "rss",
    keywords: ["rss", "feed", "subscribe", "follow updates", "notifications", "updates", "notify", "alert", "stay updated", "news feed"],
    followUp: ["Tell me about the API", "What is the weekly digest?", "Show me trending repos"],
    response: "You can subscribe to PimpMyGit via RSS at /feed.xml — it includes the latest trending repos. Add it to your favorite RSS reader to stay updated!",
  },
  {
    id: "badges",
    keywords: ["badge", "badges", "embed", "readme", "widget", "button", "shield", "sticker", "svg", "markdown badge", "html embed", "show votes"],
    followUp: ["How do I submit a repo?", "How does voting work?", "Is it open source?"],
    response: "You can embed a PimpMyGit vote badge in your repo's README! Go to any repo page on PimpMyGit and click the badge icon to get the embed code (Markdown or HTML).",
  },
  {
    id: "open_source",
    keywords: ["open source", "opensource", "license", "mit", "source code", "free to use", "github repo", "is it free", "is it open", "contribute code", "contribution", "fork", "repo source", "cost nothing", "no cost", "free"],
    followUp: ["How do I get started?", "What is PimpMyGit?", "How do I submit?"],
    response: "Yes! PimpMyGit is 100% open source under the MIT license. The source code is at github.com/ghartrid/pimpmygit. It's completely free to use. Contributions welcome!",
  },
  {
    id: "sign_in",
    keywords: ["sign in", "signin", "sign up", "signup", "login", "log in", "register", "account", "auth", "authentication", "oauth", "github login", "create account", "join", "get started", "how to join", "access", "log on", "logging in"],
    followUp: ["How do I submit a repo?", "How does voting work?", "Where is my profile?"],
    response: "Click 'Sign in' in the top nav — it uses GitHub OAuth so there's no separate account to create. One click and you're in. You need to sign in to submit repos, vote, comment, or create collections.",
  },
  {
    id: "comments",
    keywords: ["comment", "comments", "discuss", "discussion", "reply", "thread", "conversation", "talk about", "opinions", "review", "reviews", "feedback on repo", "comment on", "leave comment", "write comment"],
    followUp: ["How do I sign in?", "How does voting work?", "What are collections?"],
    response: "Every repo page has a comment section! Sign in with GitHub and leave your thoughts. Comments support threading (replies), so you can have real discussions about repos.",
  },
  {
    id: "search",
    keywords: ["search", "find", "look for", "looking for", "where is", "how to find", "search for", "locate", "specific repo", "particular", "find a repo", "search bar", "find something", "looking", "hunt for"],
    followUp: ["Can I filter by language?", "Show me trending repos", "How does sorting work?"],
    response: "Use the search bar on the homepage to find repos by name, description, or owner. You can also combine search with language filters and sorting (trending/new/top) to narrow results.",
  },
  {
    id: "sorting",
    keywords: ["sort", "sorting", "order", "trending vs", "new vs", "top vs", "difference between", "how does trending work", "algorithm", "ranking", "ranked", "sort by", "sort order", "how are repos sorted", "how are repos ranked"],
    followUp: ["Show me trending repos", "Show me newest repos", "How do I vote?"],
    response: "PimpMyGit has three sort modes: Trending (most upvoted + recent activity), New (latest submissions), and Top (all-time most voted). Use the tabs on the homepage to switch between them.",
  },
  {
    id: "contact",
    keywords: ["contact", "support", "feedback", "bug", "issue", "report", "problem", "broken", "not working", "error", "wrong", "fix", "complaint", "reach out", "email", "message us", "get in touch", "talk to human", "real person"],
    followUp: ["What is PimpMyGit?", "Is it open source?", "How do I submit?"],
    response: "You can reach us at /contact — there's a form to send a message directly. For bugs or feature requests, you can also open an issue on our GitHub repo at github.com/ghartrid/pimpmygit.",
  },
  {
    id: "sponsored",
    keywords: ["sponsor", "sponsored", "advertise", "advertising", "ad", "homepage slot", "paid placement", "feature my repo", "premium", "pro", "front page", "homepage feature"],
    followUp: ["How do credits work?", "How does boosting work?", "Contact us"],
    response: "Sponsored slots put your repo front-and-center on the homepage. Pricing: 100 credits for 1 day, 250 for 3 days, or 400 for a week. Contact us if you want to discuss larger campaigns.",
  },
  {
    id: "weekly",
    keywords: ["weekly", "digest", "newsletter", "this week", "weekly report", "roundup", "recap", "summary", "highlights", "whats new", "week in review", "weekly update"],
    followUp: ["Show me trending repos", "Check the stats page", "How do I submit?"],
    response: "Check /weekly for the auto-generated weekly digest — it shows the top-voted repos of the week, new additions, and language trends. Updated every time you visit!",
  },
  {
    id: "leaderboard",
    keywords: ["leaderboard", "leader board", "top users", "top contributors", "ranking", "rank", "scoreboard", "who has most", "most active", "best users", "power users", "top submitters"],
    followUp: ["How do I submit?", "Show me trending repos", "Check the stats"],
    response: "Check out /leaderboard to see the most active contributors — users ranked by repos submitted, votes cast, and community engagement!",
  },
  {
    id: "profile",
    keywords: ["profile", "my profile", "my account", "my repos", "my votes", "my collections", "settings", "preferences", "edit profile", "account page", "my page", "my stuff", "my submissions"],
    followUp: ["How do I sign in?", "How do credits work?", "How do collections work?"],
    response: "After signing in, click your avatar in the nav to access your profile. There you can see your submitted repos, your votes, your collections, and manage your credits.",
  },
  {
    id: "dark_mode",
    keywords: ["dark mode", "light mode", "theme", "dark theme", "light theme", "toggle theme", "switch theme", "appearance", "color scheme", "night mode", "bright", "colors", "change color", "too dark", "too bright", "cant see"],
    followUp: ["What is PimpMyGit?", "Show me trending repos", "How do I submit?"],
    response: "PimpMyGit supports both dark and light themes! Click the sun/moon toggle icon in the navigation bar to switch. Your preference is saved automatically.",
  },
  {
    id: "delete",
    keywords: ["delete", "remove", "remove my", "delete my", "take down", "unlist", "how to delete", "can i remove", "undo submission", "remove repo", "delete repo"],
    followUp: ["How do I submit?", "Contact us", "Where is my profile?"],
    response: "You can delete your own repos from PimpMyGit. Go to the repo page, and if you're the one who submitted it, you'll see a delete option. Need help? Contact us at /contact.",
  },
  {
    id: "stars",
    keywords: ["stars", "github stars", "star count", "stargazers", "how many stars", "star vs vote", "stars vs votes", "difference stars votes"],
    followUp: ["How does voting work?", "What is trending?", "How do I submit?"],
    response: "PimpMyGit shows each repo's GitHub star count alongside community votes. Stars are synced from GitHub periodically. Votes on PimpMyGit are separate from GitHub stars — they represent our community's opinion!",
  },
  {
    id: "who_built",
    keywords: ["who built", "who made", "who created", "creator", "founder", "developer of", "built by", "made by", "team", "behind this", "who owns", "who runs"],
    followUp: ["Is it open source?", "How do I contribute?", "Contact the team"],
    response: "PimpMyGit was built by a solo indie developer. It's a passion project for the open-source community. The source code is on GitHub at github.com/ghartrid/pimpmygit — contributions are welcome!",
  },
  {
    id: "how_it_works",
    keywords: ["how it works", "how does it work", "how does this work", "walkthrough", "tutorial", "guide", "getting started", "start", "begin", "new here", "first time", "newbie", "beginner", "just joined", "where do i start", "what do i do", "show me around", "how to use"],
    followUp: ["How do I submit a repo?", "Show me trending repos", "How does voting work?"],
    response: "Here's the quick start:\n1. Browse repos on the homepage (sort by trending/new/top)\n2. Sign in with GitHub (one click)\n3. Upvote repos you like\n4. Submit your own repos at /submit\n5. Create collections to organize favorites\n\nThat's it! No sign-up forms, no email verification.",
  },
  {
    id: "why_use",
    keywords: ["why use", "why should i", "benefit", "benefits", "advantage", "advantages", "better than", "compared to", "vs github", "versus", "why not just", "point of", "reason", "why pimpmygit", "why this", "whats different", "what makes this special", "unique"],
    followUp: ["How does it work?", "Is it free?", "Show me trending repos"],
    response: "GitHub has 300M+ repos but no great way to surface hidden gems. PimpMyGit adds what's missing: community voting, persistent rankings, language filtering, collections, and a public API. Think of it as the missing front page for GitHub.",
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "thx", "cheers", "appreciate", "ty", "tyvm", "grateful"],
    followUp: ["Show me trending repos", "How do I submit?", "Check the weekly digest"],
    response: "Glad I could help! If you find a cool repo, submit it to PimpMyGit so others can discover it too.",
  },
  {
    id: "positive",
    keywords: ["awesome", "great", "cool", "nice", "love it", "amazing", "perfect", "wonderful", "excellent", "fantastic", "brilliant", "sweet", "neat", "sick", "dope", "fire", "lit", "impressive", "good job", "well done"],
    followUp: ["Submit a repo!", "Show me trending repos", "Tell a friend about PimpMyGit"],
    response: "Thanks! Glad you're enjoying PimpMyGit. Help us grow by submitting your favorite repos and spreading the word!",
  },
  {
    id: "negative",
    keywords: ["bad", "terrible", "awful", "hate", "sucks", "worst", "ugly", "useless", "garbage", "trash", "stupid", "dumb", "boring", "pointless", "waste"],
    followUp: ["Contact us with feedback", "What would you improve?", "Report a bug"],
    response: "Sorry to hear that! We're always improving. If you have specific feedback, we'd love to hear it at /contact. What could be better?",
  },
  {
    id: "goodbye",
    keywords: ["bye", "goodbye", "see ya", "later", "gotta go", "cya", "peace", "take care", "good night", "im leaving", "im done", "exit", "quit", "close"],
    response: "See you around! Happy repo hunting.",
  },
  {
    id: "bot_identity",
    keywords: ["are you a bot", "are you real", "are you ai", "are you human", "who are you", "your name", "what are you", "chatbot", "are you smart", "can you think"],
    followUp: ["What is PimpMyGit?", "How can you help me?", "Show me trending repos"],
    response: "I'm the PimpMyGit bot — a helpful assistant built into the site. I know everything about PimpMyGit and can answer your questions instantly. Try asking me about repos, voting, or how to get started!",
  },
  {
    id: "capabilities",
    keywords: ["what can you do", "help me", "how can you help", "what do you know", "capabilities", "features", "options", "menu", "commands", "what can i ask", "help", "assist", "assistance"],
    followUp: ["How do I submit a repo?", "Show me trending repos", "How does voting work?"],
    response: "I can help with:\n- Submitting, voting, and boosting repos\n- Finding trending and new repos\n- Language filters and search\n- Collections, badges, and the API\n- Credits, pricing, and sponsored slots\n- Account setup and profile\n- Weekly digest and community stats\n- Dark/light theme\n\nJust ask about any of these!",
  },
  {
    id: "confused",
    keywords: ["confused", "dont understand", "i dont get it", "what do you mean", "huh", "unclear", "makes no sense", "lost", "im lost", "i dont know", "not sure", "no idea", "what"],
    followUp: ["What is PimpMyGit?", "How do I get started?", "What can you help with?"],
    response: "No worries! PimpMyGit is a site where developers discover and promote GitHub repos. The simplest way to start: browse the homepage, sign in with GitHub, and upvote repos you like. Want me to explain something specific?",
  },
  {
    id: "fun",
    keywords: ["tell me a joke", "joke", "funny", "lol", "haha", "lmao", "rofl", "humor", "entertain", "bored", "play", "game"],
    followUp: ["Show me trending repos", "What is PimpMyGit?", "How do I submit?"],
    response: "Why do programmers prefer dark mode? Because light attracts bugs! But seriously, want to discover some cool repos? Check out what's trending!",
  },
  {
    id: "security",
    keywords: ["security", "safe", "privacy", "data", "trust", "secure", "hack", "scam", "phishing", "malware", "virus", "safe to use", "steal", "credentials"],
    followUp: ["How does sign-in work?", "Is it open source?", "Contact us"],
    response: "PimpMyGit uses GitHub OAuth for sign-in — we never see your GitHub password. We don't store sensitive data. The entire codebase is open source (MIT license) so you can verify everything yourself at github.com/ghartrid/pimpmygit.",
  },
  {
    id: "mobile",
    keywords: ["mobile", "phone", "app", "ios", "android", "responsive", "mobile app", "tablet", "small screen", "on my phone"],
    followUp: ["What is PimpMyGit?", "How do I submit?", "Show me trending repos"],
    response: "PimpMyGit is fully responsive — it works great on mobile browsers! There's no separate app needed. Just visit pimpmygit.com on your phone and everything works the same.",
  },
];

// ── Fuzzy matching (Levenshtein distance) ──

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function isFuzzyMatch(word: string, keyword: string): boolean {
  if (keyword.length <= 3) return word === keyword; // no fuzzy for short words
  const maxDist = keyword.length <= 5 ? 1 : 2;
  return levenshtein(word, keyword) <= maxDist;
}

// ── Keyword matching engine ──

function normalizeMessage(msg: string): string {
  return msg
    .toLowerCase()
    .replace(/['']/g, "")        // remove apostrophes
    .replace(/[^\w\s+#]/g, " ")  // keep letters, numbers, +, #
    .replace(/\s+/g, " ")
    .trim();
}

function scoreIntent(normalized: string, words: string[], intent: Intent): number {
  let score = 0;
  for (const kw of intent.keywords) {
    const kwLower = kw.toLowerCase();
    // Multi-word keywords: check if the phrase appears
    if (kwLower.includes(" ")) {
      if (normalized.includes(kwLower)) score += 3; // phrase match is strong
    } else {
      // Exact word match
      if (words.includes(kwLower)) {
        score += 1;
      } else {
        // Fuzzy match — check each word in the message
        for (const w of words) {
          if (w.length >= 3 && isFuzzyMatch(w, kwLower)) {
            score += 0.7; // fuzzy worth slightly less
            break;
          }
        }
      }
    }
  }
  return score;
}

// ── Session memory for follow-ups ──
const sessionMemory = new Map<string, { lastIntent: string; timestamp: number }>();
const MEMORY_TTL = 10 * 60 * 1000; // 10 min
const MAX_SESSIONS = 1000;

function pruneMap(map: Map<string, { timestamp?: number; resetAt?: number }>, max: number) {
  if (map.size <= max) return;
  const now = Date.now();
  for (const [key, val] of map) {
    const ts = val.timestamp ?? val.resetAt ?? 0;
    if (now - ts > MEMORY_TTL) map.delete(key);
    if (map.size <= max) return;
  }
  // Still over limit — drop oldest entries
  const entries = [...map.entries()];
  const toDelete = entries.slice(0, entries.length - max);
  for (const [key] of toDelete) map.delete(key);
}

function getLastIntent(sessionId: string): string | null {
  const entry = sessionMemory.get(sessionId);
  if (!entry || Date.now() - entry.timestamp > MEMORY_TTL) return null;
  return entry.lastIntent;
}

function setLastIntent(sessionId: string, intentId: string) {
  sessionMemory.set(sessionId, { lastIntent: intentId, timestamp: Date.now() });
  pruneMap(sessionMemory as Map<string, { timestamp?: number; resetAt?: number }>, MAX_SESSIONS);
}

// Follow-up phrases that refer back to previous topic
const FOLLOWUP_PATTERNS = [
  "tell me more", "more info", "more details", "elaborate", "go on",
  "explain more", "what else", "and", "continue", "keep going",
  "more about that", "more about it", "more on that", "expand",
  "how", "why", "when", "where", "really", "seriously",
  "can you explain", "say more", "details", "detail",
];

function isFollowUp(normalized: string): boolean {
  return FOLLOWUP_PATTERNS.some((p) => normalized.includes(p)) && normalized.split(" ").length <= 6;
}

// ── Main matching ──

function matchIntent(message: string, sessionId: string): { intent: Intent | null; isFollowUp: boolean } {
  const normalized = normalizeMessage(message);
  const words = normalized.split(" ");

  // Check if this is a follow-up to the last topic
  if (isFollowUp(normalized)) {
    const lastId = getLastIntent(sessionId);
    if (lastId) {
      const lastIntent = INTENTS.find((i) => i.id === lastId);
      if (lastIntent) return { intent: lastIntent, isFollowUp: true };
    }
  }

  let bestIntent: Intent | null = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    const score = scoreIntent(normalized, words, intent);
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  }

  return { intent: bestScore >= 1 ? bestIntent : null, isFollowUp: false };
}

// ── Smarter fallback with best-guess ──

function buildFallback(message: string): { reply: string; suggestions: string[] } {
  const normalized = normalizeMessage(message);
  const words = normalized.split(" ");

  // Find the two closest intents even if below threshold
  const scored = INTENTS.map((intent) => ({ intent, score: scoreIntent(normalized, words, intent) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length > 0) {
    const guesses = scored.map((s) => {
      const labels: Record<string, string> = {
        how_submit: "submitting repos", how_vote: "voting", how_boost: "boosting",
        trending: "trending repos", languages: "language filters", stats: "site stats",
        collections: "collections", api: "the API", badges: "badges", credits: "credits",
        sign_in: "signing in", comments: "comments", search: "searching",
        weekly: "the weekly digest", sponsored: "sponsored slots", contact: "contacting us",
        dark_mode: "theme switching", profile: "your profile", leaderboard: "the leaderboard",
        open_source: "open source", recent: "new repos", sorting: "how sorting works",
      };
      return labels[s.intent.id] || s.intent.id.replace(/_/g, " ");
    });

    return {
      reply: `I'm not 100% sure what you mean. Were you asking about ${guesses.join(" or ")}? Try rephrasing, or pick one of the suggestions below!`,
      suggestions: scored[0].intent.followUp || ["What is PimpMyGit?", "How do I submit?", "Show me trending repos"],
    };
  }

  return {
    reply: "I'm not sure about that one, but I know a lot about PimpMyGit! Try one of these topics, or ask me something specific:",
    suggestions: ["What is PimpMyGit?", "How do I get started?", "Show me trending repos", "How does voting work?"],
  };
}

// ── Rate limiting ──
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRate(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW });
    pruneMap(rateLimits as Map<string, { timestamp?: number; resetAt?: number }>, MAX_SESSIONS);
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
    return NextResponse.json({ reply: "Say something! I don't bite.", suggestions: ["What is PimpMyGit?", "How do I submit?", "Show me trending repos"] });
  }

  if (!checkRate(sessionId)) {
    return NextResponse.json({ reply: "Whoa, slow down! You're sending messages too fast. Try again in a minute." }, { status: 429 });
  }

  const { intent, isFollowUp: wasFollowUp } = matchIntent(message, sessionId);
  let reply: string;
  let intentId = "unknown";
  let suggestions: string[] = [];

  if (intent) {
    intentId = intent.id;
    if (typeof intent.response === "function") {
      const ctx = await getContext();
      reply = await intent.response(ctx);
    } else {
      reply = intent.response;
    }
    if (wasFollowUp) {
      reply = "Sure, here's more on that:\n\n" + reply;
    }
    suggestions = intent.followUp || [];
    setLastIntent(sessionId, intentId);
  } else {
    const fallback = buildFallback(message);
    reply = fallback.reply;
    suggestions = fallback.suggestions;
  }

  logChat(sessionId, message, reply, intentId).catch(() => {});

  return NextResponse.json({ reply, intent: intentId, suggestions });
}
