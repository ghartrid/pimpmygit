"use client";

import { useState, useCallback } from "react";

type Tab = "stats" | "repos" | "users" | "comments" | "messages" | "promote";

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
    const url = t === "promote" ? "/api/admin/promote" : `/api/admin?section=${t}`;
    const res = await fetch(url, { headers: headers() });
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
    { key: "promote", label: "Promote", icon: "\uD83D\uDE80" },
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
          {tab === "promote" && data && <PromotePanel data={data} />}
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

// ── Promote Panel ──

interface PromoteData {
  stage: string;
  momentum: string;
  stats: { totalRepos: number; totalVotes: number; totalStars: number; pageViews: number; submitters: number; topLangs: { lang: string; count: number }[] };
  insights: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  content: { platform: string; angle: string; score: number; text: string }[];
  competitors: { name: string; weakness: string; advantage: string }[];
  audiences: { name: string; hook: string; platforms: string }[];
  outreach: { name: string; relevance: string; pitch: string }[];
  schedule: { optimal: { platform: string; days: string; times: string; note: string }[]; weekly: { day: string; task: string }[] };
  seo: { primary: string[]; longTail: string[]; langKeywords: string[] };
}

function PromotePanel({ data }: { data: Record<string, unknown> }) {
  const d = data as unknown as PromoteData;
  const [section, setSection] = useState<string>("overview");
  const [copied, setCopied] = useState<number | null>(null);

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const sections = [
    { key: "overview", label: "Overview" },
    { key: "content", label: "Content" },
    { key: "outreach", label: "Outreach" },
    { key: "schedule", label: "Schedule" },
    { key: "seo", label: "SEO" },
    { key: "competitors", label: "Competitors" },
  ];

  const stageColors: Record<string, string> = { launch: "#f59e0b", early: "#3b82f6", growth: "#22c55e", scaling: "#a855f7" };
  const momentumColors: Record<string, string> = { stagnant: "#ef4444", declining: "#f97316", neutral: "#a3a3a3", growing: "#22c55e", surging: "#a855f7" };

  return (
    <div>
      {/* Stage + Momentum badges */}
      <div className="flex items-center gap-3 mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: stageColors[d.stage] || "#666", color: "#fff" }}>
          STAGE: {d.stage.toUpperCase()}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: momentumColors[d.momentum] || "#666", color: "#fff" }}>
          MOMENTUM: {d.momentum.toUpperCase()}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {d.stats.totalRepos} repos | {d.stats.totalVotes} votes | {d.stats.submitters} submitters | {d.stats.pageViews.toLocaleString()} views
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 rounded-lg overflow-hidden" style={{ background: "var(--bg)" }}>
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className="px-4 py-2 text-xs font-medium cursor-pointer transition-all"
            style={{
              background: section === s.key ? "var(--accent)" : "transparent",
              color: section === s.key ? "#fff" : "var(--text-muted)",
              border: "none",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {section === "overview" && (
        <div className="flex flex-col gap-4">
          {/* Insights */}
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Insights</h3>
            {d.insights.map((i, idx) => (
              <p key={idx} className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>💡 {i}</p>
            ))}
          </div>

          {/* SWOT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {d.strengths.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: "#22c55e" }}>Strengths</h3>
                {d.strengths.map((s, i) => <p key={i} className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>✅ {s}</p>)}
              </div>
            )}
            {d.weaknesses.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: "#f59e0b" }}>Weaknesses</h3>
                {d.weaknesses.map((w, i) => <p key={i} className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>⚠️ {w}</p>)}
              </div>
            )}
            {d.opportunities.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <h3 className="text-sm font-bold mb-2" style={{ color: "#3b82f6" }}>Opportunities</h3>
                {d.opportunities.map((o, i) => <p key={i} className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>🎯 {o}</p>)}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Recommendations</h3>
            {d.recommendations.map((r, i) => (
              <p key={i} className="text-sm mb-2" style={{ color: r.startsWith("PRIORITY") ? "var(--accent)" : "var(--text-muted)" }}>
                {i + 1}. {r}
              </p>
            ))}
          </div>

          {/* Audiences */}
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Target Audiences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {d.audiences.map((a, i) => (
                <div key={i} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-bold mb-1">{a.name}</p>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{a.hook}</p>
                  <p className="text-xs" style={{ color: "var(--accent)" }}>{a.platforms}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {section === "content" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {d.content.length} posts generated, sorted by engagement score. Click Copy to grab any post.
          </p>
          {d.content.map((c, i) => {
            const barWidth = Math.round(c.score);
            return (
              <div key={i} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                      {c.platform}
                    </span>
                    <span className="text-xs" style={{ color: "var(--accent)" }}>{c.angle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${barWidth}%`,
                            background: c.score >= 70 ? "#22c55e" : c.score >= 50 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{c.score}</span>
                    </div>
                    <button
                      onClick={() => copyText(c.text, i)}
                      className="px-2 py-1 rounded text-xs cursor-pointer"
                      style={{
                        background: copied === i ? "var(--green)" : "var(--accent)",
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      {copied === i ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-sans" style={{ color: "var(--text-muted)" }}>{c.text}</pre>
              </div>
            );
          })}
        </div>
      )}

      {/* Outreach */}
      {section === "outreach" && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold mb-1">Newsletter & Community Targets</h3>
          {d.outreach.map((o, i) => {
            const badge = o.relevance === "high" ? "🔴" : o.relevance === "medium" ? "🟡" : "⚪";
            return (
              <div key={i} className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
                <span className="text-lg">{badge}</span>
                <div>
                  <p className="text-sm font-bold">{o.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{o.pitch}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule */}
      {section === "schedule" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Optimal Posting Times</h3>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "var(--bg-hover)" }}>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Platform</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Days</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Times</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-muted)" }}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {d.schedule.optimal.map((s, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      <td className="px-3 py-2 font-medium">{s.platform}</td>
                      <td className="px-3 py-2" style={{ color: "var(--accent)" }}>{s.days}</td>
                      <td className="px-3 py-2">{s.times}</td>
                      <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Weekly Cadence</h3>
            {d.schedule.weekly.map((w, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs font-bold w-24" style={{ color: "var(--accent)" }}>{w.day}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{w.task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO */}
      {section === "seo" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Primary Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {d.seo.primary.map((k, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>{k}</span>
              ))}
            </div>
          </div>
          {d.seo.langKeywords.length > 0 && (
            <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <h3 className="text-sm font-bold mb-3">Language Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {d.seo.langKeywords.map((k, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg)", color: "var(--accent)" }}>{k}</span>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-3">Long-Tail Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {d.seo.longTail.map((k, i) => (
                <span key={i} className="px-2 py-1 rounded text-xs" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>{k}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Competitors */}
      {section === "competitors" && (
        <div className="flex flex-col gap-3">
          {d.competitors.map((c, i) => (
            <div key={i} className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-2">{c.name}</p>
              <p className="text-xs mb-1"><span style={{ color: "#ef4444" }}>Weakness:</span> <span style={{ color: "var(--text-muted)" }}>{c.weakness}</span></p>
              <p className="text-xs"><span style={{ color: "#22c55e" }}>Our advantage:</span> <span style={{ color: "var(--text-muted)" }}>{c.advantage}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
