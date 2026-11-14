"use client";
import { useEffect, useMemo, useState } from "react";
import { Cpu, Database, EyeOff, Lock, LockOpen } from "lucide-react";
import { analyze, mask } from "@pv/engine";

const SAMPLE =
  "Dear customer, your SBI account will be blocked today. Share the OTP 482913 sent to 98230 01452 or reply with your card 4111 1111 1111 1111 to ravi.kumar@gmail.com. Pay ₹5,000 to unblock.";
const QUESTION = "I shared my OTP 482913, what do I do now?";
const MASK_TOKEN = /(\[(?:code|phone number|number|email)\])/g;
const IS_MASK = /^\[(?:code|phone number|number|email)\]$/;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** The exact shape the island sends to /api/chat (see packages/island/src/services.ts). */
function payloadFor(text: string) {
  const a = analyze({ text });
  return {
    analysis: a,
    json: JSON.stringify(
      {
        question: mask(QUESTION),
        lang: "en",
        context: {
          message: mask(text).slice(0, 1500),
          level: a.level,
          flags: a.flags.map((f) => f.title),
          links: a.links.map((l) => `${l.domain} (${l.verdict})`),
          claimed: a.claimedEntity?.name,
        },
      },
      null,
      2,
    ),
  };
}

type Sealed = { cipher: string; iv: string; key: string; plain: string };

/**
 * An illustration of encryption in transit, made in your browser with AES-256-GCM (a cipher TLS
 * uses). The real request is protected by HTTPS; this shows what that looks like from outside.
 */
async function seal(plain: string): Promise<Sealed> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const raw = await crypto.subtle.exportKey("raw", key);
  const back = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return { cipher: b64(cipher), iv: b64(iv), key: b64(raw), plain: new TextDecoder().decode(back) };
}

export function PrivacyDemo() {
  const [text, setText] = useState(SAMPLE);
  const [sealed, setSealed] = useState<Sealed | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const { analysis, json } = useMemo(() => payloadFor(text), [text]);
  const bytes = new TextEncoder().encode(json).length;
  const hidden = (json.match(MASK_TOKEN) ?? []).length;

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => seal(json).then((s) => live && setSealed(s)), 200);
    return () => { live = false; clearTimeout(t); };
  }, [json]);

  return (
    <section aria-label="See what leaves your device" className="mx-auto mt-12 max-w-6xl">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* 1 · On the device */}
        <Step n={1} icon={Cpu} title="On your device" note="Checked instantly, in your browser · 0 bytes sent">
          <label htmlFor="pv-privacy-msg" className="sr-only">A message to check</label>
          <textarea id="pv-privacy-msg" value={text} onChange={(e) => setText(e.target.value)} rows={8}
            className="block w-full resize-none rounded-2xl border border-border bg-subtle p-4 text-[15px] leading-relaxed outline-none focus:border-border-strong" />
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className={`size-2.5 rounded-full ${analysis.level === "high" ? "bg-destructive" : analysis.level === "caution" ? "bg-warning" : "bg-success"}`} aria-hidden />
            <span className="font-medium">{analysis.headline}</span>
            <span className="text-muted-foreground">{analysis.flags.length} signs</span>
          </div>
        </Step>

        {/* 2 · Masked */}
        <Step n={2} icon={EyeOff} title="What we send — only if you ask" note={`${hidden} private detail${hidden === 1 ? "" : "s"} masked · ${bytes.toLocaleString("en-IN")} bytes`}>
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-[#1c1b1a] p-4 font-mono text-[12.5px] leading-relaxed text-[#e9e4df]">
            {json.split(MASK_TOKEN).map((part, i) =>
              IS_MASK.test(part) ? <mark key={i} className="rounded bg-brand px-1 text-white">{part}</mark> : <span key={i}>{part}</span>,
            )}
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">Asked: “{QUESTION}” — the OTP in the question is masked too.</p>
        </Step>

        {/* 3 · Encrypted in transit */}
        <Step n={3} icon={unlocked ? LockOpen : Lock} title="What the internet sees" note="HTTPS (TLS) on every request">
          <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-[#1c1b1a] p-4 font-mono text-[12.5px] leading-relaxed text-[#9fd9b5]">
            {unlocked ? sealed?.plain : sealed ? sealed.cipher : "Encrypting…"}
          </pre>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setUnlocked((u) => !u)} disabled={!sealed}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium hover:border-foreground disabled:opacity-40">
              {unlocked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}{unlocked ? "Lock it again" : "Unlock with the key"}
            </button>
            <span className="truncate font-mono text-xs text-muted-foreground" title="A fresh random key, made in your browser">key {sealed?.key.slice(0, 16)}…</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            An illustration made in your browser with AES-256-GCM, a cipher TLS uses. Without the key it’s noise; our server holds the
            other end of the real HTTPS connection.
          </p>
        </Step>
      </div>

      {/* 4 · Kept */}
      <div className="mt-4 flex flex-col items-start gap-4 rounded-[24px] border border-border bg-background p-5 sm:flex-row sm:items-center">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-subtle"><Database className="size-5 text-brand" strokeWidth={1.75} /></span>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">4 · What we keep</p>
          <p className="mt-1 text-[17px] font-semibold">Nothing. The answer comes back, and the request is gone.</p>
        </div>
        <p className="max-w-sm text-sm text-secondary-fg">No account, no database, no message history — and the extension stores only your on/off and language settings.</p>
      </div>
    </section>
  );
}

function Step({ n, icon: Icon, title, note, children }: { n: number; icon: typeof Cpu; title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-[24px] border border-border bg-background p-5 shadow-float">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white">{n}</span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[16px] font-semibold"><Icon className="size-4 text-brand" strokeWidth={2} />{title}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
