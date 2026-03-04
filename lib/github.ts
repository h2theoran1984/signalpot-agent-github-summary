export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  default_branch: string;
  updated_at: string;
  license: { name: string } | null;
  topics: string[];
}

export interface RepoLanguages {
  [language: string]: number;
}

export interface RepoCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

async function githubFetch<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "signalpot-github-summarizer/0.1.0",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchRepoData(owner: string, repo: string, token?: string) {
  const [metadata, languages, commits, readmeRaw] = await Promise.allSettled([
    githubFetch<RepoMetadata>(`/repos/${owner}/${repo}`, token),
    githubFetch<RepoLanguages>(`/repos/${owner}/${repo}/languages`, token),
    githubFetch<RepoCommit[]>(`/repos/${owner}/${repo}/commits?per_page=10`, token),
    githubFetch<{ content: string; encoding: string }>(`/repos/${owner}/${repo}/readme`, token),
  ]);

  const meta = metadata.status === "fulfilled" ? metadata.value : null;
  const langs = languages.status === "fulfilled" ? languages.value : {};
  const recentCommits = commits.status === "fulfilled" ? commits.value : [];
  const readmeContent =
    readmeRaw.status === "fulfilled" && readmeRaw.value.encoding === "base64"
      ? Buffer.from(readmeRaw.value.content, "base64").toString("utf-8").slice(0, 3000)
      : null;

  return { meta, langs, recentCommits, readmeContent };
}
