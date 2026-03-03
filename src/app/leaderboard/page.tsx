"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface LeaderboardRepo {
  id: number;
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  upvote_count: number;
  isBoosted: boolean;
  submitted_by_username: string;
}

export default function LeaderboardPage() {
  const [repos, setRepos] = useState<LeaderboardRepo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/repos?sort=top&limit=50");
      const data = await res.json();
      setRepos(data.repos || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      {repos.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          No repos yet. Be the first to submit one!
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {repos.map((repo, index) => (
            <div
              key={repo.id}
              className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: index < 3 ? "rgba(210,153,34,0.05)" : "transparent",
              }}
            >
              {/* Rank */}
              <div
                className="w-8 text-center font-bold text-lg flex-shrink-0"
                style={{
                  color: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : index === 2 ? "#cd7f32" : "var(--text-muted)",
                }}
              >
                {index + 1}
              </div>

              {/* Avatar */}
              {repo.avatar_url && (
                <Image src={repo.avatar_url} alt={repo.owner} width={32} height={32} className="rounded-full flex-shrink-0" />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/repo/${repo.id}`}
                  className="font-medium hover:no-underline truncate block"
                  style={{ color: "var(--accent)" }}
                >
                  {repo.owner}/{repo.name}
                </Link>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {repo.language && <span>{repo.language} &middot; </span>}
                  &#9733; {repo.stars.toLocaleString()} &middot; by {repo.submitted_by_username}
                </div>
              </div>

              {/* Badges */}
              {repo.isBoosted && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                  style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
                >
                  Promoted
                </span>
              )}

              {/* Vote count */}
              <div className="flex-shrink-0 text-right">
                <div className="font-bold text-lg" style={{ color: "var(--accent)" }}>
                  {repo.upvote_count}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  votes
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
