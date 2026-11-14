"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowUp, BadgeCheck, Clock, Eye, EyeOff, Gift, IndianRupee, KeyRound, Lock, MessageCircle, Phone, QrCode,
  ScanSearch, ShieldAlert, ShieldCheck, Siren, Smartphone, UserRound, Users, X, Link2, TriangleAlert, Volume2, Square,
  Languages, ChevronDown, Check,
} from "lucide-react";
import type { Analysis, Flag, Lang } from "@pv/engine";
import { HELP } from "@pv/engine";
import { SUGGESTIONS, localAnswer } from "./answers.ts";
import { MARK_PATH } from "./mark.ts";

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
  /** Where the island sits. "right" keeps it in the bottom-right corner, out of the way. */
  position?: "center" | "right";
  /**
   * Where the resting island was dragged to, as an offset from its home corner. Drag it (or
   * Alt + arrow keys) so it never covers a site's own buttons; the extension saves it per site.
   */
  initialOffset?: Offset;
  onOffsetChange?: (o: Offset) => void;
}

export type Offset = { x: number; y: number };

// Native names. Seven Northeast languages, all served by Bhashini.
export const LANG_NAMES: Record<Lang, string> = {
  en: "English", hi: "हिन्दी", as: "অসমীয়া", brx: "बड़ो", bn: "বাংলা", mni: "ꯃꯤꯇꯩꯂꯣꯟ", ne: "नेपाली", kha: "Khasi", lus: "Mizo",
};
export const LANG_ENGLISH: Record<Lang, string> = {
  en: "English", hi: "Hindi", as: "Assamese", brx: "Bodo", bn: "Bengali", mni: "Manipuri", ne: "Nepali", kha: "Khasi", lus: "Mizo",
};
/** Bhashini has a usable voice for these; the read-aloud button hides for the rest. */
export const SPEAKABLE: Lang[] = ["en", "hi", "as", "brx", "bn", "ne"];

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
const RADIUS: Record<IslandMode, number> = { idle: 28, scanning: 28, alert: 24, sheet: 28 };

