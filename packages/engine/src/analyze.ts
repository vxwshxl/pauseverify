import { DIRECTORY, HELP } from "./directory.ts";
import { extractLinks, analyzeUrl } from "./links.ts";
import { OTP_DELIVERY, RULES } from "./rules.ts";
import { parseUpi } from "./upi.ts";
import type { Analysis, Entity, Flag, LinkReport, RiskLevel, Span } from "./types.ts";

const LINK_WEIGHT: Record<LinkReport["verdict"], number> = { lookalike: 45, suspicious: 25, shortener: 15, unknown: 4, official: 0 };

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
}

export function analyze({ text, qr }: AnalyzeInput): Analysis {
  const flags: Flag[] = [];
  const otpDelivery = OTP_DELIVERY.test(text);

  for (const rule of RULES) {
    if (rule.kind === "credentials" && otpDelivery) continue;
    const spans = collect(text, rule.patterns);
    if (spans.length) flags.push({ kind: rule.kind, title: rule.title, detail: rule.detail, spans, weight: rule.weight });
  }

  const links = extractLinks(text);
  if (qr && !parseUpi(qr)) {
    const fromQr = analyzeUrl(qr);
    if (fromQr) links.push({ ...fromQr, span: { start: -1, end: -1, text: qr } });
  }

  // A message that names an organisation but links somewhere else is impersonation.
  const entity = claimed(text) ?? links.find((l) => l.verdict === "lookalike")?.entity;
  const badLink = links.find((l) => l.verdict === "lookalike" || l.verdict === "suspicious" || l.verdict === "shortener");
  const hasRisk = flags.some((f) => ["threat", "credentials", "payment", "reward"].includes(f.kind));
  if (entity && (badLink || (hasRisk && !links.some((l) => l.verdict === "official")))) {
    const m = text.match(entity.mentions);
    flags.push({
      kind: "impersonation",
      title: `Pretending to be ${entity.name}`,
      detail: badLink
        ? `It says it’s from ${entity.name}, but the link goes to ${badLink.domain}, which isn’t theirs.`
        : `It uses ${entity.name}’s name to make the request look official.`,
      spans: m?.index != null ? [{ start: m.index, end: m.index + m[0].length, text: m[0] }] : [],
      weight: 20,
    });
  }

  const upi = qr ? parseUpi(qr) ?? undefined : undefined;
  if (upi) {
    flags.push({
      kind: "qr_payment",
      title: upi.amount ? `This QR sends ₹${upi.amount.toLocaleString("en-IN")}` : "This QR sends money",
      detail: `Scanning it pays ${upi.name ? `“${upi.name}” ` : ""}(${upi.payee}) from your account. You never scan a QR to receive money.`,
      spans: [],
      weight: /receive|refund|cashback|prize|won|get ₹|credited/i.test(text) ? 55 : 25,
    });
  }

  // Strongest sign first: that's the one people read.
  flags.sort((a, b) => b.weight - a.weight);
  const has = (k: Flag["kind"]) => flags.some((f) => f.kind === k);
  let score = flags.reduce((s, f) => s + f.weight, 0) + links.reduce((s, l) => s + LINK_WEIGHT[l.verdict], 0);
  // Combinations that are far more dangerous than their parts.
  if ((has("urgency") || has("threat")) && (has("credentials") || badLink)) score += 15;
  if (has("reward") && has("payment")) score += 15;
  if (has("reward") && (badLink || has("unofficial_contact"))) score += 15;
  if (has("family") && (has("payment") || has("urgency"))) score += 15;
  if (has("threat") && has("secrecy")) score += 15;
  if (otpDelivery && !badLink && flags.length === 0) score = Math.min(score, 5);
  score = Math.max(0, Math.min(99, Math.round(score)));

  const level: RiskLevel = score >= 55 ? "high" : score >= 25 ? "caution" : "safe";
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

  return { score, level, headline, summary, flags, links, claimedEntity: entity, steps: steps(level, flags, links, entity), upi };
}

function shortName(e: Entity) {
  return e.name.replace(/ \(.+\)$/, "").replace(/^State Bank of India$/, "SBI");
}

function steps(level: RiskLevel, flags: Flag[], links: LinkReport[], entity?: Entity): string[] {
  const has = (k: Flag["kind"]) => flags.some((f) => f.kind === k);
  const out: string[] = [];
  const bad = links.some((l) => l.verdict !== "official" && l.verdict !== "unknown");
  if (bad) out.push("Don’t tap the link.");
  if (has("qr_payment")) out.push("Don’t scan the QR code. You never scan a QR to receive money.");
  if (has("remote_access")) out.push("Don’t install any app they send. If you already did, uninstall it and restart your phone.");
  if (has("family")) out.push("Call your family member on the number you already know before sending anything.");
  if (has("reward") && has("payment")) out.push("You never have to pay to receive a prize, refund or job.");
  if (entity?.tip) out.push(entity.tip);
  if (entity?.app) out.push(`Open the ${entity.app} app yourself and check there.`);
  if (entity?.site) out.push(`Or type ${entity.site} into your browser yourself.`);
  if (has("credentials") || level !== "safe") out.push("Never share your OTP, PIN, password or card details — with anyone, even “bank staff”.");
  if (level === "high") out.push(`Already paid or shared details? Call ${HELP.helpline} now, or report at ${HELP.portal}.`);
  if (level === "safe") out.push(entity?.app ? `Still unsure? Check in the ${entity.app} app.` : "Still unsure? Contact the company through its official app or website.");
  return [...new Set(out)];
}
