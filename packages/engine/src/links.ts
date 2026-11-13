import { parse } from "tldts";
import { DIRECTORY } from "./directory.ts";
import type { Entity, LinkReport, Span } from "./types.ts";

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.ly", "cutt.ly", "rb.gy", "is.gd", "goo.gl", "shorturl.at", "tiny.cc", "ow.ly", "rebrand.ly", "t.co", "s.id", "v.gd",
]);

// Cheap, throwaway TLDs that turn up again and again in Indian SMS phishing.
const RISKY_TLDS = new Set([
  "xyz", "top", "click", "icu", "buzz", "live", "online", "site", "info", "rest", "cam", "sbs", "cfd", "vip", "monster", "quest", "lol", "shop", "support", "work", "link", "bond", "cyou", "today",
]);

// Bare domains too ("sbi-kyc.xyz/update"), not only http(s) URLs. tldts validates the suffix.
const URL_RE = /(?<![@\w.-])((?:https?:\/\/)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"'”’)\]]*)?)/gi;

// Characters scammers swap in to make a domain look right at a glance.
function unconfuse(s: string) {
  return s
    .toLowerCase()
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/4/g, "a")
    .replace(/@/g, "a");
}

function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length]![b.length]!;
}

/** Brand words to look for inside a suspicious domain: "sbi", "hdfcbank", "amazon"… */
const BRAND_TOKENS: { token: string; entity: Entity }[] = DIRECTORY.flatMap((e) =>
  e.domains
    .map((d) => d.split(".")[0]!)
    .filter((t) => t.length >= 3 && t !== "google")
    .concat(e.id.length >= 3 && !["courier", "police", "npci", "gpay"].includes(e.id) ? [e.id] : [])
    .map((token) => ({ token, entity: e })),
);

function officialEntity(domain: string): Entity | undefined {
  return DIRECTORY.find((e) => e.domains.includes(domain));
}

function imitated(domain: string, subdomain: string): Entity | undefined {
  const label = domain.split(".")[0] ?? "";
  const plain = unconfuse(label);
  const sub = unconfuse(subdomain);
  for (const { token, entity } of BRAND_TOKENS) {
    // Brand name inside an unrelated domain or subdomain: sbi-kyc-verify.xyz, sbi.secure-login.co
    if (plain.split(/[-_]/).includes(token) || (token.length >= 5 && plain.includes(token)) || sub.split(/[.-]/).includes(token)) return entity;
    // One or two characters off: amaz0n.in, paytrn.com, flipkartt.com
    if (token.length >= 5 && editDistance(plain, token) <= (token.length >= 8 ? 2 : 1)) return entity;
  }
  return undefined;
}

export function extractLinks(text: string): LinkReport[] {
  const out: LinkReport[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[1]!.replace(/[.,;:!?]+$/, "");
    const span: Span = { start: m.index!, end: m.index! + raw.length, text: raw };
    const report = analyzeUrl(raw, span);
    if (report) out.push(report);
  }
  return out;
}

export function analyzeUrl(raw: string, span?: Span): LinkReport | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  const p = parse(withScheme, { allowPrivateDomains: false });
  if (!p.hostname) return null;
  const s = span ?? { start: 0, end: raw.length, text: raw };

  if (p.isIp) return { url: raw, host: p.hostname, domain: p.hostname, verdict: "suspicious", reason: "Uses a bare number address instead of a company name.", span: s };
  if (!p.domain || !p.isIcann) return null;

  const domain = p.domain;
  const host = p.hostname;
  const sub = p.subdomain ?? "";
  const tld = p.publicSuffix ?? "";

  const official = officialEntity(domain);
  if (official) return { url: raw, host, domain, verdict: "official", reason: `This is ${official.name}’s real website.`, entity: official, span: s };
  if (/(^|\.)(gov|nic)\.in$/.test(tld) || domain.endsWith(".gov.in") || domain.endsWith(".nic.in"))
    return { url: raw, host, domain, verdict: "official", reason: "A government .gov.in website.", span: s };
  if (tld === "bank.in") return { url: raw, host, domain, verdict: "official", reason: "A .bank.in address, which only real Indian banks can register.", span: s };

  const fake = imitated(domain, sub);
  if (fake) return { url: raw, host, domain, verdict: "lookalike", reason: `Made to look like ${fake.name}, but it isn’t their website.`, entity: fake, span: s };

  if (SHORTENERS.has(domain)) return { url: raw, host, domain, verdict: "shortener", reason: "A shortened link hides where it really goes.", span: s };
  if (host.includes("xn--")) return { url: raw, host, domain, verdict: "suspicious", reason: "Uses look-alike letters from another alphabet.", span: s };
  if (RISKY_TLDS.has(tld.split(".").pop() ?? "")) return { url: raw, host, domain, verdict: "suspicious", reason: `Ends in “.${tld}”, a cheap address often used for scam sites.`, span: s };
  if ((domain.match(/-/g)?.length ?? 0) >= 2) return { url: raw, host, domain, verdict: "suspicious", reason: "A long, hyphenated address — typical of throwaway scam sites.", span: s };

  return { url: raw, host, domain, verdict: "unknown", reason: "We don’t know this website. Treat it with care.", span: s };
}
