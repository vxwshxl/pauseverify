import "server-only";

// The extension calls these routes from its background worker (origin chrome-extension://…).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

// Simple fixed-window limiter per IP and route. Per instance, which is fine for a
// prototype: it stops a runaway loop, not a determined attacker.
const hits = new Map<string, { n: number; reset: number }>();

export function limited(req: Request, route: string, perMinute: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${route}:${ip}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + 60_000 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  return ++h.n > perMinute;
}

export const LANGS = ["en", "hi", "as", "brx", "bn", "mni", "ne", "kha", "lus"] as const;
export function isLang(v: unknown): v is (typeof LANGS)[number] {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}
