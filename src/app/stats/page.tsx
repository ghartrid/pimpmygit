"use client";

import { useState, useEffect } from "react";

interface StatsData {
  totalRepos: number;
  totalVotes: number;
  totalStars: number;
  pageViews: number;
  submitters: number;
  topLanguages: { language: string; count: number }[];
  trending: { owner: string; name: string; description: string; language: string; stars: number; votes: number; id: number }[];
  newest: { owner: string; name: string; description: string; language: string; stars: number; votes: number; id: number; created_at: string }[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
    >
      <div className="text-3xl font-bold gradient-text">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function LangBar({ lang, count, max }: { lang: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm w-24 text-right shrink-0" style={{ color: "var(--text)" }}>{lang}</span>
      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--gradient-accent)" }}
        />
      </div>
      <span className="text-xs w-8 shrink-0" style={{ color: "var(--text-muted)" }}>{count}</span>
    </div>
  );
}

function RepoRow({ repo }: { repo: StatsData["trending"][0] }) {
  return (
    <a
      href={`/repo/${repo.id}`}
      className="flex items-center gap-3 py-3 px-4 rounded-lg no-underline hover:no-underline transition-colors"
      style={{ color: "var(--text)", background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{repo.owner}/{repo.name}</div>
        {repo.description && (
          <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{repo.description}</div>
        )}
      </div>
      {repo.language && (
        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
          {repo.language}
        </span>
      )}
      <span className="text-xs shrink-0" style={{ color: "var(--green)" }}>{repo.votes} votes</span>
      <span className="text-xs shrink-0" style={{ color: "var(--gold)" }}>{repo.stars} stars</span>
    </a>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
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
    return <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>Failed to load stats.</div>;
  }

  const maxLang = data.topLanguages.length > 0 ? data.topLanguages[0].count : 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold gradient-text mb-2">Community Stats</h1>
        <p style={{ color: "var(--text-muted)" }}>Live metrics from the PimpMyGit community</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="Repos" value={data.totalRepos} />
        <StatCard label="Votes" value={data.totalVotes} />
        <StatCard label="Stars" value={data.totalStars} />
        <StatCard label="Contributors" value={data.submitters} />
        <StatCard label="Page Views" value={data.pageViews} />
      </div>

      {/* Language chart */}
      {data.topLanguages.length > 0 && (
        <div
          className="rounded-xl p-6 mb-10"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
        >
          <h2 className="text-lg font-semibold mb-4">Top Languages</h2>
          {data.topLanguages.map((l) => (
            <LangBar key={l.language} lang={l.language} count={l.count} max={maxLang} />
          ))}
        </div>
      )}

      {/* Trending + Newest side by side */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {data.trending.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
          >
            <h2 className="text-lg font-semibold mb-3">Trending Repos</h2>
            {data.trending.map((r) => <RepoRow key={r.id} repo={r} />)}
          </div>
        )}

        {data.newest.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
          >
            <h2 className="text-lg font-semibold mb-3">Recently Added</h2>
            {data.newest.map((r) => <RepoRow key={r.id} repo={r} />)}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-lg mb-4" style={{ color: "var(--text-muted)" }}>
          Got a repo the community should know about?
        </p>
        <a
          href="/submit"
          className="inline-block px-8 py-3 rounded-lg font-semibold text-white no-underline hover:no-underline"
          style={{ background: "var(--accent)" }}
        >
          Submit a Repo
        </a>
      </div>
    </div>
  );
}
