"use client";

import { useState, useEffect } from "react";
import { RepoCard } from "@/components/RepoCard";

interface RepoData {
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
  comment_count?: number;
  hasVoted: boolean;
  isBoosted: boolean;
  created_at: string;
}

export function LanguageRepoList({ language }: { language: string }) {
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/repos?language=${encodeURIComponent(language)}&sort=top&limit=50`)
      .then((res) => res.json())
      .then((data) => setRepos(data.repos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [language]);

  if (loading) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (repos.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
        No {language} repos yet. Be the first to submit one!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
