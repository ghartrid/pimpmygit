import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "pimpmygit.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      credits INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

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

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      repo_id INTEGER NOT NULL REFERENCES repos(id),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, repo_id)
    );
  `);
}

// --- User queries ---

export function upsertUser(githubId: string, username: string, avatarUrl: string) {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE github_id = ?").get(githubId) as { id: number } | undefined;
  if (existing) {
    db.prepare("UPDATE users SET username = ?, avatar_url = ? WHERE github_id = ?").run(username, avatarUrl, githubId);
    return existing.id;
  }
  const result = db.prepare("INSERT INTO users (github_id, username, avatar_url) VALUES (?, ?, ?)").run(githubId, username, avatarUrl);
  return result.lastInsertRowid as number;
}

export function getUserByGithubId(githubId: string) {
  return getDb().prepare("SELECT * FROM users WHERE github_id = ?").get(githubId) as DbUser | undefined;
}

export function getUserById(id: number) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined;
}

export function addCredits(userId: number, amount: number) {
  getDb().prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, userId);
}

// --- Repo queries ---

export function createRepo(data: {
  github_url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  submitted_by: number;
}) {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM repos WHERE github_url = ?").get(data.github_url);
  if (existing) return null; // already submitted
  const result = db.prepare(
    "INSERT INTO repos (github_url, owner, name, description, stars, language, avatar_url, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(data.github_url, data.owner, data.name, data.description, data.stars, data.language, data.avatar_url, data.submitted_by);
  return result.lastInsertRowid as number;
}

export function getRepos(options: {
  sort?: "trending" | "new" | "top";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = getDb();
  const { sort = "trending", search, limit = 30, offset = 0 } = options;

  let where = "";
  const params: (string | number)[] = [];

  if (search) {
    where = "WHERE (r.name LIKE ? OR r.description LIKE ? OR r.owner LIKE ?)";
    const term = `%${search}%`;
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

  // Boosted repos appear first (if boost_until > now)
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

  return db.prepare(sql).all(...params) as DbRepo[];
}

export function getRepoById(id: number) {
  return getDb().prepare(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
    FROM repos r
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE r.id = ?
  `).get(id) as DbRepo | undefined;
}

export function getReposByUser(userId: number) {
  return getDb().prepare(`
    SELECT r.*, u.username as submitted_by_username, u.avatar_url as submitted_by_avatar
    FROM repos r
    LEFT JOIN users u ON r.submitted_by = u.id
    WHERE r.submitted_by = ?
    ORDER BY r.created_at DESC
  `).all(userId) as DbRepo[];
}

// --- Vote queries ---

export function toggleVote(userId: number, repoId: number): boolean {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM votes WHERE user_id = ? AND repo_id = ?").get(userId, repoId);

  if (existing) {
    db.prepare("DELETE FROM votes WHERE user_id = ? AND repo_id = ?").run(userId, repoId);
    db.prepare("UPDATE repos SET upvote_count = upvote_count - 1 WHERE id = ?").run(repoId);
    return false; // unvoted
  } else {
    db.prepare("INSERT INTO votes (user_id, repo_id) VALUES (?, ?)").run(userId, repoId);
    db.prepare("UPDATE repos SET upvote_count = upvote_count + 1 WHERE id = ?").run(repoId);
    return true; // voted
  }
}

export function hasVoted(userId: number, repoId: number): boolean {
  const result = getDb().prepare("SELECT id FROM votes WHERE user_id = ? AND repo_id = ?").get(userId, repoId);
  return !!result;
}

export function getUserVotes(userId: number): number[] {
  const rows = getDb().prepare("SELECT repo_id FROM votes WHERE user_id = ?").all(userId) as { repo_id: number }[];
  return rows.map((r) => r.repo_id);
}

// --- Boost queries ---

export function boostRepo(userId: number, repoId: number, hours: number = 24): boolean {
  const db = getDb();
  const user = getUserById(userId);
  if (!user || user.credits < 10) return false;

  db.prepare("UPDATE users SET credits = credits - 10 WHERE id = ?").run(userId);
  db.prepare("UPDATE repos SET boost_until = datetime('now', '+' || ? || ' hours') WHERE id = ?").run(hours, repoId);
  return true;
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
