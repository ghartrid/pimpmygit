import type { Metadata } from "next";
import { getRepoById } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const repoId = parseInt(id, 10);
  if (!repoId || !Number.isFinite(repoId)) return {};

  const repo = await getRepoById(repoId);
  if (!repo) return {};

  const title = `${repo.owner}/${repo.name} - PimpMyGit`;
  const description = repo.description
    ? `${repo.description} | ${repo.stars} stars | ${repo.upvote_count} votes on PimpMyGit`
    : `${repo.owner}/${repo.name} — ${repo.stars} stars, ${repo.upvote_count} votes on PimpMyGit`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/${repo.id}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${repo.id}`],
    },
  };
}

export default function RepoLayout({ children }: Props) {
  return <>{children}</>;
}
