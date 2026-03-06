import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "pimpmygit.db");

let db: SqlJsDatabase;
let dbReady: Promise<void>;

function ensureDb(): Promise<void> {
  if (!dbReady) {
    dbReady = (async () => {
      const SQL = await initSqlJs();
      try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (fs.existsSync(DB_PATH)) {
          const buf = fs.readFileSync(DB_PATH);
          db = new SQL.Database(buf);
        } else {
          db = new SQL.Database();
        }
      } catch {
        db = new SQL.Database();
      }
      initTables();
    })();
  }
  return dbReady;
}

function save() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error("DB save error:", e);
  }
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      credits INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_url TEXT UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      stars INTEGER DEFAULT 0,
      language TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      submitted_by INTEGER REFERENCES users(id),
      boost_until TEXT,
      upvote_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      repo_id INTEGER NOT NULL REFERENCES repos(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, repo_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS paypal_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      package_id TEXT NOT NULL,
      status TEXT DEFAULT 'created',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL REFERENCES repos(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      parent_id INTEGER REFERENCES comments(id),
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS collection_repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id),
      repo_id INTEGER NOT NULL REFERENCES repos(id),
      added_at TEXT DEFAULT (datetime('now')),
      UNIQUE(collection_id, repo_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sponsored_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER NOT NULL REFERENCES repos(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      slot_position INTEGER NOT NULL,
      starts_at TEXT DEFAULT (datetime('now')),
      ends_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      count INTEGER DEFAULT 0
    );
  `);
  db.run(`INSERT OR IGNORE INTO page_views (id, count) VALUES (1, 0)`);
  // Add boost_tier column to repos if not exists
  try {
    db.run("ALTER TABLE repos ADD COLUMN boost_tier TEXT DEFAULT ''");
  } catch { /* column already exists */ }
  save();
}

// Helper: run query returning rows as objects
function queryAll(sql: string, params: (string | number)[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql: string, params: (string | number)[] = []): Record<string, unknown> | undefined {
  const rows = queryAll(sql, params);
  return rows[0];
}

function runSql(sql: string, params: (string | number)[] = []) {
  db.run(sql, params);
  save();
}

// --- User queries ---

export async function upsertUser(githubId: string, username: string, avatarUrl: string) {
  await ensureDb();
  const existing = queryOne("SELECT id FROM users WHERE github_id = ?", [githubId]);
  if (existing) {
    runSql("UPDATE users SET username = ?, avatar_url = ? WHERE github_id = ?", [username, avatarUrl, githubId]);
    return existing.id as number;
  }
  runSql("INSERT INTO users (github_id, username, avatar_url) VALUES (?, ?, ?)", [githubId, username, avatarUrl]);
  const row = queryOne("SELECT last_insert_rowid() as id");
  return (row?.id as number) || 0;
}

export async function getUserByGithubId(githubId: string) {
  await ensureDb();
  return queryOne("SELECT * FROM users WHERE github_id = ?", [githubId]) as DbUser | undefined;
}

export async function getUserById(id: number) {
  await ensureDb();
  return queryOne("SELECT * FROM users WHERE id = ?", [id]) as DbUser | undefined;
}

export async function addCredits(userId: number, amount: number) {
  await ensureDb();
  runSql("UPDATE users SET credits = credits + ? WHERE id = ?", [amount, userId]);
}

// --- Repo queries ---

export async function createRepo(data: {
  github_url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  submitted_by: number;
}) {
  await ensureDb();
  if (!data.github_url.startsWith("https://github.com/")) return null;
  const existing = queryOne("SELECT id FROM repos WHERE github_url = ?", [data.github_url]);
  if (existing) return null;
  runSql(
    "INSERT INTO repos (github_url, owner, name, description, stars, language, avatar_url, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [data.github_url, data.owner, data.name, data.description, data.stars, data.language, data.avatar_url, data.submitted_by]
  );
  const row = queryOne("SELECT last_insert_rowid() as id");
  return (row?.id as number) || 0;
}

export async function getRepos(options: {
  sort?: "trending" | "new" | "top";
  search?: string;
  language?: string;
  limit?: number;
  offset?: number;
}) {
  await ensureDb();
  const { sort = "trending", search, language, limit = 30, offset = 0 } = options;

  let where = "WHERE 1=1";
  const params: (string | number)[] = [];

  if (search) {
    const sanitized = search.slice(0, 200).replace(/[%_]/g, "\\$&");
    where += " AND (r.name LIKE ? ESCAPE '\\' OR r.description LIKE ? ESCAPE '\\' OR r.owner LIKE ? ESCAPE '\\')";
    const term = `%${sanitized}%`;
    params.push(term, term, term);
  }

  if (language) {
    where += " AND r.language = ?";
    params.push(language);
  }

  let orderBy: string;
  switch (sort) {
    case "new":
      orderBy = "r.created_at DESC";
      break;
    case "top":
      orderBy = "r.upvote_count DESC";
      break;
    case "trending":
    default:
      orderBy = "r.upvote_count DESC, r.created_at DESC";
      break;
  }

  const sql = `
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar,
      (SELECT COUNT(*) FROM comments WHERE comments.repo_id = r.id) as comment_count
    FROM repos r
    LEFT JOIN users u ON r.submitted_by = u.id
    ${where}
    ORDER BY
      CASE WHEN r.boost_until > datetime('now') THEN 0 ELSE 1 END,
      ${orderBy}
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  return queryAll(sql, params) as unknown as DbRepo[];
}

export async function getRepoById(id: number) {
  await ensureDb();
  return queryOne(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
    FROM repos r
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE r.id = ?
  `, [id]) as DbRepo | undefined;
}

export async function getReposByUser(userId: number) {
  await ensureDb();
  return queryAll(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
    FROM repos r
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE r.submitted_by = ?
    ORDER BY r.created_at DESC
  `, [userId]) as unknown as DbRepo[];
}

// --- Vote queries ---

export async function toggleVote(userId: number, repoId: number): Promise<boolean> {
  await ensureDb();
  const existing = queryOne("SELECT id FROM votes WHERE user_id = ? AND repo_id = ?", [userId, repoId]);

  if (existing) {
    runSql("DELETE FROM votes WHERE user_id = ? AND repo_id = ?", [userId, repoId]);
    // Sync count from actual votes to prevent desync
    runSql("UPDATE repos SET upvote_count = (SELECT COUNT(*) FROM votes WHERE repo_id = ?) WHERE id = ?", [repoId, repoId]);
    return false;
  } else {
    db.run("INSERT OR IGNORE INTO votes (user_id, repo_id) VALUES (?, ?)", [userId, repoId]);
    if (db.getRowsModified() === 0) return true; // Already voted (race condition)
    runSql("UPDATE repos SET upvote_count = (SELECT COUNT(*) FROM votes WHERE repo_id = ?) WHERE id = ?", [repoId, repoId]);
    return true;
  }
}

export async function hasVoted(userId: number, repoId: number): Promise<boolean> {
  await ensureDb();
  const result = queryOne("SELECT id FROM votes WHERE user_id = ? AND repo_id = ?", [userId, repoId]);
  return !!result;
}

export async function getUserVotes(userId: number): Promise<number[]> {
  await ensureDb();
  const rows = queryAll("SELECT repo_id FROM votes WHERE user_id = ?", [userId]);
  return rows.map((r) => r.repo_id as number);
}

// --- Boost queries ---

export const BOOST_TIERS = {
  basic:   { credits: 10, hours: 24, label: "24h" },
  plus:    { credits: 25, hours: 72, label: "3 days" },
  premium: { credits: 50, hours: 168, label: "7 days" },
} as const;

export async function boostRepo(userId: number, repoId: number, tier: string = "basic"): Promise<boolean> {
  await ensureDb();
  const t = BOOST_TIERS[tier as keyof typeof BOOST_TIERS];
  if (!t) return false;
  db.run("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?", [t.credits, userId, t.credits]);
  const changes = db.getRowsModified();
  if (changes === 0) return false;
  runSql("UPDATE repos SET boost_until = datetime('now', '+' || ? || ' hours'), boost_tier = ? WHERE id = ?", [t.hours, tier, repoId]);
  return true;
}

// --- PayPal order queries ---

export async function createPaypalOrder(orderId: string, userId: number, packageId: string) {
  await ensureDb();
  runSql("INSERT INTO paypal_orders (order_id, user_id, package_id) VALUES (?, ?, ?)", [orderId, userId, packageId]);
}

export async function capturePaypalOrder(orderId: string): Promise<{ packageId: string; userId: number } | null> {
  await ensureDb();
  const order = queryOne(
    "SELECT package_id, user_id, status FROM paypal_orders WHERE order_id = ?",
    [orderId]
  );
  if (!order || order.status !== "created") return null; // Already captured or doesn't exist
  runSql("UPDATE paypal_orders SET status = 'captured' WHERE order_id = ? AND status = 'created'", [orderId]);
  const changes = db.getRowsModified();
  if (changes === 0) return null; // Race condition: another request already captured
  return { packageId: order.package_id as string, userId: order.user_id as number };
}

// --- Delete queries ---

export async function deleteRepo(repoId: number, userId: number): Promise<boolean> {
  await ensureDb();
  // Only the submitter can delete their repo
  const repo = queryOne("SELECT id FROM repos WHERE id = ? AND submitted_by = ?", [repoId, userId]);
  if (!repo) return false;
  runSql("DELETE FROM comments WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM collection_repos WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM votes WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM repos WHERE id = ? AND submitted_by = ?", [repoId, userId]);
  return db.getRowsModified() > 0;
}

export async function deleteUser(userId: number): Promise<boolean> {
  await ensureDb();
  const user = queryOne("SELECT id FROM users WHERE id = ?", [userId]);
  if (!user) return false;
  // Delete user's votes
  runSql("DELETE FROM votes WHERE user_id = ?", [userId]);
  // Recalculate upvote counts for affected repos
  const repos = queryAll("SELECT id FROM repos", []);
  for (const r of repos) {
    runSql("UPDATE repos SET upvote_count = (SELECT COUNT(*) FROM votes WHERE repo_id = ?) WHERE id = ?", [r.id as number, r.id as number]);
  }
  // Delete user's comments
  runSql("DELETE FROM comments WHERE user_id = ?", [userId]);
  // Delete user's collections
  const userCollections = queryAll("SELECT id FROM collections WHERE user_id = ?", [userId]);
  for (const c of userCollections) {
    runSql("DELETE FROM collection_repos WHERE collection_id = ?", [c.id as number]);
  }
  runSql("DELETE FROM collections WHERE user_id = ?", [userId]);
  // Delete user's repos and their votes/comments/collection refs
  const userRepos = queryAll("SELECT id FROM repos WHERE submitted_by = ?", [userId]);
  for (const r of userRepos) {
    runSql("DELETE FROM comments WHERE repo_id = ?", [r.id as number]);
    runSql("DELETE FROM collection_repos WHERE repo_id = ?", [r.id as number]);
    runSql("DELETE FROM votes WHERE repo_id = ?", [r.id as number]);
  }
  runSql("DELETE FROM repos WHERE submitted_by = ?", [userId]);
  // Delete sponsored slots
  runSql("DELETE FROM sponsored_slots WHERE user_id = ?", [userId]);
  // Delete paypal orders
  runSql("DELETE FROM paypal_orders WHERE user_id = ?", [userId]);
  // Delete user
  runSql("DELETE FROM users WHERE id = ?", [userId]);
  return true;
}

// --- Contact queries ---

export async function createContactMessage(name: string, email: string, message: string) {
  await ensureDb();
  runSql("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)", [name, email, message]);
}

export async function getContactMessages(): Promise<{ id: number; name: string; email: string; message: string; created_at: string }[]> {
  await ensureDb();
  return queryAll("SELECT id, name, email, message, created_at FROM contact_messages ORDER BY id DESC LIMIT 50") as { id: number; name: string; email: string; message: string; created_at: string }[];
}

// --- Comment queries ---

export async function createComment(repoId: number, userId: number, body: string, parentId?: number): Promise<number> {
  await ensureDb();
  if (parentId) {
    const parent = queryOne("SELECT id, parent_id FROM comments WHERE id = ? AND repo_id = ?", [parentId, repoId]);
    if (!parent || parent.parent_id !== null) return 0; // Only allow 1-level replies
  }
  if (parentId) {
    runSql(
      "INSERT INTO comments (repo_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)",
      [repoId, userId, parentId, body]
    );
  } else {
    db.run("INSERT INTO comments (repo_id, user_id, body) VALUES (?, ?, ?)", [repoId, userId, body]);
    save();
  }
  const row = queryOne("SELECT last_insert_rowid() as id");
  return (row?.id as number) || 0;
}

export async function getCommentsByRepo(repoId: number): Promise<DbComment[]> {
  await ensureDb();
  return queryAll(`
    SELECT c.*, u.username, u.avatar_url as user_avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.repo_id = ?
    ORDER BY c.created_at ASC
  `, [repoId]) as unknown as DbComment[];
}

export async function deleteComment(commentId: number, userId: number): Promise<boolean> {
  await ensureDb();
  // Verify ownership first
  const comment = queryOne("SELECT id FROM comments WHERE id = ? AND user_id = ?", [commentId, userId]);
  if (!comment) return false;
  // Delete all replies to this comment, then the comment itself
  runSql("DELETE FROM comments WHERE parent_id = ?", [commentId]);
  runSql("DELETE FROM comments WHERE id = ?", [commentId]);
  return db.getRowsModified() > 0;
}

export async function getCommentCount(repoId: number): Promise<number> {
  await ensureDb();
  const row = queryOne("SELECT COUNT(*) as count FROM comments WHERE repo_id = ?", [repoId]);
  return (row?.count as number) || 0;
}

// --- Collection queries ---

export async function createCollection(userId: number, title: string, description: string): Promise<number> {
  await ensureDb();
  runSql("INSERT INTO collections (user_id, title, description) VALUES (?, ?, ?)", [userId, title, description]);
  const row = queryOne("SELECT last_insert_rowid() as id");
  return (row?.id as number) || 0;
}

export async function getPublicCollections(limit: number = 30, offset: number = 0): Promise<DbCollection[]> {
  await ensureDb();
  return queryAll(`
    SELECT c.*, u.username, u.avatar_url as user_avatar,
      (SELECT COUNT(*) FROM collection_repos WHERE collection_id = c.id) as repo_count
    FROM collections c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.is_public = 1
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]) as unknown as DbCollection[];
}

export async function getCollectionsByUser(userId: number, includePrivate: boolean = false): Promise<DbCollection[]> {
  await ensureDb();
  const publicFilter = includePrivate ? "" : " AND c.is_public = 1";
  return queryAll(`
    SELECT c.*,
      (SELECT COUNT(*) FROM collection_repos WHERE collection_id = c.id) as repo_count
    FROM collections c
    WHERE c.user_id = ?${publicFilter}
    ORDER BY c.created_at DESC
  `, [userId]) as unknown as DbCollection[];
}

export async function getCollectionById(id: number): Promise<DbCollection | undefined> {
  await ensureDb();
  return queryOne(`
    SELECT c.*, u.username, u.avatar_url as user_avatar,
      (SELECT COUNT(*) FROM collection_repos WHERE collection_id = c.id) as repo_count
    FROM collections c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `, [id]) as unknown as DbCollection | undefined;
}

export async function getCollectionRepos(collectionId: number): Promise<DbRepo[]> {
  await ensureDb();
  return queryAll(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
    FROM collection_repos cr
    JOIN repos r ON cr.repo_id = r.id
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE cr.collection_id = ?
    ORDER BY cr.added_at DESC
  `, [collectionId]) as unknown as DbRepo[];
}

export async function addRepoToCollection(collectionId: number, repoId: number, userId: number): Promise<boolean> {
  await ensureDb();
  const col = queryOne("SELECT id FROM collections WHERE id = ? AND user_id = ?", [collectionId, userId]);
  if (!col) return false;
  db.run("INSERT OR IGNORE INTO collection_repos (collection_id, repo_id) VALUES (?, ?)", [collectionId, repoId]);
  return db.getRowsModified() > 0;
}

export async function removeRepoFromCollection(collectionId: number, repoId: number, userId: number): Promise<boolean> {
  await ensureDb();
  const col = queryOne("SELECT id FROM collections WHERE id = ? AND user_id = ?", [collectionId, userId]);
  if (!col) return false;
  runSql("DELETE FROM collection_repos WHERE collection_id = ? AND repo_id = ?", [collectionId, repoId]);
  return db.getRowsModified() > 0;
}

export async function deleteCollection(collectionId: number, userId: number): Promise<boolean> {
  await ensureDb();
  const col = queryOne("SELECT id FROM collections WHERE id = ? AND user_id = ?", [collectionId, userId]);
  if (!col) return false;
  runSql("DELETE FROM collection_repos WHERE collection_id = ?", [collectionId]);
  runSql("DELETE FROM collections WHERE id = ? AND user_id = ?", [collectionId, userId]);
  return db.getRowsModified() > 0;
}

// --- Sponsored slot queries ---

export const SPONSORED_TIERS = {
  "1d":  { credits: 100, days: 1, label: "1 day" },
  "3d":  { credits: 250, days: 3, label: "3 days" },
  "7d":  { credits: 400, days: 7, label: "7 days" },
} as const;

export async function getActiveSponsored(): Promise<DbRepo[]> {
  await ensureDb();
  return queryAll(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar,
      s.slot_position, s.ends_at as sponsor_ends_at
    FROM sponsored_slots s
    JOIN repos r ON s.repo_id = r.id
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE s.ends_at > datetime('now')
    ORDER BY s.slot_position ASC
    LIMIT 2
  `) as unknown as DbRepo[];
}

export async function createSponsoredSlot(repoId: number, userId: number, slot: number, duration: string): Promise<boolean> {
  await ensureDb();
  const t = SPONSORED_TIERS[duration as keyof typeof SPONSORED_TIERS];
  if (!t || (slot !== 1 && slot !== 2)) return false;
  // Deduct credits atomically
  db.run("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?", [t.credits, userId, t.credits]);
  if (db.getRowsModified() === 0) return false;
  // Insert only if slot is not currently active (atomic check via WHERE NOT EXISTS)
  db.run(
    `INSERT INTO sponsored_slots (repo_id, user_id, slot_position, ends_at)
     SELECT ?, ?, ?, datetime('now', '+' || ? || ' days')
     WHERE NOT EXISTS (SELECT 1 FROM sponsored_slots WHERE slot_position = ? AND ends_at > datetime('now'))`,
    [repoId, userId, slot, t.days, slot]
  );
  if (db.getRowsModified() === 0) {
    // Slot was taken — refund credits
    db.run("UPDATE users SET credits = credits + ? WHERE id = ?", [t.credits, userId]);
    save();
    return false;
  }
  save();
  return true;
}

// --- Language queries ---

export async function getLanguages(): Promise<{ language: string; count: number }[]> {
  await ensureDb();
  return queryAll(`
    SELECT language, COUNT(*) as count
    FROM repos
    WHERE language != '' AND language IS NOT NULL
    GROUP BY language
    ORDER BY count DESC
  `) as unknown as { language: string; count: number }[];
}

// --- Extended repo queries ---

export async function getReposCount(options: { search?: string; language?: string }): Promise<number> {
  await ensureDb();
  let where = "WHERE 1=1";
  const params: (string | number)[] = [];
  if (options.search) {
    const sanitized = options.search.slice(0, 200).replace(/[%_]/g, "\\$&");
    where += " AND (r.name LIKE ? ESCAPE '\\' OR r.description LIKE ? ESCAPE '\\' OR r.owner LIKE ? ESCAPE '\\')";
    const term = `%${sanitized}%`;
    params.push(term, term, term);
  }
  if (options.language) {
    where += " AND r.language = ?";
    params.push(options.language);
  }
  const row = queryOne(`SELECT COUNT(*) as count FROM repos r ${where}`, params);
  return (row?.count as number) || 0;
}

// --- Sitemap queries ---

export async function getAllRepoIds(): Promise<{ id: number; created_at: string }[]> {
  await ensureDb();
  return queryAll("SELECT id, created_at FROM repos ORDER BY id ASC") as unknown as { id: number; created_at: string }[];
}

export async function getPublicCollectionIds(): Promise<{ id: number; created_at: string }[]> {
  await ensureDb();
  return queryAll("SELECT id, created_at FROM collections WHERE is_public = 1 ORDER BY id ASC") as unknown as { id: number; created_at: string }[];
}

// --- Stats refresh ---

export async function updateRepoStats(id: number, stars: number, description: string, language: string) {
  await ensureDb();
  runSql("UPDATE repos SET stars = ?, description = ?, language = ? WHERE id = ?", [stars, description, language, id]);
}

export async function getAllRepos(): Promise<{ id: number; owner: string; name: string }[]> {
  await ensureDb();
  return queryAll("SELECT id, owner, name FROM repos ORDER BY id ASC") as unknown as { id: number; owner: string; name: string }[];
}

// --- Admin queries ---

export async function getAdminStats() {
  await ensureDb();
  const users = queryOne("SELECT COUNT(*) as count FROM users");
  const repos = queryOne("SELECT COUNT(*) as count FROM repos");
  const votes = queryOne("SELECT COUNT(*) as count FROM votes");
  const comments = queryOne("SELECT COUNT(*) as count FROM comments");
  const collections = queryOne("SELECT COUNT(*) as count FROM collections");
  const messages = queryOne("SELECT COUNT(*) as count FROM contact_messages");
  const totalCredits = queryOne("SELECT SUM(credits) as total FROM users");
  const activeBoosts = queryOne("SELECT COUNT(*) as count FROM repos WHERE boost_until > datetime('now')");
  const activeSponsors = queryOne("SELECT COUNT(*) as count FROM sponsored_slots WHERE ends_at > datetime('now')");
  const recentUsers = queryAll("SELECT id, username, avatar_url, credits, created_at FROM users ORDER BY id DESC LIMIT 10") as unknown as DbUser[];
  return {
    users: (users?.count as number) || 0,
    repos: (repos?.count as number) || 0,
    votes: (votes?.count as number) || 0,
    comments: (comments?.count as number) || 0,
    collections: (collections?.count as number) || 0,
    messages: (messages?.count as number) || 0,
    totalCredits: (totalCredits?.total as number) || 0,
    activeBoosts: (activeBoosts?.count as number) || 0,
    activeSponsors: (activeSponsors?.count as number) || 0,
    recentUsers,
  };
}

export async function adminGetAllRepos() {
  await ensureDb();
  return queryAll(`
    SELECT r.id, r.owner, r.name, r.stars, r.language, r.upvote_count, r.boost_until, r.created_at,
      u.username as submitted_by_username,
      (SELECT COUNT(*) FROM comments WHERE comments.repo_id = r.id) as comment_count
    FROM repos r LEFT JOIN users u ON r.submitted_by = u.id
    ORDER BY r.id DESC
  `) as unknown as Record<string, unknown>[];
}

export async function adminGetAllUsers() {
  await ensureDb();
  return queryAll(`
    SELECT u.id, u.username, u.avatar_url, u.credits, u.created_at,
      (SELECT COUNT(*) FROM repos WHERE repos.submitted_by = u.id) as repo_count,
      (SELECT COUNT(*) FROM votes WHERE votes.user_id = u.id) as vote_count
    FROM users u ORDER BY u.id DESC
  `) as unknown as Record<string, unknown>[];
}

export async function adminGetAllComments() {
  await ensureDb();
  return queryAll(`
    SELECT c.id, c.body, c.created_at, c.repo_id,
      u.username, r.owner as repo_owner, r.name as repo_name
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN repos r ON c.repo_id = r.id
    ORDER BY c.id DESC LIMIT 50
  `) as unknown as Record<string, unknown>[];
}

export async function adminDeleteRepo(repoId: number) {
  await ensureDb();
  runSql("DELETE FROM comments WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM collection_repos WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM votes WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM sponsored_slots WHERE repo_id = ?", [repoId]);
  runSql("DELETE FROM repos WHERE id = ?", [repoId]);
  return db.getRowsModified() > 0;
}

export async function adminDeleteComment(commentId: number) {
  await ensureDb();
  runSql("DELETE FROM comments WHERE parent_id = ?", [commentId]);
  runSql("DELETE FROM comments WHERE id = ?", [commentId]);
  return db.getRowsModified() > 0;
}

// --- Types ---

export interface DbUser {
  id: number;
  github_id: string;
  username: string;
  avatar_url: string;
  credits: number;
  created_at: string;
}

export interface DbRepo {
  id: number;
  github_url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  submitted_by: number;
  submitted_by_username: string;
  submitted_by_avatar: string;
  boost_until: string | null;
  boost_tier: string;
  upvote_count: number;
  comment_count: number;
  created_at: string;
}

export interface DbComment {
  id: number;
  repo_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  username: string;
  user_avatar: string;
}

export interface DbCollection {
  id: number;
  user_id: number;
  title: string;
  description: string;
  is_public: number;
  created_at: string;
  username: string;
  user_avatar: string;
  repo_count: number;
}

// ── Page view counter ──
export async function incrementPageViews(): Promise<number> {
  await ensureDb();
  runSql("UPDATE page_views SET count = count + 1 WHERE id = 1");
  const row = queryOne("SELECT count FROM page_views WHERE id = 1");
  return (row?.count as number) || 0;
}

export async function getPageViews(): Promise<number> {
  await ensureDb();
  const row = queryOne("SELECT count FROM page_views WHERE id = 1");
  return (row?.count as number) || 0;
}
