"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { VoteButton } from "@/components/VoteButton";
import { useRouter } from "next/navigation";

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
  hasVoted: boolean;
  isBoosted: boolean;
  boost_until: string | null;
  created_at: string;
}

export default function RepoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const ext = session as Record<string, unknown> | null;
  const router = useRouter();
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/repos?search=&limit=100`);
      const data = await res.json();
      const found = data.repos?.find((r: RepoData) => r.id === parseInt(id));
      setRepo(found || null);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleBoost() {
    if (status !== "authenticated") {
      signIn("github");
      return;
    }

    setBoosting(true);
    setBoostMsg("");
    try {
      const res = await fetch(`/api/repos/${id}/boost`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBoostMsg(`Boosted! You have ${data.credits} credits remaining.`);
        router.refresh();
        // Reload repo data
        const res2 = await fetch(`/api/repos?search=&limit=100`);
        const data2 = await res2.json();
        const found = data2.repos?.find((r: RepoData) => r.id === parseInt(id));
        if (found) setRepo(found);
      } else {
        setBoostMsg(data.error || "Failed to boost");
      }
    } finally {
      setBoosting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!repo) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Repo not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-xl border p-6"
        style={{
          background: "var(--bg-card)",
          borderColor: repo.isBoosted ? "var(--gold)" : "var(--border)",
          boxShadow: repo.isBoosted ? "0 0 30px var(--gold-glow)" : "none",
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {repo.avatar_url && (
            <Image src={repo.avatar_url} alt={repo.owner} width={48} height={48} className="rounded-full" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {repo.owner}/{repo.name}
            </h1>
            {repo.isBoosted && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1"
                style={{ background: "var(--gold-glow)", color: "var(--gold)" }}
              >
                Promoted
              </span>
            )}
          </div>
          <VoteButton repoId={repo.id} count={repo.upvote_count} hasVoted={repo.hasVoted} large />
        </div>

        {/* Description */}
        <p className="text-base mb-4" style={{ color: "var(--text-muted)" }}>
          {repo.description || "No description provided"}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {repo.language && <span>Language: {repo.language}</span>}
          <span>&#9733; {repo.stars.toLocaleString()} stars</span>
          <span>Submitted by {repo.submitted_by_username}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <a
            href={repo.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium no-underline hover:no-underline"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            View on GitHub
          </a>

          <button
            onClick={handleBoost}
            disabled={boosting || repo.isBoosted}
            className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
            style={{ background: "var(--gold)", color: "#000", border: "none" }}
          >
            {repo.isBoosted
              ? "Already Boosted"
              : boosting
              ? "Boosting..."
              : `Boost for 24h (10 credits)`}
          </button>
        </div>

        {boostMsg && (
          <div className="mt-3 text-sm" style={{ color: boostMsg.includes("!") ? "var(--green)" : "var(--red)" }}>
            {boostMsg}
          </div>
        )}

        {/* Credit info */}
        {status === "authenticated" && (
          <div className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            Your balance: {(ext?.credits as number) ?? 0} credits
          </div>
        )}
      </div>
    </div>
  );
}
