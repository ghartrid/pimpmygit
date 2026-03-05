import { NextRequest, NextResponse } from "next/server";
import { getAllRepos, updateRepoStats } from "@/lib/db";
import { fetchRepoData } from "@/lib/github";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.ADMIN_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await getAllRepos();
  let updated = 0;
  let errors = 0;

  // Process in batches of 10 to avoid GitHub rate limits
  for (let i = 0; i < repos.length; i += 10) {
    const batch = repos.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (repo) => {
        const data = await fetchRepoData(repo.owner, repo.name);
        if (data) {
          await updateRepoStats(repo.id, data.stars, data.description, data.language);
          return true;
        }
        return false;
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        updated++;
      } else {
        errors++;
      }
    }

    // Brief pause between batches to be respectful of GitHub API
    if (i + 10 < repos.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return NextResponse.json({ updated, errors, total: repos.length });
}
