import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getRepoById } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);
  const rl = rateLimit(`og:${ip}`, 60, 60000);
  if (!rl.ok) {
    return new Response("Too many requests", { status: 429 });
  }

  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) {
    return new Response("Not found", { status: 404 });
  }

  const repo = await getRepoById(repoId);
  if (!repo) {
    return new Response("Not found", { status: 404 });
  }

  const langColors: Record<string, string> = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
    Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", Ruby: "#701516",
    "C++": "#f34b7d", C: "#555555", "C#": "#178600", PHP: "#4F5D95",
    Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
  };
  const langColor = langColors[repo.language] || "#8b949e";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2333 100%)",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#d29922", fontSize: "36px" }}>&#9733;</span>
            <span style={{ fontSize: "24px", color: "#8b949e" }}>PimpMyGit</span>
          </div>
          <div style={{ fontSize: "52px", fontWeight: "bold", lineHeight: 1.2 }}>
            {repo.owner}/{repo.name}
          </div>
          {repo.description && (
            <div style={{ fontSize: "24px", color: "#8b949e", lineHeight: 1.4, maxHeight: "100px", overflow: "hidden" }}>
              {repo.description.slice(0, 150)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "32px", fontSize: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#d29922" }}>&#9733;</span>
            <span>{repo.stars.toLocaleString()} stars</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#58a6ff" }}>&#9650;</span>
            <span>{repo.upvote_count} votes</span>
          </div>
          {repo.language && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: langColor }} />
              <span>{repo.language}</span>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    }
  );
}
