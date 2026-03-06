"use client";

import { useState, useCallback } from "react";

type Tab = "stats" | "repos" | "users" | "comments" | "messages";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const headers = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  async function handleLogin() {
    setError("");
    const res = await fetch("/api/admin?section=stats", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setAuthed(true);
      const d = await res.json();
      setData(d);
    } else {
      setError("Invalid token");
    }
  }

  const fetchTab = useCallback(async (t: Tab) => {
    setTab(t);
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin?section=${t}`, { headers: headers() });
    if (res.ok) {
      setData(await res.json());
    } else {
      setError("Failed to load");
    }
    setLoading(false);
  }, [headers]);

  async function handleDelete(type: string, id: number, label: string) {
    if (!confirm(`Delete ${type} "${label}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ type, id }),
    });
    if (res.ok) {
      fetchTab(tab);
    } else {
      setError("Delete failed");
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    const res = await fetch("/api/repos/refresh", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      alert(`Refreshed ${d.updated} repos (${d.errors} errors)`);
    } else {
      alert("Refresh failed");
    }
    setRefreshing(false);
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>
        <div className="rounded-xl border p-6" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <input
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none mb-4"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-medium cursor-pointer"
            style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          >
            Sign In
          </button>
          {error && <p className="mt-3 text-sm text-center" style={{ color: "var(--red)" }}>{error}</p>}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "stats", label: "Dashboard", icon: "\uD83D\uDCCA" },
    { key: "repos", label: "Repos", icon: "\uD83D\uDCC1" },
    { key: "users", label: "Users", icon: "\uD83D\uDC65" },
    { key: "comments", label: "Comments", icon: "\uD83D\uDCAC" },
    { key: "messages", label: "Messages", icon: "\u2709\uFE0F" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
          style={{ background: "var(--green)", color: "#fff", border: "none" }}
        >
          {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl overflow-hidden" style={{ background: "var(--bg-card)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => fetchTab(t.key)}
            className="flex-1 px-4 py-3 text-sm font-medium cursor-pointer transition-all"
            style={{
              background: tab === t.key ? "var(--accent)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--text-muted)",
              border: "none",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: "var(--red)" }}>{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : (
        <>
          {tab === "stats" && data && <StatsPanel data={data} />}
          {tab === "repos" && data && <ReposPanel repos={(data as { repos: Record<string, unknown>[] }).repos} onDelete={handleDelete} />}
          {tab === "users" && data && <UsersPanel users={(data as { users: Record<string, unknown>[] }).users} />}
          {tab === "comments" && data && <CommentsPanel comments={(data as { comments: Record<string, unknown>[] }).comments} onDelete={handleDelete} />}
          {tab === "messages" && data && <MessagesPanel messages={(data as { messages: Record<string, unknown>[] }).messages} />}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="text-2xl font-bold" style={{ color: color || "var(--text)" }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function StatsPanel({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    users: number; repos: number; votes: number; comments: number;
    collections: number; messages: number; totalCredits: number;
    activeBoosts: number; activeSponsors: number;
    recentUsers: { id: number; username: string; credits: number; created_at: string }[];
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
        <StatCard label="Users" value={d.users} color="var(--accent)" />
        <StatCard label="Repos" value={d.repos} color="var(--green)" />
        <StatCard label="Votes" value={d.votes} />
        <StatCard label="Comments" value={d.comments} />
        <StatCard label="Collections" value={d.collections} />
        <StatCard label="Messages" value={d.messages} color="var(--gold)" />
        <StatCard label="Credits in Circulation" value={d.totalCredits} color="var(--gold)" />
        <StatCard label="Active Boosts" value={d.activeBoosts} color="var(--green)" />
        <StatCard label="Active Sponsors" value={d.activeSponsors} color="var(--gold)" />
      </div>

      <h2 className="text-lg font-bold mb-3">Recent Users</h2>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-hover)" }}>
              <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>ID</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Username</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Credits</th>
              <th className="text-left px-4 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {d.recentUsers.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="px-4 py-2" style={{ color: "var(--text-muted)" }}>#{u.id}</td>
                <td className="px-4 py-2 font-medium">{u.username}</td>
                <td className="px-4 py-2" style={{ color: "var(--gold)" }}>{u.credits}</td>
                <td className="px-4 py-2" style={{ color: "var(--text-muted)" }}>{u.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReposPanel({ repos, onDelete }: { repos: Record<string, unknown>[]; onDelete: (type: string, id: number, label: string) => void }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-hover)" }}>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>ID</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Repo</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Lang</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Stars</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Votes</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>By</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {repos.map((r) => (
            <tr key={r.id as number} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>#{r.id as number}</td>
              <td className="px-3 py-2 font-medium">
                <a href={`/repo/${r.id}`} style={{ color: "var(--accent)" }}>{r.owner as string}/{r.name as string}</a>
              </td>
              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{r.language as string || "-"}</td>
              <td className="px-3 py-2">{(r.stars as number)?.toLocaleString()}</td>
              <td className="px-3 py-2" style={{ color: "var(--accent)" }}>{r.upvote_count as number}</td>
              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{r.submitted_by_username as string}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => onDelete("repo", r.id as number, `${r.owner}/${r.name}`)}
                  className="px-2 py-1 rounded text-xs cursor-pointer"
                  style={{ background: "transparent", color: "var(--red)", border: "1px solid var(--red)" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersPanel({ users }: { users: Record<string, unknown>[] }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-hover)" }}>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>ID</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Username</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Credits</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Repos</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Votes</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id as number} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>#{u.id as number}</td>
              <td className="px-3 py-2 font-medium">{u.username as string}</td>
              <td className="px-3 py-2" style={{ color: "var(--gold)" }}>{u.credits as number}</td>
              <td className="px-3 py-2">{u.repo_count as number}</td>
              <td className="px-3 py-2">{u.vote_count as number}</td>
              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{(u.created_at as string)?.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CommentsPanel({ comments, onDelete }: { comments: Record<string, unknown>[]; onDelete: (type: string, id: number, label: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {comments.map((c) => (
        <div key={c.id as number} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{c.username as string}</span>
              <span style={{ color: "var(--text-muted)" }}>on</span>
              <a href={`/repo/${c.repo_id}`} style={{ color: "var(--accent)" }}>{c.repo_owner as string}/{c.repo_name as string}</a>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>#{c.id as number}</span>
            </div>
            <button
              onClick={() => onDelete("comment", c.id as number, (c.body as string).slice(0, 30))}
              className="px-2 py-1 rounded text-xs cursor-pointer"
              style={{ background: "transparent", color: "var(--red)", border: "1px solid var(--red)" }}
            >
              Delete
            </button>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{c.body as string}</p>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{(c.created_at as string)?.slice(0, 16)}</p>
        </div>
      ))}
      {comments.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No comments yet</p>}
    </div>
  );
}

function MessagesPanel({ messages }: { messages: Record<string, unknown>[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div key={m.id as number} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-2 text-sm">
            <span className="font-medium">{m.name as string}</span>
            <span style={{ color: "var(--accent)" }}>{m.email as string}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{(m.created_at as string)?.slice(0, 16)}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{m.message as string}</p>
        </div>
      ))}
      {messages.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No messages yet</p>}
    </div>
  );
}
