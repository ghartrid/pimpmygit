"use client";

import { useState, useRef } from "react";
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
  const btnRef = useRef<HTMLButtonElement>(null);

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
        // Trigger bounce animation
        btnRef.current?.classList.remove("vote-bounce");
        void btnRef.current?.offsetWidth; // force reflow
        btnRef.current?.classList.add("vote-bounce");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      ref={btnRef}
      onClick={handleVote}
      disabled={loading}
      className={`flex flex-col items-center rounded-xl border cursor-pointer transition-all duration-200 ${
        large ? "px-6 py-3 text-lg" : "px-3.5 py-2.5 text-sm"
      }`}
      style={{
        borderColor: voted ? "var(--accent)" : "var(--border)",
        background: voted ? "rgba(88,166,255,0.15)" : "var(--bg-card)",
        color: voted ? "var(--accent)" : "var(--text-muted)",
        boxShadow: voted ? "0 0 12px rgba(88,166,255,0.2)" : "none",
      }}
    >
      <span className={large ? "text-2xl" : "text-base"} style={{ lineHeight: 1 }}>&#9650;</span>
      <span className="font-bold mt-0.5">{count}</span>
    </button>
  );
}
