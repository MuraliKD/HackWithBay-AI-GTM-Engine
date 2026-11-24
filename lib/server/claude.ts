import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
export const MODEL = "claude-opus-5-5";

// One structured-output call. Low effort keeps latency demo-friendly.
// Server-side fallbacks re-run the request on another model if it is declined.
export async function claudeJson<T>(system: string, user: string, schema: Record<string, unknown>): Promise<T> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: user }],
  } as Anthropic.Beta.MessageCreateParamsNonStreaming);
  if (response.stop_reason === "refusal") throw new Error("Model declined the request");
  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return JSON.parse(text) as T;
}
