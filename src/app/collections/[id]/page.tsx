"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { RepoCard } from "@/components/RepoCard";
import { useRouter } from "next/navigation";

interface Collection {
  id: number;
  user_id: number;
  title: string;
  description: string;
  username: string;
  user_avatar: string;
  repo_count: number;
  created_at: string;
}

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

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const ext = session as Record<string, unknown> | null;
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [repos, setRepos] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/collections/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCollection(data.collection || null);
        setRepos(
          (data.repos || []).map((r: RepoData) => ({
            ...r,
            hasVoted: false,
            isBoosted: r.isBoosted ?? false,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRemoveRepo(repoId: number) {
    const res = await fetch(`/api/collections/${id}/repos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoId }),
    });
    if (res.ok) {
      setRepos((prev) => prev.filter((r) => r.id !== repoId));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this collection?")) return;
    setDeleting(true);
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/collections");
    }
    setDeleting(false);
  }

  if (loading) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>;
  }

  if (!collection) {
    return <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Collection not found</div>;
  }

  const isOwner = (ext?.userId as number) === collection.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h1 className="text-2xl font-bold mb-1">{collection.title}</h1>
        {collection.description && (
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{collection.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {collection.user_avatar && (
            <Image src={collection.user_avatar} alt="" width={20} height={20} className="rounded-full" />
          )}
          <span>by {collection.username}</span>
          <span>&middot;</span>
          <span>{repos.length} {repos.length === 1 ? "repo" : "repos"}</span>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            style={{ background: "rgba(248,81,73,0.1)", color: "var(--red)", border: "1px solid rgba(248,81,73,0.3)" }}
          >
            {deleting ? "Deleting..." : "Delete Collection"}
          </button>
        )}
      </div>

      {repos.length === 0 ? (
        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
          No repos in this collection yet
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {repos.map((repo) => (
            <div key={repo.id} className="relative">
              <RepoCard repo={repo} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveRepo(repo.id)}
                  className="absolute top-2 right-2 px-2 py-1 rounded text-xs cursor-pointer"
                  style={{ background: "rgba(248,81,73,0.1)", color: "var(--red)", border: "none" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
