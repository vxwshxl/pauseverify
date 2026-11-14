import { useEffect, useState } from "react";
import { ScanSearch, Search } from "lucide-react";
import type { Lang } from "@pv/engine";
import { LANG_NAMES, Mark } from "@pv/island";
import { API_URL } from "@/utils/api";
import { DEFAULTS, getSettings, onSettings, setSettings, type Settings } from "@/utils/settings";

export default function App() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setS);
    browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      try { setHost(tab?.url ? new URL(tab.url).hostname : null); } catch { setHost(null); }
    });
    return onSettings(setS);
  }, []);

  const pausedHere = !!host && s.pausedSites.includes(host);
  const togglePauseHere = () => {
    if (!host) return;
    setSettings({ pausedSites: pausedHere ? s.pausedSites.filter((h) => h !== host) : [...s.pausedSites, host] });
  };
  const watching = s.enabled && !pausedHere;

  const look = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await browser.tabs.sendMessage(tab.id, { type: "look" }).catch(() => {});
    window.close();
  };

  return (
    <div className="pv-root pp">
      <div className="pp-head">
        <Mark />
        <div>
          <div className="pp-name">Pause &amp; Verify</div>
          <div className="pp-status"><span className="pv-dot" data-level={watching ? "safe" : "caution"} />{watching ? "Watching this page" : "Not watching this page"}</div>
        </div>
      </div>

      <div className="pp-card">
        <div className="pp-row">
          <div className="pp-row-text">
            <p className="pp-row-title">Watch for scams</p>
            <p className="pp-row-sub">On every site, on this device only</p>
          </div>
          <button type="button" role="switch" aria-checked={s.enabled} aria-label="Watch for scams" className="pp-switch" onClick={() => setSettings({ enabled: !s.enabled })} />
        </div>
        {host && (
          <div className="pp-row">
            <div className="pp-row-text">
              <p className="pp-row-title">On this site</p>
              <p className="pp-row-sub">{host}</p>
            </div>
            <button type="button" role="switch" aria-checked={!pausedHere} aria-label={`Watch ${host}`} className="pp-switch" disabled={!s.enabled} onClick={togglePauseHere} />
          </div>
        )}
      </div>

      <p className="pp-label">Language</p>
      <div className="pp-langs" role="radiogroup" aria-label="Language">
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
          <button key={l} type="button" role="radio" aria-checked={s.lang === l} lang={l} onClick={() => setSettings({ lang: l })}>{LANG_NAMES[l]}</button>
        ))}
      </div>

      <div className="pp-actions">
        <button type="button" className="pv-btn pv-btn-primary" onClick={look}><ScanSearch />Look</button>
        <a className="pv-btn pv-btn-secondary" href={`${API_URL}/check`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}><Search />Paste</a>
      </div>

      <p className="pp-foot">Lost money to a scam? Call <a href="tel:1930">1930</a> or report at <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">cybercrime.gov.in</a>. Shortcut for Look: <span className="pv-kbd">Alt Shift L</span></p>
    </div>
  );
}
