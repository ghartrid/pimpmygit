"use client";

import { useState, useEffect } from "react";

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  newCount: number;
  weekVotes: number;
  totalRepos: number;
  pageViews: number;
  topLanguages: { language: string; count: number }[];
  weekLanguages: { language: string; count: number }[];
  topVoted: { owner: string; name: string; description: string; language: string; stars: number; votes: number; id: number }[];
  newRepos: { owner: string; name: string; description: string; language: string; stars: number; votes: number; id: number; created_at: string }[];
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function RepoCard({ repo, rank }: { repo: WeeklyData["topVoted"][0]; rank?: number }) {
  return (
    <a
      href={`/repo/${repo.id}`}
      className="block rounded-xl p-5 no-underline hover:no-underline transition-shadow"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
        color: "var(--text)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--card-shadow-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--card-shadow)")}
    >
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span className="text-2xl font-bold shrink-0 w-8" style={{ color: rank === 1 ? "var(--gold)" : rank === 2 ? "var(--text-muted)" : "var(--border)" }}>
            #{rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base">{repo.owner}/{repo.name}</div>
          {repo.description && (
            <div className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{repo.description}</div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {repo.language && (
              <span className="px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)" }}>{repo.language}</span>
            )}
            <span style={{ color: "var(--green)" }}>{repo.votes} votes</span>
            <span style={{ color: "var(--gold)" }}>{repo.stars} stars</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function WeeklyPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weekly")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Failed to load weekly digest.</div>;
  }

  const hasActivity = data.newCount > 0 || data.topVoted.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold gradient-text mb-2">This Week on PimpMyGit</h1>
        <p style={{ color: "var(--text-muted)" }}>
          {formatDate(data.weekStart)} &mdash; {formatDate(data.weekEnd)}
        </p>
      </div>

      {/* Weekly summary bar */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 rounded-xl p-5"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{data.newCount}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>New Repos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--green)" }}>{data.weekVotes}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Votes This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--gold)" }}>{data.totalRepos}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Total Repos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{data.pageViews.toLocaleString()}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Page Views</div>
        </div>
      </div>

      {!hasActivity ? (
        <div
          className="text-center py-12 rounded-xl mb-10"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-lg mb-2">No new repos this week yet.</p>
          <p style={{ color: "var(--text-muted)" }}>Be the first to submit one!</p>
          <a
            href="/submit"
            className="inline-block mt-4 px-6 py-2.5 rounded-lg font-semibold text-white no-underline hover:no-underline"
            style={{ background: "var(--accent)" }}
          >
            Submit a Repo
          </a>
        </div>
      ) : (
        <>
          {/* Top voted this week */}
          {data.topVoted.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Top Voted This Week</h2>
              <div className="space-y-3">
                {data.topVoted.map((r, i) => (
                  <RepoCard key={r.id} repo={r} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Languages this week */}
          {data.weekLanguages.length > 0 && (
            <div
              className="rounded-xl p-5 mb-10"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
            >
              <h2 className="text-lg font-semibold mb-3">Languages This Week</h2>
              <div className="flex flex-wrap gap-2">
                {data.weekLanguages.map((l) => (
                  <span
                    key={l.language}
                    className="px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{ background: "var(--bg-hover)", color: "var(--text)" }}
                  >
                    {l.language} ({l.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* New repos list */}
          {data.newRepos.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-semibold mb-4">All New Repos</h2>
              <div className="space-y-3">
                {data.newRepos.map((r) => (
                  <RepoCard key={r.id} repo={r} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer CTA */}
      <div className="text-center py-8">
        <p style={{ color: "var(--text-muted)" }} className="mb-4">
          Want to see your repo here next week?
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="/submit"
            className="inline-block px-6 py-2.5 rounded-lg font-semibold text-white no-underline hover:no-underline"
            style={{ background: "var(--accent)" }}
          >
            Submit a Repo
          </a>
          <a
            href="/stats"
            className="inline-block px-6 py-2.5 rounded-lg font-medium no-underline hover:no-underline"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Full Stats
          </a>
        </div>
      </div>
    </div>
  );
}
