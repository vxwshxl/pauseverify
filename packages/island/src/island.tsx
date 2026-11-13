"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUp, BadgeCheck, Clock, EyeOff, Gift, IndianRupee, KeyRound, Lock, MessageCircle, Phone, QrCode,
  ScanSearch, ShieldAlert, ShieldCheck, Siren, Smartphone, UserRound, Users, X, Link2, TriangleAlert,
} from "lucide-react";
import type { Analysis, Flag } from "@pv/engine";
import { HELP } from "@pv/engine";
import { SUGGESTIONS, localAnswer } from "./answers.ts";

export type IslandMode = "idle" | "scanning" | "alert" | "sheet";
export type IslandTheme = "light" | "dark" | "auto";

export interface IslandProps {
  analysis: Analysis | null;
  scanning?: boolean;
  /** Called when the user asks the island to look at part of the screen. */
  onLook?: () => void;
  /** Free-form question the offline answers can't handle (the AI layer plugs in here). */
  onAsk?: (question: string, analysis: Analysis) => Promise<string | null>;
  onDismiss?: () => void;
  /** Where the island is watching, for the idle line: "this page", "this message". */
  context?: string;
  /** Position inside a relatively positioned parent instead of the viewport. */
  inline?: boolean;
  theme?: IslandTheme;
  /** Start opened (marketing screenshots, tests). */
  initialMode?: IslandMode;
}

const FLAG_ICON: Record<Flag["kind"], typeof Clock> = {
  urgency: Clock,
  threat: Siren,
  credentials: KeyRound,
  payment: IndianRupee,
  reward: Gift,
  secrecy: EyeOff,
  remote_access: Smartphone,
  family: Users,
  unofficial_contact: MessageCircle,
  impersonation: UserRound,
  qr_payment: QrCode,
};

const SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;
const RADIUS: Record<IslandMode, number> = { idle: 30, scanning: 30, alert: 24, sheet: 28 };

export function Island({ analysis, scanning, onLook, onAsk, onDismiss, context = "this page", inline, theme = "auto", initialMode }: IslandProps) {
  const [mode, setMode] = useState<IslandMode>(initialMode ?? "idle");
  const lastAnalysis = useRef<Analysis | null>(null);

  // A new risky result opens the alert; a clean one settles back to the pill.
  useEffect(() => {
    if (scanning) return setMode("scanning");
    if (analysis && analysis !== lastAnalysis.current) {
      lastAnalysis.current = analysis;
      setMode(initialMode && initialMode !== "idle" ? initialMode : analysis.level === "safe" ? "idle" : "alert");
    } else if (!analysis) setMode((m) => (m === "scanning" ? "idle" : m));
  }, [analysis, scanning, initialMode]);

  useEffect(() => {
    if (mode !== "sheet") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode(analysis?.level === "safe" ? "idle" : "alert");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, analysis]);

  const close = () => {
    setMode("idle");
    onDismiss?.();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="pv-root" data-theme={theme}>
        <div className="pv-dock" data-inline={inline ? "true" : "false"}>
          <motion.div
            layout
            initial={false}
            transition={SPRING}
            className="pv-shell"
            data-mode={mode}
            style={{ borderRadius: RADIUS[mode] }}
            role={mode === "sheet" ? "dialog" : "region"}
            aria-label="Pause & Verify"
            aria-live="polite"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, delay: 0.06 } }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
              >
                {mode === "scanning" && <Scanning />}
                {mode === "idle" && <Pill analysis={analysis} context={context} onLook={onLook} onOpen={() => analysis && setMode("sheet")} />}
                {mode === "alert" && analysis && <Alert analysis={analysis} onWhy={() => setMode("sheet")} onClose={close} onLook={onLook} />}
                {mode === "sheet" && analysis && <Sheet analysis={analysis} onAsk={onAsk} onLook={onLook} onClose={() => setMode(analysis.level === "safe" ? "idle" : "alert")} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}

function Mark() {
  return (
    <span className="pv-mark" aria-hidden>
      <span><i /><i /></span>
    </span>
  );
}

