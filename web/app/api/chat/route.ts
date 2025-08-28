// web/app/api/chat/route.ts





import OpenAI from "openai";

export const runtime = "nodejs"; // ensure Node runtime in dev/preview

function required(name: string, v?: string) {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const endpoint = required("AZURE_OPENAI_ENDPOINT", process.env.AZURE_OPENAI_ENDPOINT);
const apiKey = required("AZURE_OPENAI_API_KEY", process.env.AZURE_OPENAI_API_KEY);
const deployment = required("AZURE_OPENAI_DEPLOYMENT", process.env.AZURE_OPENAI_DEPLOYMENT);

// Azure OpenAI works with the OpenAI SDK by setting baseURL and api-version
const client = new OpenAI({
  apiKey,
  baseURL: `${endpoint}openai`,                      // e.g. https://xxx.openai.azure.com/openai
  defaultQuery: { "api-version": "2024-02-15-preview" }, // leave as-is unless your portal shows newer
});

export async function POST(req: Request) {
  try {
    const { question, history = [] } = await req.json();

    // Build messages: system + prior turns + new user question
    const messages = [
      {
        role: "system",
        content:
          "You are the Vectorius AI Mentor. Be practical, upbeat, and concise. Use numbered steps when giving plans.",
      },
      ...history, // [{role:'user'|'assistant', content:'...'}]
      { role: "user", content: String(question ?? "") },
    ];

    const completion = await client.chat.completions.create({
      // IMPORTANT: for Azure, set the model to your *deployment name*
      model: deployment,
      temperature: 0.7,
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
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
