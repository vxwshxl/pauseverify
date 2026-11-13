// Assets for the Pause & Verify deck: backgrounds, the mark, device frames, shadowed cards.
const sharp = require("sharp");
const path = require("path");
const A = (f) => path.join(__dirname, "assets", f);
const S = (f) => path.join(__dirname, "shots", f);

async function bg(file, base, glow, op, dots) {
  const w = 2400, h = 1350;
  let d = "";
  if (dots) for (let y = 20; y < h; y += 40) for (let x = 20; x < w; x += 40) d += `<circle cx="${x}" cy="${y}" r="1.5" fill="#${dots}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="g" cx="0.88" cy="0.1" r="0.75"><stop offset="0" stop-color="#${glow}" stop-opacity="${op}"/><stop offset="1" stop-color="#${glow}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0.04" cy="1" r="0.6"><stop offset="0" stop-color="#${glow}" stop-opacity="${op * 0.55}"/><stop offset="1" stop-color="#${glow}" stop-opacity="0"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="#${base}"/>${d}<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#g2)"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function mark(file, s = 600) {
  const bw = s * 0.1, bh = s * 0.38, gap = s * 0.085, cx = s / 2, top = (s - bh) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
    <rect width="${s}" height="${s}" rx="${s * 0.28}" fill="#E8505B"/>
    <rect x="${cx - gap / 2 - bw}" y="${top}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="#fff"/>
    <rect x="${cx + gap / 2}" y="${top}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="#fff"/></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

// MacBook Pro frame around a 2880×1800 screenshot (same construction as the SchoolERP deck).
async function macbook(shot, out) {
  const W = 2880, Hs = 1800, bz = 64, top = 64, R = 60;
  const LW = W + 2 * bz, LH = Hs + top + bz;
  const baseW = LW + 300, baseH = 90, M = 60;
  const CWm = baseW + 2 * M, CHm = LH + baseH + 2 * M + 60;
  const lx = (CWm - LW) / 2, ly = M;
  const screen = await sharp(shot).extract({ left: 0, top: 0, width: 2880, height: 1800 }).png().toBuffer();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CWm}" height="${CHm}">
    <defs>
      <linearGradient id="al" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9eaec"/><stop offset=".55" stop-color="#c3c5c9"/><stop offset="1" stop-color="#8d9095"/></linearGradient>
      <linearGradient id="lid" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a7a9ad"/><stop offset=".5" stop-color="#d6d8db"/><stop offset="1" stop-color="#a7a9ad"/></linearGradient>
      <filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="30"/></filter>
    </defs>
    <ellipse cx="${CWm / 2}" cy="${ly + LH + baseH - 10}" rx="${baseW / 2}" ry="40" fill="#000" opacity=".35" filter="url(#sh)"/>
    <rect x="${lx - 6}" y="${ly - 6}" width="${LW + 12}" height="${LH + 12}" rx="${R + 6}" fill="url(#lid)"/>
    <rect x="${lx}" y="${ly}" width="${LW}" height="${LH}" rx="${R}" fill="#0a0a0b"/>
    <rect x="${CWm / 2 - 110}" y="${ly}" width="220" height="44" rx="16" fill="#000"/>
    <circle cx="${CWm / 2}" cy="${ly + 20}" r="8" fill="#1d2a3a"/>
    <path d="M ${(CWm - baseW) / 2} ${ly + LH + 6} L ${(CWm + baseW) / 2} ${ly + LH + 6} L ${(CWm + baseW) / 2 - 30} ${ly + LH + baseH} Q ${CWm / 2} ${ly + LH + baseH + 14} ${(CWm - baseW) / 2 + 30} ${ly + LH + baseH} Z" fill="url(#al)"/>
    <rect x="${CWm / 2 - 260}" y="${ly + LH + 6}" width="520" height="26" rx="13" fill="#9fa2a7"/>
  </svg>`);
  const buf = await sharp({ create: { width: CWm, height: CHm, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: svg, left: 0, top: 0 }, { input: screen, left: Math.round(lx + bz), top: ly + top }]).png().toBuffer();
  const meta = await sharp(buf).resize({ width: 2400 }).png({ compressionLevel: 9 }).toFile(out);
  console.log("macbook", path.basename(out), meta.width, meta.height);
}

// A screenshot crop of the island as a floating card: rounded corners + soft shadow.
async function card(shot, out, radius) {
  const m = await sharp(shot).metadata();
  const pad = 60;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><rect x="2" y="2" width="${m.width - 4}" height="${m.height - 4}" rx="${radius}" fill="#fff"/></svg>`);
  const body = await sharp(shot).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const W = m.width + pad * 2, H = m.height + pad * 2;
  const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="b"><feGaussianBlur stdDeviation="22"/></filter></defs>
    <rect x="${pad}" y="${pad + 18}" width="${m.width}" height="${m.height}" rx="${radius}" fill="#000" opacity=".22" filter="url(#b)"/></svg>`);
  const meta = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: shadow, left: 0, top: 0 }, { input: body, left: pad, top: pad }]).png({ compressionLevel: 9 }).toFile(out);
  console.log("card", path.basename(out), meta.width, meta.height);
}

(async () => {
  await bg(A("bg-light.png"), "FBF8F6", "F6C4C8", 0.5, null);
  await bg(A("bg-dark.png"), "1F1D1B", "E8505B", 0.32, "2A2724");
  await bg(A("bg-ink.png"), "161413", "E8505B", 0.26, "221F1D");
  await mark(A("mark.png"));
  await macbook(S("landing.png"), A("macbook-landing.png"));
  await macbook(S("ext-alert.png"), A("macbook-ext.png"));
  await macbook(S("check.png"), A("macbook-check.png"));
  await card(S("sheet-as.png"), A("card-sheet-as.png"), 56);
  await card(S("sheet-qr.png"), A("card-sheet-qr.png"), 56);
  await card(S("ext-paused.png"), A("card-paused.png"), 48);
})();
