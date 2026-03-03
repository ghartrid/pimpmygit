"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const { status } = useSession();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "authenticated") {
      signIn("github");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push(`/repo/${data.id}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Submit a Repo</h1>
        <p className="mb-4" style={{ color: "var(--text-muted)" }}>
          Sign in with GitHub to submit repositories
        </p>
        <button
          onClick={() => signIn("github")}
          className="px-6 py-2 rounded-lg font-medium cursor-pointer"
          style={{ background: "var(--accent)", color: "#fff", border: "none" }}
        >
          Sign in with GitHub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit a Repository</h1>

      <form onSubmit={handleSubmit}>
        <label className="block mb-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          GitHub Repository URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="w-full px-4 py-3 rounded-lg border text-sm outline-none focus:border-[var(--accent)] mb-4"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />

        {error && (
          <div
            className="mb-4 px-4 py-2 rounded-lg text-sm"
            style={{ background: "rgba(248,81,73,0.1)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full py-3 rounded-lg font-medium text-sm cursor-pointer disabled:opacity-50"
          style={{ background: "var(--green)", color: "#fff", border: "none" }}
        >
          {loading ? "Submitting..." : "Submit Repo"}
        </button>
      </form>

      <div className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
        <p className="font-medium mb-2">Accepted formats:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>https://github.com/owner/repo</li>
          <li>github.com/owner/repo</li>
          <li>owner/repo</li>
        </ul>
      </div>
    </div>
  );
}
