"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { VoteButton } from "@/components/VoteButton";
import { CommentSection } from "@/components/CommentSection";
import { ShareButtons } from "@/components/ShareButtons";
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
  const [collections, setCollections] = useState<{ id: number; title: string }[]>([]);
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [colMsg, setColMsg] = useState("");

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

  useEffect(() => {
    if (status === "authenticated" && ext?.userId) {
      fetch(`/api/collections?user=${ext.userId}`)
        .then((res) => res.json())
        .then((data) => setCollections(data.collections || []))
        .catch(() => {});
    }
  }, [status, ext?.userId]);

  async function handleAddToCollection(colId: number) {
    setColMsg("");
    const res = await fetch(`/api/collections/${colId}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoId: repo?.id }),
    });
    if (res.ok) {
      setColMsg("Added!");
      setShowColDropdown(false);
    } else {
      const data = await res.json();
      setColMsg(data.error || "Failed");
    }
    setTimeout(() => setColMsg(""), 2000);
  }

  async function handleBoost(tier: string) {
    if (status !== "authenticated") {
      signIn("github");
      return;
    }

    setBoosting(true);
    setBoostMsg("");
    try {
      const res = await fetch(`/api/repos/${id}/boost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setBoostMsg(`Boosted! You have ${data.credits} credits remaining.`);
        router.refresh();
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

          {repo.isBoosted ? (
            <span className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--gold-glow)", color: "var(--gold)" }}>
              Already Boosted
            </span>
          ) : (
            <>
              <button
                onClick={() => handleBoost("basic")}
                disabled={boosting}
                className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                style={{ background: "var(--gold)", color: "#000", border: "none" }}
              >
                {boosting ? "..." : "24h (10cr)"}
              </button>
              <button
                onClick={() => handleBoost("plus")}
                disabled={boosting}
                className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                style={{ background: "var(--gold)", color: "#000", border: "none" }}
              >
                {boosting ? "..." : "3 days (25cr)"}
              </button>
              <button
                onClick={() => handleBoost("premium")}
                disabled={boosting}
                className="px-3 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
                style={{ background: "var(--gold)", color: "#000", border: "none" }}
              >
                {boosting ? "..." : "7 days (50cr)"}
              </button>
            </>
          )}
        </div>

        {/* Add to Collection */}
        {status === "authenticated" && collections.length > 0 && (
          <div className="mt-3 relative">
            <button
              onClick={() => setShowColDropdown(!showColDropdown)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              + Add to Collection
            </button>
            {showColDropdown && (
              <div
                className="absolute left-0 top-full mt-1 rounded-lg border shadow-lg z-10 min-w-48"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleAddToCollection(col.id)}
                    className="w-full text-left px-3 py-2 text-sm cursor-pointer hover:opacity-80"
                    style={{ background: "transparent", border: "none", color: "var(--text)" }}
                  >
                    {col.title}
                  </button>
                ))}
              </div>
            )}
            {colMsg && <span className="ml-2 text-xs" style={{ color: "var(--green)" }}>{colMsg}</span>}
          </div>
        )}

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

      {/* Share */}
      <ShareButtons repoId={repo.id} owner={repo.owner} name={repo.name} />

      {/* Badge embed */}
      <BadgeEmbed repoId={repo.id} />

      {/* Comments */}
      <CommentSection repoId={repo.id} />
    </div>
  );
}

function BadgeEmbed({ repoId }: { repoId: number }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState("");

  const mdSnippet = `[![Featured on PimpMyGit](https://pimpmygit.com/api/badge/${repoId})](https://pimpmygit.com/repo/${repoId})`;
  const htmlSnippet = `<a href="https://pimpmygit.com/repo/${repoId}"><img src="https://pimpmygit.com/api/badge/${repoId}" alt="Featured on PimpMyGit"></a>`;

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setShow(!show)}
        className="text-sm cursor-pointer"
        style={{ background: "none", border: "none", color: "var(--text-muted)" }}
      >
        {show ? "Hide" : "Show"} Embed Badge
      </button>
      {show && (
        <div
          className="mt-2 rounded-lg border p-4"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/badge/${repoId}`} alt="Badge preview" className="mb-3" />
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Markdown</span>
                <button
                  onClick={() => copy(mdSnippet, "md")}
                  className="text-xs cursor-pointer"
                  style={{ background: "none", border: "none", color: "var(--accent)" }}
                >
                  {copied === "md" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs p-2 rounded overflow-x-auto" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                {mdSnippet}
              </pre>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>HTML</span>
                <button
                  onClick={() => copy(htmlSnippet, "html")}
                  className="text-xs cursor-pointer"
                  style={{ background: "none", border: "none", color: "var(--accent)" }}
                >
                  {copied === "html" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs p-2 rounded overflow-x-auto" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                {htmlSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
