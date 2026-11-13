"use client";
import { useCallback, useSyncExternalStore } from "react";
import { LANG_NAMES, createServices, fetchPost } from "@pv/island";
import type { Analysis, Lang } from "@pv/engine";

export const services = createServices(fetchPost(""));

// The chosen language is remembered across pages and visits.
const KEY = "pv-lang";
const listeners = new Set<() => void>();
const read = (): Lang => {
  const v = typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
  return v && (Object.keys(LANG_NAMES) as string[]).includes(v) ? (v as Lang) : "en";
};

export function useLang() {
  const lang = useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    read,
    () => "en" as Lang,
  );
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(KEY, l);
    listeners.forEach((cb) => cb());
  }, []);
  return [lang, setLang] as const;
}

/** Props that connect an <Island> to the AI services, for a given message text. */
export function useIslandServices(messageText?: string) {
  const [lang, setLang] = useLang();
  return {
    lang,
    onLangChange: setLang,
    translate: services.translate,
    speak: services.speak,
    stopSpeaking: services.stopSpeaking,
    onAsk: (q: string, a: Analysis, l: Lang) => services.ask(q, a, l, messageText),
  };
}
