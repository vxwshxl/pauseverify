// Team Commit&Run — Pause & Verify, Technovanza Prototype Competition, Consensio 2026.
// Same structure and layout system as the SchoolERP deck made for Noesis; Pause & Verify theme.
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const QRCode = require("qrcode");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const L = require("react-icons/lu");
const { applyTheme } = require(process.env.SKILL + "/scripts/apply_theme.js");
const CH = require("./charts.js");
const NOTES = require("./notes.js");

const OUT = process.argv[2] || "deck.pptx";
const A = (f) => path.join(__dirname, "assets", f);
const LIVE = process.env.LIVE_URL || "pauseverify.vercel.app";

// ── palette: Pause & Verify (warm ink, coral, amber) ─────────────────────
const P = {
  ink: "1F1D1B", navy: "1F1D1B", panel: "2C2926", panel2: "3A3633", coral: "E8505B", coralInk: "C2333F", coralLt: "FF8A90",
  lav: "FBF8F6", card: "FFFFFF", line: "E6E1DC", soft: "FBEDEE", soft2: "F4EFEA",
  text: "2B2826", muted: "6A6A6A", slate: "8C857E", ltext: "D6D0CA", ltext2: "A8A29E",
  amber: "F5A524", amberInk: "8A5300", green: "0B7A53",
};
const THEME = {
  name: "Pause and Verify Pitch",
  headFontFace: "Arial",
  bodyFontFace: "Arial",
  colors: {
    dk1: P.ink, lt1: "FFFFFF", dk2: P.text, lt2: P.lav,
    accent1: P.coral, accent2: P.amber, accent3: P.coralInk, accent4: P.panel2, accent5: P.slate, accent6: P.green,
    hlink: P.coralInk, folHlink: P.panel2,
  },
};
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;

