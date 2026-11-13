// Records the judges' demo: the website, the AI layer, and the Chrome extension on real sites.
import { chromium } from "playwright";
import fs from "node:fs";
const EXT = "/Users/vee/Web Dev/pauseverify/apps/extension/.output/chrome-mv3";
const VID = process.argv[2];
const SITE = "http://localhost:3000";
const TEST = "http://localhost:8765";
const SHOT = "/private/tmp/claude-501/-Users-vee-Web-Dev/7525f81d-500c-4404-94d0-6cddf74f7242/scratchpad/ext-test/site/sms-screenshot.png";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const args = [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`];

// Captions and a visible cursor live in closed shadow roots, so the scam scanner never reads them.
const OVERLAY = () => {
  const mk = () => {
    if (window.__pvOverlay || !document.body) return;
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147482000";
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>
      .cap{position:fixed;top:18px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:12px;max-width:1100px;padding:12px 22px 12px 12px;border-radius:999px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.05),0 10px 30px rgba(0,0,0,.18);font:600 19px/1.3 "Helvetica Neue",Arial,sans-serif;color:#222}
      .n{flex:none;min-width:34px;height:34px;padding:0 10px;border-radius:999px;background:#E8505B;color:#fff;display:grid;place-items:center;font-size:16px}
      .cur{position:fixed;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(232,80,91,.28);border:2px solid #E8505B;transition:transform .12s;left:-40px;top:-40px}
      .cur.down{transform:scale(.7);background:rgba(232,80,91,.55)}</style>
      <div class="cap"><span class="n"></span><span class="t"></span></div><div class="cur"></div>`;
    document.documentElement.append(host);
    const cap = root.querySelector(".cap"), cur = root.querySelector(".cur");
    window.__pvOverlay = {
      caption(n, t) { cap.style.display = t ? "flex" : "none"; root.querySelector(".n").textContent = n; root.querySelector(".t").textContent = t; },
    };
    addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, true);
    addEventListener("mousedown", () => cur.classList.add("down"), true);
    addEventListener("mouseup", () => cur.classList.remove("down"), true);
  };
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", mk) : mk();
};

async function launch(record) {
  const ctx = await chromium.launchPersistentContext("", {
    channel: "chromium", headless: true, viewport: { width: 1440, height: 900 }, userAgent: UA, args,
  });
  if (!ctx.serviceWorkers().length) await ctx.waitForEvent("serviceworker");
  await ctx.addInitScript(OVERLAY);
  return ctx;
}

const LANG_CHIPS = ["অসমীয়া", "बड़ो", "ꯃꯤꯇꯩꯂꯣꯟ", "Khasi", "Mizo", "नेपाली", "বাংলা", "हिन्दी"];

// ── Warm-up: fill the server's translation cache so language switches are instant on camera.
{
  const ctx = await launch(false);
  const p = await ctx.newPage();
  await p.goto(SITE + "/demo");
  await p.locator("ul[aria-label=Messages] button", { hasText: "VM-SBIBNK" }).click();
  await sleep(1300);
  await p.locator(".pv-btn", { hasText: "Show me why" }).click();
  for (const l of LANG_CHIPS) {
    await p.locator(".pv-langs button", { hasText: l }).click();
    for (let i = 0; i < 80 && (await p.locator(".pv-sheet-scroll[data-loading=true]").count()); i++) await sleep(250);
  }
  await ctx.close();
  console.log("warm-up done");
}

// Playwright's video recorder captures blank frames with extensions in headless mode, so we
// stream Chrome's own screencast frames (with timestamps) and stitch them with ffmpeg.
const ctx = await launch(true);
const p = await ctx.newPage();
fs.rmSync(VID + "/frames", { recursive: true, force: true });
fs.mkdirSync(VID + "/frames", { recursive: true });
const frames = [];
const cdp = await ctx.newCDPSession(p);
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const f = `${VID}/frames/${String(frames.length).padStart(6, "0")}.jpg`;
  fs.writeFileSync(f, Buffer.from(data, "base64"));
  frames.push({ f, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1440, maxHeight: 900 });
