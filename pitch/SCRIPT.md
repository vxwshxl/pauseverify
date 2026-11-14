# Pause & Verify — pitch script

Technovanza Prototype Competition, Consensio 2026 · Team Commit&Run (Veeshal D Bodosa, Mrinmoy Banikya, Deepjyoti Dey)

About a minute per slide at a calm pace (~150 words a minute); Problem & market runs longer on purpose. The same text is in each slide's speaker notes.
Live: https://pauseverify.vercel.app · Code: https://github.com/vxwshxl/pauseverify

## 1 · Cover  _(~57 s)_

Good morning, judges. We are Team Commit&Run: I'm Veeshal, with Mrinmoy and Deepjyoti, B.Tech CSE at The Assam Royal Global University. Our project is Pause & Verify, a calm anti-scam assistant for India. The idea in one line: every scam works by rushing you past the moment you would have checked. So we built something that gives you that moment back: a small island in the corner of your browser that notices a scam message, underlines exactly what is wrong, explains it in your own language, and shows you a safe way to check. The check runs on your own device, it is free for families, and it speaks Assamese, Bodo, Manipuri, Khasi, Mizo, Nepali and Bengali as well as Hindi and English. In the next few minutes: the problem, how it works, how it earns, the technology, and where it goes next.

## 2 · Problem & market  _(~111 s)_

Let's start with the scale. In a written reply to the Lok Sabha on 22 July 2025, the Ministry of Home Affairs said Indians lost 22,845 crore rupees to cyber fraud in 2024, up from 7,465 crore in 2023. That is a 206 percent jump in a single year. These figures come from I4C, the Indian Cyber Crime Coordination Centre, which runs the National Cyber Crime Reporting Portal and the 1930 helpline system: 36.4 lakh financial-fraud incidents were reported in 2024, about ten thousand every single day. One scam shows how fast this is moving: the 'digital arrest', where fake police keep you on a video call until you pay. Losses went from 91 crore in 2022, to 339 crore in 2023, to 1,935 crore in 2024, twenty-one times in two years, again from MHA's replies in Parliament. Now look at who is online. The IAMAI and Kantar 'Internet in India 2024' report counts 88.6 crore active internet users, and 48.8 crore of them, 55 percent, live in rural India. Many are first-time users reading in their own language, exactly the people least used to spotting a fake bank link. And every scam follows the same five steps: an urgent SMS, fear, a tap on a link, an OTP shared, and the money is gone. A spam filter may block a message, but nobody tells you why, or how to check. Why now: reporting fast works, 5,489 crore rupees were saved in 2024 by stopping fraudulent transactions; banks are moving to .bank.in addresses, which makes fake links easier to catch; and AI can finally speak Bodo, Khasi and Mizo. Our year-one target is 50,000 users in Assam.

## 3 · Idea & solution  _(~76 s)_

Pause & Verify is a small island in the corner of your screen, and you can drag it anywhere so it never hides a website's own buttons. It reads the page the way you do. When a message rushes you, scares you, or asks for an OTP, PIN or KYC update, three things happen. One: the exact words are underlined right inside the message. Two: the island stops you, 'Hold on, this looks like a scam', with the reasons. Three: it shows a safe way to check: open the official app yourself, type the real .bank.in address, or call 1930. It pauses fake links before they open, including links whose text says one website but go to another. It decodes UPI QR codes and tells you the truth, 'this QR sends 5,000 rupees', because you never scan a QR to receive money. Drag 'Look' over a screenshot or a poster and it reads that too. You can ask questions in your own words, in nine languages, and hear the answer read aloud. The key design choice: our engine makes the decision on the device; AI only reads and explains.

## 4 · Business model & why we win  _(~70 s)_

Families never pay, and that is deliberate: a free tool is how it reaches the people who need it. So who pays? The institutions that lose money when their customers are scammed. Banks and fintechs pay about two rupees per active user a month to put Pause & Verify inside their own app, with an anonymous scam-trend dashboard, which costs them less than handling a single fraud claim. Colleges and companies pay 99 rupees a seat a year for an admin dashboard and scam drills. Districts and CSR programmes fund training and kiosks linked to 1930. One bank with 50,000 active users brings one lakh rupees a month and leaves about 65,000 after AI, cloud, support and content, because the checking runs on the user's own device and costs us nothing; we only pay when someone asks the AI. We never sell data. Why we win: spam filters and bank SMS alerts don't explain anything, and awareness ads are generic. We explain the exact message, right where you read it, in seven Northeast languages.

## 5 · Tech stack  _(~78 s)_

