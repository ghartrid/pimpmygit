"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Collection {
  id: number;
  title: string;
  description: string;
  created_at: string;
  username: string;
  user_avatar: string;
  repo_count: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data.collections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Collections</h1>
      <p className="mb-6" style={{ color: "var(--text-muted)" }}>
        Curated lists of GitHub repositories
      </p>

      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <p className="text-lg mb-2">No collections yet</p>
          <p className="text-sm">Create one from your profile page!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="rounded-xl border p-4 no-underline hover:no-underline transition-all hover:border-[var(--accent)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>
                {col.title}
              </h3>
              {col.description && (
                <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--text-muted)" }}>
                  {col.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {col.user_avatar && (
                  <Image src={col.user_avatar} alt="" width={16} height={16} className="rounded-full" />
                )}
                <span>{col.username}</span>
                <span>&middot;</span>
                <span>{col.repo_count} {col.repo_count === 1 ? "repo" : "repos"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
