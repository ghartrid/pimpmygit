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
  limit?: number;
  offset?: number;
}) {
  await ensureDb();
  const { sort = "trending", search, limit = 30, offset = 0 } = options;

  let where = "";
  const params: (string | number)[] = [];

  if (search) {
    const sanitized = search.slice(0, 200).replace(/[%_]/g, "\\$&");
    where = "WHERE (r.name LIKE ? ESCAPE '\\' OR r.description LIKE ? ESCAPE '\\' OR r.owner LIKE ? ESCAPE '\\')";
    const term = `%${sanitized}%`;
    params.push(term, term, term);
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
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
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

export async function boostRepo(userId: number, repoId: number): Promise<boolean> {
  await ensureDb();
  // Atomic: only deduct if credits >= 10, prevents negative balance race condition
  db.run("UPDATE users SET credits = credits - 10 WHERE id = ? AND credits >= 10", [userId]);
  const changes = db.getRowsModified();
  if (changes === 0) return false;
  runSql("UPDATE repos SET boost_until = datetime('now', '+24 hours') WHERE id = ?", [repoId]);
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
  upvote_count: number;
  created_at: string;
}
