import { mask } from "@pv/engine";
import { translate } from "@/server/bhashini";
import { sarvamChat } from "@/server/sarvam";
import { isLang, json, limited, preflight } from "@/server/http";

export const maxDuration = 60;
export const OPTIONS = preflight;

interface Context {
  message?: string;
  level?: string;
  flags?: string[];
  links?: string[];
  claimed?: string;
  officialApp?: string;
  officialSite?: string;
  steps?: string[];
}

const SYSTEM = `You are Pause & Verify, a calm anti-scam helper for people in India, many of them elderly or new to smartphones.
Rules:
- Answer in plain, simple English in at most 90 words. Short sentences. No jargon, no markdown.
- Be kind and steady. Never blame the person.
- Base your answer on the check results you are given. If you are not sure, say so.
- Never ask for, or tell anyone to share, an OTP, PIN, password, CVV or card number.
- Never give a link or phone number unless it is the official site in the context, 1930 (national cyber-fraud helpline), or cybercrime.gov.in.
- If money may have been lost, tell them to call 1930 immediately and block cards/UPI from their bank app.
- Recommend checking through the organisation's official app or a website they type in themselves.`;

export async function POST(req: Request) {
  if (limited(req, "chat", 20)) return json({ error: "Too many requests" }, 429);
  const body = (await req.json().catch(() => null)) as { question?: unknown; lang?: unknown; context?: Context } | null;
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, 600) : "";
  const lang = isLang(body?.lang) ? body.lang : "en";
  if (!question) return json({ error: "Send { question, lang, context }" }, 400);
  const c = body?.context ?? {};

  try {
    // Sarvam answers best in English; Bhashini carries the question and answer across.
    const q = lang === "en" ? question : (await translate([question], lang, "en"))[0]!;
    const facts = [
      c.message && `The message (secrets already masked): """${mask(String(c.message)).slice(0, 1500)}"""`,
      c.level && `Risk level from our checks: ${c.level}.`,
      c.flags?.length && `Warning signs found: ${c.flags.slice(0, 8).join("; ")}.`,
      c.links?.length && `Links: ${c.links.slice(0, 5).join("; ")}.`,
      c.claimed && `It claims to be from: ${c.claimed}.`,
      (c.officialApp || c.officialSite) && `Official way to check: ${[c.officialApp && `the ${c.officialApp} app`, c.officialSite && `typing ${c.officialSite}`].filter(Boolean).join(" or ")}.`,
    ].filter(Boolean).join("\n");
    const answer = await sarvamChat([
      { role: "system", content: SYSTEM },
      { role: "user", content: `${facts || "No message was checked yet."}\n\nTheir question: ${mask(q)}` },
    ]);
    if (!answer) throw new Error("empty answer");
    const out = lang === "en" ? answer : (await translate([answer], "en", lang))[0]!;
    return json({ answer: out });
  } catch (e) {
    console.error("[chat]", e);
    return json({ error: "The helper is busy right now" }, 502);
  }
}
