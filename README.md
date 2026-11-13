# Pause & Verify

**Pause before you pay.** A calm second opinion on suspicious messages — right where they appear.

Pause & Verify lives as a small island at the bottom of your browser. When a message tries to
rush, scare or trick you, it underlines the warning signs in the message itself, explains them in
plain language (English, অসমীয়া, बड़ो or हिन्दी), and shows a safe way to check. Built for
problem statement **PS05 — Smart Anti-Scam Assistant**.

## What it does

| | |
|---|---|
| **Watches quietly** | Reads message-sized text on any page (WhatsApp Web, Gmail, SMS web…) **on the device**. Nothing is stored or sent while it watches. |
| **Stops you at the risky moment** | Urgency, threats, OTP/KYC requests, fake prizes, "new number" family scams, "digital arrest", remote-access apps, unofficial contact numbers. Red flags are underlined in place; the island springs open. |
| **Checks links** | Look-alike domains (`sbi-kyc-verify.xyz`, `amaz0n`), risky TLDs, shorteners, IP addresses, punycode, and links whose text says one site but go to another. Hover shows a warning; clicking a fake link **pauses** it first. |
| **Reads QR codes exactly** | Decodes UPI QRs on the device: *"This QR sends ₹5,000 to refund.desk7@okaxis."* You never scan to receive money. |
| **Looks at your screen** | Drag a box around anything (Alt+Shift+L). The cropped screenshot is read by a vision model, then judged by the same engine. |
| **Explains and helps** | Plain-language reasons, step-by-step safe checks, the official app/site from a reviewed list, read-aloud, and a helper chat (Sarvam AI) for "I already clicked / shared my OTP / paid". |
| **Speaks your language** | Every explanation and the chat in English, Assamese, Bodo and Hindi (Bhashini), with read-aloud. |

## How it's built

```
packages/engine     On-device scam engine (TypeScript): multilingual rules, link analysis,
                    UPI QR parsing, curated official directory, scoring, safe steps, masking.
packages/island     The island UI (React + Motion, plain CSS that works in a Shadow DOM),
                    on-page highlights, Look overlay, and client services for the API.
apps/web            Next.js 16 site: landing, /demo inbox, /check (paste or screenshot),
                    and the API: /api/translate, /api/speak, /api/chat, /api/vision.
apps/extension      Chrome MV3 extension (WXT + React): content-script island, CSS Highlight
                    API underlines, link guard, screen capture for Look, popup settings.
```

| Job | Service | Why |
|---|---|---|
| Scam decision | **On-device engine** | Instant, private, works offline, explainable |
| Translation + read-aloud | **Bhashini** (Govt. of India) | Assamese and Bodo support |
| Helper chat | **Sarvam-105B** | Indian LLM, calm short answers |
| Reading screenshots | **Gemma 3 27B** (via Hugging Face) | Vision; it only reads — the engine decides |

**Privacy.** Watching happens entirely in the browser. Text is sent to the server only when the
person asks (chat, translate, Look), and OTPs, phone, card and account numbers are masked first.
API keys stay on the server — the extension relays through its background worker.

## Run it

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # add Bhashini, Sarvam and HF keys
pnpm --filter @pv/web dev                      # http://localhost:3000
pnpm --filter @pv/engine test                  # engine tests
```

### Load the extension

```bash
cp apps/extension/.env.example apps/extension/.env   # WXT_API_URL → your deployed site
pnpm --filter @pv/extension build
```
Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → `apps/extension/.output/chrome-mv3`.

### Deploy the site (Vercel)

Import the repo, set **Root Directory** to `apps/web`, add the four keys from `.env.example`.
Then rebuild the extension with `WXT_API_URL` set to the Vercel URL.

## Demo script (3 minutes)

1. `/` — the hero shows the problem statement's own example, already caught.
2. `/demo` → open **VM-SBIBNK**: island alerts, flags underlined, *Show me why* → reasons, fake link, safe steps, Call 1930.
3. Switch the sheet to **অসমীয়া** or **बड़ो**, press read-aloud.
4. Open **Refund Desk** → scan icon → drag over the QR: *"This QR sends ₹5,000."*
5. Ask the chat: *"I already shared my OTP"* or anything in your own words.
6. Real web: with the extension loaded, open a page with a scam message → underlines and island appear; click the fake link → **Paused**.

## Notes

- Sample messages mirror real Indian scam patterns; all names, numbers and domains are invented.
- The official directory (`packages/engine/src/directory.ts`) is shown as *verified* only after a
  person reviews each entry — see `reviewed`.
- Light mode only, by product decision.
