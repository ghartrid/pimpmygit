"use client";

import { useState } from "react";

interface ShareButtonsProps {
  repoId: number;
  owner: string;
  name: string;
}

export function ShareButtons({ repoId, owner, name }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://pimpmygit.com/repo/${repoId}`;
  const text = `Check out ${owner}/${name} on PimpMyGit!`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 rounded-lg text-xs font-medium no-underline hover:no-underline"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        X / Twitter
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1 rounded-lg text-xs font-medium no-underline hover:no-underline"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
      >
        LinkedIn
      </a>
      <button
        onClick={copyLink}
        className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: copied ? "var(--green)" : "var(--text-muted)" }}
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
