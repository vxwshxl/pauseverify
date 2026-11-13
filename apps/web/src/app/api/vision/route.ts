import { readImage } from "@/server/vision";
import { json, limited, preflight } from "@/server/http";

export const maxDuration = 60;
export const OPTIONS = preflight;

const MAX_BYTES = 2_500_000;

export async function POST(req: Request) {
  if (limited(req, "vision", 12)) return json({ error: "Too many requests" }, 429);
  const body = (await req.json().catch(() => null)) as { image?: unknown } | null;
  const image = typeof body?.image === "string" ? body.image : "";
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(image)) return json({ error: "Send { image: 'data:image/jpeg;base64,…' }" }, 400);
  if (image.length > MAX_BYTES * 1.37) return json({ error: "Image too large — send at most ~2.5 MB" }, 413);
  try {
    return json(await readImage(image));
  } catch (e) {
    console.error("[vision]", e);
    return json({ error: "Couldn’t read the image right now" }, 502);
  }
}
