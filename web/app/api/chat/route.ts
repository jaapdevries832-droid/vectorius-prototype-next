// web/app/api/chat/route.ts

import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

// Keep consistent with debug usage
const API_VERSION = "2024-12-01-preview";

type ResolvedEnv = {
  endpoint: string;
  apiKey: string;
  deployment: string;
};

function resolveEnv(): { ok: true; cfg: ResolvedEnv } | { ok: false; reason: string } {
  // Support alternate names to avoid breakage if envs differ
  let endpoint = process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_API_BASE || "";
  const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_MODEL || "";

  if (!endpoint || !apiKey || !deployment) return { ok: false, reason: "missing-config" };
  if (!endpoint.endsWith("/")) endpoint += "/";
  return { ok: true, cfg: { endpoint, apiKey, deployment } };
}

function createClient(cfg: ResolvedEnv) {
  // Azure: point baseURL to the deployment; do not pass `model` (SDK requires a dummy value though)
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: `${cfg.endpoint}openai/deployments/${cfg.deployment}`,
    defaultQuery: { "api-version": API_VERSION },
  });
}

async function readPrompt(filename: string) {
  const repoRoot = path.resolve(process.cwd(), ".."); // from /web to repo root
  const full = path.join(repoRoot, "prompts", filename);
  return await fs.readFile(full, "utf8");
}

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

// GET: allow clients to check if chat is enabled without exposing secrets
export async function GET() {
  const env = resolveEnv();
  return new Response(JSON.stringify({ enabled: env.ok }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// POST: perform chat completion
export async function POST(req: Request) {
  try {
    const env = resolveEnv();
    if (!env.ok) {
      return new Response(
        JSON.stringify({ error: "Chat is disabled: missing server configuration." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const client = createClient(env.cfg);

    const body = await req.json().catch(() => ({}));
    const question = String(body?.question ?? "");
    const history = (Array.isArray(body?.history) ? body.history : []) as ChatMsg[];
    const mode = String(body?.mode ?? "tutor")
      .toLowerCase()
      .trim();

    const modeFile =
      mode === "checker"
        ? "checker_mode.md"
        : mode === "explainer"
          ? "explainer_mode.md"
          : "tutor_mode.md";

    const [systemText, modeText] = await Promise.all([
      readPrompt("grade8_system.md"),
      readPrompt(modeFile),
    ]);

    const messages: ChatMsg[] = [
      { role: "system", content: systemText },
      { role: "system", content: modeText },
      ...history,
      { role: "user", content: question },
    ];

    const temperature = mode === "checker" ? 0.2 : mode === "explainer" ? 0.5 : 0.4;

    const completion = await client.chat.completions.create({
      // Azure ignores `model`, but OpenAI SDK requires a value
      model: "dummy",
      temperature,
      messages,
    });

    const reply =
      completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    const payload = { reply, role: "assistant", content: reply, modeUsed: mode };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
