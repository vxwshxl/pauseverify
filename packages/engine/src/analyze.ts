import { DIRECTORY, HELP } from "./directory.ts";
import { extractLinks, analyzeUrl } from "./links.ts";
import { ABOUT_SCAMS, FAKE_REASSURANCE, OTP_DELIVERY, RULES } from "./rules.ts";
import { parseUpi } from "./upi.ts";
import type { Analysis, Entity, Flag, LinkReport, PageFacts, RiskLevel, ScorePart, Span } from "./types.ts";

// ── The scoring model. Everything here is shown on the website's /scoring page, so the page can
// never disagree with the engine. Change a number here and the page follows.
export const LINK_WEIGHT: Record<LinkReport["verdict"], number> = { lookalike: 45, suspicious: 25, shortener: 15, unknown: 4, official: 0 };
export const THRESHOLDS = { caution: 25, high: 55, max: 99 } as const;
/** Signs that come from links, QR codes and opened pages rather than from the words. */
export const WEIGHTS = { impersonation: 20, qrReceive: 55, qr: 25, fakeLogin: 40, newDomainMonth: 30, newDomainHalfYear: 12, redirect: 15, redirectFromShortener: 10 } as const;

type Has = (k: Flag["kind"]) => boolean;
/** Combinations far more dangerous than their parts: each adds a bonus. */
export const COMBOS: { label: string; points: number; when: (has: Has, badLink: boolean) => boolean }[] = [
  { label: "A deadline or threat together with a request for secrets or a bad link", points: 15, when: (has, bad) => (has("urgency") || has("threat")) && (has("credentials") || bad) },
  { label: "A prize that asks you to pay a fee first", points: 15, when: (has) => has("reward") && has("payment") },
  { label: "A prize with a bad link or a private number", points: 15, when: (has, bad) => has("reward") && (bad || has("unofficial_contact")) },
  { label: "A “family member” on a new number who needs money fast", points: 15, when: (has) => has("family") && (has("payment") || has("urgency")) },
  { label: "A threat plus “don’t tell anyone”", points: 15, when: (has) => has("threat") && has("secrecy") },
  { label: "A login form on a brand-new or redirected site, or a bad link", points: 15, when: (has, bad) => has("fake_login") && (has("new_domain") || has("redirect") || bad) },
];

function collect(text: string, patterns: RegExp[]): Span[] {
  const spans: Span[] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) spans.push({ start: m.index!, end: m.index! + m[0].length, text: m[0] });
  }
  return spans.sort((a, b) => a.start - b.start);
}

function claimed(text: string): Entity | undefined {
  return DIRECTORY.find((e) => e.mentions.test(text));
}

export interface AnalyzeInput {
  /** Message text, a URL, or OCR text from a screenshot. */
  text: string;
  /** Raw contents of a QR code found in an image, if any. */
  qr?: string;
  /** One-sentence description from the vision model, shown as "What I see". */
  seen?: string;
  /** The page around this text is about scams (set by the extension from the page title). */
  about?: boolean;
  /** What the linked page turned out to be, when it was opened on the server. */
  page?: PageFacts;
}

/** Does this text discuss scams rather than run one? */
export function talksAboutScams(text: string): boolean {
  if (FAKE_REASSURANCE.test(text)) return false;
  return ABOUT_SCAMS.some((re) => re.test(text));
}

/**
 * Stretches of text in quotation marks: the example messages an article or a safety page quotes.
 * A straight ' only opens after a space or colon and only closes before a space or punctuation,
 * so apostrophes ("month's") don't end a quote early.
 */
export function quotedRanges(text: string): [number, number][] {
  const out: [number, number][] = [];
  const re = /“([^”]{12,})”|"([^"]{12,})"|‘([^’]{12,}?)’(?=[\s.,;:!?)]|$)|(?<=^|[\s:(—–-])'([\s\S]{12,}?)'(?=[\s.,;:!?)]|$)/g;
  for (const m of text.matchAll(re)) out.push([m.index!, m.index! + m[0].length]);
  return out;
}

