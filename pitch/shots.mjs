import { chromium } from "playwright";
const OUT = new URL("./shots/", import.meta.url).pathname;
const EXT = "/Users/vee/Web Dev/pauseverify/apps/extension/.output/chrome-mv3";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shell = (p) => p.locator(".pv-shell").first();

// ── Website shots ─────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: "chromium" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
let p = await ctx.newPage();
await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await sleep(1200);
await p.screenshot({ path: OUT + "landing.png" });

// Assamese explanation sheet for the power-cut scam
await p.evaluate(() => localStorage.setItem("pv-lang", "as"));
await p.goto("http://localhost:3000/demo", { waitUntil: "networkidle" });
await p.locator("ul[aria-label=Messages] button", { hasText: "70021" }).click();
await sleep(1400);
await p.locator(".pv-btn", { hasText: /Show me why|কিয়|কাৰণ/ }).first().click().catch(async () => p.locator(".pv-btn-primary").first().click());
for (let i = 0; i < 60 && (await p.locator(".pv-sheet-scroll[data-loading=true]").count()); i++) await sleep(300);
await sleep(800);
await shell(p).screenshot({ path: OUT + "sheet-as.png" });
await p.screenshot({ path: OUT + "demo-as.png" });

// QR "refund": Look over the QR → sheet
await p.evaluate(() => localStorage.setItem("pv-lang", "en"));
await p.goto("http://localhost:3000/demo", { waitUntil: "networkidle" });
await p.locator("ul[aria-label=Messages] button", { hasText: "Refund Desk" }).click();
await sleep(1400);
await p.locator('.pv-root [aria-label="Look at part of the screen"]').first().click();
await sleep(300);
const img = await p.locator("figure img").boundingBox();
await p.mouse.move(img.x - 10, img.y - 10); await p.mouse.down();
await p.mouse.move(img.x + img.width + 10, img.y + img.height + 10, { steps: 6 }); await p.mouse.up();
await sleep(1600);
await p.locator(".pv-btn", { hasText: "Show me why" }).click();
await sleep(900);
await shell(p).screenshot({ path: OUT + "sheet-qr.png" });

// Checker with the digital-arrest example
await p.goto("http://localhost:3000/check", { waitUntil: "networkidle" });
await p.locator("button", { hasText: "Digital arrest" }).click();
await sleep(1500);
await p.screenshot({ path: OUT + "check.png" });
await browser.close();

// ── Extension on a real page ─────────────────────────────────────────────
const ectx = await chromium.launchPersistentContext("", { channel: "chromium", headless: true, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`] });
if (!ectx.serviceWorkers().length) await ectx.waitForEvent("serviceworker");
p = await ectx.newPage();
await p.goto("http://localhost:8765/");
await sleep(2500);
await p.screenshot({ path: OUT + "ext-alert.png" });
await p.click("#fake");
await sleep(700);
await p.locator("pause-verify .pv-shell").screenshot({ path: OUT + "ext-paused.png" });
await ectx.close();
console.log("shots done");
