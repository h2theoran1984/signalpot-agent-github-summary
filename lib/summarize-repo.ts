import Anthropic from "@anthropic-ai/sdk";
import type { RepoMetadata, RepoLanguages, RepoCommit } from "./github.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface RepoSummaryOutput {
  summary: string;
  tech_stack: string[];
  recent_activity: string;
  key_stats: {
    stars: number;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    last_updated: string;
    license: string;
  };
  repo_name: string;
  owner: string;
}

export async function summarizeRepo(
  owner: string,
  repo: string,
  meta: RepoMetadata | null,
  langs: RepoLanguages,
  recentCommits: RepoCommit[],
  readmeContent: string | null
): Promise<RepoSummaryOutput> {
  const langList = Object.keys(langs).slice(0, 8).join(", ") || "unknown";
  const commitMessages = recentCommits
    .slice(0, 5)
    .map((c) => `- ${c.commit.message.split("\n")[0]} (${c.commit.author.date.slice(0, 10)})`)
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are analyzing a GitHub repository. Today's date is ${today}.
Return a JSON object with:
- "summary": 2-3 sentences describing what this project does and who it's for. Do NOT mention specific numbers like stars, forks, or dates in the summary.
- "recent_activity": 1-2 sentences describing the recent commit activity and project health based on the commit messages below.

Repository: ${owner}/${repo}
Description: ${meta?.description ?? "No description"}
Languages: ${langList}
Topics: ${meta?.topics?.join(", ") ?? "none"}

Recent commits:
${commitMessages || "No recent commits"}

README excerpt:
${readmeContent ? readmeContent.slice(0, 2000) : "No README available"}

Respond with only valid JSON, no markdown fences.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");
  // Strip markdown code fences if Claude wraps the JSON response
  const cleaned = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  // Use API languages directly — don't let Claude hallucinate the tech stack
  const techStack = Object.keys(langs).slice(0, 8);
  if (techStack.length === 0) techStack.push("unknown");

  return {
    summary: parsed.summary,
    tech_stack: techStack,
    recent_activity: parsed.recent_activity,
    key_stats: {
      stars: meta?.stargazers_count ?? 0,
      forks: meta?.forks_count ?? 0,
      open_issues: meta?.open_issues_count ?? 0,
      watchers: meta?.watchers_count ?? 0,
      default_branch: meta?.default_branch ?? "main",
      last_updated: meta?.updated_at ?? new Date().toISOString(),
      license: meta?.license?.name ?? "None",
    },
    repo_name: meta?.name ?? repo,
    owner,
  };
}
