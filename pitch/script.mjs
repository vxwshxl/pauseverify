import fs from "node:fs";
import { createRequire } from "node:module";
const N = createRequire(import.meta.url)("./notes.js");
const words = (t) => t.split(/\s+/).length;
const secs = (t) => Math.round(words(t) / 2.5);
const slides = [
  ["1 · Cover", "cover"], ["2 · Problem & market", "problem"], ["3 · Idea & solution", "solution"],
  ["4 · Business model & why we win", "business"], ["5 · Tech stack", "tech"], ["6 · Future scope", "future"],
  ["7 · Conclusion", "conclusion"], ["8 · Prototype showcase (supporting, only if time allows)", "showcase"],
];
let md = `# Pause & Verify — pitch script

Technovanza Prototype Competition, Consensio 2026 · Team Commit&Run (Veeshal D Bodosa, Mrinmoy Banikya, Deepjyoti Dey)

About a minute per slide at a calm pace (~150 words a minute); Problem & market runs longer on purpose. The same text is in each slide's speaker notes.
Live: https://pauseverify.vercel.app · Code: https://github.com/vxwshxl/pauseverify

`;
for (const [h, k] of slides) md += `## ${h}  _(~${secs(N[k])} s)_\n\n${N[k]}\n\n`;
md += `## Sources for the Problem & market slide

| Figure | Source |
|---|---|
| ₹22,845.73 crore lost to cyber fraud in 2024, vs ₹7,465.18 crore in 2023 (+206%); 36,37,288 financial-fraud incidents; ₹5,489 crore saved | MHA written reply in the Lok Sabha, 22 July 2025 (MoS Home Bandi Sanjay Kumar), data from I4C's NCRP and CFCFRMS. Reported by PTI: [The Week](https://www.theweek.in/wire-updates/business/2025/07/22/del23-lsq-cyber-fraud.html), [India TV](https://www.indiatvnews.com/technology/news/indians-lost-over-rs-22-845-crore-to-cyber-fraud-in-2024-incidents-skyrocket-by-206-government-2025-07-22-1000037), [Morung Express](https://morungexpress.com/2268-lakh-cyber-crimes-registered-over-rs-22845-crore-lost-by-citizens-in-2024-centre) |
| "Digital arrest": ₹91 cr (2022), ₹339 cr (2023), ₹1,935.51 cr (2024); 1,23,672 cases in 2024 | MHA reply in Parliament, 2025: [Inc42](https://inc42.com/buzz/indians-lost-inr-1935-cr-to-digital-arrest-scams-in-2024-govt), [The Wire](https://thewire.in/tech/indians-lost-nearly-rs-2000-crore-to-digital-arrest-scams-in-2024-report). (ThePrint, citing I4C, gives ₹1,918 cr — say "about ₹1,900 crore" if asked.) |
| 88.6 crore active internet users in 2024; 48.8 crore rural (55%), 39.7 crore urban | IAMAI–Kantar, *Internet in India 2024* (Jan 2025): [report PDF](https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf), [Business Today](https://www.businesstoday.in/amp/technology/news/story/indias-internet-revolution-key-insights-from-kantar-and-iamai-report-461043-2025-01-16) |
| Year-1 target, plans, unit economics, cash model | Team's own estimates — labelled as such on the slides |

Note: some outlets quote 22.68 lakh NCRP complaints for 2024; the 36.37 lakh figure combines NCRP and CFCFRMS financial-fraud incidents. If a judge asks, say "36 lakh financial-fraud reports across both I4C systems."

## Likely judge questions

**It's free — how does it make money?**
Families never pay; institutions do. Banks and fintechs pay about ₹2 per active user a month to ship it inside their own app with a scam-trend dashboard — less than the cost of one fraud claim. Colleges and companies pay ₹99 a seat a year (dashboard, scam drills). Districts and CSR programmes fund training and kiosks. Checking runs on the user's device, so a free user costs us almost nothing; we only pay for AI when someone asks. We never sell data.

**What works offline?**
Everything that decides: the scam check and score, fake and look-alike link warnings, the .bank.in rule, who a UPI QR pays and how much, underlines, the alert, pausing fake links, masking, and ready answers to common questions. Needs internet: translation, read-aloud, free-form AI answers, and reading text inside pictures.

**Can it read images? How good is the OCR?**
Three ways in: drag "Look" over any part of the screen, right-click an image, or upload a screenshot on the website. QR codes are decoded on the device (jsQR). The words are read by Gemma 3 27B, a vision model that handles Indian scripts; text that is already on the page is taken exactly from the page, and the model only fills in what's inside images. Our engine — not the AI — then judges it. About 8 seconds from screenshot to verdict.

**Is it private? What about my OTPs?**
The check happens in the browser; nothing is sent. Only if you ask the AI is the message sent — with OTPs, phone, card and account numbers and emails masked first — over HTTPS, and nothing is stored. Show https://pauseverify.vercel.app/privacy: it shows the exact request, masked, and what the network sees.

**Won't it cry wolf?**
We tested on live sites: quiet on Wikipedia, NDTV and Flipkart; on scam-awareness pages (ScamDekho, OneIndia, Mokokchung Times) it underlines only the quoted scam SMS and doesn't pop an alert. Bank menus like "Update KYC" are skipped as navigation. 21 automated tests guard these cases.

**How would you build the phone app, and how long? (Not built yet — 3 months.)**
- *Android first:* most Indian users and scam SMS are there. Kotlin, or React Native/Expo to reuse our TypeScript engine as-is.
- *Reading messages:* SMS access needs Google Play's SMS-permission review — the surest route is offering to be the user's SMS app; a NotificationListenerService (notification access) covers WhatsApp, Telegram and email previews. Everything is read on the phone.
- *Same engine:* the TypeScript rules run inside the app (Hermes/JS engine), so a scam SMS is flagged before it's opened, offline.
- *Calls:* Android's CallScreeningService to warn about reported scam numbers (from 1930/community lists), and later on-device speech detection of "digital arrest" phrases.
- *Languages and AI:* the same Vercel API for translation, voice and answers; a small on-device model later.
- *iOS:* Apple doesn't let apps read SMS, so an SMS Filter (Message Filter) extension plus a share-sheet "Check this".
- *Distribution:* free on Play Store, and a white-label SDK for banks' own apps — the business model.
- *Timeline: 3 months.* Month 1–2: Android app (SMS + notification guard, share-to-check, QR scanner) on the existing engine and API. Month 3: caller warnings, bank SDK, family mode, trend dashboard, iOS filter. Fast because the engine, languages and API already work.

**Why not just use Truecaller?**
Truecaller identifies callers and spam senders. It doesn't read the message and explain *why* it's a scam, check the link, decode a UPI QR, or speak Bodo, Khasi or Mizo. We explain the exact message, in the reader's language, and show a safe way to check.

**Which AI models, and why?**
Bhashini (MeitY) — the only service covering Bodo, Khasi, Mizo and Manipuri; Sarvam-105B — an Indian model for plain answers; Gemma 3 27B — open-weights vision. The verdict always comes from our own rules, so it's fast, explainable and testable.
`;
fs.writeFileSync(process.argv[2], md);
console.log(slides.map(([h, k]) => `${h}: ${words(N[k])} words ≈ ${secs(N[k])} s`).join("\n"));
