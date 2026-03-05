"use client";

import { useState } from "react";

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false);

  const exampleCurl = `curl "https://pimpmygit.com/api/v1/repos?sort=top&language=Python&limit=5"`;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Public API</h1>
      <p className="mb-6" style={{ color: "var(--text-muted)" }}>
        Access PimpMyGit data programmatically. No authentication required.
      </p>

      <div
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-bold mb-3">GET /api/v1/repos</h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Returns a paginated list of repositories.
        </p>

        <h3 className="text-sm font-bold mb-2">Query Parameters</h3>
        <table className="w-full text-sm mb-4">
          <thead>
            <tr style={{ color: "var(--text-muted)" }}>
              <th className="text-left py-1 pr-4">Param</th>
              <th className="text-left py-1 pr-4">Type</th>
              <th className="text-left py-1 pr-4">Default</th>
              <th className="text-left py-1">Description</th>
            </tr>
          </thead>
          <tbody style={{ color: "var(--text)" }}>
            <tr><td className="py-1 pr-4 font-mono text-xs">sort</td><td className="pr-4">string</td><td className="pr-4">trending</td><td>trending, new, or top</td></tr>
            <tr><td className="py-1 pr-4 font-mono text-xs">search</td><td className="pr-4">string</td><td className="pr-4">-</td><td>Search by name, owner, or description</td></tr>
            <tr><td className="py-1 pr-4 font-mono text-xs">language</td><td className="pr-4">string</td><td className="pr-4">-</td><td>Filter by programming language</td></tr>
            <tr><td className="py-1 pr-4 font-mono text-xs">limit</td><td className="pr-4">number</td><td className="pr-4">30</td><td>Results per page (1-100)</td></tr>
            <tr><td className="py-1 pr-4 font-mono text-xs">offset</td><td className="pr-4">number</td><td className="pr-4">0</td><td>Pagination offset</td></tr>
          </tbody>
        </table>

        <h3 className="text-sm font-bold mb-2">Response</h3>
        <pre
          className="text-xs p-3 rounded-lg overflow-x-auto mb-4"
          style={{ background: "var(--bg)", color: "var(--text-muted)" }}
        >{`{
  "data": [
    {
      "id": 1,
      "github_url": "https://github.com/owner/repo",
      "owner": "owner",
      "name": "repo",
      "description": "A cool project",
      "stars": 1234,
      "language": "Python",
      "upvote_count": 42,
      "is_boosted": false,
      "submitted_by": "username",
      "created_at": "2026-03-01 00:00:00"
    }
  ],
  "meta": {
    "total": 150,
    "limit": 30,
    "offset": 0
  }
}`}</pre>

        <h3 className="text-sm font-bold mb-2">Rate Limits</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          60 requests per minute per IP. Check the <code className="text-xs px-1 py-0.5 rounded" style={{ background: "var(--bg)" }}>X-RateLimit-Remaining</code> header.
        </p>

        <h3 className="text-sm font-bold mb-2">Example</h3>
        <div className="flex items-center gap-2">
          <pre
            className="flex-1 text-xs p-3 rounded-lg overflow-x-auto"
            style={{ background: "var(--bg)", color: "var(--text-muted)" }}
          >
            {exampleCurl}
          </pre>
          <button
            onClick={() => { navigator.clipboard.writeText(exampleCurl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0"
            style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-bold mb-3">RSS Feed</h2>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          Subscribe to trending repos via RSS:
        </p>
        <a
          href="/feed.xml"
          className="text-sm font-medium no-underline"
          style={{ color: "var(--accent)" }}
        >
          https://pimpmygit.com/feed.xml
        </a>
      </div>
    </div>
  );
}
