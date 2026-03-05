"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  C: "#555555", Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
  PHP: "#4F5D95", Shell: "#89e051", Dart: "#00B4AB", Zig: "#ec915c",
};

interface LangData {
  language: string;
  count: number;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<LangData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/languages")
      .then((res) => res.json())
      .then((data) => setLanguages(data.languages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Languages</h1>
      <p className="mb-6" style={{ color: "var(--text-muted)" }}>
        Browse repositories by programming language
      </p>

      {loading ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : languages.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>No repos yet</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {languages.map((lang) => (
            <Link
              key={lang.language}
              href={`/language/${encodeURIComponent(lang.language)}`}
              className="rounded-xl border p-4 no-underline hover:no-underline transition-all hover:border-[var(--accent)]"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                  style={{ background: LANG_COLORS[lang.language] || "#8b949e" }}
                />
                <span className="font-medium text-sm" style={{ color: "var(--text)" }}>
                  {lang.language}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {lang.count} {lang.count === 1 ? "repo" : "repos"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
