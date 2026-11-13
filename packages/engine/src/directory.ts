import type { Entity } from "./types.ts";

// Curated list of organisations scammers impersonate in India, with the domains and apps
// that genuinely belong to them. The problem statement requires that verification links
// come only from a reviewed list: an entry is shown as "verified" only once `reviewed` is
// set, after a person has checked it (see scripts/check-directory.mjs for the automated
// first pass). Add entries; never loosen an existing domain list without checking it.

// Filled in from scripts/check-directory.mjs results and team review.
const PENDING = undefined;

export const DIRECTORY: Entity[] = [
  // ── Banks ──────────────────────────────────────────────────────────────
  { id: "sbi", name: "State Bank of India", kind: "bank", mentions: /\bsbi\b|state bank|एसबीआई|স্টেট বেংক/i,
    domains: ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in"], site: "onlinesbi.sbi", app: "YONO SBI", reviewed: PENDING },
  { id: "hdfc", name: "HDFC Bank", kind: "bank", mentions: /\bhdfc\b/i,
    domains: ["hdfcbank.com", "hdfc.bank.in"], site: "hdfcbank.com", app: "HDFC Bank MobileBanking", reviewed: PENDING },
  { id: "icici", name: "ICICI Bank", kind: "bank", mentions: /\bicici\b/i,
    domains: ["icicibank.com", "icici.bank.in"], site: "icicibank.com", app: "iMobile Pay", reviewed: PENDING },
  { id: "axis", name: "Axis Bank", kind: "bank", mentions: /\baxis bank\b/i,
    domains: ["axisbank.com", "axis.bank.in"], site: "axisbank.com", app: "Axis Mobile", reviewed: PENDING },
  { id: "pnb", name: "Punjab National Bank", kind: "bank", mentions: /\bpnb\b|punjab national/i,
    domains: ["pnbindia.in", "pnb.bank.in"], site: "pnbindia.in", app: "PNB ONE", reviewed: PENDING },
  { id: "bob", name: "Bank of Baroda", kind: "bank", mentions: /bank of baroda|\bbob\b/i,
    domains: ["bankofbaroda.in", "bankofbaroda.bank.in"], site: "bankofbaroda.in", app: "bob World", reviewed: PENDING },
  { id: "canara", name: "Canara Bank", kind: "bank", mentions: /\bcanara\b/i,
    domains: ["canarabank.com", "canarabank.bank.in"], site: "canarabank.com", app: "Canara ai1", reviewed: PENDING },

  // ── Payments ───────────────────────────────────────────────────────────
  { id: "paytm", name: "Paytm", kind: "payments", mentions: /\bpaytm\b/i, domains: ["paytm.com"], site: "paytm.com", app: "Paytm", reviewed: PENDING },
  { id: "phonepe", name: "PhonePe", kind: "payments", mentions: /\bphone ?pe\b/i, domains: ["phonepe.com"], site: "phonepe.com", app: "PhonePe", reviewed: PENDING },
  { id: "gpay", name: "Google Pay", kind: "payments", mentions: /google ?pay|\bgpay\b/i, domains: ["google.com"], app: "Google Pay", reviewed: PENDING },
  { id: "npci", name: "NPCI / BHIM UPI", kind: "payments", mentions: /\bnpci\b|\bbhim\b/i, domains: ["npci.org.in", "bhimupi.org.in"], site: "npci.org.in", app: "BHIM", reviewed: PENDING },

  // ── Shopping & delivery ────────────────────────────────────────────────
  { id: "amazon", name: "Amazon", kind: "shopping", mentions: /\bamazon\b/i, domains: ["amazon.in", "amazon.com"], site: "amazon.in", app: "Amazon", reviewed: PENDING },
  { id: "flipkart", name: "Flipkart", kind: "shopping", mentions: /\bflipkart\b/i, domains: ["flipkart.com"], site: "flipkart.com", app: "Flipkart", reviewed: PENDING },
  { id: "indiapost", name: "India Post", kind: "delivery", mentions: /india ?post|speed ?post/i, domains: ["indiapost.gov.in"], site: "indiapost.gov.in",
    tip: "India Post does not ask you to pay to release a parcel through an SMS link.", reviewed: PENDING },
  { id: "courier", name: "Courier or customs", kind: "authority", mentions: /\b(fedex|dhl|courier|parcel|customs)\b/i, domains: [],
    tip: "Customs and couriers never ask you to pay or share Aadhaar on a phone or video call.", reviewed: PENDING },

  // ── Government & authorities ───────────────────────────────────────────
  { id: "incometax", name: "Income Tax Department", kind: "government", mentions: /income ?tax|\bitr\b|tax refund/i, domains: ["incometax.gov.in"], site: "incometax.gov.in", reviewed: PENDING },
  { id: "uidai", name: "UIDAI (Aadhaar)", kind: "government", mentions: /\baadhaa?r\b|\buidai\b/i, domains: ["uidai.gov.in"], site: "uidai.gov.in", reviewed: PENDING },
  { id: "epfo", name: "EPFO", kind: "government", mentions: /\bepfo?\b|provident fund/i, domains: ["epfindia.gov.in"], site: "epfindia.gov.in", reviewed: PENDING },
  { id: "police", name: "Police, CBI or a court", kind: "authority", mentions: /\b(police|cbi|ncb|narcotics|court|cyber cell|digital arrest|ed officer|enforcement directorate)\b|पुलिस|गिरफ्तार/i, domains: [],
    tip: "There is no such thing as a “digital arrest”. Police never arrest you or settle a case over a video call, and never ask for money to close one.", reviewed: PENDING },

  // ── Telecom & utilities ────────────────────────────────────────────────
  { id: "airtel", name: "Airtel", kind: "telecom", mentions: /\bairtel\b/i, domains: ["airtel.in"], site: "airtel.in", app: "Airtel Thanks", reviewed: PENDING },
  { id: "jio", name: "Jio", kind: "telecom", mentions: /\bjio\b/i, domains: ["jio.com"], site: "jio.com", app: "MyJio", reviewed: PENDING },
  { id: "apdcl", name: "APDCL (Assam electricity)", kind: "utility", mentions: /\bapdcl\b|electricity|bijli|power (cut|supply)|light bill|বিদ্যুৎ/i, domains: ["apdcl.org"], site: "apdcl.org",
    tip: "The electricity board does not cut your power tonight over an SMS, and never asks you to call an officer’s personal number.", reviewed: PENDING },
];

/** Official national channels to report fraud. Always safe to show. */
export const HELP = {
  helpline: "1930",
  portal: "cybercrime.gov.in",
  reportSpam: "sancharsaathi.gov.in",
} as const;
