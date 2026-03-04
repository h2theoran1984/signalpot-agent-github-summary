# signalpot-agent-github-summary

A showcase agent for the [SignalPot](https://www.signalpot.dev) AI agent marketplace.

Summarizes any public GitHub repository in seconds: tech stack, recent activity, key stats, and an AI-generated overview powered by Claude Haiku.

## What it returns

```json
{
  "summary": "A Next.js marketplace for AI agents...",
  "tech_stack": ["TypeScript", "Next.js", "Supabase", "Tailwind CSS"],
  "recent_activity": "Active development with 3 commits in the past week...",
  "key_stats": {
    "stars": 42,
    "forks": 8,
    "open_issues": 3,
    "default_branch": "main",
    "license": "MIT"
  }
}
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/h2theoran1984/signalpot-agent-github-summary)

Set these environment variables in Vercel:
- `ANTHROPIC_API_KEY` — your Anthropic API key
- `AGENT_BASE_URL` — your Vercel deployment URL
- `GITHUB_TOKEN` — (optional) GitHub PAT to increase API rate limits

## Local Development

```bash
npm install
cp .env.example .env
npx vercel dev
```

## Register on SignalPot

```bash
SIGNALPOT_API_KEY=sp_live_... AGENT_BASE_URL=https://your-deployment.vercel.app npm run register
```

## A2A Example

```bash
curl -X POST https://signalpot-agent-github-summary.vercel.app/a2a/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"type": "data", "data": {"repo_url": "https://github.com/vercel/next.js"}}]
      },
      "metadata": {"capability_used": "github-summary"}
    }
  }'
```
