# Pause & Verify

Hackathon project (PS05 anti-scam assistant). pnpm + Turborepo monorepo — a second surface
(the extension) exists, so this follows TECH_STACK §2b. Standards: `/Users/vee/Web Dev/standards/`.

## Deliberate deviations from the standards

| Deviation | Why |
|---|---|
| **Light mode only** — no dark mode, no theme toggle | Product decision by Vee (2026-11-14). The island must look identical on every site and OS setting. Don't reintroduce `next-themes` or `.dark` rules. |
| Island styles are plain CSS (`packages/island/src/island.css`, `pv-` prefix), not Tailwind | They're injected into the extension's Shadow DOM, where Tailwind v4's document-level `@property` rules don't apply. The reset is wrapped in `:where()` so component classes always win — keep it that way. |
| No Supabase | Nothing is stored. The "reviewed source list" is code-reviewed (`directory.ts`). |

## Things that will bite you

- **The engine decides; AI never does.** Vision only transcribes, Sarvam only explains. Keep
  scoring in `packages/engine` so it stays instant, offline and testable (`pnpm --filter @pv/engine test`).
- **Bhashini translates "scam" as "calendar" in Assamese.** `server/bhashini.ts` rewrites
  scam→fraud before translating. Keep it.
- **Languages:** English, Hindi + 7 Northeast languages Bhashini serves (as, brx, bn, mni, ne, kha, lus;
  checked 2026-11-14 — Garo and Kokborok are not available). Translation into/out of Manipuri must use
  the AI4Bharat model (IIIT-H returns Bengali-script nonsense) and its output needs `fixMeitei`.
  Read-aloud exists only for en, hi, as, brx, bn, ne (`SPEAKABLE`, kept in sync in island + server).
  Meitei Mayek needs the bundled Noto Sans Meetei Mayek font (web public/ and extension public/).
- **The scanner separates paragraphs with "\n"** when joining a block's text; gluing them made
  "…appear." + "Live demo" read as the link `appear.live` (a false alarm).
- **The scanner skips navigation** (nav/header/footer/menus, and blocks that are >60% link text) and
  puts a space between text from different inline elements. Both came from real-site false alarms:
  SBI's "Update KYC" menu item, and Flipkart's footer "© 2007-2026" + "Flipkart.com" read as a domain.
- **Sarvam needs `reasoning_effort: null`** or short answers come back empty.
- **Typed chat questions go to the AI first**; canned answers (`answers.ts`) are only for the
  suggestion chips and as offline fallback. Regex-matching free text gave wrong answers.
- **Extension → API goes through the background worker** (`utils/api.ts` relayPost); content
  scripts are bound by the page's CORS. API keys never ship in the extension.
- **The content script skips our own site** (API_URL origin) so the web demo doesn't get two islands.
- **Highlights use the CSS Custom Highlight API** — never wrap page text in spans; it breaks
  React apps like WhatsApp Web.
- `isolateEvents: true` on the shadow UI stops chat typing from firing site shortcuts (Gmail).
- Directory entries show as "verified" only when `reviewed` is set by a person.

## Commands

```bash
pnpm --filter @pv/web dev            # site + API on :3000
pnpm --filter @pv/extension build    # .output/chrome-mv3 (load unpacked)
pnpm -r typecheck && pnpm --filter @pv/engine test
```
