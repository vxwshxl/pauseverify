import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_TOKENS, COMBOS, DIRECTORY, LINK_WEIGHT, RISKY_TLDS, RULES, SHORTENERS, SWAPS, THRESHOLDS, WEIGHTS } from "@pv/engine";
import { ScoreCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "How the score works",
  description: "Pause & Verify adds up warning signs with fixed, published points — no black box, and AI never decides. Try it live and see every point.",
  alternates: { canonical: "/scoring" },
};

// Everything below is read from the engine itself (packages/engine), so this page can't drift
// from what the extension actually does.
const LINKS: [string, string, number][] = [
  ["Look-alike website", "Made to look like a bank, shop or office: amaz0n-refunds.in, sbi-kyc-verify.xyz, paytrn.com.", LINK_WEIGHT.lookalike],
  ["Suspicious address", "A bare number address (http://103.21.4.9) or a cheap throwaway ending like .xyz, .top, .click.", LINK_WEIGHT.suspicious],
  ["Shortened link", "bit.ly, tinyurl… hides where it really goes. When we can, we open it and judge the real destination.", LINK_WEIGHT.shortener],
  ["Unknown website", "Not on our reviewed list. On its own this is almost nothing.", LINK_WEIGHT.unknown],
  ["Real website", "On our reviewed list of real bank, government and shop sites (and real banks’ .bank.in addresses).", LINK_WEIGHT.official],
];

const EXTRA: [string, string, string][] = [
  ["Pretending to be an organisation", "Uses a bank’s or office’s name, with a bad link or a risky request.", `+${WEIGHTS.impersonation}`],
  ["The page asks for your password, OTP, PIN or card", "Found when we open the link safely on our server.", `+${WEIGHTS.fakeLogin}`],
  ["Website made in the last month · last six months", "From the domain’s public registration record (RDAP).", `+${WEIGHTS.newDomainMonth} · +${WEIGHTS.newDomainHalfYear}`],
  ["The link really goes somewhere else", "It redirects to a different website (less if it’s a known link shortener).", `+${WEIGHTS.redirect} · +${WEIGHTS.redirectFromShortener}`],
  ["A UPI QR that sends money", "Decoded on the device. Much worse when the message says you’ll receive money.", `+${WEIGHTS.qrReceive} · +${WEIGHTS.qr}`],
];

const BANDS = [
  { range: `0 – ${THRESHOLDS.caution - 1}`, name: "Nothing worrying here", body: "The island stays a small circle with a green dot.", cls: "bg-success" },
  { range: `${THRESHOLDS.caution} – ${THRESHOLDS.high - 1}`, name: "Be careful with this one", body: "Underlined, and explained if you open it.", cls: "bg-warning" },
  { range: `${THRESHOLDS.high} – ${THRESHOLDS.max}`, name: "Hold on. This looks like a scam.", body: "The island stops you, with the reasons and a safe way to check.", cls: "bg-destructive" },
];

const SAFE = [
  ["Real websites count for nothing against you", "A link to onlinesbi.sbi, sbi.bank.in or amazon.in adds 0 — and stops “pretending to be” from firing."],
  ["A genuine OTP is not a request", "“482913 is your OTP… do not share” is capped at 5: delivering a code is not asking for one."],
  ["Talking about scams is not a scam", "News, fact-checks and bank safety pages only have the messages they quote scored, and never pop an alert."],
  ["Menus are labels, not messages", "Navigation like a bank’s “Update KYC” menu item is skipped."],
];

// Group a rule's words by script so each language reads as its own row.
const SCRIPTS: [string, (w: string) => boolean][] = [
  ["English & Hinglish", (w) => !/[ऀ-৿]/.test(w)],
  ["Hindi", (w) => /[ऀ-ॿ]/.test(w)],
  ["Assamese", (w) => /[ঀ-৿]/.test(w)],
];

const REAL_SITES = DIRECTORY.filter((e) => e.domains.length > 0);
const BRAND_WORDS = [...new Set(BRAND_TOKENS.map((t) => t.token))];

const chip = "rounded-full bg-subtle px-2.5 py-1 text-sm";
const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-4 py-3 align-top";

