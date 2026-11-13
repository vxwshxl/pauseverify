// First-pass check of the official directory: does each domain resolve and serve a page
// whose title names the organisation? Prints a report for a person to review — it never
// marks anything as reviewed by itself.
// Run: node --experimental-strip-types scripts/check-directory.mjs
import { DIRECTORY } from "../packages/engine/src/directory.ts";

const rows = [];
for (const e of DIRECTORY) {
  for (const d of e.domains) {
    const url = `https://${d === "onlinesbi.sbi" || d === "google.com" ? (d === "google.com" ? "pay.google.com" : "www.onlinesbi.sbi") : "www." + d}`;
    let status = "", title = "";
    for (const u of [url, `https://${d}`]) {
      try {
        const r = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "Mozilla/5.0 (Macintosh) PauseVerifyDirectoryCheck" } });
        status = `${r.status} ${new URL(r.url).hostname}`;
        title = ((await r.text()).match(/<title[^>]*>([^<]{0,120})/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
        break;
      } catch (err) {
        status = `ERR ${err.cause?.code ?? err.name}`;
      }
    }
    rows.push({ entity: e.id, domain: d, status, title });
    console.log(`${e.id.padEnd(10)} ${d.padEnd(24)} ${status.padEnd(34)} ${title.slice(0, 70)}`);
  }
}
