import { test } from "node:test";
import assert from "node:assert/strict";
import { mask } from "./mask.ts";

test("masks secrets but keeps amounts", () => {
  const m = mask("482913 is your OTP. Call 98230 01452 or +91 70021 04419. Card 4111 1111 1111 1111. Pay ₹5,000 or Rs.2000. Mail a@b.co");
  assert.ok(!m.includes("482913"));
  assert.ok(!m.includes("01452") && !m.includes("04419"));
  assert.ok(!m.includes("1111 1111"));
  assert.ok(m.includes("₹5,000") && m.includes("Rs.2000"));
  assert.ok(m.includes("[email]"));
});

test("a code followed by punctuation is still masked, amounts are not", () => {
  const m = mask("I shared my OTP 482913, what now? Code 7731. Paid ₹12,500.50 and 3,000 rupees.");
  assert.ok(!m.includes("482913") && !m.includes("7731"), m);
  assert.ok(m.includes("₹12,500.50") && m.includes("3,000"), m);
});