export default function ScoringPage() {
  return (
    <div className="container-page pb-28 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Scoring, in the open</p>
        <h1 className="mt-3 text-balance font-display text-[40px] font-semibold leading-[1.05] sm:text-[56px]">Every point, explained.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-secondary-fg">
          No black box. Each warning sign adds a fixed number of points; the total decides what you see. Same rules every time, checked on your device — AI never makes the call.
        </p>
      </div>

      <ScoreCalculator />

      <div className="mx-auto mt-24 max-w-5xl space-y-20">
        <section aria-labelledby="bands">
          <h2 id="bands" className="font-display text-[30px] font-semibold tracking-[-0.02em]">What the total means</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {BANDS.map((b) => (
              <div key={b.range} className="rounded-[22px] border border-border p-5">
                <div className="flex items-center gap-2"><span className={`size-3 rounded-full ${b.cls}`} aria-hidden /><span className="font-mono text-sm font-semibold">{b.range}</span></div>
                <p className="mt-3 text-[17px] font-semibold">{b.name}</p>
                <p className="mt-1 text-sm text-secondary-fg">{b.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">The total is capped at {THRESHOLDS.max}: the score shows how strong the evidence is, not a probability.</p>
        </section>

        <section aria-labelledby="words">
          <h2 id="words" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Warning signs in the words</h2>
          <p className="mt-2 max-w-2xl text-secondary-fg">Matched in English, Hinglish, Hindi and Assamese. Each sign counts once, however many times it appears.</p>
          <div className="mt-6 overflow-x-auto rounded-[22px] border border-border">
            <table className="w-full min-w-[720px] text-[15px]">
              <thead className="bg-subtle"><tr><th className={th}>Sign</th><th className={th}>Why it’s a warning</th><th className={th}>Examples that trigger it</th><th className={`${th} text-right`}>Points</th></tr></thead>
              <tbody className="divide-y divide-border">
                {[...RULES].sort((a, b) => b.weight - a.weight).map((r) => (
                  <tr key={r.kind}>
                    <td className={`${td} font-semibold`}>{r.title}</td>
                    <td className={`${td} text-secondary-fg`}>{r.detail}</td>
                    <td className={`${td} text-sm text-muted-foreground`}>{r.examples.map((e) => `“${e}”`).join(", ")}</td>
                    <td className={`${td} text-right font-mono font-semibold`}>+{r.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="wordlist">
          <h2 id="wordlist" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Every word we look for</h2>
          <p className="mt-2 max-w-2xl text-secondary-fg">
            The full list, read straight from the engine. Capital letters don’t matter, small words like “your” and “the” can be left out, ’ and &apos; count the same, and numbers can be any amount or time.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[...RULES].sort((a, b) => b.weight - a.weight).map((r) => (
              <div key={r.kind} className="rounded-[22px] border border-border p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[17px] font-semibold">{r.title}</h3>
                  <span className="font-mono font-semibold">+{r.weight}</span>
                </div>
                {SCRIPTS.map(([lang, inScript]) => {
                  const words = r.words.filter(inScript);
                  if (!words.length) return null;
                  return (
                    <div key={lang} className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{lang}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {words.map((w) => <li key={w} className={chip}>{w}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[22px] bg-subtle p-5 text-[15px]">
            <p className="font-semibold">What the word list can’t do</p>
            <p className="mt-1 text-secondary-fg">
              It matches phrases, not meaning. A scam that says the same thing in completely different words won’t trigger a phrase. That’s why links, QR codes and the pages they open are checked separately, by what they really are, not by how the message is worded.
            </p>
          </div>
        </section>

        <section aria-labelledby="links">
          <h2 id="links" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Links, QR codes and the pages they open</h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[22px] border border-border">
              <table className="w-full text-[15px]">
                <thead className="bg-subtle"><tr><th className={th}>Every link in the message</th><th className={`${th} text-right`}>Points</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {LINKS.map(([name, body, pts]) => (
                    <tr key={name}><td className={td}><p className="font-semibold">{name}</p><p className="mt-0.5 text-sm text-secondary-fg">{body}</p></td><td className={`${td} text-right font-mono font-semibold`}>+{pts}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-border">
              <table className="w-full text-[15px]">
                <thead className="bg-subtle"><tr><th className={th}>More evidence</th><th className={`${th} text-right`}>Points</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {EXTRA.map(([name, body, pts]) => (
                    <tr key={name}><td className={td}><p className="font-semibold">{name}</p><p className="mt-0.5 text-sm text-secondary-fg">{body}</p></td><td className={`${td} whitespace-nowrap text-right font-mono font-semibold`}>{pts}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="linklist">
          <h2 id="linklist" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Every link check</h2>
          <p className="mt-2 max-w-2xl text-secondary-fg">These run on your device, with no internet needed. Opening a link on our server is an extra step, only when you ask to check it.</p>

          <div className="mt-6 overflow-x-auto rounded-[22px] border border-border">
            <table className="w-full min-w-[560px] text-[15px]">
              <thead className="bg-subtle"><tr><th className={th}>Real websites we know</th><th className={th}>Their addresses</th></tr></thead>
              <tbody className="divide-y divide-border">
                {REAL_SITES.map((e) => (
                  <tr key={e.id}><td className={`${td} font-semibold`}>{e.name}</td><td className={`${td} font-mono text-sm text-secondary-fg`}>{e.domains.join(" · ")}</td></tr>
                ))}
                <tr><td className={`${td} font-semibold`}>Any government website</td><td className={`${td} font-mono text-sm text-secondary-fg`}>*.gov.in · *.nic.in</td></tr>
                <tr><td className={`${td} font-semibold`}>Any real Indian bank</td><td className={`${td} font-mono text-sm text-secondary-fg`}>*.bank.in (only banks can register it)</td></tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-border p-5">
              <h3 className="text-[17px] font-semibold">Brand names hidden in other addresses</h3>
              <p className="mt-1 text-sm text-secondary-fg">Found inside an address that isn’t theirs (sbi-kyc-verify.xyz), or one or two letters off (flipkartt.com): look-alike, +{LINK_WEIGHT.lookalike}.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">{BRAND_WORDS.map((w) => <li key={w} className={`${chip} font-mono`}>{w}</li>)}</ul>
            </div>
            <div className="rounded-[22px] border border-border p-5">
              <h3 className="text-[17px] font-semibold">Swapped characters</h3>
              <p className="mt-1 text-sm text-secondary-fg">Undone before comparing, so amaz0n.in and paytrn.com read as amazon and paytm.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">{SWAPS.map(([from, to]) => <li key={from} className={`${chip} font-mono`}>{from} → {to}</li>)}</ul>
            </div>
            <div className="rounded-[22px] border border-border p-5">
              <h3 className="text-[17px] font-semibold">Link shorteners</h3>
              <p className="mt-1 text-sm text-secondary-fg">They hide where a link really goes: +{LINK_WEIGHT.shortener}.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">{[...SHORTENERS].map((w) => <li key={w} className={`${chip} font-mono`}>{w}</li>)}</ul>
            </div>
            <div className="rounded-[22px] border border-border p-5">
              <h3 className="text-[17px] font-semibold">Cheap throwaway endings</h3>
              <p className="mt-1 text-sm text-secondary-fg">Seen again and again in Indian SMS scams: suspicious, +{LINK_WEIGHT.suspicious}.</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">{[...RISKY_TLDS].map((w) => <li key={w} className={`${chip} font-mono`}>.{w}</li>)}</ul>
            </div>
          </div>
          <div className="mt-4 rounded-[22px] bg-subtle p-5 text-[15px]">
            <p className="font-semibold">Also suspicious (+{LINK_WEIGHT.suspicious})</p>
            <p className="mt-1 text-secondary-fg">A bare number address like http://103.21.4.9 · letters from another alphabet that look like ours (addresses starting xn--) · a long address with two or more hyphens.</p>
          </div>
        </section>

        <section aria-labelledby="combos">
          <h2 id="combos" className="font-display text-[30px] font-semibold tracking-[-0.02em]">Combinations that make it worse</h2>
          <p className="mt-2 max-w-2xl text-secondary-fg">Some signs together are the shape of a scam, so each pair adds a bonus.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {COMBOS.map((c) => (
              <li key={c.label} className="flex items-start justify-between gap-4 rounded-[18px] border border-border p-4">
                <span className="text-[15px]">{c.label}</span><span className="font-mono font-semibold">+{c.points}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="safe">
          <h2 id="safe" className="font-display text-[30px] font-semibold tracking-[-0.02em]">What keeps real things from being flagged</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SAFE.map(([h, b]) => (
              <div key={h} className="rounded-[22px] bg-subtle p-5"><p className="font-semibold">{h}</p><p className="mt-1 text-sm text-secondary-fg">{b}</p></div>
            ))}
          </div>
        </section>

        <section aria-labelledby="why" className="rounded-[28px] bg-[#1c1b1a] p-8 text-white sm:p-10">
          <h2 id="why" className="font-display text-[28px] font-semibold tracking-[-0.02em]">Why rules, and not AI, decide</h2>
          <div className="mt-5 grid gap-6 text-[15px] leading-relaxed text-white/80 sm:grid-cols-3">
            <p><strong className="text-white">Explainable.</strong> Every point points at a word or a link you can see. Nobody has to trust a model’s hunch.</p>
            <p><strong className="text-white">Instant and private.</strong> It runs in milliseconds inside your browser, offline, without sending your messages anywhere.</p>
            <p><strong className="text-white">Testable.</strong> 32 automated tests pin the behaviour: every scam sample high risk, genuine OTPs and real websites safe.</p>
          </div>
          <p className="mt-6 text-sm text-white/60">AI still helps where it’s good: reading screenshots, translating into nine languages, and answering questions in plain words. <Link href="/privacy" className="underline">What leaves your device →</Link></p>
        </section>
      </div>
    </div>
  );
}
