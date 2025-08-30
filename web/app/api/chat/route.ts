// web/app/api/chat/route.ts

import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

/* ---------------- env ---------------- */
function required(name: string, v?: string) {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

let endpoint = required("AZURE_OPENAI_ENDPOINT", process.env.AZURE_OPENAI_ENDPOINT);
if (!endpoint.endsWith("/")) endpoint += "/";
const apiKey = required("AZURE_OPENAI_API_KEY", process.env.AZURE_OPENAI_API_KEY);
const deployment = required("AZURE_OPENAI_DEPLOYMENT", process.env.AZURE_OPENAI_DEPLOYMENT);

// Match your working notebook version
const API_VERSION = "2024-12-01-preview";

/* ------------- OpenAI (Azure) client ------------- */
/**
 * For Azure + JS SDK, point baseURL at the *deployment*:
 *   https://<resource>.cognitiveservices.azure.com/openai/deployments/<DEPLOYMENT>
 * and DO NOT pass `model` in the create() call.
 */
const client = new OpenAI({
  apiKey,
  baseURL: `${endpoint}openai/deployments/${deployment}`,
  defaultQuery: { "api-version": API_VERSION },
});

/* ------------- prompt loader ------------- */
async function readPrompt(filename: string) {
  const repoRoot = path.resolve(process.cwd(), ".."); // from /web to repo root
  const full = path.join(repoRoot, "prompts", filename);
  return await fs.readFile(full, "utf8");
}

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

/* ---------------- POST ---------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body?.question ?? "");
    const history = (Array.isArray(body?.history) ? body.history : []) as ChatMsg[];
    const mode = String(body?.mode ?? "tutor").toLowerCase().trim();

    const modeFile =
      mode === "checker" ? "checker_mode.md" :
      mode === "explainer" ? "explainer_mode.md" :
      "tutor_mode.md";

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

    const completion = await client.chat.completions.create({
    // IMPORTANT: Azure ignores `model`, but OpenAI SDK requires it for type safety
    model: "dummy",
    temperature: 0.4,
    messages,
    });

    const reply =
      completion.choices?.[0]?.message?.content ??
      "Sorry, I couldn’t generate a response.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    return new Response(
      JSON.stringify({
        error: msg,
        env: { endpoint, deployment, apiVersion: API_VERSION },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