const cap = (n, t) => p.evaluate(([n, t]) => window.__pvOverlay?.caption(n, t), [n, t]).catch(() => {});
const shadow = (sel) => p.locator(`pause-verify ${sel}`);
async function glide(locator, opts = {}) {
  const b = await locator.boundingBox().catch(() => null);
  if (!b) return;
  await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: opts.steps ?? 18 });
  await sleep(250);
}
async function click(locator, wait = 600) {
  try { await locator.first().waitFor({ state: "visible", timeout: 10000 }); await glide(locator.first()); await locator.first().click({ timeout: 8000 }); }
  catch (e) { console.log("skip click:", e.message.split("\n")[0].slice(0, 90)); }
  await sleep(wait);
}
async function scroll(dy, steps = 6, gap = 140) { for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, dy / steps); await sleep(gap); } }
async function settleTranslation() { for (let i = 0; i < 80 && (await p.locator(".pv-sheet-scroll[data-loading=true]").count()); i++) await sleep(200); }
async function drag(box, pad = 14) {
  await p.mouse.move(box.x - pad, box.y - pad, { steps: 14 });
  await p.mouse.down();
  await p.mouse.move(box.x + box.width + pad, box.y + box.height + pad, { steps: 22 });
  await p.mouse.up();
}

// 0 · Intro card
await p.goto(TEST + "/card.html");
await sleep(4200);

// 1 · Website
await p.goto(SITE + "/", { waitUntil: "networkidle" });
await cap("1", "The website: what Pause & Verify does, in one line");
await sleep(3500);
await scroll(900, 8);
await cap("1", "Seven Northeast languages — including low-resource Bodo, Khasi and Mizo");
await p.getByRole("heading", { name: "Speaks the Northeast" }).scrollIntoViewIfNeeded();
await scroll(-120, 2);
await sleep(4200);

// 2 · Demo inbox: the problem statement's own example
await p.goto(SITE + "/demo", { waitUntil: "networkidle" });
await cap("2", "Live demo inbox — open the bank message from the problem statement");
await sleep(1500);
await click(p.locator("ul[aria-label=Messages] button", { hasText: "VM-SBIBNK" }), 1600);
await cap("2", "Warning signs are underlined in the message, and the island stops you");
await sleep(3800);
await click(p.locator(".pv-btn", { hasText: "Show me why" }), 900);
await cap("2", "Why it’s a scam, in plain words — and the fake link it uses");
await sleep(2200);
for (let i = 0; i < 4; i++) { await p.locator(".pv-sheet-scroll").evaluate((el) => el.scrollBy({ top: 230, behavior: "smooth" })); await sleep(1300); }
await cap("2", "Safe next steps: the official app, the real .bank.in address, and 1930");
await sleep(2600);
await p.locator(".pv-sheet-scroll").evaluate((el) => el.scrollTo({ top: 0, behavior: "smooth" }));
await sleep(800);
await cap("2", "The same explanation in every Northeast language (Bhashini)");
for (const l of LANG_CHIPS) {
  await click(p.locator(".pv-langs button", { hasText: l }), 200);
  await settleTranslation();
  await sleep(1500);
}
await click(p.locator(".pv-langs button", { hasText: "English" }), 600);
await cap("2", "Ask what to do — one tap, or type in your own words");
await p.locator(".pv-sheet-scroll").evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
await sleep(1200);
await click(p.locator(".pv-suggest button", { hasText: "I shared my OTP" }), 2200);
await p.locator(".pv-sheet-scroll").evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
await sleep(3500);
await click(p.locator(".pv-sheet [aria-label=Close]"), 600);

// 3 · QR "refund"
await cap("3", "A cashback QR — tap the scan button and drag over the QR");
await click(p.locator("ul[aria-label=Messages] button", { hasText: "Refund Desk" }), 1600);
await click(p.locator('.pv-alert [aria-label="Look at part of the screen"]'), 500);
await drag(await p.locator("figure img").boundingBox());
await sleep(1800);
await cap("3", "Decoded on the device: this QR SENDS ₹5,000 — you never scan to receive");
await click(p.locator(".pv-btn", { hasText: "Show me why" }), 900);
await sleep(4200);
await click(p.locator(".pv-sheet [aria-label=Close]"), 500);