export function analyze({ text, qr, seen, about, page }: AnalyzeInput): Analysis {
  const flags: Flag[] = [];
  const otpDelivery = OTP_DELIVERY.test(text);
  // Advice and news about scams mention OTPs, AnyDesk and "account blocked" too. There, only the
  // messages they quote count: "Change your net banking password" is advice, not a request.
  const aboutScams = !otpDelivery && (!!about || talksAboutScams(text));
  const quotes = aboutScams ? quotedRanges(text) : [];
  const counts = (sp: Span) => !aboutScams || quotes.some(([a, b]) => sp.start >= a && sp.end <= b);

  for (const rule of RULES) {
    if (rule.kind === "credentials" && otpDelivery) continue;
    const spans = collect(text, rule.patterns).filter(counts);
    if (spans.length) flags.push({ kind: rule.kind, title: rule.title, detail: rule.detail, spans, weight: rule.weight });
  }

  const links = extractLinks(text);
  if (qr && !parseUpi(qr)) {
    const fromQr = analyzeUrl(qr);
    if (fromQr) links.push({ ...fromQr, span: { start: -1, end: -1, text: qr } });
  }

  // A message that names an organisation but links somewhere else is impersonation.
  const opened = page && !page.error ? pageFlags(page, links) : null;
  if (opened) flags.push(...opened.flags);

  const judged = aboutScams ? quotes.map(([a, b]) => text.slice(a, b)).join("\n") : text;
  const entity = claimed(judged) ?? (opened?.official ? undefined : opened?.claims) ?? links.find((l) => l.verdict === "lookalike")?.entity;
  const badLink = links.find((l) => l.verdict === "lookalike" || l.verdict === "suspicious" || l.verdict === "shortener");
  const hasRisk = flags.some((f) => ["threat", "credentials", "payment", "reward", "fake_login"].includes(f.kind));
  if (entity && (badLink || (hasRisk && !links.some((l) => l.verdict === "official")))) {
    const at = aboutScams ? quotes[0]?.[0] ?? 0 : 0;
    const m = text.slice(at).match(entity.mentions);
    flags.push({
      kind: "impersonation",
      title: `Pretending to be ${entity.name}`,
      detail: badLink
        ? `It says it’s from ${entity.name}, but the link goes to ${badLink.domain}, which isn’t theirs.`
        : `It uses ${entity.name}’s name to make the request look official.`,
      spans: m?.index != null ? [{ start: at + m.index, end: at + m.index + m[0].length, text: m[0] }] : [],
      weight: WEIGHTS.impersonation,
    });
  }

  const upi = qr ? parseUpi(qr) ?? undefined : undefined;
  if (upi) {
    flags.push({
      kind: "qr_payment",
      title: upi.amount ? `This QR sends ₹${upi.amount.toLocaleString("en-IN")}` : "This QR sends money",
      detail: `Scanning it pays ${upi.name ? `“${upi.name}” ` : ""}(${upi.payee}) from your account. You never scan a QR to receive money.`,
      spans: [],
      weight: /receive|refund|cashback|prize|won|get ₹|credited/i.test(text) ? WEIGHTS.qrReceive : WEIGHTS.qr,
    });
  }

  // Strongest sign first: that's the one people read.
  flags.sort((a, b) => b.weight - a.weight);
  const has = (k: Flag["kind"]) => flags.some((f) => f.kind === k);
  // Every point is recorded, so the score can be explained line by line.
  const breakdown: ScorePart[] = [
    ...flags.map((f) => ({ kind: "sign" as const, label: f.title, points: f.weight, quote: f.spans[0]?.text?.trim() })),
    ...links.filter((l) => LINK_WEIGHT[l.verdict] > 0).map((l) => ({ kind: "link" as const, label: linkLabel(l), points: LINK_WEIGHT[l.verdict], quote: l.domain })),
  ];
  for (const c of COMBOS) if (c.when(has, !!badLink)) breakdown.push({ kind: "combo", label: c.label, points: c.points });
  const raw = breakdown.reduce((s, p) => s + p.points, 0);
  let score = raw;
  if (otpDelivery && !badLink && flags.length === 0 && score > 5) {
    breakdown.push({ kind: "adjust", label: "A genuine OTP delivery (“do not share”) — capped at 5", points: 5 - score });
    score = 5;
  }
  if (score > THRESHOLDS.max) {
    breakdown.push({ kind: "adjust", label: `Capped at ${THRESHOLDS.max}`, points: THRESHOLDS.max - score });
    score = THRESHOLDS.max;
  }
  score = Math.max(0, Math.round(score));

  const level: RiskLevel = score >= THRESHOLDS.high ? "high" : score >= THRESHOLDS.caution ? "caution" : "safe";
  const signs = flags.length;
  const linkNote = badLink
    ? badLink.verdict === "lookalike" && badLink.entity
      ? `the link isn’t ${shortName(badLink.entity)}’s`
      : "the link looks unsafe"
    : links.some((l) => l.verdict === "official")
      ? "the link is the real website"
      : "";

  const headline =
    level === "high" ? "Hold on. This looks like a scam." : level === "caution" ? "Be careful with this one." : "Nothing worrying here.";
  const summary =
    level === "safe" && signs === 0
      ? linkNote ? `No warning signs · ${linkNote}` : "No warning signs found"
      : [`${signs} warning sign${signs === 1 ? "" : "s"}`, linkNote].filter(Boolean).join(" · ");

  const pageInfo = page ? (({ text: _t, ...rest }) => rest)(page) : undefined;
  return { score, level, headline, summary, breakdown, flags, links, claimedEntity: entity, steps: steps(level, flags, links, entity), upi, seen, aboutScams: aboutScams || undefined, page: pageInfo };
}

function shortName(e: Entity) {
  return e.name.replace(/ \(.+\)$/, "").replace(/^State Bank of India$/, "SBI");
}