function Pill({ analysis, context, onLook, onOpen }: { analysis: Analysis | null; context: string; onLook?: () => void; onOpen: () => void }) {
  const level = analysis?.level ?? "safe";
  const sub = !analysis ? `Watching ${context}` : level === "safe" ? `Checked · ${analysis.summary.toLowerCase()}` : analysis.summary;
  return (
    <div className="pv-pill">
      <button type="button" onClick={onOpen} className="pv-pill" style={{ height: "auto", padding: 0 }} aria-label={analysis ? "Open the last check" : "Pause & Verify"}>
        <Mark />
        <span className="pv-pill-text">
          <span className="pv-pill-title">Pause &amp; Verify</span>
          <span className="pv-pill-sub"><span className="pv-dot" data-level={level} />{sub}</span>
        </span>
      </button>
      {onLook && (
        <button type="button" className="pv-round" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen">
          <ScanSearch />
        </button>
      )}
    </div>
  );
}

function Scanning() {
  return (
    <div className="pv-scan">
      <span className="pv-spinner" aria-hidden />
      Checking…
    </div>
  );
}

function LevelIcon({ level }: { level: Analysis["level"] }) {
  return level === "high" ? <ShieldAlert /> : level === "caution" ? <TriangleAlert /> : <ShieldCheck />;
}

