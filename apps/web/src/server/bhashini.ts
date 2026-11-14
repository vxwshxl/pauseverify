import "server-only";
import type { Lang } from "@pv/engine";

// Bhashini (Government of India) Dhruva pipeline — same endpoint and models okhrang uses.
// Model per language pair, as measured (okhrang 2026-09-17, re-checked 2026-11-14):
// IIIT-H serves Khasi and Mizo and most pairs; only AI4Bharat translates into
// Manipuri (Meitei Mayek) correctly — IIIT-H returns unrelated Bengali-script text.
const IIITH = "bhashini/iiith/nmt-all";
const AI4B = "ai4bharat/indictrans-v2-all-gpu--t4";
const serviceFor = (from: Lang, to: Lang) => (from === "mni" || to === "mni" ? AI4B : IIITH);

/** Languages Bhashini can read aloud with usable audio. Khasi and Mizo have no voice;
 *  Manipuri in Meitei Mayek comes back as a near-empty clip. */
export const SPEAKABLE: Lang[] = ["en", "hi", "as", "brx", "bn", "ne"];

/** AI4Bharat puts spaces around the Meitei virama and before the full stop, breaking conjuncts. */
const fixMeitei = (t: string) => t.replace(/\s*\uABED\s*/g, "\uABED").replace(/\s+\uABEB/g, "\uABEB");
const TTS = "Bhashini/IITM/TTS";

type Pipeline = { pipelineResponse?: { output?: { target?: string }[]; audio?: { audioContent?: string }[] }[] };

async function call(body: unknown, timeoutMs: number): Promise<Pipeline> {
  const endpoint = process.env.BHASHINI_API_ENDPOINT;
  const key = process.env.BHASHINI_SUBSCRIPTION_KEY;
  if (!endpoint || !key) throw new Error("Bhashini is not configured");
  let last: unknown;
  // An idle Bhashini model often 504s once and then wakes; retry 5xx, 429 and timeouts.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 700 * attempt));
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: key },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return (await res.json()) as Pipeline;
      last = new Error(`Bhashini ${res.status}`);
      if (res.status < 500 && res.status !== 429) break;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

// Translations of the same sentence repeat constantly ("Rushing you", the steps…), so a
// small in-memory cache saves most calls. Per server instance; that's enough here.
const cache = new Map<string, string>();
const CACHE_MAX = 4000;

// Bhashini's NMT renders "scam/scammer" as "calendar" in Assamese. "Fraud/fraudster" comes
// out right in every target language, so rewrite before translating out of English.
function translatable(t: string) {
  return t
    .replace(/\bscammers\b/gi, "fraudsters")
    .replace(/\bscammer\b/gi, "fraudster")
    .replace(/\bscams\b/gi, "frauds")
    .replace(/\bscam\b/gi, "fraud");
}

export async function translate(texts: string[], from: Lang, to: Lang): Promise<string[]> {
  if (from === to) return texts;
  const out: (string | undefined)[] = texts.map((t) => cache.get(`${from}>${to}:${t}`));
  const missing = texts.map((t, i) => ({ t, i })).filter(({ i }) => out[i] === undefined && texts[i]!.trim());
  const batches: (typeof missing)[] = [];
  for (let i = 0; i < missing.length; i += 25) batches.push(missing.slice(i, i + 25));
  // Batches run in parallel so a long sheet fits in one function call. A batch that fails (an idle
  // model that never woke) leaves its strings in English *uncached*, so the next request retries
  // them — caching the fallback once kept a language stuck in English until a redeploy.
  const settled = await Promise.allSettled(batches.map((batch) => call(
    {
      pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: from, targetLanguage: to }, serviceId: serviceFor(from, to) } }],
      inputData: { input: batch.map(({ t }) => ({ source: from === "en" ? translatable(t) : t })) },
    },
    20_000,
  )));
  let failed = 0;
  settled.forEach((res, b) => {
    const got = res.status === "fulfilled" ? res.value.pipelineResponse?.[0]?.output ?? [] : [];
    batches[b]!.forEach(({ t, i: idx }, j) => {
      const raw = got[j]?.target?.trim();
      if (!raw) { failed++; return; }
      const target = to === "mni" ? fixMeitei(raw) : raw;
      out[idx] = target;
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
      cache.set(`${from}>${to}:${t}`, target);
    });
  });
  if (failed && failed === missing.length) throw new Error("Translation is unavailable right now");
  return out.map((t, i) => t ?? texts[i]!);
}

/** Speech for one short passage. Returns base64 WAV chunks to play in order. */
export async function speak(text: string, lang: Lang): Promise<string[]> {
  // Long passages time out; split on sentence ends into ~300-character pieces.
  const pieces: string[] = [];
  let cur = "";
  for (const s of text.split(/(?<=[.!?।])\s+/)) {
    if ((cur + " " + s).length > 300 && cur) { pieces.push(cur); cur = s; } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) pieces.push(cur);
  const audio = await Promise.all(
    pieces.slice(0, 6).map(async (p) => {
      const data = await call(
        {
          pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: lang }, gender: "female", serviceId: TTS } }],
          inputData: { input: [{ source: p }] },
        },
        60_000,
      );
      return data.pipelineResponse?.[0]?.audio?.[0]?.audioContent ?? "";
    }),
  );
  return audio.filter(Boolean);
}
