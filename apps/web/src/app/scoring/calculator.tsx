"use client";
import { useMemo, useState } from "react";
import { analyze, SAMPLES, THRESHOLDS, type ScorePart } from "@pv/engine";
import { Highlighted } from "@pv/island";

const EXAMPLES: { label: string; text: string }[] = [
  { label: "Bank “account blocked”", text: SAMPLES.find((s) => s.id === "sbi-kyc")!.text },
  { label: "Power cut tonight", text: SAMPLES.find((s) => s.id === "power-cut")!.text },
  { label: "Part-time job", text: SAMPLES.find((s) => s.id === "job-task")!.text },
  { label: "“New number” family", text: SAMPLES.find((s) => s.id === "new-number")!.text },
  { label: "Look-alike link only", text: "amaz0n-refunds.in/claim" },
  { label: "Real SBI OTP", text: SAMPLES.find((s) => s.id === "sbi-otp")!.text },
];

const KIND: Record<ScorePart["kind"], { tag: string; cls: string }> = {
  sign: { tag: "Sign", cls: "bg-brand-subtle text-brand" },
  link: { tag: "Link", cls: "bg-[#FDF0DC] text-[#8A5300]" },
  combo: { tag: "Combo", cls: "bg-[#1c1b1a] text-white" },
  adjust: { tag: "Cap", cls: "bg-subtle text-muted-foreground" },
};

const LEVEL = {
  high: { name: "Hold on — high risk", dot: "bg-destructive", text: "text-destructive" },
  caution: { name: "Be careful", dot: "bg-warning", text: "text-[#8A5300]" },
  safe: { name: "Nothing worrying", dot: "bg-success", text: "text-success" },
} as const;

/** Paste anything and watch the engine add up the points — the same code the extension runs. */
export function ScoreCalculator() {
  const [text, setText] = useState(EXAMPLES[0]!.text);
  const a = useMemo(() => analyze({ text }), [text]);
  const raw = a.breakdown.filter((p) => p.kind !== "adjust").reduce((s, p) => s + p.points, 0);
  const lv = LEVEL[a.level];

  return (
    <section aria-label="Try the scoring" className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="rounded-[24px] border border-border bg-background p-5 shadow-float">
        <label htmlFor="score-msg" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">A message to score</label>
        <textarea id="score-msg" value={text} onChange={(e) => setText(e.target.value)} rows={6}
          className="mt-3 block w-full resize-none rounded-2xl border border-border bg-subtle p-4 text-[15px] leading-relaxed outline-none focus:border-border-strong" />
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" onClick={() => setText(ex.text)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-[120ms] ${text === ex.text ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
              {ex.label}
            </button>
          ))}
        </div>
        {text.trim() && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What it found, marked</p>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.8]"><Highlighted text={text} analysis={a} /></p>
          </div>
        )}
      </div>

      <div className="rounded-[24px] border border-border bg-background p-5 shadow-float">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Score</p>
            <p className="mt-1 font-display text-[56px] font-semibold leading-none tracking-[-0.03em]">{a.score}<span className="text-2xl text-muted-foreground">/{THRESHOLDS.max}</span></p>
          </div>
          <span className={`mb-1 inline-flex items-center gap-2 rounded-full bg-subtle px-3.5 py-1.5 text-sm font-semibold ${lv.text}`}>
            <span className={`size-2.5 rounded-full ${lv.dot}`} aria-hidden />{lv.name}
          </span>
        </div>

        {/* The scale: where the thresholds sit */}
        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-subtle" aria-hidden>
          <div className="absolute inset-y-0 left-0 bg-success/25" style={{ width: `${(THRESHOLDS.caution / THRESHOLDS.max) * 100}%` }} />
          <div className="absolute inset-y-0 bg-warning/30" style={{ left: `${(THRESHOLDS.caution / THRESHOLDS.max) * 100}%`, width: `${((THRESHOLDS.high - THRESHOLDS.caution) / THRESHOLDS.max) * 100}%` }} />
          <div className="absolute inset-y-0 right-0 bg-destructive/20" style={{ left: `${(THRESHOLDS.high / THRESHOLDS.max) * 100}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-300" style={{ width: `${Math.max(2, (a.score / THRESHOLDS.max) * 100)}%`, opacity: 0.85 }} />
        </div>
        <div className="relative mt-1.5 h-4 text-xs text-muted-foreground">
          <span className="absolute left-0">0</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(THRESHOLDS.caution / THRESHOLDS.max) * 100}%` }}>{THRESHOLDS.caution} careful</span>
          <span className="absolute -translate-x-1/2" style={{ left: `${(THRESHOLDS.high / THRESHOLDS.max) * 100}%` }}>{THRESHOLDS.high} stop</span>
          <span className="absolute right-0">{THRESHOLDS.max}</span>
        </div>

        <ol className="mt-6 divide-y divide-border border-y border-border">
          {a.breakdown.length === 0 && <li className="py-4 text-secondary-fg">No warning signs — 0 points.</li>}
          {a.breakdown.map((p, i) => (
            <li key={i} className="flex items-start gap-3 py-3">
              <span className={`mt-0.5 w-14 flex-none rounded-full px-2 py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide ${KIND[p.kind].cls}`}>{KIND[p.kind].tag}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium leading-snug">{p.label}</p>
                {p.quote && <p className="mt-0.5 truncate text-sm text-muted-foreground">“{p.quote}”</p>}
              </div>
              <span className={`flex-none font-mono text-[15px] font-semibold tabular-nums ${p.points < 0 ? "text-muted-foreground" : ""}`}>{p.points > 0 ? `+${p.points}` : p.points}</span>
            </li>
          ))}
        </ol>
        {a.breakdown.length > 0 && (
          <p className="mt-3 flex justify-between text-sm text-secondary-fg">
            <span>{raw !== a.score ? `${raw} points, capped at ${a.score}` : "Total"}</span>
            <span className="font-mono font-semibold text-foreground">= {a.score}</span>
          </p>
        )}
        {a.aboutScams && <p className="mt-3 rounded-xl bg-subtle p-3 text-sm text-secondary-fg">This reads as advice or news <em>about</em> scams, so only the messages it quotes are scored.</p>}
      </div>
    </section>
  );
}
