import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ExtendedSession } from "@/lib/auth";
import { getRepos, createRepo, getUserVotes } from "@/lib/db";
import { parseGitHubUrl, fetchRepoData } from "@/lib/github";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = (searchParams.get("sort") as "trending" | "new" | "top") || "trending";
  const search = searchParams.get("search") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const repos = await getRepos({ sort, search, limit, offset });

  // Attach user vote status if logged in
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  let votedRepoIds: number[] = [];
  if (session?.userId) {
    votedRepoIds = await getUserVotes(session.userId);
  }

  const reposWithVoteStatus = repos.map((r) => ({
    ...r,
    hasVoted: votedRepoIds.includes(r.id),
    isBoosted: r.boost_until ? new Date(r.boost_until + "Z") > new Date() : false,
  }));

  return NextResponse.json({ repos: reposWithVoteStatus });
}

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as ExtendedSession | null;
  if (!session?.userId) {
    return NextResponse.json({ error: "Sign in to submit repos" }, { status: 401 });
  }

  const body = await req.json();
  const url = body.url as string;

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const repoData = await fetchRepoData(parsed.owner, parsed.name);
  if (!repoData) {
    return NextResponse.json({ error: "Repository not found on GitHub" }, { status: 404 });
  }

  const id = await createRepo({
    github_url: repoData.html_url,
    owner: repoData.owner,
    name: repoData.name,
    description: repoData.description,
    stars: repoData.stars,
    language: repoData.language,
    avatar_url: repoData.avatar_url,
    submitted_by: session.userId,
  });

  if (id === null) {
    return NextResponse.json({ error: "This repo has already been submitted" }, { status: 409 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
