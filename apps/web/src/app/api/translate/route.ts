import { translate } from "@/server/bhashini";
import { isLang, json, limited, preflight } from "@/server/http";

export const maxDuration = 30;
export const OPTIONS = preflight;

export async function POST(req: Request) {
  if (limited(req, "translate", 60)) return json({ error: "Too many requests" }, 429);
  const body = (await req.json().catch(() => null)) as { texts?: unknown; to?: unknown; from?: unknown } | null;
  const texts = Array.isArray(body?.texts) ? body.texts.filter((t): t is string => typeof t === "string").slice(0, 80).map((t) => t.slice(0, 1500)) : [];
  const to = body?.to;
  const from = body?.from ?? "en";
  if (!texts.length || !isLang(to) || !isLang(from)) return json({ error: "Send { texts: string[], to: 'en'|'as'|'brx'|'hi' }" }, 400);
  try {
    return json({ texts: await translate(texts, from, to) });
  } catch (e) {
    console.error("[translate]", e);
    return json({ error: "Translation is unavailable right now" }, 502);
  }
}