function steps(level: RiskLevel, flags: Flag[], links: LinkReport[], entity?: Entity): string[] {
  const has = (k: Flag["kind"]) => flags.some((f) => f.kind === k);
  const out: string[] = [];
  const bad = links.some((l) => l.verdict !== "official" && l.verdict !== "unknown");
  if (has("fake_login")) out.push("Don’t type anything into that page — no password, OTP, PIN or card number.");
  if (bad) out.push("Don’t tap the link.");
  if (has("qr_payment")) out.push("Don’t scan the QR code. You never scan a QR to receive money.");
  if (has("remote_access")) out.push("Don’t install any app they send. If you already did, uninstall it and restart your phone.");
  if (has("family")) out.push("Call your family member on the number you already know before sending anything.");
  if (has("reward") && has("payment")) out.push("You never have to pay to receive a prize, refund or job.");
  if (entity?.tip) out.push(entity.tip);
  if (entity?.app) out.push(`Open the ${entity.app} app yourself and check there.`);
  if (entity?.site) out.push(`Or type ${entity.site} into your browser yourself.`);
  if (entity?.kind === "bank" && bad) out.push("Real Indian bank websites now end in .bank.in — any other ending is not your bank.");
  if (has("credentials") || level !== "safe") out.push("Never share your OTP, PIN, password or card details — with anyone, even “bank staff”.");
  if (level === "high") out.push(`Already paid or shared details? Call ${HELP.helpline} now, or report at ${HELP.portal}.`);
  if (level === "safe") out.push(entity?.app ? `Still unsure? Check in the ${entity.app} app.` : "Still unsure? Contact the company through its official app or website.");
  return [...new Set(out)];
}

const quoteOnly = (sp: Span): Span => ({ start: -1, end: -1, text: sp.text });

/** Warning signs from the page a link opens: where it really goes, what it asks for, how new it is, what it says. */
function pageFlags(page: PageFacts, links: LinkReport[]): { flags: Flag[]; official: boolean; claims?: Entity } {
  const flags: Flag[] = [];
  const start = analyzeUrl(page.url);
  const end = analyzeUrl(page.finalUrl, { start: -1, end: -1, text: page.finalUrl });
  const official = end?.verdict === "official";
  if (!end) return { flags, official };

  // Make the link card say what we actually saw, not just "unknown website".
  const since = page.registered ? `, online since ${page.registered.slice(0, 4)}` : "";
  if (end.verdict === "unknown") end.reason = page.asks.length
    ? `We opened it safely. It has a form asking for your ${list(page.asks)}${since}.`
    : `We opened it safely: no login or payment form${since}.`;
  for (const l of links) if (l.domain === end.domain && l.verdict === end.verdict) l.reason = end.reason;
  if (start && start.domain !== end.domain && !links.some((l) => l.domain === end.domain)) links.push(end);

  if (official) return { flags, official };

  if (start && start.domain !== end.domain) {
    flags.push({
      kind: "redirect",
      title: `It really goes to ${end.domain}`,
      detail: `The link you see sends you on to ${end.domain}. Hiding where a link goes is a common trick — judge the website you end up on.`,
      spans: [{ start: -1, end: -1, text: end.domain }],
      weight: start.verdict === "shortener" ? WEIGHTS.redirectFromShortener : WEIGHTS.redirect,
    });
  }
  if (page.asks.length) {
    flags.push({
      kind: "fake_login",
      title: `This page asks for your ${list(page.asks)}`,
      detail: "Only type these into your bank’s own app, or its website that you typed in yourself — never into a page you reached from a message.",
      spans: [],
      weight: WEIGHTS.fakeLogin,
    });
  }
  if (page.ageDays != null && page.ageDays < 180) {
    flags.push({
      kind: "new_domain",
      title: page.ageDays < 31 ? `Website made ${Math.max(1, page.ageDays)} day${page.ageDays === 1 ? "" : "s"} ago` : `Website is only ${Math.round(page.ageDays / 30)} months old`,
      detail: "Scam websites are usually brand new and disappear within weeks. Real banks, shops and offices have had theirs for years.",
      spans: [],
      weight: page.ageDays < 31 ? WEIGHTS.newDomainMonth : WEIGHTS.newDomainHalfYear,
    });
  }
  // What the page itself says. An article or fact-check *about* scams doesn't count against it.
  const inner = analyze({ text: [page.title, page.description, page.text].filter(Boolean).join("\n") });
  if (!inner.aboutScams) {
    for (const f of inner.flags) {
      if (f.kind === "impersonation" || flags.some((x) => x.kind === f.kind)) continue;
      flags.push({ ...f, spans: f.spans.slice(0, 1).map(quoteOnly) });
    }
  }
  return { flags, official, claims: claimed(page.title) ?? end.entity };
}

function list(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function linkLabel(l: LinkReport) {
  return l.verdict === "lookalike" ? `Look-alike link${l.entity ? ` pretending to be ${l.entity.name}` : ""}`
    : l.verdict === "suspicious" ? "Suspicious link"
    : l.verdict === "shortener" ? "Shortened link that hides where it goes"
    : "Unknown website";
}