Here is how it is built. The left half runs on your device and works offline. The Chrome extension is built with WXT on Manifest V3 and React; it reads pages as they change and underlines with the browser's Highlight API, so it never breaks apps like WhatsApp Web. The scam engine is plain TypeScript: ten warning-sign rules across five scripts, look-alike and .bank.in link checks, a UPI QR decoder, and masking of OTPs, phone and card numbers and emails, covered by 18 automated tests. The right half goes online only when you ask. Our Next.js API on Vercel keeps every key on the server, is rate-limited and stores nothing. It calls Bhashini, the government's language platform, for translation and voice in nine languages; Sarvam's 105-billion-parameter model for plain answers; and Google's open Gemma 3 vision model to read screenshots. Offline you still get the full check, link warnings, the QR truth, alerts and ready answers. For images, the QR is decoded on the device, Gemma reads the words in any script, and our engine judges, in about eight seconds. Our live privacy page shows exactly what leaves your device: masked, encrypted, and never stored.

## 6 · Future scope  _(~64 s)_

The browser is where we proved it. The phone is where most scams arrive, so next is an Android app: think Truecaller, but for scam messages. It reads SMS and notifications on the phone itself and holds back a scam SMS before you open it, with the same explanation in your language. It covers WhatsApp, Telegram and email notifications, lets you share any message to check it, warns you about scam callers using 1930 and community reports, and has a safe UPI QR scanner. After that: a bank SDK so banks ship it inside their own apps; a live-call guard for 'digital arrest' calls; a family mode that alerts a trusted relative when an elderly parent receives a high-risk message; an anonymous scam-trend dashboard for banks and I4C; and Garo and Kokborok as soon as Bhashini supports them. Privacy stays the rule: a small model runs on the phone, messages never leave it, and only anonymous counts are shared, with consent.

## 7 · Conclusion  _(~50 s)_

To close. Scams win by rushing people; Pause & Verify gives them a pause, in their own language. And this isn't a promise: we tested it on live websites. It underlined the scam messages quoted by Mokokchung Times, OneIndia and ScamDekho without raising false alarms on those advice pages, and it stayed completely quiet on Wikipedia, NDTV and Flipkart. Eighteen of eighteen engine tests pass, it speaks nine languages, and it stores zero messages. It serves four Sustainable Development Goals: justice, reduced inequality through local languages, innovation, and safer digital payments. In the next 90 days: the Chrome Web Store, three colleges, an Android beta and a first bank pilot. Scan the code to try it right now. Thank you. We're happy to take your questions.

## 8 · Prototype showcase (supporting, only if time allows)  _(~39 s)_

Supporting slide, if time allows. On the left, the extension on a message page: the warning signs are underlined in place and the island raises the alert. In the middle, the same explanation in Assamese, and the QR truth: this QR sends 5,000 rupees. Below, a fake link paused before it opens: the text says onlinesbi.sbi, but it really goes somewhere else. Nine languages, seven of them from the Northeast; eighteen of eighteen engine tests pass; and a screenshot becomes a verdict in about eight seconds. The code is public on GitHub, and the site is live.

## Sources for the Problem & market slide

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
We tested on live sites: quiet on Wikipedia, NDTV and Flipkart; on scam-awareness pages (ScamDekho, OneIndia, Mokokchung Times) it underlines only the quoted scam SMS and doesn't pop an alert. Bank menus like "Update KYC" are skipped as navigation. 18 automated tests guard these cases.

**How would you build the phone app? (We haven't built it yet.)**
- *Android first:* most Indian users and scam SMS are there. Kotlin, or React Native/Expo to reuse our TypeScript engine as-is.
- *Reading messages:* SMS access needs Google Play's SMS-permission review — the surest route is offering to be the user's SMS app; a NotificationListenerService (notification access) covers WhatsApp, Telegram and email previews. Everything is read on the phone.
- *Same engine:* the TypeScript rules run inside the app (Hermes/JS engine), so a scam SMS is flagged before it's opened, offline.
- *Calls:* Android's CallScreeningService to warn about reported scam numbers (from 1930/community lists), and later on-device speech detection of "digital arrest" phrases.
- *Languages and AI:* the same Vercel API for translation, voice and answers; a small on-device model later.
- *iOS:* Apple doesn't let apps read SMS, so an SMS Filter (Message Filter) extension plus a share-sheet "Check this".
- *Distribution:* free on Play Store, and a white-label SDK for banks' own apps — the business model.

**Why not just use Truecaller?**
Truecaller identifies callers and spam senders. It doesn't read the message and explain *why* it's a scam, check the link, decode a UPI QR, or speak Bodo, Khasi or Mizo. We explain the exact message, in the reader's language, and show a safe way to check.

**Which AI models, and why?**
Bhashini (MeitY) — the only service covering Bodo, Khasi, Mizo and Manipuri; Sarvam-105B — an Indian model for plain answers; Gemma 3 27B — open-weights vision. The verdict always comes from our own rules, so it's fast, explainable and testable.
