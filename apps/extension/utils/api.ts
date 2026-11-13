import type { Post } from "@pv/island";

/** Where the Pause & Verify API lives. Set WXT_API_URL in .env for production builds. */
export const API_URL = (import.meta.env.WXT_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3000";

export type BgMessage =
  | { type: "api"; path: string; body: unknown }
  | { type: "capture" }
  | { type: "fetchImage"; url: string };

/**
 * Content scripts can't call our API directly — the page's CORS rules apply to them — so
 * every request is relayed through the background worker, which has host permission.
 */
export const relayPost: Post = async <T,>(path: string, body: unknown) => {
  const res = (await browser.runtime.sendMessage({ type: "api", path, body } satisfies BgMessage)) as { ok: boolean; data?: T; error?: string };
  if (!res?.ok) throw new Error(res?.error || "Request failed");
  return res.data as T;
};
