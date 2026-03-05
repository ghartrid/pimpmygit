import { MetadataRoute } from "next";
import { getAllRepoIds, getLanguages, getPublicCollectionIds } from "@/lib/db";

const BASE = "https://pimpmygit.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [repos, languages, collections] = await Promise.all([
    getAllRepoIds(),
    getLanguages(),
    getPublicCollectionIds(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/leaderboard`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/collections`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/language`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/api-docs`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/submit`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const repoPages: MetadataRoute.Sitemap = repos.map((r) => ({
    url: `${BASE}/repo/${r.id}`,
    lastModified: new Date(r.created_at + "Z"),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const languagePages: MetadataRoute.Sitemap = languages.map((l) => ({
    url: `${BASE}/language/${encodeURIComponent(l.language)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${BASE}/collections/${c.id}`,
    lastModified: new Date(c.created_at + "Z"),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticPages, ...repoPages, ...languagePages, ...collectionPages];
}
