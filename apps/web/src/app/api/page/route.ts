import { inspect } from "@/server/inspect";
import { json, limited, preflight } from "@/server/http";

export const maxDuration = 30;
export const OPTIONS = preflight;

/** Opens a link safely on the server and reports what's really there (see server/inspect.ts). */
export async function POST(req: Request) {
  if (limited(req, "page", 20)) return json({ error: "Too many requests" }, 429);
  const body = (await req.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim().slice(0, 2000) : "";
  if (!url) return json({ error: "Send { url: string }" }, 400);
  try {
    return json(await inspect(url));
  } catch (e) {
    console.error("[page]", e);
    return json({ error: "Couldn’t open that link" }, 502);
  }
}
