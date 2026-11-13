import "server-only";
import { extractJson } from "./json";

// Gemma 3 27B (open weights) through the Hugging Face inference router. It reads the
// screenshot; the on-device engine still makes the scam decision from what it read.
type Chat = { choices?: { message?: { content?: string | null } }[] };

export interface VisionRead {
  text: string;
  kind: string;
  seen: string;
  hasQr: boolean;
}

const PROMPT = `You help an anti-scam assistant read a screenshot from a phone or computer in India.
Reply ONLY with JSON:
{
  "text": "every word visible in the image, transcribed exactly in its original language and script, including sender names, phone numbers, links and amounts; join lines with spaces",
  "kind": "one of: sms, whatsapp, email, social_post, website, payment_screen, qr_poster, call_screen, document, other",
  "seen": "one short, calm sentence describing what this is, e.g. 'A WhatsApp message from “Refund Desk” with a payment QR code.'",
  "hasQr": true or false
}
Do not judge whether it is a scam. Do not add anything that is not visible.`;

export async function readImage(dataUrl: string): Promise<VisionRead> {
  const token = process.env.HF_TOKEN;
  if (!token) throw new Error("Vision is not configured");
  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model: process.env.VISION_MODEL_ID || "google/gemma-3-27b-it",
      temperature: 0.1,
      max_tokens: 1200,
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Vision ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = (await res.json()) as Chat;
  const raw = extractJson(data.choices?.[0]?.message?.content ?? "") as Partial<VisionRead>;
  return {
    text: String(raw.text ?? "").slice(0, 6000),
    kind: String(raw.kind ?? "other"),
    seen: String(raw.seen ?? "").slice(0, 300),
    hasQr: Boolean(raw.hasQr),
  };
}
