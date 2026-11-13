import { SPEAKABLE, speak } from "@/server/bhashini";
import { isLang, json, limited, preflight } from "@/server/http";

export const maxDuration = 60;
export const OPTIONS = preflight;

export async function POST(req: Request) {
  if (limited(req, "speak", 20)) return json({ error: "Too many requests" }, 429);
  const body = (await req.json().catch(() => null)) as { text?: unknown; lang?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 1600) : "";
  if (!text || !isLang(body?.lang)) return json({ error: "Send { text, lang }" }, 400);
  if (!SPEAKABLE.includes(body.lang)) return json({ error: "No voice for this language yet" }, 422);
  try {
    return json({ audio: await speak(text, body.lang), mime: "audio/wav" });
  } catch (e) {
    console.error("[speak]", e);
    return json({ error: "Read-aloud is unavailable right now" }, 502);
  }
}
