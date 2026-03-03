export interface GitHubRepoData {
  owner: string;
  name: string;
  description: string;
  stars: number;
  language: string;
  avatar_url: string;
  html_url: string;
}

export function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/,
    /^github\.com\/([^/]+)\/([^/]+)\/?$/,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return { owner: match[1], name: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

export async function fetchRepoData(owner: string, name: string): Promise<GitHubRepoData | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "PimpMyGit",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      owner: data.owner.login,
      name: data.name,
      description: data.description || "",
      stars: data.stargazers_count,
      language: data.language || "",
      avatar_url: data.owner.avatar_url,
      html_url: data.html_url,
    };
  } catch {
    return null;
  }
}
