"use client";

import Image from "next/image";
import Link from "next/link";
import { VoteButton } from "./VoteButton";

interface RepoCardProps {
  repo: {
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
  };
}

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Zig: "#ec915c",
};

export function RepoCard({ repo }: RepoCardProps) {
  const timeAgo = getTimeAgo(repo.created_at);

  return (
    <div
      className="rounded-lg border p-4 transition-all duration-200 hover:border-[var(--accent)]"
      style={{
        background: "var(--bg-card)",
        borderColor: repo.isBoosted ? "var(--gold)" : "var(--border)",
        boxShadow: repo.isBoosted ? "0 0 20px var(--gold-glow)" : "none",
      }}
    >
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex-shrink-0">
          <VoteButton repoId={repo.id} count={repo.upvote_count} hasVoted={repo.hasVoted} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {repo.avatar_url && (
                <Image
                  src={repo.avatar_url}
                  alt={repo.owner}
                  width={24}
                  height={24}
                  className="rounded-full flex-shrink-0"
                />
              )}
              <Link
                href={`/repo/${repo.id}`}
                className="font-semibold text-lg truncate hover:no-underline"
                style={{ color: "var(--accent)" }}
              >
                {repo.owner}/{repo.name}
              </Link>
            </div>
            {repo.isBoosted && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
              >
                Promoted
              </span>
            )}
          </div>

          <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {repo.description || "No description provided"}
          </p>

          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {repo.language && (
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: LANG_COLORS[repo.language] || "#8b949e" }}
                />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              &#9733; {repo.stars.toLocaleString()}
            </span>
            <span>by {repo.submitted_by_username}</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
