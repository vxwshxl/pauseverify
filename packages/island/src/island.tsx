"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUp, BadgeCheck, Clock, Eye, EyeOff, Gift, IndianRupee, KeyRound, Lock, MessageCircle, Phone, QrCode,
  ScanSearch, ShieldAlert, ShieldCheck, Siren, Smartphone, UserRound, Users, X, Link2, TriangleAlert, Volume2, Square,
} from "lucide-react";
import type { Analysis, Flag, Lang } from "@pv/engine";
import { HELP } from "@pv/engine";
import { SUGGESTIONS, localAnswer } from "./answers.ts";

export type IslandMode = "idle" | "scanning" | "alert" | "sheet";

export interface IslandProps {
  analysis: Analysis | null;
  scanning?: boolean;
  /** Called when the user asks the island to look at part of the screen. */
  onLook?: () => void;
  /** Free-form questions the offline answers can't handle (AI). Reply in `lang`. */
  onAsk?: (question: string, analysis: Analysis, lang: Lang) => Promise<string | null>;
  /** English → `lang`. When absent, the language picker is hidden. */
  translate?: (texts: string[], lang: Lang) => Promise<string[]>;
  /** Reads text aloud in `lang`; resolves when playback ends. */
  speak?: (text: string, lang: Lang) => Promise<void>;
  stopSpeaking?: () => void;
  onDismiss?: () => void;
  /** Where the island is watching, for the idle line: "this page", "this message". */
  context?: string;
  /** Position inside a relatively positioned parent instead of the viewport. */
  inline?: boolean;
  /** Start opened (marketing screenshots, tests). */
  initialMode?: IslandMode;
  lang?: Lang;
  onLangChange?: (lang: Lang) => void;
  /** The person asked for this check, so show the result even when it's safe. */
  alwaysAlert?: boolean;
}

export const LANG_NAMES: Record<Lang, string> = { en: "English", as: "অসমীয়া", brx: "बड़ो", hi: "हिन्दी" };

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

// Interface strings, translated with everything else when another language is picked.
const UI = [
  "Pause & Verify", "Show me why", "High risk", "Be careful", "Looks safe", "Why this is suspicious", "The link", "Links",
  "Check it safely", "Good habits", "Ask me", "What I see", "Checked on your device", "Never share your OTP, PIN or passwords.",
  "No bank, police officer or company will ever ask for them.", "Lost money? Call 1930", "Call 1930", "Ask about this message…",
  "Read aloud", "Stop", "Checking…", "Translating…", ...SUGGESTIONS,
];

// ── Translation: one shared cache, so the alert, sheet and chat never re-ask ─────────
const tcache = new Map<string, string>();
type TFn = (s: string) => string;
const TCtx = createContext<{ t: TFn; lang: Lang; loading: boolean }>({ t: (s) => s, lang: "en", loading: false });
const useT = () => useContext(TCtx);

function collect(a: Analysis | null): string[] {
  if (!a) return UI;
  return [
    ...UI, a.headline, a.summary, a.seen ?? "", ...a.steps,
    ...a.flags.flatMap((f) => [f.title, f.detail]),
    ...a.links.map((l) => l.reason),
  ].filter(Boolean);
}

function useTranslations(lang: Lang, strings: string[], translate?: IslandProps["translate"]) {
  const [, bump] = useState(0);
  const [loading, setLoading] = useState(false);
  const key = `${lang}\u0001${strings.join("\u0001")}`;
  useEffect(() => {
    if (lang === "en" || !translate) return;
    const missing = [...new Set(strings)].filter((s) => !tcache.has(`${lang}:${s}`));
    if (!missing.length) return;
    let live = true;
    setLoading(true);
    translate(missing, lang)
      .then((out) => missing.forEach((s, i) => tcache.set(`${lang}:${s}`, out[i] || s)))
      .catch(() => {})
      .finally(() => {
        if (!live) return;
        setLoading(false);
        bump((n) => n + 1);
      });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures lang + strings
  }, [key, translate]);
  const t: TFn = (s) => (lang === "en" ? s : tcache.get(`${lang}:${s}`) ?? s);
  return { t, loading };
}

