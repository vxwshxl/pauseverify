import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "./analyze.ts";
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
