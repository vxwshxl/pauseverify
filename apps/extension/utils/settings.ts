import type { Lang } from "@pv/engine";

export interface Settings {
  enabled: boolean;
  /** Hostnames where the user switched watching off. */
  pausedSites: string[];
  lang: Lang;
}

export const DEFAULTS: Settings = { enabled: true, pausedSites: [], lang: "en" };

export async function getSettings(): Promise<Settings> {
  const s = (await browser.storage.sync.get(DEFAULTS)) as Settings;
  return { ...DEFAULTS, ...s };
}

export async function setSettings(patch: Partial<Settings>) {
  await browser.storage.sync.set(patch);
}

export function onSettings(cb: (s: Settings) => void) {
  const fn = () => getSettings().then(cb);
  browser.storage.onChanged.addListener(fn);
  return () => browser.storage.onChanged.removeListener(fn);
}
