// Charts drawn as SVG and rasterised at 300 dpi (same approach as the SchoolERP deck),
// recoloured for Pause & Verify: warm ink, coral, amber.
const sharp = require("sharp");
const DPI = 300;
const px = (inch) => Math.round(inch * DPI);
const pt = (p) => (p * DPI) / 72;
const FONT = "Arial, Helvetica, sans-serif";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const C = { ink: "1F1D1B", text: "3A3633", muted: "6A6A6A", axis: "C9C2BA", grid: "EFEAE5" };

function text(x, y, s, o = {}) {
  const lines = String(s).split("\n");
  const size = pt(o.size || 12), lh = size * 1.18;
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-family="${FONT}" font-size="${size}" font-weight="${o.bold ? 700 : 400}" ${o.italic ? 'font-style="italic"' : ""} fill="#${o.color || C.text}" text-anchor="${o.anchor || "start"}" dominant-baseline="${o.base || "alphabetic"}">${esc(l)}</text>`).join("");
}
async function save(svg, w, h, file) {
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${px(w)}" height="${px(h)}">${svg}</svg>`), { density: 72 }).png({ compressionLevel: 9 }).toFile(file);
}

async function columns(file, w, h, labels, values, colors, o = {}) {
  const W = px(w), Hh = px(h), top = pt(30) + (o.topPad || 0), bottom = pt(22), left = pt(4), right = pt(4);
  const max = o.max || Math.max(...values) * 1.15, n = values.length;
  const slot = (W - left - right) / n, bw = slot * (o.bar || 0.58), base = Hh - bottom;
  let s = "";
  values.forEach((v, i) => {
    const x = left + i * slot + (slot - bw) / 2, bh = ((base - top) * v) / max;
    s += `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh}" rx="${pt(3)}" fill="#${colors[i]}"/>`;
    s += text(x + bw / 2, base - bh - pt(5), o.fmt ? o.fmt(v) : v, { size: 12.5, bold: true, color: C.ink, anchor: "middle" });
    s += text(x + bw / 2, base + pt(15), labels[i], { size: 11, color: C.muted, anchor: "middle" });
  });
  s += `<line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#${C.axis}" stroke-width="${pt(1)}"/>`;
  if (o.extra) s += o.extra({ W, H: Hh, slot, left, base, top, max, bw });
  await save(s, w, h, file);
}

async function hbars(file, w, h, labels, values, colors, o = {}) {
  const W = px(w), Hh = px(h), labW = px(o.labelW || 1.6), right = px(o.rightPad ?? 0.7), top = pt(4), bottom = pt(4);
  const max = o.max || Math.max(...values), n = values.length;
  const slot = (Hh - top - bottom) / n, bh = slot * (o.bar || 0.56), x0 = labW + pt(6);
  let s = `<line x1="${x0}" y1="${top}" x2="${x0}" y2="${Hh - bottom}" stroke="#${C.axis}" stroke-width="${pt(1)}"/>`;
  values.forEach((v, i) => {
    const y = top + i * slot + (slot - bh) / 2, bw = ((W - x0 - right) * v) / max;
    s += `<rect x="${x0}" y="${y}" width="${bw}" height="${bh}" rx="${pt(3)}" fill="#${colors[i]}"/>`;
    s += text(x0 - pt(6), y + bh / 2, labels[i], { size: o.cat || 12, color: C.text, anchor: "end", base: "central" });
    s += text(x0 + bw + pt(5), y + bh / 2, o.fmt ? o.fmt(v) : v, { size: o.dl || 12.5, bold: true, color: C.ink, base: "central" });
  });
  if (o.extra) s += o.extra({ W, H: Hh, slot, top, x0, max, right, bh });
  await save(s, w, h, file);
}

// Cumulative cash, ₹ lakh, with gates, a shaded "below the raise" band and labelled points.
async function cash(file, w, h, base, down, o) {
  const W = px(w), Hh = px(h), L = pt(30), R = pt(92), T = pt(10), B = pt(24);
  const { vmin, vmax, raise, step, gates, startYear, endLabel, notes } = o;
  const N = base.length;
  const X = (m) => L + ((W - L - R) * m) / (N - 1);
  const Y = (v) => T + ((Hh - T - B) * (vmax - v)) / (vmax - vmin);
  let s = raise ? `<rect x="${X(0)}" y="${Y(-raise)}" width="${X(N - 1) - X(0)}" height="${Y(vmin) - Y(-raise)}" fill="#FBEDEE"/>` : "";
  for (let v = vmin; v <= vmax; v += step) {
    s += `<line x1="${X(0)}" y1="${Y(v)}" x2="${X(N - 1)}" y2="${Y(v)}" stroke="#${v === 0 ? C.axis : C.grid}" stroke-width="${pt(v === 0 ? 1 : 0.75)}"/>`;
    s += text(X(0) - pt(6), Y(v), v, { size: 10.5, color: C.muted, anchor: "end", base: "central" });
  }
  for (const [m, t] of gates) {
    s += `<line x1="${X(m)}" y1="${T}" x2="${X(m)}" y2="${Y(vmin)}" stroke="#${C.axis}" stroke-width="${pt(0.9)}" stroke-dasharray="${pt(3)} ${pt(3)}"/>`;
    s += text(X(m) + pt(4), T + pt(10), t, { size: 10.5, color: C.muted });
  }
  for (let m = 0; m < N; m += 12) s += text(X(m), Hh - pt(8), `Jan ${startYear + m / 12}`, { size: 10.5, color: C.muted, anchor: "middle" });
  s += text(X(N - 1), Hh - pt(8), endLabel, { size: 10.5, color: C.muted, anchor: "middle" });
  const path = (vals) => vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const BASE = "E8505B", DOWN = "B87A10";
  s += `<path d="${path(down)}" fill="none" stroke="#${DOWN}" stroke-width="${pt(2.4)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<path d="${path(base)}" fill="none" stroke="#${BASE}" stroke-width="${pt(2.6)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  for (const n of notes) {
    const col = n.down ? DOWN : "C2333F";
    if (n.lead) s += `<line x1="${X(n.m)}" y1="${Y(n.v)}" x2="${X(n.lead[0])}" y2="${Y(n.lead[1])}" stroke="#${col}" stroke-width="${pt(0.8)}"/>`;
    s += text(X(n.at[0]), Y(n.at[1]), n.t, { size: 11.5, bold: true, color: col, anchor: "middle" });
    s += `<circle cx="${X(n.m)}" cy="${Y(n.v)}" r="${pt(3.2)}" fill="#${n.down ? DOWN : BASE}" stroke="#fff" stroke-width="${pt(1.2)}"/>`;
  }
  s += text(X(N - 1) + pt(8), Y(base[N - 1]) + pt(2), o.endBase, { size: 12, bold: true, color: "C2333F" });
  s += text(X(N - 1) + pt(8), Y(down[N - 1]) + pt(2), o.endDown, { size: 12, bold: true, color: DOWN });
  await save(s, w, h, file);
}

module.exports = { columns, hbars, cash, pt, px, text };
