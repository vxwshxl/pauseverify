import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { analyzeUrl, type PageFacts } from "@pv/engine";

// Opens a link the way a careful person would — without running its scripts — and reports what is
// really there: where it ends up, what it says, what its forms ask for, and how old the domain is.
// Every hop is checked so a link can't make our server fetch something private (SSRF).

const MAX_HOPS = 5;
const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 8000;
const UA = "Mozilla/5.0 (compatible; PauseVerifyBot/1.0; +https://pauseverify.vercel.app/privacy)";

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
function privateIp(ip: string) {
  if (isIP(ip) === 4) return privateV4(ip);
  const v = ip.toLowerCase();
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return privateV4(mapped[1]!);
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
}

async function assertPublic(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only web links can be checked");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("That link uses an unusual port");
  if (url.username || url.password) throw new Error("That link hides a login inside it");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error("That website doesn’t exist (no DNS record)");
  if (addrs.some((a) => privateIp(a.address))) throw new Error("That link points inside a private network");
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.length;
    if (size > MAX_BYTES) { await reader.cancel().catch(() => {}); break; }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

const decode = (s: string) => s
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

function meta(html: string, name: string) {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i");
  return decode(html.match(re)?.[0].match(/content=["']([^"']*)["']/i)?.[1] ?? "").trim();
}

/** What secrets the page's forms ask for, from input names, ids, placeholders, labels and types. */
function asksFor(html: string): string[] {
  const inputs = html.match(/<input\b[^>]*>/gi) ?? [];
  const found = new Set<string>();
  for (const tag of inputs) {
    if (/type=["']?(hidden|submit|button|checkbox|radio|search)\b/i.test(tag)) continue;
    const words = (tag.match(/(?:name|id|placeholder|aria-label|autocomplete)=["']([^"']*)["']/gi) ?? []).join(" ").toLowerCase();
    if (/type=["']?password/i.test(tag) || /pass(word|code)?|mpin|\bpwd\b/.test(words)) found.add("password");
    if (/\botp\b|one.?time|verification.?code|\bcode\b/.test(words)) found.add("OTP");
    if (/card.?(no|num)|cc-number|cvv|cvc|expiry|cc-exp/.test(words)) found.add("card details");
    if (/\bupi\b.*pin|\bpin\b|atm/.test(words)) found.add("PIN");
    if (/aadhaa?r|\bpan\b/.test(words)) found.add("Aadhaar or PAN");
    if (/account.?(no|num)|ifsc/.test(words)) found.add("bank account");
  }
  return [...found];
}

function visibleText(html: string) {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|p|div|li|h[1-6]|tr|section|article)\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  ).replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

/** Domain age from RDAP (the registries' public lookup). Best effort; new domains are a strong scam sign. */
async function registered(domain: string): Promise<string | undefined> {
  try {
    const r = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { signal: AbortSignal.timeout(5000), headers: { accept: "application/rdap+json", "user-agent": UA } });
    if (!r.ok) return undefined;
    const j = (await r.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
    return j.events?.find((e) => e.eventAction === "registration")?.eventDate;
  } catch {
    return undefined;
  }
}

const cache = new Map<string, { at: number; facts: PageFacts }>();

export async function inspect(raw: string): Promise<PageFacts> {
  const input = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const hit = cache.get(input);
  if (hit && Date.now() - hit.at < 10 * 60_000) return hit.facts;

  const empty = { url: input, finalUrl: input, hops: [input], title: "", description: "", text: "", asks: [] };
  let url: URL;
  try { url = new URL(input); } catch { return { ...empty, error: "That doesn’t look like a web address" }; }

  const domain = analyzeUrl(url.href)?.domain;
  const regP = domain ? registered(domain) : Promise.resolve(undefined);
  const hops = [url.href];
  let res: Response | undefined;
  try {
    for (let i = 0; i <= MAX_HOPS; i++) {
      await assertPublic(url);
      res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "en-IN,en;q=0.8" } });
      const loc = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!loc) break;
      if (i === MAX_HOPS) throw new Error("That link bounces through too many redirects");
      url = new URL(loc, url);
      hops.push(url.href);
    }
  } catch (e) {
    const reg = await ageOf(url, domain, regP);
    return { ...empty, hops, finalUrl: url.href, registered: reg, ageDays: reg ? ageDays(reg) : undefined, error: e instanceof Error && !/abort|timeout/i.test(e.name + e.message) ? e.message : "The website didn’t answer in time" };
  }

  const type = res!.headers.get("content-type") ?? "";
  let html = /html|xml|text\/plain/i.test(type) || !type ? await readCapped(res!) : "";
  // A page that only bounces on with <meta http-equiv="refresh"> is a redirect too.
  const refresh = html.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>\s]+)/i)?.[1];
  if (refresh && hops.length <= MAX_HOPS) {
    try {
      const next = new URL(decode(refresh), url);
      await assertPublic(next);
      const r2 = await fetch(next, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": UA } });
      url = new URL(r2.url || next.href);
      hops.push(url.href);
      html = await readCapped(r2);
    } catch { /* keep the first page */ }
  }

  const reg = await ageOf(url, domain, regP);
  const facts: PageFacts = {
    url: hops[0]!,
    finalUrl: url.href,
    hops,
    status: res!.status,
    title: decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim().slice(0, 200),
    description: (meta(html, "description") || meta(html, "og:description")).slice(0, 400),
    text: visibleText(html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html).slice(0, 6000),
    asks: asksFor(html),
    registered: reg,
    ageDays: reg ? ageDays(reg) : undefined,
  };
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  cache.set(input, { at: Date.now(), facts });
  return facts;
}

/** Registration date of the site the link ends up on (looked up again if a redirect changed the domain). */
async function ageOf(final: URL, firstDomain: string | undefined, first: Promise<string | undefined>) {
  const d = analyzeUrl(final.href)?.domain;
  return !d || d === firstDomain ? first : registered(d);
}

function ageDays(iso: string) {
  const d = Date.parse(iso);
  return Number.isNaN(d) ? undefined : Math.max(0, Math.floor((Date.now() - d) / 86_400_000));
}
