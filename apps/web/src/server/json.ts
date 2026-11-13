/** Pulls the first JSON object out of a model reply (strips <think> blocks and code fences). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Model reply had no JSON object");
  return JSON.parse(cleaned.slice(start, end + 1));
}
