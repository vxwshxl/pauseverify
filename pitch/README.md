# Pitch deck — Technovanza Prototype Competition

Same structure as the team's SchoolERP deck for Noesis (cover, problem & market, idea & solution,
business model, implementation & financial plan, conclusion, prototype showcase), in the
Pause & Verify theme.

1. `node shots.mjs` — product screenshots (needs `pnpm --filter @pv/web dev` on :3000 and the
   extension test page on :8765).
2. `node prep.js` — backgrounds, mark, MacBook frames, island cards → `assets/`.
3. `SKILL=<pptx skill dir> NODE_PATH=./node_modules node build.js deck.pptx`
   (deps: pptxgenjs, sharp, react, react-dom, react-icons, qrcode, playwright).

Figures and sources: MHA Lok Sabha reply (July 2025, I4C: NCRP + CFCFRMS) — ₹22,845.73 crore lost
in 2024 vs ₹7,465.18 crore in 2023; 36,37,288 financial-fraud incidents; ₹5,489 crore saved.
"Digital arrest": ₹91 cr (2022), ₹339 cr (2023), ₹1,935.51 cr (2024). IAMAI–Kantar Internet in
India 2024: 886 M active users, 488 M rural. Plans, unit economics and the cash model are the
team's own estimates and are labelled as such on the slides.
