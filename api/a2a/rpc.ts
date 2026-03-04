import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { JSONRPCRequest, JSONRPCResponse, MessageSendParams } from "../../lib/a2a-types.js";
import { parseRepoUrl, fetchRepoData } from "../../lib/github.js";
import { summarizeRepo } from "../../lib/summarize-repo.js";

function jsonrpcError(id: string | number, code: number, message: string): JSONRPCResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMessageSend(params: MessageSendParams): Promise<unknown> {
  const dataPart = params.message.parts.find((p) => p.type === "data") as
    | { type: "data"; data: Record<string, unknown> }
    | undefined;
  const textPart = params.message.parts.find((p) => p.type === "text") as
    | { type: "text"; text: string }
    | undefined;

  const repoUrl =
    (dataPart?.data?.repo_url as string) ??
    textPart?.text ??
    "";

  if (!repoUrl) throw new Error("Missing repo_url in request");

  const { owner, repo } = parseRepoUrl(repoUrl);
  const githubToken = process.env.GITHUB_TOKEN;

  const { meta, langs, recentCommits, readmeContent } = await fetchRepoData(owner, repo, githubToken);
  const result = await summarizeRepo(owner, repo, meta, langs, recentCommits, readmeContent);

  return {
    id: crypto.randomUUID(),
    status: { state: "completed" },
    artifacts: [{ parts: [{ type: "data", data: result }] }],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as JSONRPCRequest;
  const id = body?.id ?? 0;

  try {
    if (body.method === "message/send") {
      const result = await handleMessageSend(body.params as MessageSendParams);
      const response: JSONRPCResponse = { jsonrpc: "2.0", id, result };
      return res.status(200).json(response);
    }

    return res.status(200).json(jsonrpcError(id, -32601, `Method not found: ${body.method}`));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return res.status(200).json(jsonrpcError(id, -32603, message));
  }
}
