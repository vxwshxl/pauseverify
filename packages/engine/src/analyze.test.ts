import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, collect } from "./analyze.ts";
import { RULES } from "./rules.ts";
import { analyzeUrl } from "./links.ts";
import { SAMPLES } from "./samples.ts";

for (const s of SAMPLES) {
  test(`sample ${s.id} is ${s.expected}`, () => {
    const a = analyze({ text: s.text, qr: s.qr });
    assert.equal(a.level, s.expected, `${s.id}: score ${a.score}, flags ${a.flags.map((f) => f.kind).join(",")}`);
  });
}

test("problem-statement demo: urgency and the fake link are both flagged", () => {
  const a = analyze({ text: SAMPLES[0]!.text });
  assert.ok(a.flags.some((f) => f.kind === "urgency"));
  assert.ok(a.flags.some((f) => f.kind === "impersonation"));
  assert.equal(a.links[0]?.verdict, "lookalike");
  assert.ok(a.steps.some((s) => s.includes("YONO SBI")));
});

test("look-alike domains", () => {
  assert.equal(analyzeUrl("amaz0n-refunds.in")?.verdict, "lookalike");
  assert.equal(analyzeUrl("https://www.paytrn.com/login")?.verdict, "lookalike");
  assert.equal(analyzeUrl("https://onlinesbi.sbi")?.verdict, "official");
  assert.equal(analyzeUrl("https://www.amazon.in/gp/x")?.verdict, "official");
  assert.equal(analyzeUrl("https://www.incometax.gov.in")?.verdict, "official");
  assert.equal(analyzeUrl("bit.ly/abc")?.verdict, "shortener");
  assert.equal(analyzeUrl("http://103.21.4.9/pay")?.verdict, "suspicious");
});

test("UPI QR to 'receive' money is high risk and shows the amount", () => {
  const a = analyze({ text: "Scan to receive your refund", qr: "upi://pay?pa=x@ybl&pn=Desk&am=5000" });
  assert.equal(a.upi?.amount, 5000);
  assert.equal(a.level, "high");
});

test("ordinary shop and site text is not flagged", () => {
  for (const t of ["Download App · Become a Seller · Gift Cards · Help Center", "Install the Flipkart app for faster shopping"]) {
    const a = analyze({ text: t });
    assert.ok(!a.flags.some((f) => f.kind === "remote_access"), t);
  }
  assert.equal(analyze({ text: "Please install this app AnyDesk so I can help you" }).flags.some((f) => f.kind === "remote_access"), true);
});

test("advice and news about scams are not scams", () => {
  // scamdekho.in "If you already fell for a KYC scam" list — a real false alarm.
  const advice = [
    "Call your bank's 24×7 helpline and block your card and freeze your account",
    "Change your net banking password and UPI PIN from a different device if possible",
    "Factory reset your phone if you installed an APK or gave AnyDesk access",
    "Call 1930 — National Cyber Crime Helpline — and report the fraud immediately",
  ];
  const all = analyze({ text: advice.join("\n") });
  assert.equal(all.level, "safe", `score ${all.score}, flags ${all.flags.map((f) => f.kind)}`);
  assert.equal(all.aboutScams, true);
  for (const t of advice) assert.notEqual(analyze({ text: t }).level, "high", t);
});

test("a scam quoted inside an article is still judged", () => {
  const text = "Fraudsters use official-sounding language. The message may read: 'Dear customer, your SBI account will be blocked today. Update KYC immediately at http://sbi-kyc-verify.xyz/update' — never click such links.";
  const a = analyze({ text });
  assert.equal(a.aboutScams, true);
  assert.ok(a.flags.some((f) => f.kind === "credentials"));
  assert.ok(a.flags.every((f) => f.spans.every((s) => s.start > text.indexOf("'Dear"))), "only quoted words are underlined");
});

test("a real scam that calls itself genuine is still a scam", () => {
  const a = analyze({ text: "Part time job, 100% genuine not a scam! Earn ₹3,000 daily liking YouTube videos. Pay registration fee ₹500 to start." });
  assert.ok(!a.aboutScams);
  assert.ok(a.flags.some((f) => f.kind === "reward") && a.flags.some((f) => f.kind === "payment"));
});

const page = (p: Partial<import("./types.ts").PageFacts>) => ({ url: "", finalUrl: "", hops: [], title: "", description: "", text: "", asks: [], ...p });

test("an opened page that asks for an OTP on a new site is high risk", () => {
  const url = "https://secure-kyc-portal.in/login";
  const a = analyze({ text: url, page: page({ url, finalUrl: url, title: "SBI KYC Update", text: "Enter your Customer ID and OTP to complete KYC", asks: ["password", "OTP"], ageDays: 4, registered: "2026-11-10" }) });
  assert.equal(a.level, "high", `score ${a.score}: ${a.flags.map((f) => f.kind)}`);
  for (const k of ["fake_login", "new_domain", "impersonation"]) assert.ok(a.flags.some((f) => f.kind === k), k);
});

test("a shortened link is judged by where it really goes", () => {
  const a = analyze({ text: "bit.ly/abc", page: page({ url: "https://bit.ly/abc", finalUrl: "https://amaz0n-refunds.in/claim", hops: ["https://bit.ly/abc", "https://amaz0n-refunds.in/claim"], title: "Claim your refund" }) });
  assert.ok(a.flags.some((f) => f.kind === "redirect"));
  assert.ok(a.links.some((l) => l.domain === "amaz0n-refunds.in" && l.verdict === "lookalike"));
  assert.equal(a.level, "high");
});

test("a fact-check page is opened and found safe", () => {
  const url = "https://www.boomlive.in/fact-check/image-is-digitally-altered-32492";
  const a = analyze({ text: url, page: page({ url, finalUrl: url, title: "Image Of Indian Embassy Counsellor At Anti-Pak Protest Is Digitally Altered", text: "Fact Check. BOOM found the viral image was digitally altered. The claim is false.", registered: "2013-03-01", ageDays: 4000 }) });
  assert.equal(a.level, "safe", `score ${a.score}: ${a.flags.map((f) => f.kind)}`);
  assert.match(a.links[0]!.reason, /opened it safely.*since 2013/);
});

test("a link to a bare IP address inside a message is found and flagged", () => {
  const a = analyze({ text: "Your electricity will be disconnected tonight. Pay now: http://103.21.4.9/pay" });
  assert.equal(a.links[0]?.verdict, "suspicious");
  assert.equal(a.level, "high", `score ${a.score}`);
  assert.equal(analyze({ text: "Update to version 1.2.3.4 today" }).links.length, 0);
});

// The scoring page lists every word and example; each must really trigger its own rule.
for (const rule of RULES) {
  test(`every listed word triggers “${rule.title}”`, () => {
    for (const w of [...rule.examples, ...rule.words]) {
      assert.ok(collect(`Hello ${w} thanks`, rule.patterns).length > 0, `${rule.kind}: “${w}” does not match`);
    }
  });
}

test("curly apostrophes and multi-digit amounts are matched", () => {
  const a = analyze({ text: "Don’t tell anyone. Pay ₹99 now." });
  assert.ok(a.flags.some((f) => f.kind === "secrecy"));
  assert.ok(a.flags.some((f) => f.kind === "payment"));
  assert.equal(a.flags.find((f) => f.kind === "secrecy")?.spans[0]?.text, "Don’t tell anyone");
});