export function Island(props: IslandProps) {
  const { analysis, scanning, onLook, onDismiss, context = "this page", inline, initialMode, translate } = props;
  const [mode, setMode] = useState<IslandMode>(initialMode ?? "idle");
  const [lang, setLangState] = useState<Lang>(props.lang ?? "en");
  const lastAnalysis = useRef<Analysis | null>(null);
  const strings = useMemo(() => collect(analysis), [analysis]);
  const { t, loading } = useTranslations(lang, strings, translate);

  useEffect(() => { if (props.lang) setLangState(props.lang); }, [props.lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    props.onLangChange?.(l);
  };

  // A new risky result opens the alert; a clean one settles back to the pill.
  useEffect(() => {
    if (scanning) return setMode("scanning");
    if (analysis && analysis !== lastAnalysis.current) {
      lastAnalysis.current = analysis;
      setMode(initialMode && initialMode !== "idle" ? initialMode : analysis.level === "safe" && !props.alwaysAlert ? "idle" : "alert");
    } else if (!analysis) setMode((m) => (m === "scanning" ? "idle" : m));
  }, [analysis, scanning, initialMode, props.alwaysAlert]);

  useEffect(() => {
    if (mode !== "sheet") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMode(analysis?.level === "safe" ? "idle" : "alert");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, analysis]);

  const close = () => {
    props.stopSpeaking?.();
    setMode("idle");
    onDismiss?.();
  };

  return (
    <TCtx.Provider value={{ t, lang, loading }}>
      <MotionConfig reducedMotion="user">
        <div className="pv-root" lang={lang}>
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
                  {mode === "sheet" && analysis && (
                    <Sheet
                      {...props}
                      analysis={analysis}
                      setLang={setLang}
                      onClose={() => {
                        props.stopSpeaking?.();
                        setMode(analysis.level === "safe" ? "idle" : "alert");
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </MotionConfig>
    </TCtx.Provider>
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
  const { t } = useT();
  const level = analysis?.level ?? "safe";
  const sub = !analysis ? `Watching ${context}` : level === "safe" ? t(analysis.summary) : t(analysis.summary);
  return (
    <div className="pv-pill">
      <button type="button" onClick={onOpen} className="pv-pill-main" aria-label={analysis ? "Open the last check" : "Pause & Verify"}>
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
  const { t } = useT();
  return (
    <div className="pv-scan">
      <span className="pv-spinner" aria-hidden />
      {t("Checking…")}
    </div>
  );
}

function LevelIcon({ level }: { level: Analysis["level"] }) {
  return level === "high" ? <ShieldAlert /> : level === "caution" ? <TriangleAlert /> : <ShieldCheck />;
}

function Alert({ analysis, onWhy, onClose, onLook }: { analysis: Analysis; onWhy: () => void; onClose: () => void; onLook?: () => void }) {
  const { t } = useT();
  return (
    <div className="pv-alert">
      <div className="pv-alert-head">
        <span className="pv-badge-icon" data-level={analysis.level}><LevelIcon level={analysis.level} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="pv-alert-title">{t(analysis.headline)}</p>
          <p className="pv-alert-sub"><span className="pv-dot" data-level={analysis.level} data-pulse={analysis.level === "high"} style={{ display: "inline-block", marginRight: 6 }} />{t(analysis.summary)}</p>
        </div>
        {onLook && <button type="button" className="pv-icon-btn" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen"><ScanSearch /></button>}
        <button type="button" className="pv-icon-btn" onClick={onClose} aria-label="Dismiss"><X /></button>
      </div>
      <div className="pv-actions">
        <button type="button" className="pv-btn pv-btn-primary pv-btn-block" onClick={onWhy}>{t("Show me why")}</button>
        {analysis.level === "high" && (
          <a className="pv-btn pv-btn-secondary" href={`tel:${HELP.helpline}`} style={{ textDecoration: "none" }}><Phone />{t("Call 1930")}</a>
        )}
      </div>
    </div>
  );
}

type Msg = { from: "me" | "pv"; text: string };

function Sheet({ analysis, onAsk, onLook, onClose, translate, speak, stopSpeaking, setLang }: IslandProps & { analysis: Analysis; onClose: () => void; setLang: (l: Lang) => void }) {
  const { t, lang, loading } = useT();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
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
    setMsgs((m) => [...m, { from: "me", text: SUGGESTIONS.includes(question) ? t(question) : question }]);
    setThinking(true);
    // Suggestion chips get instant, offline answers. Anything typed goes to the AI helper,
    // which reads the actual question; the offline answers are only its fallback.
    const chip = SUGGESTIONS.includes(question);
    let answer: string | null = null;
    if (!chip && onAsk) answer = await onAsk(question, analysis, lang).catch(() => null);
    if (!answer) {
      const local = chip || lang === "en" ? localAnswer(question, analysis) : null;
      if (local) answer = lang === "en" || !translate ? local : (await translate([local], lang).catch(() => [local]))[0] ?? local;
    }
    await new Promise((r) => setTimeout(r, 300));
    setThinking(false);
    const fallback = "I can help with whether this is real, what to do if you clicked or paid, and how to report it. Try one of the questions above.";
    setMsgs((m) => [...m, { from: "pv", text: answer ?? t(fallback) }]);
  }

  async function readAloud() {
    if (!speak) return;
    if (speaking) {
      stopSpeaking?.();
      setSpeaking(false);
      return;
    }
    const parts = [t(analysis.headline), ...analysis.flags.slice(0, 3).map((f) => t(f.title)), ...analysis.steps.slice(0, 4).map(t)];
    setSpeaking(true);
    await speak(parts.join(". ").replace(/\.\./g, "."), lang).catch(() => {});
    setSpeaking(false);
  }

  return (
    <div className="pv-sheet">
      <div className="pv-sheet-head">
        <Mark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pv-pill-title">Pause &amp; Verify</div>
          <div className="pv-pill-sub">{loading ? t("Translating…") : t("Checked on your device")}</div>
        </div>
        {speak && (
          <button type="button" className="pv-icon-btn" onClick={readAloud} aria-pressed={speaking} aria-label={speaking ? t("Stop") : t("Read aloud")} title={speaking ? t("Stop") : t("Read aloud")} data-active={speaking}>
            {speaking ? <Square /> : <Volume2 />}
          </button>
        )}
        {onLook && <button type="button" className="pv-icon-btn" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen"><ScanSearch /></button>}
        <button type="button" className="pv-icon-btn" onClick={onClose} aria-label="Close"><X /></button>
      </div>

      {translate && (
        <div className="pv-langs" role="radiogroup" aria-label="Language">
          {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} lang={l} onClick={() => setLang(l)}>{LANG_NAMES[l]}</button>
          ))}
        </div>
      )}

      <div className="pv-sheet-scroll" ref={scroller} data-loading={loading}>
        <span className="pv-chip" data-level={analysis.level}><LevelIcon level={analysis.level} />{t(levelLabel)}</span>
        <p className="pv-lead">{t(analysis.headline)}</p>
        <div className="pv-risk" style={{ marginTop: 16 }}>
          <div className="pv-risk-score">{analysis.score}<small> /100</small></div>
          <div className="pv-meter" data-level={analysis.level} aria-label={`Risk ${analysis.score} out of 100`}>
            {Array.from({ length: 10 }, (_, i) => <i key={i} data-on={i < filled} />)}
          </div>
        </div>

        {analysis.seen && (
          <>
            <h3 className="pv-h">{t("What I see")}</h3>
            <div className="pv-seen"><Eye /><span>{t(analysis.seen)}</span></div>
          </>
        )}

        {analysis.flags.length > 0 && (
          <>
            <h3 className="pv-h">{t("Why this is suspicious")}</h3>
            <ul className="pv-flags">
              {analysis.flags.map((f) => {
                const Icon = FLAG_ICON[f.kind];
                const quote = f.spans[0]?.text;
                return (
                  <li key={f.kind} className="pv-flag">
                    <span className="pv-flag-icon"><Icon /></span>
                    <div>
                      <p className="pv-flag-title">{t(f.title)}</p>
                      <p className="pv-flag-detail">{t(f.detail)}</p>
                      {quote && f.kind !== "impersonation" && <span className="pv-quote" lang="en">“{quote.trim()}”</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {(riskyLinks.length > 0 || officialLinks.length > 0) && (
          <>
            <h3 className="pv-h">{t(riskyLinks.length ? "The link" : "Links")}</h3>
            {[...riskyLinks, ...officialLinks].map((l) => (
              <div key={l.url + l.span.start} className="pv-link">
                <span className="pv-badge-icon" data-level={l.verdict === "official" ? "safe" : l.verdict === "unknown" ? "caution" : "high"} style={{ width: 36, height: 36, borderRadius: 12 }}>
                  {l.verdict === "official" ? <BadgeCheck /> : <Link2 />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="pv-link-domain" lang="en">{l.domain}</div>
                  <p className="pv-link-reason">{t(l.reason)}</p>
                </div>
              </div>
            ))}
          </>
        )}

        <h3 className="pv-h">{t(analysis.level === "safe" ? "Good habits" : "Check it safely")}</h3>
        <ol className="pv-steps">
          {analysis.steps.map((s) => <li key={s} className="pv-step">{t(s)}</li>)}
        </ol>

        {e?.reviewed && (e.site || e.app) && (
          <div className="pv-verify">
            <BadgeCheck className="pv-verify-icon" size={24} />
            <div>
              <p className="pv-verify-title">{e.name}</p>
              <p className="pv-verify-sub" lang="en">{[e.app && `App: ${e.app}`, e.site && `Website: ${e.site}`].filter(Boolean).join(" · ")}</p>
              <p className="pv-verify-by">From our checked list · {e.reviewed.by}, {e.reviewed.on}</p>
            </div>
          </div>
        )}

        <div className="pv-note">
          <Lock />
          <span><strong>{t("Never share your OTP, PIN or passwords.")}</strong> {t("No bank, police officer or company will ever ask for them.")}</span>
        </div>

        <h3 className="pv-h">{t("Ask me")}</h3>
        <div className="pv-chat">
          {msgs.length === 0 && (
            <div className="pv-suggest">
              {SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => ask(s)}>{t(s)}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`pv-bubble ${m.from === "me" ? "pv-bubble-me" : "pv-bubble-pv"}`}>
              {m.text}
            </motion.div>
          ))}
          {thinking && <div className="pv-bubble pv-bubble-pv" aria-label="Typing"><span className="pv-typing"><i /><i /><i /></span></div>}
          {msgs.length > 0 && !thinking && (
            <div className="pv-suggest">
              {SUGGESTIONS.filter((s) => !msgs.some((m) => m.text === t(s))).slice(0, 3).map((s) => <button key={s} type="button" onClick={() => ask(s)}>{t(s)}</button>)}
            </div>
          )}
        </div>
      </div>

      <form className="pv-compose" onSubmit={(ev) => { ev.preventDefault(); ask(draft); }}>
        <input value={draft} onChange={(ev) => setDraft(ev.target.value)} placeholder={t("Ask about this message…")} aria-label={t("Ask about this message…")} />
        <button type="submit" className="pv-round" aria-label="Send" disabled={!draft.trim()} style={{ opacity: draft.trim() ? 1 : 0.35 }}><ArrowUp /></button>
      </form>
      {analysis.level === "high" && (
        <div className="pv-foot">
          <a className="pv-btn pv-btn-danger pv-btn-block" href={`tel:${HELP.helpline}`} style={{ textDecoration: "none" }}><Phone />{t("Lost money? Call 1930")}</a>
        </div>
      )}
    </div>
  );
}
