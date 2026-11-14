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

// Where the person dragged the island on each site, so it never covers that site's own buttons.
// Local (not synced): screen sizes differ between devices.
type Offset = { x: number; y: number };
const POS_KEY = "islandOffsets";

export async function getOffset(host: string): Promise<Offset | undefined> {
  const all = ((await browser.storage.local.get(POS_KEY))[POS_KEY] ?? {}) as Record<string, Offset>;
  return all[host];
}

export async function setOffset(host: string, o: Offset) {
  const all = ((await browser.storage.local.get(POS_KEY))[POS_KEY] ?? {}) as Record<string, Offset>;
  if (!o.x && !o.y) delete all[host]; else all[host] = o;
  await browser.storage.local.set({ [POS_KEY]: all });
}
