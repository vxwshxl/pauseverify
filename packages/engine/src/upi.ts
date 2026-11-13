import type { UpiPayment } from "./types.ts";

/**
 * Parses a UPI payment link (the text inside a payment QR):
 *   upi://pay?pa=someone@okbank&pn=Name&am=5000&cu=INR&tn=Note
 * Scanning a QR like this always SENDS money from your account — there is no
 * such thing as a QR you scan to receive money.
 */
export function parseUpi(text: string): UpiPayment | null {
  const m = text.trim().match(/^upi:\/\/pay\?(.+)$/i);
  if (!m) return null;
  const q = new URLSearchParams(m[1]);
  const payee = q.get("pa");
  if (!payee) return null;
  const am = q.get("am");
  const amount = am && !Number.isNaN(Number(am)) ? Number(am) : undefined;
  return { payee, name: q.get("pn") ?? undefined, amount, note: q.get("tn") ?? undefined };
}