async function icon(name, color) {
  const svg = renderToStaticMarkup(React.createElement(L[name], { size: 256, color: "#" + color, strokeWidth: 2 }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString("base64");
}
function pchip(pts, n) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), k = xs.length;
  const d = [], m = new Array(k);
  for (let i = 0; i < k - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[k - 1] = d[k - 2];
  for (let i = 1; i < k - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  const out = [];
  for (let x = 0; x < n; x++) {
    let i = 0; while (i < k - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t, h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
    out.push(+(h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]).toFixed(2));
  }
  return out;
}

(async () => {
  const qr = await QRCode.toDataURL("https://" + LIVE, { width: 1000, margin: 1, color: { dark: "#1F1D1B", light: "#FFFFFF" }, errorCorrectionLevel: "M" });
  const ICON = {};
  const ic = async (n, c) => (ICON[n + c] ||= await icon(n, c));

  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Pause & Verify — Team Commit&Run";
  pres.author = "Team Commit&Run";
  pres.company = "Team Commit&amp;Run";
  pres.subject = "Technovanza Prototype Competition, Consensio 2026";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };

  const FOOT = "Pause & Verify  ·  Team Commit&Run  ·  Technovanza, Consensio 2026";
  const layout = (title, bgFile, dark) => pres.defineSlideMaster({
    title,
    background: { path: A(bgFile) },
    objects: [
      { line: { x: M, y: 6.93, w: CW, h: 0, line: { color: dark ? "3A3633" : P.line, width: 0.75 } } },
      { text: { text: FOOT, options: { x: M, y: 7.0, w: 7, h: 0.28, fontSize: 9, color: dark ? P.ltext2 : P.muted, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 0.42, w: CW, h: 0.62, fontSize: 30, bold: true, color: dark ? "FFFFFF" : P.ink, valign: "middle", align: "left", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: M, y: 1.04, w: CW, h: 0.42, fontSize: 16, color: dark ? P.ltext : "5E5852", valign: "top", align: "left", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: W - M - 1.0, y: 7.0, w: 1.0, h: 0.28, fontSize: 9, color: dark ? P.ltext2 : P.muted, align: "right", margin: 0 },
  });
  layout("Light", "bg-light.png", false);
  layout("Dark", "bg-dark.png", true);
  layout("Ink", "bg-ink.png", true);
  pres.defineSlideMaster({ title: "Cover", background: { path: A("bg-dark.png") }, objects: [] });

  const T = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontSize: 12, color: P.text, valign: "top", ...o });
  const box = (s, x, y, w, h, fill, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: o.r ?? 0.1, fill: { color: fill, transparency: o.t ?? 0 }, line: { color: o.line || fill, width: o.lw ?? (o.line ? 1 : 0) },
    shadow: o.shadow ? { type: "outer", color: "1F1D1B", opacity: 0.1, blur: 10, offset: 3, angle: 90 } : undefined, objectName: o.name || "panel",
  });
  const pill = (s, x, y, w, h, text, fill, color, size = 11) => {
    box(s, x, y, w, h, fill, { r: h / 2, name: "pill " + text });
    T(s, text, { x, y, w, h, fontSize: size, bold: true, color, align: "center", valign: "middle", charSpacing: 1 });
  };
  const iconChip = async (s, x, y, d, name, fill, color) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: name + " chip" });
    s.addImage({ data: await ic(name, color), x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, objectName: name, altText: "" });
  };
  const slide = (master, sec, title, sub) => {
    const s = pres.addSlide({ masterName: master, sectionTitle: sec });
    s.addText(title, { placeholder: "title" });
    if (sub) s.addText(sub, { placeholder: "sub" });
    return s;
  };
  const src = (s, text, dark, y = 6.62) => T(s, text, { x: M, y, w: CW, h: 0.24, fontSize: 9, color: dark ? P.ltext2 : P.muted });
  const MB = 2400 / 1539;
  const ratio = async (f) => { const m = await require("sharp")(A(f)).metadata(); return m.width / m.height; };
  const SHEET = await ratio("card-sheet-as.png"), SHEET_QR = await ratio("card-sheet-qr.png"), PAUSED = await ratio("card-paused.png");

  // ════ 1 · Cover ═══════════════════════════════════════════════════════
  pres.addSection({ title: "Opening" });
  {
    const s = pres.addSlide({ masterName: "Cover", sectionTitle: "Opening" });
    // Event mark (swap in the official Technovanza logo when available).
    T(s, [{ text: "TECHNOVANZA", options: { fontSize: 30, bold: true, color: "FFFFFF", charSpacing: 3, breakLine: true } }, { text: "PROTOTYPE COMPETITION", options: { fontSize: 12, bold: true, color: P.coralLt, charSpacing: 4 } }],
      { x: M, y: 0.55, w: 5, h: 0.95, objectName: "Technovanza event mark" });
    pill(s, 7.9, 0.66, 4.83, 0.44, "CONSENSIO 2026  ·  ROYAL GLOBAL UNIVERSITY", P.panel, P.ltext, 11);
    s.addShape(pres.shapes.OVAL, { x: 7.7, y: 1.5, w: 5.4, h: 5.4, fill: { color: P.coral, transparency: 84 }, line: { color: P.coral, width: 0, transparency: 100 }, objectName: "glow" });
    s.addImage({ path: A("mark.png"), x: M, y: 2.05, w: 1.2, h: 1.2, objectName: "Pause & Verify mark", altText: "Pause & Verify logo" });
    T(s, "Pause & Verify", { x: 1.98, y: 2.0, w: 6.0, h: 1.0, fontSize: 54, bold: true, color: "FFFFFF", valign: "middle" });
    T(s, "a calm anti-scam assistant for India", { x: 2.02, y: 2.95, w: 5, h: 0.32, fontSize: 15, color: P.ltext });
    T(s, "Pause before you pay. A second opinion on suspicious messages, right where they appear.", { x: M, y: 3.6, w: 7.0, h: 0.95, fontSize: 22, color: "FFFFFF" });
    pill(s, M, 4.85, 2.25, 0.46, "CYBERSECURITY", P.coral, "FFFFFF", 12);
    pill(s, M + 2.4, 4.85, 2.4, 0.46, "AI · ON-DEVICE", P.panel2, "FFFFFF", 12);
    pill(s, M + 4.95, 4.85, 2.25, 0.46, "SDG 16 · JUSTICE", P.amber, P.ink, 12);
    T(s, [
      { text: "Team Commit&Run", options: { fontSize: 20, bold: true, color: "FFFFFF", breakLine: true } },
      { text: "Veeshal D Bodosa   ·   Mrinmoy Banikya   ·   Deepjyoti Dey", options: { fontSize: 15, color: P.ltext, breakLine: true } },
      { text: "B.Tech CSE, 5th semester   ·   The Assam Royal Global University", options: { fontSize: 12, color: P.ltext2 } },
    ], { x: M, y: 5.62, w: 7.2, h: 1.25, paraSpaceAfter: 4 });
    s.addImage({ path: A("macbook-ext.png"), x: 7.75, y: 2.0, w: 5.2, h: 5.2 / MB, objectName: "Extension on a laptop", altText: "Pause & Verify catching a fake bank SMS on a web page" });
    s.addImage({ path: A("card-paused.png"), x: 8.4, y: 5.25, w: 3.9, h: 3.9 / PAUSED, objectName: "Paused link card", altText: "Paused. This link isn't what it seems." });
    s.addNotes(NOTES.cover);
  }

  // ════ 2 · Problem & market ════════════════════════════════════════════
  pres.addSection({ title: "Problem & market" });
  {
    const s = slide("Light", "Problem & market", "PROBLEM & MARKET", "Indians lost ₹22,846 crore to cyber fraud in 2024, three times more than the year before.");
    const cols = [M, M + 4.16, M + 8.32], cw = 3.81, ch = 2.3;
    ["Money lost to cyber fraud (₹ crore)", "“Digital arrest” losses (₹ crore)", "Who is online now (crore people)"].forEach((h, i) => T(s, h, { x: cols[i], y: 1.6, w: cw, h: 0.3, fontSize: 14, bold: true, color: P.ink }));
    await CH.columns(A("c-loss.png"), cw, ch, ["2023", "2024"], [7465, 22846], [P.slate, P.coral], {
      max: 27000, bar: 0.46, fmt: (v) => v.toLocaleString("en-IN"),
      extra: ({ slot, left, top }) => CH.text(left + slot * 0.98, top + CH.pt(30), "+206%\nin a year", { size: 13, bold: true, color: P.coralInk, anchor: "middle" }),
    });
    s.addImage({ path: A("c-loss.png"), x: cols[0], y: 1.95, w: cw, h: ch, objectName: "Cyber fraud losses chart", altText: "Money lost to cyber fraud in India: ₹7,465 crore in 2023, ₹22,846 crore in 2024" });
    await CH.columns(A("c-arrest.png"), cw, ch, ["2022", "2023", "2024"], [91, 339, 1936], [P.slate, P.slate, P.coral], {
      max: 2300, fmt: (v) => v.toLocaleString("en-IN"),
      extra: ({ slot, left, top }) => CH.text(left + slot * 1.0, top + CH.pt(26), "21× in\ntwo years", { size: 13, bold: true, color: P.coralInk, anchor: "middle" }),
    });
    s.addImage({ path: A("c-arrest.png"), x: cols[1], y: 1.95, w: cw, h: ch, objectName: "Digital arrest losses chart", altText: "Digital arrest scam losses: ₹91 crore in 2022, ₹339 crore in 2023, ₹1,936 crore in 2024" });
    await CH.hbars(A("c-online.png"), cw, ch * 0.62, ["Rural India", "Urban India"], [48.8, 39.7], [P.coral, P.slate], { labelW: 1.2, rightPad: 0.7, max: 48.8, fmt: (v) => v.toFixed(1) });
    s.addImage({ path: A("c-online.png"), x: cols[2], y: 1.95, w: cw, h: ch * 0.62, objectName: "Internet users chart", altText: "Active internet users in India, 2024: 48.8 crore rural, 39.7 crore urban" });
    T(s, "Most new users are rural and first-time, often reading in their own language — the people least used to spotting a scam.", { x: cols[2], y: 1.95 + ch * 0.66, w: cw, h: 0.7, fontSize: 11.5, italic: true, color: P.coralInk });

    box(s, M, 4.45, 6.05, 1.9, "FFFFFF", { line: P.line, shadow: true, name: "problem card" });
    T(s, "THE PROBLEM", { x: M + 0.22, y: 4.58, w: 3, h: 0.26, fontSize: 13, bold: true, color: P.coral });
    ["Urgent SMS", "Fear", "Tap link", "Share OTP", "Money gone"].forEach((t, i) => {
      const x = M + 0.22 + i * 1.16;
      box(s, x, 4.92, 0.94, 0.34, i === 4 ? P.soft : P.soft2, { line: P.line, r: 0.06, name: "step " + t });
      T(s, t, { x, y: 4.92, w: 0.94, h: 0.34, fontSize: 10.5, bold: true, color: i === 4 ? P.coralInk : P.ink, align: "center", valign: "middle" });
      if (i < 4) T(s, "→", { x: x + 0.94, y: 4.92, w: 0.22, h: 0.34, fontSize: 12, color: P.coral, align: "center", valign: "middle" });
    });
    T(s, "Every scam rushes you past the moment you would have checked.", { x: M + 0.22, y: 5.36, w: 5.7, h: 0.26, fontSize: 12.5, bold: true, color: P.ink });
    T(s, [
      { text: "Parents ", options: { bold: true, color: P.ink } }, { text: "get fake ‘KYC’ texts   ·   " },
      { text: "Students ", options: { bold: true, color: P.ink } }, { text: "get task-job offers", options: { breakLine: true } },
      { text: "Elders ", options: { bold: true, color: P.ink } }, { text: "get ‘digital arrest’ calls; spam filters never say why" },
    ], { x: M + 0.22, y: 5.7, w: 5.75, h: 0.55, fontSize: 11.5, paraSpaceAfter: 2 });

    const mk = [["ONLINE · INDIA", "88.6 cr", "active internet users in 2024; 55% of them rural", P.ink, P.coralLt, "FFFFFF"],
      ["LOST IN 2024", "₹22,846 cr", "36.4 lakh fraud reports to I4C, about 10,000 a day", P.coral, "FFFFFF", "FFFFFF"],
      ["YEAR-1 TARGET", "50,000", "users in Assam: 10 colleges + 2 bank pilots", P.amber, P.ink, P.ink]];
    mk.forEach(([lab, big, cap, fill, lc, tc], i) => {
      const w = 1.9, x = M + 6.25 + i * (w + 0.09);
      box(s, x, 4.45, w, 1.9, fill, { shadow: true, name: lab });
      T(s, lab, { x: x + 0.16, y: 4.6, w: w - 0.25, h: 0.4, fontSize: 10, bold: true, color: lc, charSpacing: 0.5 });
      T(s, big, { x: x + 0.16, y: 5.0, w: w - 0.2, h: 0.5, fontSize: i === 1 ? 19 : 21, bold: true, color: tc, valign: "middle" });
      T(s, cap, { x: x + 0.16, y: 5.55, w: w - 0.28, h: 0.7, fontSize: 10.5, color: tc });
    });
    T(s, [{ text: "Why now   ", options: { bold: true, color: P.coralInk } }, { text: "reporting fast works — ₹5,489 cr already saved via 1930  ·  banks moved to .bank.in addresses  ·  AI now speaks Bodo, Khasi and Mizo" }], { x: M, y: 6.43, w: CW, h: 0.24, fontSize: 12, color: P.text });
    src(s, "Sources: MHA written reply, Lok Sabha, July 2025 (I4C: NCRP + CFCFRMS) · MHA/I4C digital-arrest data, Parliament reply 2025 · IAMAI–Kantar, Internet in India 2024. 1 crore = 10 million. Targets are ours.", false, 6.7);
    s.addNotes(NOTES.problem);
  }

  // ════ 3 · Idea & solution ═════════════════════════════════════════════
  pres.addSection({ title: "Solution" });
  {
    const s = slide("Light", "Solution", "IDEA & SOLUTION", "A small island in the corner of the screen (drag it anywhere) that stops you at the risky moment and explains why.");
    const flow = ["Message", "Checked", "Underlined", "Explained", "Safe check", "1930"];
    const LW = 8.35, fw = 1.22, gap = (LW - fw * 6) / 5;
    flow.forEach((t, i) => {
      const x = M + i * (fw + gap);
      box(s, x, 1.62, fw, 0.44, i === 0 ? P.coral : P.soft, { r: 0.08, name: "flow " + t });
      T(s, t, { x, y: 1.62, w: fw, h: 0.44, fontSize: 12.5, bold: true, color: i === 0 ? "FFFFFF" : P.ink, align: "center", valign: "middle" });
      if (i < 5) T(s, "→", { x: x + fw, y: 1.62, w: gap, h: 0.44, fontSize: 13, color: P.coral, align: "center", valign: "middle" });
    });
    T(s, [{ text: "Checked on the device, in milliseconds.  ", options: { bold: true, color: P.ink } }, { text: "AI only reads and explains; our engine decides." }], { x: M, y: 2.17, w: LW, h: 0.3, fontSize: 12.5 });
    const feats = [
      ["LuShieldAlert", "Pauses fake links", "Look-alike sites, links whose text says one site but go to another, and the .bank.in rule. Clicking a fake link pauses first."],
      ["LuQrCode", "Tells the truth about QRs", "Decodes UPI QRs on the device: “This QR sends ₹5,000”. You never scan a QR to receive money."],
      ["LuScanSearch", "Looks at anything", "Drag a box over a screenshot, poster or chat. Gemma vision reads it; the engine judges it."],
      ["LuLanguages", "7 Northeast languages", "Assamese, Bodo, Manipuri, Khasi, Mizo, Nepali, Bengali, plus Hindi — low-resource languages included, through Bhashini."],
      ["LuLock", "Private by design", "Checks run in the browser. Only what you ask about leaves it, with OTPs and numbers masked."],
      ["LuMessageCircle", "Ask in your own words", "“I shared my OTP” → block, call 1930, change passwords. Sarvam AI, grounded in the check."],
    ];
    const gw = (LW - 0.2) / 2;
    for (let i = 0; i < feats.length; i++) {
      const [n, h, b] = feats[i], x = M + (i % 2) * (gw + 0.2), y = 2.65 + Math.floor(i / 2) * 1.25;
      box(s, x, y, gw, 1.1, "FFFFFF", { line: P.line, shadow: true, name: h });
      await iconChip(s, x + 0.18, y + 0.2, 0.5, n, i === 0 ? P.coral : P.soft, i === 0 ? "FFFFFF" : P.coralInk);
      T(s, [{ text: h, options: { bold: true, fontSize: 14, color: P.ink, breakLine: true } }, { text: b, options: { fontSize: 11.5 } }], { x: x + 0.82, y: y + 0.14, w: gw - 0.98, h: 0.88, paraSpaceAfter: 3 });
    }
    s.addImage({ path: A("card-sheet-qr.png"), x: 9.05, y: 2.15, w: 2.45, h: 2.45 / SHEET_QR, objectName: "QR result sheet", altText: "Island sheet: This QR sends ₹5,000" });
    s.addImage({ path: A("card-sheet-as.png"), x: 10.45, y: 1.55, w: 2.45, h: 2.45 / SHEET, objectName: "Assamese sheet", altText: "Island sheet explaining a scam in Assamese" });
    src(s, "Sources: Pause & Verify prototype (engine tests: every scam sample high risk, genuine OTP and Amazon messages safe) · Bhashini (MeitY) · Sarvam AI · Gemma 3 (Google, open weights).", false, 6.62);
    s.addNotes(NOTES.solution);
  }

  // ════ 4 · Business model & why we win ═════════════════════════════════
  pres.addSection({ title: "Business" });
  {
    const s = slide("Dark", "Business", "BUSINESS MODEL & WHY WE WIN", "Free for families, so it spreads. Banks, campuses and districts pay, because every scam stopped saves them money.");
    const plans = [["Families", "₹0", "  forever", "Extension + web checker, nine languages, read-aloud"], ["Banks & fintech", "₹2", "  / active user / month", "White-label in their app + scam-trend dashboard"], ["Campus & work", "₹99", "  / seat / year", "Admin dashboard, scam drills, reporting"], ["Govt & CSR", "₹5 L", "  / district / year", "Training, kiosks, 1930 tie-in"]];
    const pw = (CW - 3 * 0.15) / 4;
    plans.forEach(([n, p, unit, d], i) => {
      const x = M + i * (pw + 0.15), hi = i === 1;
      box(s, x, 1.62, pw, 1.25, hi ? P.panel2 : "161413", { t: hi ? 0 : 30, line: hi ? P.coral : "3A3633", lw: hi ? 1.5 : 1, name: n + " plan" });
      T(s, n.toUpperCase(), { x: x + 0.2, y: 1.74, w: pw - 0.3, h: 0.26, fontSize: 11, bold: true, color: hi ? P.coralLt : P.ltext, charSpacing: 1 });
      T(s, [{ text: p, options: { fontSize: 24, bold: true, color: "FFFFFF" } }, { text: unit, options: { fontSize: 10.5, color: P.ltext } }], { x: x + 0.2, y: 1.98, w: pw - 0.3, h: 0.42, valign: "middle" });
      T(s, d, { x: x + 0.2, y: 2.42, w: pw - 0.35, h: 0.42, fontSize: 10.5, color: P.ltext });
    });

    box(s, M, 3.07, 5.95, 3.38, "FFFFFF", { name: "unit economics card" });
    T(s, "One bank partner, 50,000 active users, per month (₹)", { x: M + 0.22, y: 3.17, w: 5.6, h: 0.28, fontSize: 13, bold: true, color: P.ink });
    const wf = [["Revenue", 100000], ["AI & language", -8000], ["Cloud", -6000], ["Support", -14000], ["Content", -7000], ["Margin", 65000]];
    const baseY = 5.15, top = 3.8, scale = (baseY - top) / 100000, bw = 0.55, step = 0.92, x0 = M + 0.35;
    let run = 0;
    wf.forEach(([lab, v], i) => {
      const x = x0 + i * step;
      let yTop, h, col;
      if (i === 0) { yTop = baseY - v * scale; h = v * scale; col = P.slate; run = v; }
      else if (i === wf.length - 1) { yTop = baseY - v * scale; h = v * scale; col = P.coral; }
      else { yTop = baseY - run * scale; h = -v * scale; col = "E7D9D6"; run += v; }
      s.addShape(pres.shapes.RECTANGLE, { x, y: yTop, w: bw, h: Math.max(h, 0.02), fill: { color: col }, line: { color: col, width: 0 }, objectName: "wf " + lab });
      if (i < wf.length - 1) s.addShape(pres.shapes.LINE, { x: x + bw, y: i === 0 ? yTop : yTop + h, w: step - bw, h: 0, line: { color: "C9C2BA", width: 0.75, dashType: "dash" }, objectName: "wf link" });
      T(s, (v > 0 ? "" : "−") + Math.abs(v).toLocaleString("en-IN"), { x: x - 0.25, y: yTop - 0.25, w: bw + 0.5, h: 0.23, fontSize: 11, bold: true, color: P.ink, align: "center" });
      T(s, lab, { x: x - 0.25, y: baseY + 0.05, w: bw + 0.5, h: 0.22, fontSize: 10.5, color: P.text, align: "center" });
    });
    s.addShape(pres.shapes.LINE, { x: x0 - 0.1, y: baseY, w: step * 5 + bw + 0.2, h: 0, line: { color: "C9C2BA", width: 1 }, objectName: "wf axis" });
    const k4 = [["₹65,000", "left per partner"], ["65%", "margin"], ["₹0.16", "AI cost per user"], ["2 mo", "payback per bank"]];
    k4.forEach(([b, c], i) => {
      const x = M + 0.22 + i * 1.42;
      T(s, b, { x, y: 5.55, w: 1.35, h: 0.38, fontSize: 18, bold: true, color: P.coral });
      T(s, c, { x, y: 5.93, w: 1.35, h: 0.22, fontSize: 10.5, color: P.muted });
    });
    T(s, "Checks run on the user’s device, free to us; we pay only when someone asks the AI.", { x: M + 0.22, y: 6.17, w: 5.6, h: 0.22, fontSize: 10.5, color: P.text });

    T(s, "Why we win", { x: M + 6.2, y: 3.07, w: 5, h: 0.32, fontSize: 15, bold: true, color: P.coralLt });
    const wc = (t, head, us, j) => ({ text: t, options: { bold: head || us || j === 0, color: head ? "FFFFFF" : P.ink, fill: { color: head ? (us ? P.coral : P.panel2) : us ? P.soft : "FFFFFF" }, fontSize: 11, align: j === 0 ? "left" : "center", valign: "middle", margin: [0, 0.069, 0, 0.069] } });
    const cmp = [["Says why it’s a scam", "No", "No", "In general", "Yes, quoting it"], ["Works where you read", "Calls, SMS", "SMS", "TV, radio", "Any site, WhatsApp Web"], ["Northeast languages", "No", "Rarely", "Some", "7, incl. Khasi, Mizo"], ["QR codes, screenshots", "No", "No", "No", "Exact UPI payee"], ["Fake links", "Some", "No", "No", "Paused before opening"]];
    s.addTable([["", "Spam filters", "Bank SMS alerts", "Awareness ads", "Pause & Verify"].map((t, j) => wc(t, true, j === 4, j)), ...cmp.map((r) => r.map((t, j) => wc(t, false, j === 4, j)))], {
      x: M + 6.2, y: 3.45, w: CW - 6.2, colW: [1.5, 0.95, 1.0, 1.05, 1.43], rowH: 0.37, border: { type: "solid", pt: 0.75, color: P.line }, objectName: "comparison table",
    });
    T(s, [{ text: "Hard to copy: ", options: { bold: true, color: P.coralLt } }, { text: "India-specific rules in nine languages, including low-resource Northeast ones, a reviewed directory of real bank and government sites, and an engine that runs privately on the device." }], { x: M + 6.2, y: 5.8, w: CW - 6.2, h: 0.55, fontSize: 12, color: P.ltext });
    src(s, "We never sell user data. Plans and unit economics are our estimates (AI, cloud, support; about ₹1.3 L to win and onboard a bank); columns are types of alternative, not specific products.", true);
    s.addNotes(NOTES.business);
  }

  // ════ 5 · Tech stack ══════════════════════════════════════════════════
  pres.addSection({ title: "Technology" });
  {
    const s = slide("Light", "Technology", "TECH STACK", "On-device first: our engine decides in milliseconds. AI only reads, translates and explains — and only when asked.");
    const gap = 0.34, cw4 = (CW - 3 * gap) / 4, cy = 1.95, ch = 2.02;
    // Lane labels: what runs on the device vs what goes online
    s.addShape(pres.shapes.LINE, { x: M, y: 1.82, w: cw4 * 2 + gap, h: 0, line: { color: P.coral, width: 1.5 }, objectName: "device lane" });
    s.addShape(pres.shapes.LINE, { x: M + 2 * (cw4 + gap), y: 1.82, w: cw4 * 2 + gap, h: 0, line: { color: P.slate, width: 1.5 }, objectName: "online lane" });
    T(s, "ON YOUR DEVICE  ·  works offline", { x: M, y: 1.52, w: 5, h: 0.26, fontSize: 11, bold: true, color: P.coralInk, charSpacing: 1 });
    T(s, "ONLINE  ·  only when you ask, masked first", { x: M + 2 * (cw4 + gap), y: 1.52, w: 5.6, h: 0.26, fontSize: 11, bold: true, color: P.slate, charSpacing: 1 });
    const cards = [
      ["LuGlobe", "Browser extension", ["Chrome · WXT, Manifest V3", "React 19 + Motion, Shadow DOM", "Reads pages live as they change", "Underlines with CSS Highlight API", "Look: captures part of the tab"], true],
      ["LuCpu", "Scam engine", ["TypeScript, runs in the browser", "10 warning-sign rules, 5 scripts", "Look-alike + .bank.in link checks", "UPI QR decoded on device (jsQR)", "Masks OTP, phone, card, email · 21 tests"], true],
      ["LuServer", "Our API", ["Next.js 16 on Vercel", "Translate · speak · chat · vision", "API keys stay on the server", "Rate-limited · nothing stored", "Auto-deploys from GitHub"], false],
      ["LuSparkles", "AI services", ["Bhashini (MeitY): translation +", "voice, 9 Indian languages", "Sarvam-105B: plain-word answers", "Gemma 3 27B: reads screenshots", "AI never decides the verdict"], false],
    ];
    for (let i = 0; i < cards.length; i++) {
      const [ic0, h, lines, dev] = cards[i], x = M + i * (cw4 + gap);
      box(s, x, cy, cw4, ch, "FFFFFF", { line: dev ? "F3C9CC" : P.line, shadow: true, name: h + " card" });
      await iconChip(s, x + 0.2, cy + 0.2, 0.46, ic0, dev ? P.coral : P.soft2, dev ? "FFFFFF" : P.panel2);
      T(s, h, { x: x + 0.78, y: cy + 0.2, w: cw4 - 0.9, h: 0.46, fontSize: 14, bold: true, color: P.ink, valign: "middle" });
      T(s, lines.map((t, j) => ({ text: t, options: j < lines.length - 1 ? { breakLine: true } : {} })), { x: x + 0.22, y: cy + 0.8, w: cw4 - 0.36, h: ch - 0.92, fontSize: 10.5, color: P.text, paraSpaceAfter: 3 });
      if (i < 3) T(s, "→", { x: x + cw4, y: cy + ch / 2 - 0.22, w: gap, h: 0.44, fontSize: 18, bold: true, color: i === 1 ? P.coral : P.slate, align: "center", valign: "middle" });
    }
    pill(s, M + 2 * cw4 + gap - 0.55, cy + ch + 0.02, 1.78, 0.28, "MASKED · HTTPS", P.coral, "FFFFFF", 9);

    // Bottom: offline vs online, screenshots & OCR, privacy
    const by = 4.36, bh = 2.12, pw = (CW - 2 * 0.2) / 3;
    box(s, M, by, pw, bh, "FFFFFF", { line: P.line, name: "offline panel" });
    T(s, "Works offline", { x: M + 0.2, y: by + 0.12, w: 1.9, h: 0.28, fontSize: 13, bold: true, color: P.green });
    T(s, ["Scam check + score", "Fake & look-alike links", "Who a UPI QR pays", "Underlines, alert, link pause", "Ready answers"].map((t, j, a) => ({ text: "✓ " + t, options: j < a.length - 1 ? { breakLine: true } : {} })),
      { x: M + 0.2, y: by + 0.48, w: 2.05, h: 1.55, fontSize: 11, color: P.text, paraSpaceAfter: 4 });
    T(s, "Needs internet", { x: M + 2.28, y: by + 0.12, w: 1.6, h: 0.28, fontSize: 13, bold: true, color: P.slate });
    T(s, ["Translation", "Read-aloud", "Free-form AI answers", "Text inside pictures"].map((t, j, a) => ({ text: "○ " + t, options: j < a.length - 1 ? { breakLine: true } : {} })),
      { x: M + 2.28, y: by + 0.48, w: 1.55, h: 1.55, fontSize: 11, color: P.text, paraSpaceAfter: 4 });

    const x2 = M + pw + 0.2;
    box(s, x2, by, pw, bh, "FFFFFF", { line: P.line, name: "ocr panel" });
    T(s, "Screenshots, images & QR", { x: x2 + 0.2, y: by + 0.12, w: pw - 0.4, h: 0.28, fontSize: 13, bold: true, color: P.ink });
    const steps = ["Look · right-click · upload", "QR decoded on the device", "Gemma 3 reads the words", "Engine judges it"];
    steps.forEach((t, j) => {
      const yy = by + 0.5 + j * 0.31;
      s.addShape(pres.shapes.OVAL, { x: x2 + 0.2, y: yy + 0.03, w: 0.22, h: 0.22, fill: { color: j === 1 || j === 3 ? P.coral : P.slate }, line: { color: "FFFFFF", width: 0 }, objectName: "ocr step " + j });
      T(s, String(j + 1), { x: x2 + 0.2, y: yy + 0.03, w: 0.22, h: 0.22, fontSize: 9, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
      T(s, t, { x: x2 + 0.52, y: yy, w: pw - 0.7, h: 0.28, fontSize: 11, color: P.text, valign: "middle" });
    });
    T(s, "Any script, about 8 seconds. Text already on the page is read exactly; AI fills in only what’s inside images.", { x: x2 + 0.2, y: by + 1.76, w: pw - 0.35, h: 0.32, fontSize: 9.5, italic: true, color: P.muted });

    const x3 = M + 2 * (pw + 0.2);
    box(s, x3, by, pw, bh, P.ink, { name: "privacy panel" });
    T(s, "Privacy & security", { x: x3 + 0.2, y: by + 0.12, w: pw - 0.4, h: 0.28, fontSize: 13, bold: true, color: P.coralLt });
    T(s, [["Checked on the device", " — nothing to send"], ["Masked", " — OTP, phone, card, email"], ["HTTPS", " on every request"], ["Nothing stored", " — no accounts, no logs"], ["Keys", " never ship in the extension"]].flatMap(([b, t], j, a) => [
      { text: b, options: { bold: true, color: "FFFFFF" } }, { text: t, options: j < a.length - 1 ? { breakLine: true } : {} }]),
      { x: x3 + 0.2, y: by + 0.48, w: pw - 0.35, h: 1.25, fontSize: 11, color: P.ltext, paraSpaceAfter: 3 });
    T(s, [{ text: "See it live: ", options: { color: P.ltext2 } }, { text: "pauseverify.vercel.app/privacy", options: { bold: true, color: P.coralLt } }], { x: x3 + 0.2, y: by + 1.76, w: pw - 0.3, h: 0.26, fontSize: 10.5 });
    src(s, "Stack: TypeScript · pnpm + Turborepo · Next.js 16 · React 19 · Tailwind v4 · WXT · Motion · jsQR · Vercel. Services: Bhashini (MeitY), Sarvam AI, Gemma 3 (Google, open weights) via Hugging Face.", false, 6.62);
    s.addNotes(NOTES.tech);
  }

  // ════ 6 · Future scope ════════════════════════════════════════════════
  pres.addSection({ title: "Future" });
  {
    const s = slide("Dark", "Future", "FUTURE SCOPE", "From the browser to the phone in 3 months: a Truecaller-style guard for every SMS, call and chat — still private.");
    const cols = [
      ["NOW · BUILT", P.panel2, P.ltext, ["Chrome extension on any website", "Web checker for text and screenshots", "9 languages, read-aloud in 6", "Live on Vercel, with a privacy demo"]],
      ["MONTH 1–2", P.coral, "FFFFFF", ["Android app: scam SMS flagged before you open it, on the phone", "Notification guard for WhatsApp, Telegram and email", "Share-to-check from any app", "Built-in UPI QR scanner"]],
      ["MONTH 3", P.amber, P.ink, ["Scam-caller warnings from 1930 + community reports", "Bank SDK: white-label inside bank apps", "Family mode: alert a trusted relative", "Scam-trend dashboard for banks and I4C", "iOS: SMS filter + share-to-check"]],
    ];
    const cwid = 2.72, gap = 0.18;
    cols.forEach(([h, fill, hc, items], i) => {
      const x = M + i * (cwid + gap), hi = i === 1;
      box(s, x, 1.62, cwid, 3.78, hi ? P.panel2 : "161413", { t: hi ? 0 : 30, line: hi ? P.coral : "3A3633", lw: hi ? 1.5 : 1, name: h });
      pill(s, x + 0.18, 1.78, cwid - 0.36, 0.34, h, fill, hc, 10);
      T(s, items.map((t, j) => ({ text: t, options: { bullet: { indent: 12 }, ...(j < items.length - 1 ? { breakLine: true } : {}) } })),
        { x: x + 0.14, y: 2.32, w: cwid - 0.26, h: 3.0, fontSize: 13, color: hi ? "FFFFFF" : P.ltext, paraSpaceAfter: 9 });
    });
    box(s, M, 5.58, 3 * cwid + 2 * gap, 0.88, P.panel, { name: "privacy rule" });
    T(s, [{ text: "Privacy stays the rule.  ", options: { bold: true, color: P.coralLt } }, { text: "A small model on the phone reads SMS there — messages never leave it. Only anonymous counts (“KYC scam, Assam, today”) are shared, with consent." }],
      { x: M + 0.22, y: 5.58, w: 3 * cwid + 2 * gap - 0.4, h: 0.88, fontSize: 12, color: "FFFFFF", valign: "middle" });

    // Phone mock-up: the Android app catching a scam SMS
    const px = 9.62, py = 1.45, pw2 = 2.95, ph = 5.25;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px, y: py, w: pw2, h: ph, rectRadius: 0.4, fill: { color: "0D0C0B" }, line: { color: "4A4541", width: 1.5 }, objectName: "phone body" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px + 0.1, y: py + 0.1, w: pw2 - 0.2, h: ph - 0.2, rectRadius: 0.32, fill: { color: "F4EFEA" }, line: { color: "F4EFEA", width: 0 }, objectName: "phone screen" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: px + pw2 / 2 - 0.4, y: py + 0.18, w: 0.8, h: 0.16, rectRadius: 0.08, fill: { color: "0D0C0B" }, line: { color: "0D0C0B", width: 0 }, objectName: "camera" });
    T(s, "9:41", { x: px + 0.3, y: py + 0.16, w: 0.6, h: 0.2, fontSize: 8, bold: true, color: P.ink });
    // notification
    box(s, px + 0.2, py + 0.5, pw2 - 0.4, 1.05, "FFFFFF", { r: 0.14, shadow: true, name: "notification" });
    s.addImage({ path: A("mark.png"), x: px + 0.32, y: py + 0.62, w: 0.3, h: 0.3, objectName: "app mark", altText: "" });
    T(s, [{ text: "Pause & Verify", options: { bold: true, color: P.ink, fontSize: 9.5, breakLine: true } }, { text: "Scam SMS held back", options: { bold: true, color: P.coralInk, fontSize: 9.5 } }], { x: px + 0.7, y: py + 0.58, w: 1.9, h: 0.42 });
    T(s, "VM-SBIBNK: “Update KYC…” — the link isn’t SBI’s. Not opened.", { x: px + 0.32, y: py + 1.02, w: pw2 - 0.6, h: 0.46, fontSize: 8.5, color: P.text });
    // sms bubble with underlines
    box(s, px + 0.2, py + 1.75, pw2 - 0.6, 1.25, "FFFFFF", { r: 0.14, name: "sms" });
    T(s, [{ text: "Dear Customer, your SBI account " }, { text: "will be BLOCKED today", options: { color: P.coralInk, underline: { style: "wavy", color: P.coralInk } } }, { text: ". " }, { text: "Update KYC", options: { color: P.coralInk, underline: { style: "wavy", color: P.coralInk } } }, { text: ": sbi-kyc.xyz" }],
      { x: px + 0.32, y: py + 1.83, w: pw2 - 0.85, h: 1.1, fontSize: 9.5, color: P.text });
    // alert sheet
    box(s, px + 0.2, py + 3.25, pw2 - 0.4, 1.7, "FFFFFF", { r: 0.18, shadow: true, name: "alert sheet" });
    T(s, "Hold on. This looks like a scam.", { x: px + 0.34, y: py + 3.36, w: pw2 - 0.6, h: 0.3, fontSize: 10.5, bold: true, color: P.ink });
    T(s, "উচ্চ বিপদাশংকা · 4 warning signs", { x: px + 0.34, y: py + 3.66, w: pw2 - 0.6, h: 0.24, fontSize: 8.5, color: P.muted });
    box(s, px + 0.34, py + 4.0, pw2 - 0.68, 0.36, P.ink, { r: 0.18, name: "why button" });
    T(s, "Show me why", { x: px + 0.34, y: py + 4.0, w: pw2 - 0.68, h: 0.36, fontSize: 9.5, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    box(s, px + 0.34, py + 4.44, pw2 - 0.68, 0.36, "C8323C", { r: 0.18, name: "1930 button" });
    T(s, "Lost money? Call 1930", { x: px + 0.34, y: py + 4.44, w: pw2 - 0.68, h: 0.36, fontSize: 9.5, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
    src(s, "The whole app ships within 3 months, reusing today’s engine. Phone screen is a concept; everything under “Now” is built and working today.", true, 6.62);
    s.addNotes(NOTES.future);
  }

  // ════ 7 · Conclusion ══════════════════════════════════════════════════
  pres.addSection({ title: "Close" });
  {
    const s = slide("Ink", "Close", "CONCLUSION", "");
    T(s, [{ text: "Scams win by rushing people.", options: { bold: true, color: "FFFFFF", breakLine: true } },
      { text: "Pause & Verify gives every Indian a calm second opinion, in their own language, before they pay." }],
      { x: M, y: 1.08, w: 7.9, h: 1.0, fontSize: 20, color: P.coralLt, paraSpaceAfter: 2 });
    const sdg = [["00689D", "SDG 16", "Peace & Justice", "Fewer frauds, faster reports to 1930"], ["DD1367", "SDG 10", "Reduced Inequalities", "7 Northeast languages, read aloud"], ["FD6925", "SDG 9", "Industry & Innovation", "Private AI that runs on the device"], ["A21942", "SDG 8", "Decent Work & Growth", "Safer digital payments for all"]];
    sdg.forEach(([c, n, h, b], i) => {
      const x = M + i * 2.02, w = 1.88;
      box(s, x, 2.18, w, 0.9, c, { r: 0.08, name: n });
      T(s, n, { x: x + 0.14, y: 2.25, w: w - 0.2, h: 0.4, fontSize: 19, bold: true, color: "FFFFFF" });
      T(s, h, { x: x + 0.14, y: 2.68, w: w - 0.2, h: 0.28, fontSize: 10.5, bold: true, color: "FFFFFF" });
      T(s, b, { x, y: 3.16, w, h: 0.45, fontSize: 11, color: P.ltext });
    });
    T(s, "Next 90 days", { x: M, y: 3.72, w: 4, h: 0.3, fontSize: 15, bold: true, color: "FFFFFF" });
    [["30 Nov", "Chrome Web Store"], ["15 Dec", "3 colleges live"], ["15 Jan", "Android beta"], ["15 Feb", "first bank pilot"]].forEach(([d, t], i) => {
      const x = M + i * 2.02, w = 1.88;
      box(s, x, 4.08, w, 0.82, P.panel, { r: 0.08, name: d });
      T(s, [{ text: d, options: { bold: true, color: P.coralLt, fontSize: 14, breakLine: true } }, { text: t, options: { color: "FFFFFF", fontSize: 12 } }], { x: x + 0.16, y: 4.16, w: w - 0.25, h: 0.68, paraSpaceAfter: 3 });
    });
    // Proof, not promises: what the prototype did on live public websites.
    box(s, 8.95, 1.15, 3.78, 3.75, P.panel, { name: "proof card" });
    T(s, "PROVEN ON REAL WEBSITES", { x: 9.2, y: 1.32, w: 3.4, h: 0.28, fontSize: 12, bold: true, color: P.coralLt, charSpacing: 1 });
    T(s, [{ text: "Found the scam", options: { bold: true, color: "FFFFFF", fontSize: 13, breakLine: true } },
      { text: "Underlined the scam SMS quoted by Mokokchung Times, OneIndia and ScamDekho" }], { x: 9.2, y: 1.72, w: 3.35, h: 0.8, fontSize: 11.5, color: P.ltext, paraSpaceAfter: 2 });
    T(s, [{ text: "Stayed quiet", options: { bold: true, color: "FFFFFF", fontSize: 13, breakLine: true } },
      { text: "Wikipedia, NDTV, Flipkart; advice pages get no pop-up" }], { x: 9.2, y: 2.58, w: 3.35, h: 0.62, fontSize: 11.5, color: P.ltext, paraSpaceAfter: 2 });
    s.addShape(pres.shapes.LINE, { x: 9.2, y: 3.35, w: 3.3, h: 0, line: { color: "3A3633", width: 0.75 }, objectName: "proof divider" });
    [["21/21", "engine tests"], ["9", "languages"], ["0", "messages stored"]].forEach(([b, c], i) => {
      const x = 9.2 + i * 1.12;
      T(s, b, { x, y: 3.5, w: 1.1, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", valign: "middle" });
      T(s, c, { x, y: 4.0, w: 1.1, h: 0.5, fontSize: 10.5, color: P.ltext });
    });
    box(s, M, 5.08, CW, 0.62, P.panel, { name: "vision strip" });
    T(s, [{ text: "By 2029   ", options: { bold: true, color: P.coralLt } }, { text: "1 crore users   ·   10 Indian languages   ·   10 partner banks   ·   one tap from the truth before every payment" }], { x: M + 0.3, y: 5.08, w: CW - 0.5, h: 0.62, fontSize: 15, color: "FFFFFF", valign: "middle" });
    T(s, "Thank you", { x: M, y: 5.92, w: 3, h: 0.5, fontSize: 26, bold: true, color: "FFFFFF", valign: "middle" });
    T(s, [{ text: "Team Commit&Run", options: { bold: true, color: "FFFFFF", breakLine: true } }, { text: "Veeshal D Bodosa  ·  Mrinmoy Banikya  ·  Deepjyoti Dey" }], { x: M + 2.35, y: 5.86, w: 4.9, h: 0.62, fontSize: 12, color: P.ltext, valign: "middle", paraSpaceAfter: 2 });
    T(s, [{ text: "Try it", options: { bold: true, color: P.coralLt, fontSize: 12, breakLine: true } }, { text: LIVE, options: { bold: true, color: "FFFFFF", fontSize: 14 } }], { x: 7.4, y: 5.88, w: 4.15, h: 0.6, align: "right" });
    s.addImage({ data: qr, x: 11.78, y: 5.86, w: 0.95, h: 0.95, objectName: "QR code", altText: "QR code to " + LIVE });
    s.addNotes(NOTES.conclusion);
  }

  // ════ 8 · Supporting: prototype showcase ══════════════════════════════
  pres.addSection({ title: "Supporting" });
  {
    const s = slide("Ink", "Supporting", "PROTOTYPE SHOWCASE", "Working today: a Chrome extension on real pages, a web demo and a checker.");
    pill(s, 10.53, 0.55, 2.2, 0.36, "SUPPORTING SLIDE", P.panel, P.coralLt, 10);
    s.addImage({ path: A("macbook-ext.png"), x: M - 0.1, y: 1.65, w: 6.4, h: 6.4 / MB, objectName: "Extension on a real page", altText: "The extension underlining a fake SBI message and alerting" });
    T(s, "Extension on a real page: red flags underlined in place, the island alerts", { x: M, y: 5.85, w: 6.2, h: 0.26, fontSize: 12, color: P.ltext });
    const cw = 2.05;
    s.addImage({ path: A("card-sheet-as.png"), x: 6.85, y: 1.5, w: cw, h: cw / SHEET, objectName: "Assamese sheet", altText: "Explanation in Assamese" });
    s.addImage({ path: A("card-sheet-qr.png"), x: 8.85, y: 1.5, w: cw, h: cw / SHEET_QR, objectName: "QR sheet", altText: "This QR sends ₹5,000" });
    T(s, "Explains in অসমীয়া", { x: 6.85, y: 4.55, w: cw, h: 0.28, fontSize: 12.5, bold: true, color: "FFFFFF", align: "center" });
    T(s, "Reads the QR", { x: 8.85, y: 4.55, w: cw, h: 0.28, fontSize: 12.5, bold: true, color: "FFFFFF", align: "center" });
    s.addImage({ path: A("mark.png"), x: 11.25, y: 1.75, w: 0.6, h: 0.6, objectName: "mark", altText: "" });
    T(s, [{ text: "9 languages", options: { bold: true, color: "FFFFFF", fontSize: 18, breakLine: true } }, { text: "7 from the Northeast", options: { color: P.ltext, fontSize: 11, breakLine: true } }, { text: " ", options: { breakLine: true } },
      { text: "21 / 21", options: { bold: true, color: "FFFFFF", fontSize: 18, breakLine: true } }, { text: "engine tests pass", options: { color: P.ltext, fontSize: 11, breakLine: true } }, { text: " ", options: { breakLine: true } },
      { text: "~8 s", options: { bold: true, color: "FFFFFF", fontSize: 18, breakLine: true } }, { text: "screenshot → verdict", options: { color: P.ltext, fontSize: 11 } }],
      { x: 11.0, y: 2.5, w: 1.75, h: 2.4 });
    s.addImage({ path: A("card-paused.png"), x: 6.75, y: 4.95, w: 4.2, h: 4.2 / PAUSED, objectName: "Paused link", altText: "Paused. This link isn't what it seems." });
    T(s, [{ text: "Code:  ", options: { bold: true, color: P.coralLt } }, { text: "github.com/vxwshxl/pauseverify", options: { bold: true, color: "FFFFFF" } }], { x: M, y: 6.35, w: 8, h: 0.3, fontSize: 14 });
    s.addNotes(NOTES.showcase);
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
