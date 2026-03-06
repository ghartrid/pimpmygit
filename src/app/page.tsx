"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RepoCard } from "@/components/RepoCard";

type SortMode = "trending" | "new" | "top";
const PAGE_SIZE = 20;

export default function Home() {
  const [repos, setRepos] = useState<RepoCardData[]>([]);
  const [sponsored, setSponsored] = useState<RepoCardData[]>([]);
  const [sort, setSort] = useState<SortMode>("trending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch("/api/sponsored")
      .then((res) => res.json())
      .then((data) => setSponsored(data.slots || []))
      .catch(() => {});
  }, []);

  const fetchRepos = useCallback(async (append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      offsetRef.current = 0;
    }
    const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE), offset: String(offsetRef.current) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/repos?${params}`);
    const data = await res.json();
    const newRepos = data.repos || [];
    if (append) {
      setRepos((prev) => [...prev, ...newRepos]);
    } else {
      setRepos(newRepos);
    }
    setHasMore(newRepos.length >= PAGE_SIZE);
    offsetRef.current += newRepos.length;
    setLoading(false);
    setLoadingMore(false);
  }, [sort, debouncedSearch]);

  useEffect(() => {
    setHasMore(true);
    fetchRepos(false);
  }, [fetchRepos]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchRepos(true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchRepos]);

  const sortTabs: { key: SortMode; label: string; icon: string }[] = [
    { key: "trending", label: "Trending", icon: "\uD83D\uDD25" },
    { key: "new", label: "New", icon: "\u2728" },
    { key: "top", label: "Top", icon: "\uD83C\uDFC6" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10 relative overflow-hidden py-4">
        <div
          className="hero-glow"
          style={{ background: "var(--accent)", top: "-100px", left: "50%", transform: "translateX(-50%)" }}
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 relative">
          <span className="gradient-text">Discover Amazing</span>
          <br />
          <span>GitHub Repos</span>
        </h1>
        <p className="text-lg relative" style={{ color: "var(--text-muted)" }}>
          Submit, upvote, and boost the best open source projects
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>&#128269;</span>
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: "var(--text)" }}
          />
        </div>
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className="px-5 py-3 text-sm font-medium cursor-pointer transition-all duration-200"
              style={{
                background: sort === tab.key ? "var(--accent)" : "var(--bg-card)",
                color: sort === tab.key ? "#fff" : "var(--text-muted)",
                border: "none",
              }}
            >
              <span style={{ marginRight: "4px" }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsored */}
      {sponsored.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "var(--gold)" }}>
            <span>&#11088;</span> Sponsored
          </h2>
          <div className="flex flex-col gap-3">
            {sponsored.map((repo) => (
              <div
                key={repo.id}
                className="rounded-xl border-2 p-1"
                style={{ borderColor: "var(--gold)", background: "rgba(210,153,34,0.05)" }}
              >
                <RepoCard repo={{ ...repo, isBoosted: true, hasVoted: false }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repo list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="spinner" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading repos...</span>
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <p className="text-5xl mb-4">&#128064;</p>
          <p className="text-lg font-medium mb-1">No repos yet</p>
          <p className="text-sm">Be the first to submit one!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {repos.map((repo, i) => (
            <div key={repo.id} className="fade-in-up" style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}>
              <RepoCard repo={repo} />
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="spinner" />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Loading more...</span>
        </div>
      )}
      {!hasMore && repos.length > 0 && (
        <div className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
          &#10003; You&apos;ve seen everything
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
