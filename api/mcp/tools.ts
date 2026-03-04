import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    tools: [
      {
        name: "summarize_github_repo",
        description: "Fetch and summarize any public GitHub repository",
        inputSchema: {
          type: "object",
          properties: {
            repo_url: {
              type: "string",
              description: "GitHub repository URL (e.g. https://github.com/owner/repo)",
            },
            include_commits: {
              type: "boolean",
              default: true,
              description: "Whether to include recent commit activity",
            },
          },
          required: ["repo_url"],
        },
      },
    ],
  });
}