// Interface strings, translated with everything else when another language is picked.
const UI = [
  "Pause & Verify", "Show me why", "High risk", "Be careful", "Looks safe", "Why this is suspicious", "The link", "Links",
  "Check it safely", "Good habits", "Ask me", "What I see", "Checked on your device", "Never share your OTP, PIN or passwords.",
  "No bank, police officer or company will ever ask for them.", "Lost money? Call 1930", "Call 1930", "Ask about this message…",
  "Read aloud", "Stop", "Checking…", "Translating…", "Why", "What to do", "Ask", "Scam warning", "sign", "signs",
  "No warning signs found", "Ask anything about this message, in your own words.", ...SUGGESTIONS,
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
    // Bhashini's models sleep when idle and the first call can fail; try once more before giving up.
    const once = () => translate(missing, lang);
    once()
      .catch(() => new Promise<string[]>((r) => setTimeout(r, 1500)).then(once))
      .then((out) => missing.forEach((s, i) => { if (out[i] && out[i] !== s) tcache.set(`${lang}:${s}`, out[i]); }))
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
  const shell = useRef<HTMLDivElement>(null);
  // Idle, the island is a small circle; hovering (or tapping) peeks the full pill.
  const [peek, setPeek] = useState(false);
  const strings = useMemo(() => collect(analysis), [analysis]);
  const dock = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset>(props.initialOffset ?? { x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const [dragging, setDragging] = useState(false);
  useEffect(() => { if (props.initialOffset) setOffset(props.initialOffset); }, [props.initialOffset]);
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
    // Capture phase, for the same reason as the Look overlay (shadow-root event isolation).
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [mode, analysis]);

  // Clicking anywhere outside shrinks it back to the circle; the coloured dot keeps the result.
  useEffect(() => {
    if (inline || (mode !== "alert" && mode !== "sheet")) return;
    const onDown = (e: PointerEvent) => {
      if (shell.current && e.composedPath().includes(shell.current)) return;
      props.stopSpeaking?.();
      setPeek(false);
      setMode("idle");
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stopSpeaking is a stable service
  }, [mode, inline]);

  const close = () => {
    props.stopSpeaking?.();
    setPeek(false);
    setMode("idle");
    onDismiss?.();
  };
  // Something worrying stays visible as a small black pill; otherwise the island rests as a circle.
  const warn = !!analysis && analysis.level !== "safe";
  const compact = (mode === "idle" && !peek) || mode === "scanning";
  const viewKey = mode === "idle" ? (peek ? "idle-pill" : "idle-dot") : mode;
  const isIsland = mode === "idle" && !peek && warn;
  // Only the resting island moves; the alert and sheet open in the corner so they always fit.
  const movable = !inline && mode === "idle";

  /** Keep the island fully on screen after a drag, a key press or a window resize. */
  const clampTo = (o: Offset): Offset => {
    const el = shell.current, d = dock.current;
    if (!el || !d) return o;
    // Measured from layout (offsetLeft/Width), not getBoundingClientRect: the shell's own layout
    // animation shifts it mid-drag. The live offset comes from a ref because commit() runs in
    // listeners created when the drag started.
    const dr = d.getBoundingClientRect();
    const homeX = dr.left - offsetRef.current.x + el.offsetLeft, homeY = dr.top - offsetRef.current.y + el.offsetTop;
    const m = 8;
    return {
      x: Math.round(Math.min(innerWidth - m - el.offsetWidth - homeX, Math.max(m - homeX, o.x))),
      y: Math.round(Math.min(innerHeight - m - el.offsetHeight - homeY, Math.max(m - homeY, o.y))),
    };
  };
  const commit = (o: Offset) => { const c = clampTo(o); setOffset(c); props.onOffsetChange?.(c); };

  useEffect(() => {
    if (!movable) return;
    const onResize = () => setOffset((o) => clampTo(o));
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clampTo reads refs
  }, [movable]);

  const dragHandlers = movable ? {
    // Moves are followed on the window: the pointer leaves a 56px circle on the first frame.
    // (Pointer capture would also work, but it retargets the click away from the buttons inside.)
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const start = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y, moved: false };
      drag.current = start;
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!start.moved && Math.hypot(dx, dy) < 5) return;
        if (!start.moved) { start.moved = true; setDragging(true); setPeek(false); }
        ev.preventDefault();
        setOffset({ x: start.ox + dx, y: start.oy + dy });
      };
      const up = () => {
        removeEventListener("pointermove", move, true);
        removeEventListener("pointerup", up, true);
        removeEventListener("pointercancel", up, true);
        drag.current = null;
        if (!start.moved) return;
        setDragging(false);
        justDragged.current = true;
        setTimeout(() => { justDragged.current = false; }, 0);
        commit(offsetRef.current);
      };
      addEventListener("pointermove", move, true);
      addEventListener("pointerup", up, true);
      addEventListener("pointercancel", up, true);
    },
    // A drag must not also count as a tap that opens the island.
    onClickCapture: (e: React.MouseEvent) => { if (justDragged.current) { e.stopPropagation(); e.preventDefault(); } },
    onKeyDown: (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 64 : 24;
      const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!e.altKey || !move[e.key]) return;
      e.preventDefault();
      commit({ x: offset.x + move[e.key]![0], y: offset.y + move[e.key]![1] });
    },
  } : {};

  return (
    <TCtx.Provider value={{ t, lang, loading }}>
      <MotionConfig reducedMotion="user">
        <div className="pv-root" lang={lang}>
          <div className="pv-dock" ref={dock} data-inline={inline ? "true" : "false"} data-pos={props.position ?? "center"}
            data-dragging={dragging ? "true" : undefined}
            style={movable && (offset.x || offset.y) ? { translate: `${offset.x}px ${offset.y}px` } : undefined}>
            <motion.div
              ref={shell}
              layout
              // While dragging, follow the pointer 1:1; a layout spring here made it lag and wobble.
              layoutDependency={dragging ? "drag" : undefined}
              initial={false}
              transition={SPRING}
              className="pv-shell"
              data-mode={mode}
              data-compact={compact}
              data-variant={isIsland ? "island" : undefined}
              style={{ borderRadius: compact ? 28 : RADIUS[mode] }}
              // The colour morphs with the shape: dark only once it has become the small warning pill.
              animate={{ backgroundColor: isIsland ? "#1c1b1a" : "#ffffff" }}
              onMouseEnter={() => mode === "idle" && !warn && setPeek(true)}
              onMouseLeave={() => setPeek(false)}
              {...dragHandlers}
              data-movable={movable || undefined}
              title={movable ? "Drag to move · Alt + arrow keys" : undefined}
              role={mode === "sheet" ? "dialog" : "region"}
              aria-label={movable ? "Pause & Verify. Drag, or press Alt and the arrow keys, to move it" : "Pause & Verify"}
              aria-live="polite"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={viewKey}
                  // Scale-corrects the content while the shell morphs (circle ↔ squircle), so it
                  // doesn't stretch and wobble mid-animation.
                  layout="position"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, delay: 0.06 } }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
                >
                  {mode === "scanning" && <Dot scanning />}
                  {mode === "idle" && !peek && warn && <WarningPill analysis={analysis!} onOpen={() => setMode("alert")} />}
                  {mode === "idle" && !peek && !warn && (
                    <Dot level={analysis?.level} onClick={() => (analysis ? setMode("sheet") : setPeek(true))} />
                  )}
                  {mode === "idle" && peek && <Pill analysis={analysis} context={context} onLook={onLook} onOpen={() => analysis && setMode("sheet")} />}
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