function Alert({ analysis, onWhy, onClose, onLook }: { analysis: Analysis; onWhy: () => void; onClose: () => void; onLook?: () => void }) {
  return (
    <div className="pv-alert">
      <div className="pv-alert-head">
        <span className="pv-badge-icon" data-level={analysis.level}><LevelIcon level={analysis.level} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pv-alert-title">{analysis.headline}</p>
          <p className="pv-alert-sub"><span className="pv-dot" data-level={analysis.level} data-pulse={analysis.level === "high"} style={{ display: "inline-block", marginRight: 6 }} />{analysis.summary}</p>
        </div>
        {onLook && <button type="button" className="pv-icon-btn" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen"><ScanSearch /></button>}
        <button type="button" className="pv-icon-btn" onClick={onClose} aria-label="Dismiss"><X /></button>
      </div>
      <div className="pv-actions">
        <button type="button" className="pv-btn pv-btn-primary pv-btn-block" onClick={onWhy}>Show me why</button>
        {analysis.level === "high" && (
          <a className="pv-btn pv-btn-secondary" href={`tel:${HELP.helpline}`} style={{ textDecoration: "none" }}><Phone />Call {HELP.helpline}</a>
        )}
      </div>
    </div>
  );
}

type Msg = { from: "me" | "pv"; text: string };

function Sheet({ analysis, onAsk, onLook, onClose }: { analysis: Analysis; onAsk?: IslandProps["onAsk"]; onLook?: () => void; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const filled = Math.max(1, Math.round(analysis.score / 10));
  const e = analysis.claimedEntity;
  const levelLabel = analysis.level === "high" ? "High risk" : analysis.level === "caution" ? "Be careful" : "Looks safe";
  const riskyLinks = analysis.links.filter((l) => l.verdict !== "official");
  const officialLinks = analysis.links.filter((l) => l.verdict === "official");

  useEffect(() => {
    if (msgs.length) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, thinking]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    setDraft("");
    setMsgs((m) => [...m, { from: "me", text: question }]);
    setThinking(true);
    let answer = localAnswer(question, analysis);
    if (!answer && onAsk) answer = await onAsk(question, analysis).catch(() => null);
    await new Promise((r) => setTimeout(r, answer ? 450 : 250));
    setThinking(false);
    setMsgs((m) => [...m, { from: "pv", text: answer ?? "I can help with whether this is real, what to do if you clicked or paid, and how to report it. Try one of the questions above." }]);
  }

  return (
    <div className="pv-sheet">
      <div className="pv-sheet-head">
        <Mark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pv-pill-title">Pause &amp; Verify</div>
          <div className="pv-pill-sub">Checked on your device</div>
        </div>
        {onLook && <button type="button" className="pv-icon-btn" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen"><ScanSearch /></button>}
        <button type="button" className="pv-icon-btn" onClick={onClose} aria-label="Close"><X /></button>
      </div>

      <div className="pv-sheet-scroll" ref={scroller}>
        <span className="pv-chip" data-level={analysis.level}><LevelIcon level={analysis.level} />{levelLabel}</span>
        <p className="pv-lead">{analysis.headline}</p>
        <div className="pv-risk" style={{ marginTop: 16 }}>
          <div className="pv-risk-score">{analysis.score}<small> /100</small></div>
          <div className="pv-meter" data-level={analysis.level} aria-label={`Risk ${analysis.score} out of 100`}>
            {Array.from({ length: 10 }, (_, i) => <i key={i} data-on={i < filled} />)}
          </div>
        </div>

        {analysis.flags.length > 0 && (
          <>
            <h3 className="pv-h">Why this is suspicious</h3>
            <ul className="pv-flags">
              {analysis.flags.map((f) => {
                const Icon = FLAG_ICON[f.kind];
                const quote = f.spans[0]?.text;
                return (
                  <li key={f.kind} className="pv-flag">
                    <span className="pv-flag-icon"><Icon /></span>
                    <div>
                      <p className="pv-flag-title">{f.title}</p>
                      <p className="pv-flag-detail">{f.detail}</p>
                      {quote && f.kind !== "impersonation" && <span className="pv-quote">“{quote.trim()}”</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {(riskyLinks.length > 0 || officialLinks.length > 0) && (
          <>
            <h3 className="pv-h">{riskyLinks.length ? "The link" : "Links"}</h3>
            {[...riskyLinks, ...officialLinks].map((l) => (
              <div key={l.url + l.span.start} className="pv-link">
                <span className="pv-badge-icon" data-level={l.verdict === "official" ? "safe" : l.verdict === "unknown" ? "caution" : "high"} style={{ width: 36, height: 36, borderRadius: 12 }}>
                  {l.verdict === "official" ? <BadgeCheck /> : <Link2 />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="pv-link-domain">{l.domain}</div>
                  <p className="pv-link-reason">{l.reason}</p>
                </div>
              </div>
            ))}
          </>
        )}

        <h3 className="pv-h">{analysis.level === "safe" ? "Good habits" : "Check it safely"}</h3>
        <ol className="pv-steps">
          {analysis.steps.map((s) => <li key={s} className="pv-step">{s}</li>)}
        </ol>

        {e?.reviewed && (e.site || e.app) && (
          <div className="pv-verify">
            <BadgeCheck className="pv-verify-icon" size={24} />
            <div>
              <p className="pv-verify-title">Official {e.name}</p>
              <p className="pv-verify-sub">{[e.app && `App: ${e.app}`, e.site && `Website: ${e.site}`].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        )}

        <div className="pv-note">
          <Lock />
          <span><strong>Never share your OTP, PIN or passwords.</strong> No bank, police officer or company will ever ask for them.</span>
        </div>

        <h3 className="pv-h">Ask me</h3>
        <div className="pv-chat">
          {msgs.length === 0 && (
            <div className="pv-suggest">
              {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`pv-bubble ${m.from === "me" ? "pv-bubble-me" : "pv-bubble-pv"}`}>
              {m.text}
            </motion.div>
          ))}
          {thinking && <div className="pv-bubble pv-bubble-pv" aria-label="Typing"><span className="pv-spinner" style={{ width: 14, height: 14, display: "inline-block" }} /></div>}
          {msgs.length > 0 && !thinking && (
            <div className="pv-suggest">
              {SUGGESTIONS.filter((s) => !msgs.some((m) => m.text === s)).slice(0, 3).map((s) => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}
            </div>
          )}
        </div>
      </div>

      <form className="pv-compose" onSubmit={(ev) => { ev.preventDefault(); ask(draft); }}>
        <input value={draft} onChange={(ev) => setDraft(ev.target.value)} placeholder="Ask about this message…" aria-label="Ask about this message" />
        <button type="submit" className="pv-round" aria-label="Send" disabled={!draft.trim()} style={{ opacity: draft.trim() ? 1 : 0.35 }}><ArrowUp /></button>
      </form>
      {analysis.level === "high" && (
        <div className="pv-foot">
          <a className="pv-btn pv-btn-danger pv-btn-block" href={`tel:${HELP.helpline}`} style={{ textDecoration: "none" }}><Phone />Lost money? Call {HELP.helpline}</a>
        </div>
      )}
    </div>
  );
}
