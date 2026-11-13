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