// 4 · Check a screenshot
await p.goto(SITE + "/check", { waitUntil: "networkidle" });
await cap("4", "Check a message: paste text, or drop a screenshot");
await sleep(2000);
await glide(p.locator("button", { hasText: "Screenshot" }));
await p.locator("input[type=file]").setInputFiles(SHOT);
await cap("4", "Gemma vision reads the screenshot; our engine makes the decision");
for (let i = 0; i < 120 && !(await p.locator(".pv-alert").count()); i++) await sleep(250);
await sleep(2200);
await click(p.locator(".pv-btn", { hasText: "Show me why" }), 900);
await sleep(4000);
await click(p.locator(".pv-sheet [aria-label=Close]"), 500);

// 5 · Extension on real websites
await p.goto("https://en.wikipedia.org/wiki/Assam", { waitUntil: "domcontentloaded" });
await sleep(1500);
await cap("5", "Chrome extension on a real website — an ordinary page stays quiet");
await sleep(2500);
await scroll(1400, 8);
await sleep(2500);

await p.goto("https://www.kotak.bank.in/en/safe-banking/safe-banking-articles/the-electricity-sms-fraud.html", { waitUntil: "domcontentloaded" });
await sleep(2500);
await cap("5", "A real bank page quoting a power-cut fraud SMS — caught and underlined");
const quote = p.getByText(/disconnected/i).first();
await quote.scrollIntoViewIfNeeded().catch(() => {});
await scroll(-160, 2);
await sleep(4500);
await click(shadow(".pv-btn").filter({ hasText: "Show me why" }), 900);
await click(shadow(".pv-langs button").filter({ hasText: "অসমীয়া" }), 300);
await settleTranslation();
await cap("5", "Explained in Assamese, right on the bank’s own page");
await sleep(4000);
await click(shadow(".pv-langs button").filter({ hasText: "English" }), 400);
await click(shadow(".pv-sheet [aria-label=Close]"), 600);

await cap("5", "Look on any site: drag over the message — the tab is screenshotted and read");
await click(shadow('[aria-label="Look at part of the screen"]').first(), 500);
const qb = await quote.boundingBox();
if (qb) await drag({ x: Math.max(20, qb.x - 30), y: qb.y - 60, width: Math.min(900, qb.width + 60), height: qb.height + 120 });
for (let i = 0; i < 120 && (await shadow(".pv-scan").count()); i++) await sleep(250);
await sleep(3500);

await p.goto("https://mokokchungtimes.com/scam-alert-mokokchung-sdo-electrical-cautions-public/", { waitUntil: "domcontentloaded" });
await sleep(2500);
await cap("5", "A Nagaland news site — the same scam, caught again");
await p.getByText(/disconnected/i).first().scrollIntoViewIfNeeded().catch(() => {});
await scroll(-160, 2);
await sleep(4500);

// 6 · Link that lies
await p.goto(TEST + "/", { waitUntil: "domcontentloaded" });
await sleep(1800);
await click(shadow(".pv-alert [aria-label=Dismiss]"), 400);
await cap("6", "A link that says one site but goes to another (test page)");
await glide(p.locator("#fake"), { steps: 24 });
await sleep(2800);
await cap("6", "Clicking it pauses first — Go back to safety, or open anyway");
await p.locator("#fake").click();
await sleep(4200);
await click(shadow(".pv-btn").filter({ hasText: "Go back to safety" }), 800);

// 7 · Outro
await cap("", "");
await p.goto(TEST + "/card.html?c=outro");
await sleep(7000);

await cdp.send("Page.stopScreencast").catch(() => {});
await ctx.close();
// ffmpeg concat list: each frame lasts until the next one arrived.
let list = "";
frames.forEach((fr, i) => {
  const next = frames[i + 1]?.t ?? fr.t + 1.5;
  list += `file '${fr.f}'\nduration ${Math.max(0.001, next - fr.t).toFixed(4)}\n`;
});
list += `file '${frames[frames.length - 1].f}'\n`;
fs.writeFileSync(VID + "/frames.txt", list);
console.log("frames:", frames.length, "seconds:", (frames.at(-1).t - frames[0].t).toFixed(1));
