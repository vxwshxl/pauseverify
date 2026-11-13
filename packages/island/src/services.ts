import type { Analysis, Lang } from "@pv/engine";
import { mask } from "@pv/engine";

/** Sends a JSON POST to the Pause & Verify API. The extension swaps in a background-worker relay. */
export type Post = <T>(path: string, body: unknown) => Promise<T>;

export function fetchPost(base = ""): Post {
  return async <T,>(path: string, body: unknown) => {
    const res = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };
}

export interface ImageRead {
  text: string;
  kind: string;
  seen: string;
  hasQr: boolean;
}

/** Everything the island needs from the server, built on one transport. */
export function createServices(post: Post) {
  let current: HTMLAudioElement | null = null;
  let cancelled = false;

  const stopSpeaking = () => {
    cancelled = true;
    current?.pause();
    current = null;
  };

  return {
    translate: async (texts: string[], lang: Lang) => (await post<{ texts: string[] }>("/api/translate", { texts, to: lang })).texts,

    speak: async (text: string, lang: Lang) => {
      stopSpeaking();
      cancelled = false;
      const { audio, mime } = await post<{ audio: string[]; mime: string }>("/api/speak", { text, lang });
      for (const chunk of audio) {
        if (cancelled) return;
        await new Promise<void>((resolve) => {
          const el = new Audio(`data:${mime};base64,${chunk}`);
          current = el;
          el.onended = () => resolve();
          el.onerror = () => resolve();
          el.play().catch(() => resolve());
        });
      }
    },

    stopSpeaking,

    /** Free-form question about a checked message. Secrets are masked before sending. */
    ask: async (question: string, a: Analysis, lang: Lang, messageText?: string) => {
      const context = {
        message: messageText ? mask(messageText).slice(0, 1500) : undefined,
        level: a.level,
        flags: a.flags.map((f) => f.title),
        links: a.links.map((l) => `${l.domain} (${l.verdict})`),
        claimed: a.claimedEntity?.name,
        officialApp: a.claimedEntity?.reviewed ? a.claimedEntity.app : undefined,
        officialSite: a.claimedEntity?.reviewed ? a.claimedEntity.site : undefined,
      };
      return (await post<{ answer: string }>("/api/chat", { question: mask(question), lang, context })).answer;
    },

    readImage: (dataUrl: string) => post<ImageRead>("/api/vision", { image: dataUrl }),
  };
}

export type Services = ReturnType<typeof createServices>;

/** Downscales an image (or canvas) to a JPEG data URL small enough for the vision API. */
export async function toJpeg(source: CanvasImageSource & { width: number; height: number }, maxEdge = 1400): Promise<string> {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(source.width * scale));
  c.height = Math.max(1, Math.round(source.height * scale));
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.86);
}
