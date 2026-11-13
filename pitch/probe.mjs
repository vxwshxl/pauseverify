import { chromium } from "playwright";
const EXT = "/Users/vee/Web Dev/pauseverify/apps/extension/.output/chrome-mv3";
const urls = process.argv.slice(2);
const ctx = await chromium.launchPersistentContext("", { channel: "chromium", headless: true, viewport: { width: 1440, height: 900 },
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36" });
if (!ctx.serviceWorkers().length) await ctx.waitForEvent("serviceworker");
const p = await ctx.newPage();
for (const u of urls) {
  try {
    await p.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
    await p.waitForTimeout(5000);
    // scroll through the page so the scanner sees the article body
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(900); }
    const r = await p.evaluate(() => {
      const root = document.querySelector("pause-verify")?.shadowRoot;
      return { title: document.title.slice(0, 60), island: root?.querySelector(".pv-alert-title")?.textContent || root?.querySelector(".pv-pill-sub")?.textContent || (root ? "(host, no ui)" : "NO HOST"),
        sub: root?.querySelector(".pv-alert-sub")?.textContent, hl: "highlights" in CSS ? [...CSS.highlights.keys()].map((k) => `${k}:${CSS.highlights.get(k).size}`).join(",") : "" };
    });
    console.log(u.slice(0, 70), "→", JSON.stringify(r));
  } catch (e) { console.log(u.slice(0, 70), "→ ERR", e.message.slice(0, 80)); }
}
await ctx.close();
