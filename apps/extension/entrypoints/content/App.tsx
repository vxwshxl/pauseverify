import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldAlert, TriangleAlert, X } from "lucide-react";
import { analyze, analyzeUrl, type Analysis, type Lang, type LinkReport } from "@pv/engine";
import { Island, LookOverlay, createServices, type Rect } from "@pv/island";
import { relayPost, type BgMessage } from "@/utils/api";
import { getSettings, onSettings, setSettings, type Settings } from "@/utils/settings";
import { clearPaint, paint, scan, textInRect, visible, type Found } from "./scanner";
import { crop, loadImage, readQr, toJpeg } from "./vision";

const services = createServices(relayPost);

type LinkPause = { href: string; report: LinkReport; mismatch?: string };
type Tip = { x: number; y: number; text: string };

/** A link whose visible text is a different website than where it really goes. */
function textMismatch(a: HTMLAnchorElement, report: LinkReport): string | undefined {
  const shown = a.textContent?.trim() ?? "";
  if (!/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(shown) && !/^https?:\/\//i.test(shown)) return undefined;
  const claimed = analyzeUrl(shown);
  if (claimed && claimed.domain !== report.domain) return claimed.domain;
  return undefined;
}

function risky(report: LinkReport | null, mismatch?: string) {
  return !!report && (report.verdict === "lookalike" || report.verdict === "suspicious" || !!mismatch);
}

export function App({ host }: { host: HTMLElement }) {
  const [settings, setLocal] = useState<Settings | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [messageText, setMessageText] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [asked, setAsked] = useState(false);
  const [looking, setLooking] = useState(false);
  const [pause, setPause] = useState<LinkPause | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const dismissed = useRef(new Set<string>());
  const shown = useRef<string | null>(null);

  const active = !!settings?.enabled && !settings.pausedSites.includes(location.hostname);

  useEffect(() => {
    getSettings().then(setLocal);
    return onSettings(setLocal);
  }, []);

  // ── Watch the page ────────────────────────────────────────────────────────
  const rescan = useCallback(() => {
    if (!active) return clearPaint();
    const found = scan(host);
    paint(found);
    // Alert for the worst high-risk message that's on screen and not already dismissed.
    const pick = found.find((f: Found) => f.analysis.level === "high" && visible(f.block) && !dismissed.current.has(f.text));
    if (pick && shown.current !== pick.text) {
      shown.current = pick.text;
      setAsked(false);
      setMessageText(pick.text);
      setAnalysis(pick.analysis);
    }
  }, [active, host]);

  useEffect(() => {
    if (!active) return clearPaint();
    let t: ReturnType<typeof setTimeout> | undefined;
    const soon = () => { clearTimeout(t); t = setTimeout(rescan, 700); };
    rescan();
    const mo = new MutationObserver((records) => {
      if (records.every((r) => host.contains(r.target))) return;
      soon();
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    addEventListener("scroll", soon, { passive: true });
    return () => { mo.disconnect(); removeEventListener("scroll", soon); clearTimeout(t); };
  }, [active, rescan, host]);

  // ── Link guard: a tooltip on hover, and a pause before a fake link opens ──
  useEffect(() => {
    if (!active) return;
    const linkOf = (e: Event) => (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    const over = (e: MouseEvent) => {
      const a = linkOf(e);
      if (!a || !/^https?:/.test(a.href)) return setTip(null);
      const report = analyzeUrl(a.href);
      const mismatch = report ? textMismatch(a, report) : undefined;
      if (!risky(report, mismatch)) return setTip(null);
      const r = a.getBoundingClientRect();
      setTip({
        x: Math.min(r.left, innerWidth - 360),
        y: r.bottom + 8 > innerHeight - 60 ? r.top - 48 : r.bottom + 8,
        text: mismatch ? `Says ${mismatch}, but goes to ${report!.domain}` : report!.reason,
      });
    };
    const click = (e: MouseEvent) => {
      const a = linkOf(e);
      if (!a || !/^https?:/.test(a.href)) return;
      const report = analyzeUrl(a.href);
      const mismatch = report ? textMismatch(a, report) : undefined;
      if (!risky(report, mismatch)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setTip(null);
      setPause({ href: a.href, report: report!, mismatch });
    };
    document.addEventListener("mouseover", over, true);
    document.addEventListener("click", click, true);
    return () => { document.removeEventListener("mouseover", over, true); document.removeEventListener("click", click, true); };
  }, [active]);

  // ── Explicit checks: right-click menu, keyboard shortcut ──────────────────
  const showResult = useCallback((a: Analysis, text?: string) => {
    setAsked(true);
    setMessageText(text);
    setAnalysis(a);
  }, []);

  const checkImage = useCallback(async (dataUrl: string, context = "") => {
    setScanning(true);
    try {
      const img = await loadImage(dataUrl);
      const qr = readQr(img);
      const read = await services.readImage(await toJpeg(img)).catch(() => null);
      const text = [read?.text, context].filter(Boolean).join(" ");
      showResult(analyze({ text, qr: qr ?? undefined, seen: read?.seen }), text);
    } finally {
      setScanning(false);
    }
  }, [showResult]);

  const onLookSelect = useCallback(async (rect: Rect) => {
    setLooking(false);
    setScanning(true);
    // Hide ourselves for the screenshot so the island isn't in the picture.
    host.style.visibility = "hidden";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const shot = (await browser.runtime.sendMessage({ type: "capture" } satisfies BgMessage).catch(() => null)) as { ok: boolean; dataUrl?: string } | null;
    host.style.visibility = "";
    try {
      const pageText = textInRect(rect, host);
      if (!shot?.ok || !shot.dataUrl) {
        showResult(analyze({ text: pageText }), pageText);
        return;
      }
      const cut = crop(await loadImage(shot.dataUrl), rect);
      const qr = readQr(cut);
      const read = await services.readImage(await toJpeg(cut)).catch(() => null);
      // Words the page already has as text are exact; the model fills in what's only in images.
      const text = [pageText, read && !pageText.includes(read.text.slice(0, 40)) ? read.text : ""].filter(Boolean).join(" ");
      showResult(analyze({ text, qr: qr ?? undefined, seen: read?.seen }), text);
    } finally {
      setScanning(false);
    }
  }, [host, showResult]);

  useEffect(() => {
    const onMsg = (msg: { type: string; text?: string; link?: string; image?: string }) => {
      if (msg.type === "look") setLooking(true);
      if (msg.type !== "check") return;
      if (msg.image) {
        browser.runtime.sendMessage({ type: "fetchImage", url: msg.image } satisfies BgMessage).then((r) => {
          const res = r as { ok: boolean; dataUrl?: string };
          if (res?.ok && res.dataUrl) checkImage(res.dataUrl, msg.text ?? "");
        });
      } else if (msg.text) showResult(analyze({ text: msg.text }), msg.text);
      else if (msg.link) showResult(analyze({ text: msg.link }), msg.link);
    };
    browser.runtime.onMessage.addListener(onMsg);
    return () => browser.runtime.onMessage.removeListener(onMsg);
  }, [checkImage, showResult]);

  if (!settings) return null;
  // When watching is off, stay invisible until the person asks for a check.
  if (!active && !analysis && !scanning && !looking) return null;

  return (
    <>
      {pause ? (
        <LinkPauseCard
          pause={pause}
          onBack={() => setPause(null)}
          onOpen={() => { const href = pause.href; setPause(null); location.href = href; }}
        />
      ) : (
        <Island
          analysis={analysis}
          scanning={scanning}
          alwaysAlert={asked}
          context="this page"
          position="right"
          onLook={() => setLooking(true)}
          onDismiss={() => { if (messageText) dismissed.current.add(messageText); }}
          lang={settings.lang}
          onLangChange={(l: Lang) => setSettings({ lang: l })}
          translate={services.translate}
          speak={services.speak}
          stopSpeaking={services.stopSpeaking}
          onAsk={(q, a, l) => services.ask(q, a, l, messageText)}
        />
      )}
      {looking && <LookOverlay onSelect={onLookSelect} onCancel={() => setLooking(false)} />}
      {tip && !looking && (
        <div className="pv-root">
          <div className="pv-tip" style={{ left: Math.max(8, tip.x), top: tip.y }} role="status">
            <TriangleAlert />
            <span>{tip.text}</span>
          </div>
        </div>
      )}
    </>
  );
}

function LinkPauseCard({ pause, onBack, onOpen }: { pause: LinkPause; onBack: () => void; onOpen: () => void }) {
  const { report, mismatch } = pause;
  return (
    <div className="pv-root">
      <div className="pv-dock" data-pos="right">
        <div className="pv-shell" style={{ borderRadius: 24 }} role="alertdialog" aria-label="Pause & Verify stopped this link">
          <div className="pv-alert">
            <div className="pv-alert-head">
              <span className="pv-badge-icon" data-level="high"><ShieldAlert /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="pv-alert-title">Paused. This link isn’t what it seems.</p>
                <p className="pv-alert-sub">
                  {mismatch ? <>It says <span className="pv-mono">{mismatch}</span> but really goes to <span className="pv-mono">{report.domain}</span>.</> : report.reason}
                </p>
                {!mismatch && <p className="pv-alert-sub" style={{ marginTop: 6 }}>Goes to <span className="pv-mono">{report.domain}</span></p>}
              </div>
              <button type="button" className="pv-icon-btn" onClick={onBack} aria-label="Close"><X /></button>
            </div>
            <div className="pv-actions">
              <button type="button" className="pv-btn pv-btn-primary pv-btn-block" onClick={onBack} autoFocus>Go back to safety</button>
              <button type="button" className="pv-btn pv-btn-secondary" onClick={onOpen}>Open anyway</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
