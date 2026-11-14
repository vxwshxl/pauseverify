import type { Metadata } from "next";
import { Ban, Cpu, EyeOff, KeyRound, Lock, ScanLine, ShieldCheck, Timer } from "lucide-react";
import { PrivacyDemo } from "./privacy-demo";

export const metadata: Metadata = {
  title: "Privacy & security",
  description: "What Pause & Verify checks on your device, what leaves it (masked and encrypted), and what we keep: nothing.",
  alternates: { canonical: "/privacy" },
};

const FACTS = [
  { icon: Cpu, title: "Checked on your device", body: "Warning signs, fake links, look-alike bank sites and UPI QR codes are judged inside your browser. That part works even offline." },
  { icon: EyeOff, title: "Masked before it leaves", body: "OTPs, phone numbers, card and account numbers and email addresses are replaced before anything goes to the AI. Rupee amounts stay — they identify nobody." },
  { icon: Lock, title: "Encrypted on the way", body: "Every request travels over HTTPS (TLS), so anyone between you and us sees only scrambled bytes." },
  { icon: Ban, title: "Nothing stored", body: "No accounts, no database, no message history. We don’t log what you send — only errors like a timeout." },
  { icon: KeyRound, title: "Keys stay on our server", body: "The keys for Bhashini, Sarvam and the vision model never ship inside the extension, so nobody can lift them from it." },
  { icon: ScanLine, title: "Pictures only when you ask", body: "QR codes are decoded on the device. A screenshot goes to the vision model only when you drag “Look” over it or upload it — and it isn’t kept." },
  { icon: Timer, title: "Rate-limited", body: "Each route allows a fixed number of requests a minute, so the service can’t be used to flood the AI or translation." },
  { icon: ShieldCheck, title: "The engine decides, not the AI", body: "AI only reads screenshots, translates and explains. Whether something is a scam is decided by rules you can read and test." },
];

export default function PrivacyPage() {
  return (
    <div className="container-page pb-28 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Privacy & security</p>
        <h1 className="mt-3 text-balance font-display text-[40px] font-semibold leading-[1.05] sm:text-[56px]">Your messages stay yours.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-secondary-fg">
          Most checks never leave your device. When you ask the AI a question, here is exactly what goes out — try it with your own text.
        </p>
      </div>

      <PrivacyDemo />

      <section aria-labelledby="facts" className="mx-auto mt-24 max-w-5xl">
        <h2 id="facts" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Security, in plain words</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[22px] border border-border bg-background p-5">
              <span className="grid size-10 place-items-center rounded-full bg-subtle"><Icon className="size-5 text-brand" strokeWidth={1.75} /></span>
              <h3 className="mt-4 text-[16px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-secondary-fg">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
