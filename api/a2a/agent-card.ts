import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    name: "GitHub Summarizer",
    description: "Summarizes any public GitHub repository: tech stack, activity, stats, and AI overview.",
    url: process.env.AGENT_BASE_URL ?? "https://signalpot-agent-github-summary.vercel.app",
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
  });
}
