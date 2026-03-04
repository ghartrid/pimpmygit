"use client";

import { useState, useEffect, useCallback } from "react";
import { RepoCard } from "@/components/RepoCard";

type SortMode = "trending" | "new" | "top";

export default function Home() {
  const [repos, setRepos] = useState<RepoCardData[]>([]);
  const [sort, setSort] = useState<SortMode>("trending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (search) params.set("search", search);
    const res = await fetch(`/api/repos?${params}`);
    const data = await res.json();
    setRepos(data.repos || []);
    setLoading(false);
  }, [sort, search]);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const sortTabs: { key: SortMode; label: string }[] = [
    { key: "trending", label: "Trending" },
    { key: "new", label: "New" },
    { key: "top", label: "Top" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-navbar.png" alt="" width={40} height={40} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
          Discover Amazing GitHub Repos
        </h1>
        <p className="text-lg" style={{ color: "var(--text-muted)" }}>
          Submit, upvote, and boost the best open source projects
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search repos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border text-sm outline-none focus:border-[var(--accent)]"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className="px-4 py-2 text-sm font-medium cursor-pointer transition-colors"
              style={{
                background: sort === tab.key ? "var(--accent)" : "transparent",
                color: sort === tab.key ? "#fff" : "var(--text-muted)",
                border: "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Repo list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          Loading repos...
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <p className="text-lg mb-2">No repos yet</p>
          <p className="text-sm">Be the first to submit one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}

interface RepoCardData {
  id: number;
  github_url: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  submitted_by_username: string;
  submitted_by_avatar: string;
  upvote_count: number;
  hasVoted: boolean;
  isBoosted: boolean;
  created_at: string;
}
