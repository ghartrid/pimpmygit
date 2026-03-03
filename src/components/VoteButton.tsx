"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface VoteButtonProps {
  repoId: number;
  count: number;
  hasVoted: boolean;
  large?: boolean;
}

export function VoteButton({ repoId, count: initialCount, hasVoted: initialVoted, large }: VoteButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleVote() {
    if (status !== "authenticated") {
      signIn("github");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/repos/${repoId}/vote`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setVoted(data.voted);
        setCount(data.upvote_count);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex flex-col items-center rounded-lg border cursor-pointer transition-all duration-200 ${
        large ? "px-6 py-3 text-lg" : "px-3 py-2 text-sm"
      }`}
      style={{
        borderColor: voted ? "var(--accent)" : "var(--border)",
        background: voted ? "rgba(88,166,255,0.1)" : "transparent",
        color: voted ? "var(--accent)" : "var(--text-muted)",
      }}
    >
      <span className={large ? "text-2xl" : "text-base"}>&#9650;</span>
      <span className="font-bold">{count}</span>
    </button>
  );
}
