import type { Entity } from "./types.ts";

// Curated list of organisations scammers impersonate in India, with the domains and apps
// that genuinely belong to them. The problem statement requires that verification links
// come only from a reviewed list: an entry is shown as "verified" only once `reviewed` is
// set, after a person has checked it (see scripts/check-directory.mjs for the automated
// first pass). Add entries; never loosen an existing domain list without checking it.

// `reviewed` is set from scripts/check-directory.mjs (domain resolves over HTTPS and the page
// title names the organisation). Change `by` to a person's name once your team signs it off.
const AUTO = { by: "automated domain check", on: "2026-11-14" };
const PENDING = undefined;

export const DIRECTORY: Entity[] = [
  // ── Banks ──────────────────────────────────────────────────────────────
  { id: "sbi", name: "State Bank of India", kind: "bank", mentions: /\bsbi\b|state bank|एसबीआई|স্টেট বেংক/i,
    domains: ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in", "onlinesbi.sbi.bank.in"], site: "onlinesbi.sbi.bank.in", app: "YONO SBI", reviewed: AUTO },
  { id: "hdfc", name: "HDFC Bank", kind: "bank", mentions: /\bhdfc\b/i,
    domains: ["hdfcbank.com", "hdfc.bank.in"], site: "hdfc.bank.in", app: "HDFC Bank MobileBanking", reviewed: AUTO },
  { id: "icici", name: "ICICI Bank", kind: "bank", mentions: /\bicici\b/i,
    domains: ["icicibank.com", "icici.bank.in"], site: "icici.bank.in", app: "iMobile Pay", reviewed: AUTO },
  { id: "axis", name: "Axis Bank", kind: "bank", mentions: /\baxis bank\b/i,
    domains: ["axisbank.com", "axis.bank.in"], site: "axis.bank.in", app: "Axis Mobile", reviewed: AUTO },
  { id: "pnb", name: "Punjab National Bank", kind: "bank", mentions: /\bpnb\b|punjab national/i,
    domains: ["pnbindia.in", "pnb.bank.in"], site: "pnb.bank.in", app: "PNB ONE", reviewed: AUTO },
  { id: "bob", name: "Bank of Baroda", kind: "bank", mentions: /bank of baroda|\bbob\b/i,
    domains: ["bankofbaroda.in", "bankofbaroda.bank.in"], site: "bankofbaroda.bank.in", app: "bob World", reviewed: AUTO },
  { id: "canara", name: "Canara Bank", kind: "bank", mentions: /\bcanara\b/i,
    domains: ["canarabank.com", "canarabank.bank.in"], site: "canarabank.bank.in", app: "Canara ai1", reviewed: AUTO },

  // ── Payments ───────────────────────────────────────────────────────────
  { id: "paytm", name: "Paytm", kind: "payments", mentions: /\bpaytm\b/i, domains: ["paytm.com"], site: "paytm.com", app: "Paytm", reviewed: AUTO },
  { id: "phonepe", name: "PhonePe", kind: "payments", mentions: /\bphone ?pe\b/i, domains: ["phonepe.com"], site: "phonepe.com", app: "PhonePe", reviewed: AUTO },
  { id: "gpay", name: "Google Pay", kind: "payments", mentions: /google ?pay|\bgpay\b/i, domains: ["google.com"], app: "Google Pay", reviewed: PENDING },
  { id: "npci", name: "NPCI / BHIM UPI", kind: "payments", mentions: /\bnpci\b|\bbhim\b/i, domains: ["npci.org.in", "bhimupi.org.in"], site: "npci.org.in", app: "BHIM", reviewed: AUTO },

  // ── Shopping & delivery ────────────────────────────────────────────────
  { id: "amazon", name: "Amazon", kind: "shopping", mentions: /\bamazon\b/i, domains: ["amazon.in", "amazon.com"], site: "amazon.in", app: "Amazon", reviewed: AUTO },
  { id: "flipkart", name: "Flipkart", kind: "shopping", mentions: /\bflipkart\b/i, domains: ["flipkart.com"], site: "flipkart.com", app: "Flipkart", reviewed: AUTO },
  { id: "indiapost", name: "India Post", kind: "delivery", mentions: /india ?post|speed ?post/i, domains: ["indiapost.gov.in"], site: "indiapost.gov.in",
    tip: "India Post does not ask you to pay to release a parcel through an SMS link.", reviewed: AUTO },
  { id: "courier", name: "Courier or customs", kind: "authority", mentions: /\b(fedex|dhl|courier|parcel|customs)\b/i, domains: [],
    tip: "Customs and couriers never ask you to pay or share Aadhaar on a phone or video call.", reviewed: PENDING },

  // ── Government & authorities ───────────────────────────────────────────
  { id: "incometax", name: "Income Tax Department", kind: "government", mentions: /income ?tax|\bitr\b|tax refund/i, domains: ["incometax.gov.in"], site: "incometax.gov.in", reviewed: AUTO },
  { id: "uidai", name: "UIDAI (Aadhaar)", kind: "government", mentions: /\baadhaa?r\b|\buidai\b/i, domains: ["uidai.gov.in"], site: "uidai.gov.in", reviewed: AUTO },
  { id: "epfo", name: "EPFO", kind: "government", mentions: /\bepfo?\b|provident fund/i, domains: ["epfindia.gov.in", "epfo.gov.in"], site: "epfo.gov.in", reviewed: AUTO },
  { id: "police", name: "Police, CBI or a court", kind: "authority", mentions: /\b(police|cbi|ncb|narcotics|court|cyber cell|digital arrest|ed officer|enforcement directorate)\b|पुलिस|गिरफ्तार/i, domains: [],
    tip: "There is no such thing as a “digital arrest”. Police never arrest you or settle a case over a video call, and never ask for money to close one.", reviewed: PENDING },

  // ── Telecom & utilities ────────────────────────────────────────────────
  { id: "airtel", name: "Airtel", kind: "telecom", mentions: /\bairtel\b/i, domains: ["airtel.in"], site: "airtel.in", app: "Airtel Thanks", reviewed: AUTO },
  { id: "jio", name: "Jio", kind: "telecom", mentions: /\bjio\b/i, domains: ["jio.com"], site: "jio.com", app: "MyJio", reviewed: AUTO },
  { id: "apdcl", name: "APDCL (Assam electricity)", kind: "utility", mentions: /\bapdcl\b|electricity|bijli|power (cut|supply)|light bill|বিদ্যুৎ/i, domains: ["apdcl.org"], site: "apdcl.org",
    tip: "The electricity board does not cut your power tonight over an SMS, and never asks you to call an officer’s personal number.", reviewed: PENDING },
];

/** Official national channels to report fraud. Always safe to show. */
export const HELP = {
  helpline: "1930",
  portal: "cybercrime.gov.in",
  reportSpam: "sancharsaathi.gov.in",
} as const;
