import "server-only";

// Sarvam AI (Bengaluru). Reasoning must be off (reasoning_effort: null): with any effort
// level, short replies spend the whole token budget thinking and come back empty.
type Chat = { choices?: { message?: { content?: string | null } }[] };

export async function sarvamChat(messages: { role: "system" | "user" | "assistant"; content: string }[], maxTokens = 400) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) throw new Error("Sarvam is not configured");
  const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({ model: process.env.SARVAM_MODEL_ID || "sarvam-105b", reasoning_effort: null, temperature: 0.3, max_tokens: maxTokens, messages }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()) as Chat;
  return (data.choices?.[0]?.message?.content ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}
