/**
 * Removes secrets before any text leaves the device (for AI answers or translation):
 * phone numbers, OTP-like codes, card and account numbers, and email addresses.
 * Rupee amounts are kept — "₹5,000" matters to the explanation and identifies nobody.
 */
export function mask(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]")
    .replace(/(?:\+?91[\s-]?)?(?<![\d])[6-9]\d{4}[\s-]?\d{5}(?![\d])/g, "[phone number]")
    .replace(/(?<![\d₹])\d(?:[\s-]?\d){8,18}(?![\d])/g, "[number]")
    .replace(/(?<!(?:₹|rs\.?|inr)\s?)(?<![\d,.])\b\d{4,8}\b(?![\d,.])/gi, "[code]");
}