/** The resting island: a small circle with the mark, and a coloured dot once something was checked. */
function Dot({ level, scanning, onClick }: { level?: Analysis["level"]; scanning?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className="pv-dotbtn" onClick={onClick} disabled={scanning}
      aria-label={scanning ? "Checking" : level ? `Pause & Verify: ${level === "high" ? "high risk found" : level === "caution" ? "be careful" : "looks safe"}. Open` : "Pause & Verify"}>
      {scanning ? <span className="pv-spinner" aria-hidden /> : <Mark />}
      {level && !scanning && <span className="pv-badge" data-level={level} data-pulse={level === "high"} aria-hidden />}
    </button>
  );
}

export function Mark() {
  return (
    <span className="pv-mark" aria-hidden>
      <svg viewBox="0 0 48 48" width="100%" height="100%" fill="#fff">
        <g transform="translate(0.8 0)"><rect x="10.4" y="13" width="5.2" height="22" rx="2.6" /><path d={MARK_PATH} /></g>
      </svg>
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
type Tab = "why" | "do" | "ask";

/** The resting state once something worrying was found: a small black pill, Dynamic-Island style. */
function WarningPill({ analysis, onOpen }: { analysis: Analysis; onOpen: () => void }) {
  const { t } = useT();
  const n = analysis.flags.length;
  return (
    <button type="button" className="pv-wpill" onClick={onOpen} aria-label={`${t(analysis.headline)} Open`}>
      <span className="pv-wpill-dot" data-level={analysis.level} aria-hidden />
      <span className="pv-wpill-text">{analysis.level === "high" ? t("Scam warning") : t("Be careful")}</span>
      <span className="pv-wpill-meta">{n} {n === 1 ? t("sign") : t("signs")}</span>
    </button>
  );
}

/** Language picker: one compact button and a menu, instead of nine chips. */
function LangMenu({ setLang }: { setLang: (l: Lang) => void }) {
  const { lang } = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const langs = Object.keys(LANG_NAMES) as Lang[];
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, langs.indexOf(lang)));
    list.current?.focus();
    const away = (e: PointerEvent) => wrap.current && !e.composedPath().includes(wrap.current) && setOpen(false);
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open only
  }, [open]);

  const choose = (l: Lang) => { setLang(l); setOpen(false); };
  return (
    <div className="pv-lang" ref={wrap}>
      <button type="button" className="pv-lang-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Languages aria-hidden />
        <span lang={lang}>{LANG_NAMES[lang]}</span>
        <ChevronDown aria-hidden className="pv-lang-chev" data-open={open} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={list}
            className="pv-lang-menu"
            role="listbox"
            tabIndex={-1}
            aria-label="Language"
            aria-activedescendant={`pv-lang-${langs[active]}`}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.14 } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % langs.length); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + langs.length) % langs.length); }
              else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(langs[active]!); }
              else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); }
            }}
          >
            {langs.map((l, i) => (
              <li key={l} id={`pv-lang-${l}`} role="option" aria-selected={l === lang} data-active={i === active}
                onPointerEnter={() => setActive(i)} onClick={() => choose(l)}>
                <span lang={l} className="pv-lang-native">{LANG_NAMES[l]}</span>
                <span className="pv-lang-en">{LANG_ENGLISH[l]}{!SPEAKABLE.includes(l) && " · text only"}</span>
                {l === lang && <Check aria-hidden className="pv-lang-check" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sheet({ analysis, onAsk, onLook, onClose, translate, speak, stopSpeaking, setLang }: IslandProps & { analysis: Analysis; onClose: () => void; setLang: (l: Lang) => void }) {
  const { t, lang, loading } = useT();
  const [tab, setTab] = useState<Tab>("why");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [openFlag, setOpenFlag] = useState<string | null>(analysis.flags[0]?.kind ?? null);
  const scroller = useRef<HTMLDivElement>(null);
  const e = analysis.claimedEntity;
  const levelLabel = analysis.level === "high" ? "High risk" : analysis.level === "caution" ? "Be careful" : "Looks safe";
  const riskyLinks = analysis.links.filter((l) => l.verdict !== "official");
  const officialLinks = analysis.links.filter((l) => l.verdict === "official");

  useEffect(() => {
    if (tab === "ask" && msgs.length) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length, thinking, tab]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [tab]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    setTab("ask");
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
    if (speaking) { stopSpeaking?.(); setSpeaking(false); return; }
    const parts = [t(analysis.headline), ...analysis.flags.slice(0, 3).map((f) => t(f.title)), ...analysis.steps.slice(0, 4).map(t)];
    setSpeaking(true);
    await speak(parts.join(". ").replace(/\.\./g, "."), lang).catch(() => {});
    setSpeaking(false);
  }

  const tabs: [Tab, string, number?][] = [["why", "Why", analysis.flags.length], ["do", "What to do"], ["ask", "Ask"]];

  return (
    <div className="pv-sheet">
      <div className="pv-sheet-head">
        <Mark />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pv-pill-title">Pause &amp; Verify</div>
          <div className="pv-pill-sub">{loading ? t("Translating…") : t("Checked on your device")}</div>
        </div>
        {speak && SPEAKABLE.includes(lang) && (
          <button type="button" className="pv-icon-btn" onClick={readAloud} aria-pressed={speaking} aria-label={speaking ? t("Stop") : t("Read aloud")} title={speaking ? t("Stop") : t("Read aloud")} data-active={speaking}>
            {speaking ? <Square /> : <Volume2 />}
          </button>
        )}
        {onLook && <button type="button" className="pv-icon-btn" onClick={onLook} aria-label="Look at part of the screen" title="Look at part of the screen"><ScanSearch /></button>}
        <button type="button" className="pv-icon-btn" onClick={onClose} aria-label="Close"><X /></button>
      </div>

      <div className="pv-verdict" data-level={analysis.level}>
        <div className="pv-verdict-top">
          <span className="pv-chip" data-level={analysis.level}><LevelIcon level={analysis.level} />{t(levelLabel)}</span>
          {translate && <LangMenu setLang={setLang} />}
        </div>
        <p className="pv-verdict-title">{t(analysis.headline)}</p>
        <div className="pv-verdict-meter">
          <div className="pv-bar" data-level={analysis.level}><i style={{ width: `${Math.max(4, analysis.score)}%` }} /></div>
          <span className="pv-verdict-score"><b>{analysis.score}</b>/100</span>
        </div>
      </div>

      <div className="pv-tabs" role="tablist" aria-label="Sections">
        {tabs.map(([id, label, count]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {t(label)}{count ? <span className="pv-count">{count}</span> : null}
            {tab === id && <motion.span layoutId="pv-tab-line" className="pv-tab-line" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          </button>
        ))}
      </div>

      <div className="pv-sheet-scroll" ref={scroller} data-loading={loading}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.16 } }} exit={{ opacity: 0, transition: { duration: 0.08 } }}>
            {tab === "why" && (
              <>
                {analysis.seen && <div className="pv-seen"><Eye /><span>{t(analysis.seen)}</span></div>}
                {analysis.flags.length === 0 && <p className="pv-empty">{t("No warning signs found")}</p>}
                <ul className="pv-flags">
                  {analysis.flags.map((f) => {
                    const Icon = FLAG_ICON[f.kind];
                    const quote = f.spans[0]?.text;
                    const open = openFlag === f.kind;
                    return (
                      <li key={f.kind} className="pv-flag" data-open={open}>
                        <button type="button" className="pv-flag-row" aria-expanded={open} onClick={() => setOpenFlag(open ? null : f.kind)}>
                          <span className="pv-flag-icon"><Icon /></span>
                          <span className="pv-flag-title">{t(f.title)}</span>
                          <ChevronDown aria-hidden className="pv-flag-chev" />
                        </button>
                        {open && (
                          <div className="pv-flag-body">
                            <p className="pv-flag-detail">{t(f.detail)}</p>
                            {quote && f.kind !== "impersonation" && <span className="pv-quote" lang="en">“{quote.trim()}”</span>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
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

            {tab === "do" && (
              <>
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
              </>
            )}

            {tab === "ask" && (
              <div className="pv-chat">
                {msgs.length === 0 && <p className="pv-empty">{t("Ask anything about this message, in your own words.")}</p>}
                {msgs.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`pv-bubble ${m.from === "me" ? "pv-bubble-me" : "pv-bubble-pv"}`}>
                    {m.text}
                  </motion.div>
                ))}
                {thinking && <div className="pv-bubble pv-bubble-pv" aria-label="Typing"><span className="pv-typing"><i /><i /><i /></span></div>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {(tab === "ask" || msgs.length === 0) && !thinking && (
        <div className="pv-suggest pv-suggest-bar">
          {SUGGESTIONS.filter((s) => !msgs.some((m) => m.text === t(s))).map((s) => <button key={s} type="button" onClick={() => ask(s)}>{t(s)}</button>)}
        </div>
      )}
      <form className="pv-compose" onSubmit={(ev) => { ev.preventDefault(); ask(draft); }}>
        <input value={draft} onChange={(ev) => setDraft(ev.target.value)} onFocus={() => setTab("ask")} placeholder={t("Ask about this message…")} aria-label={t("Ask about this message…")} />
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
