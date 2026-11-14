export type RiskLevel = "safe" | "caution" | "high";

export type FlagKind =
  | "urgency"
  | "threat"
  | "credentials"
  | "payment"
  | "reward"
  | "secrecy"
  | "remote_access"
  | "family"
  | "unofficial_contact"
  | "impersonation"
  | "qr_payment"
  | "fake_login"
  | "redirect"
  | "new_domain";

export interface Span {
  start: number;
  end: number;
  text: string;
}

export interface Flag {
  kind: FlagKind;
  /** Short, calm label: "Rushing you". */
  title: string;
  /** One or two plain sentences on why this is a warning sign. */
  detail: string;
  /** Where in the message this was found, for on-page highlighting. */
  spans: Span[];
  weight: number;
}

export type LinkVerdict = "official" | "lookalike" | "suspicious" | "shortener" | "unknown";

export interface LinkReport {
  url: string;
  host: string;
  /** Registrable domain, e.g. "sbi-kyc-verify.xyz". */
  domain: string;
  verdict: LinkVerdict;
  reason: string;
  /** The organisation it imitates (lookalike) or belongs to (official). */
  entity?: Entity;
  span: Span;
}

export type EntityKind = "bank" | "payments" | "shopping" | "government" | "telecom" | "utility" | "delivery" | "authority";

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  /** Words that mean a message claims to come from this organisation. */
  mentions: RegExp;
  /** Registrable domains that genuinely belong to it. Empty for authorities with no single site. */
  domains: string[];
  /** What to type into the browser yourself. */
  site?: string;
  /** Official app name, to open yourself rather than via a link. */
  app?: string;
  /** Specific safe guidance for scams that use this name. */
  tip?: string;
  /** Who checked this entry and when. Unreviewed entries are never shown as "verified". */
  reviewed?: { by: string; on: string };
}

export interface UpiPayment {
  payee: string;
  name?: string;
  amount?: number;
  note?: string;
}

export interface Analysis {
  score: number;
  level: RiskLevel;
  headline: string;
  summary: string;
  flags: Flag[];
  links: LinkReport[];
  /** Organisation the message claims to be from, if any. */
  claimedEntity?: Entity;
  /** Ordered, plain-language next steps. */
  steps: string[];
  /** A decoded UPI QR, when the input contained one. */
  upi?: UpiPayment;
  /** What the vision model saw in a screenshot, in one plain sentence. */
  seen?: string;
  /**
   * The text talks *about* scams (advice, news, a bank's safety page). Only messages it quotes are
   * judged, and the extension underlines them without raising an alert.
   */
  aboutScams?: boolean;
  /** What we found when the link was opened on our server (website checker, extension "check link"). */
  page?: Omit<PageFacts, "text">;
}

/** English, Hindi and every Northeast language Bhashini serves (checked 2026-11-14). */
export type Lang = "en" | "hi" | "as" | "brx" | "bn" | "mni" | "ne" | "kha" | "lus";

/** Facts about a web page, gathered safely on the server (no scripts run, private addresses refused). */
export interface PageFacts {
  url: string;
  /** Where the link really ends up after redirects. */
  finalUrl: string;
  hops: string[];
  status?: number;
  title: string;
  description: string;
  /** Visible text, trimmed. */
  text: string;
  /** Secrets the page's forms ask for. */
  asks: string[];
  /** When the domain was registered (RDAP), ISO date, and how many days ago. */
  registered?: string;
  ageDays?: number;
  /** Set when the page couldn't be opened; the rest is then empty. */
  error?: string;
}
