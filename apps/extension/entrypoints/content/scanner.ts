import { analyze, type Analysis } from "@pv/engine";

// Reads the page the way a person does — block by block — and runs the on-device engine
// on anything message-sized. Nothing here leaves the browser.

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "CODE", "PRE", "SVG", "MATH"]);
const BLOCK = "p,li,td,th,blockquote,article,h1,h2,h3,h4,h5,h6,dd,dt,figcaption,div";
const MAX_BLOCKS = 1500;

export interface Found {
  block: Element;
  text: string;
  nodes: { node: Text; start: number }[];
  analysis: Analysis;
}

const cache = new WeakMap<Element, { text: string; found: Found | null }>();

function textNodes(root: Element, host: Element): Text[] {
  const out: Text[] = [];
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || SKIP.has(p.tagName) || host.contains(p) || p.isContentEditable) return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n as Text);
  return out;
}

/** Every risky message-sized block on the page, worst first. */
export function scan(host: Element): Found[] {
  const blocks = new Set<Element>();
  for (const n of textNodes(document.body, host)) {
    const b = n.parentElement!.closest(BLOCK) ?? n.parentElement!;
    blocks.add(b);
    if (blocks.size >= MAX_BLOCKS) break;
  }
  const found: Found[] = [];
  for (const block of blocks) {
    const nodes = textNodes(block, host);
    let at = 0;
    const map = nodes.map((node) => {
      const m = { node, start: at };
      at += node.data.length;
      return m;
    });
    const text = nodes.map((n) => n.data).join("");
    if (text.length < 20 || text.length > 4000) continue;
    const hit = cache.get(block);
    if (hit && hit.text === text) {
      if (hit.found) found.push({ ...hit.found, nodes: map });
      continue;
    }
    const analysis = analyze({ text });
    const f = analysis.level === "safe" ? null : { block, text, nodes: map, analysis };
    cache.set(block, { text, found: f });
    if (f) found.push(f);
  }
  return found.sort((a, b) => b.analysis.score - a.analysis.score);
}

function rangeFor(f: Found, start: number, end: number): Range | null {
  const r = document.createRange();
  let set = 0;
  for (const { node, start: s } of f.nodes) {
    const e = s + node.data.length;
    if (!(set & 1) && start >= s && start <= e) { r.setStart(node, start - s); set |= 1; }
    if (end >= s && end <= e) { r.setEnd(node, end - s); set |= 2; break; }
  }
  return set === 3 ? r : null;
}

const STYLE_ID = "pause-verify-highlights";

/** Underlines red flags in place with the CSS Custom Highlight API — the page DOM is never touched. */
export function paint(found: Found[]) {
  if (!("highlights" in CSS)) return;
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      ::highlight(pv-flag) { text-decoration: underline wavy #d1242f; text-decoration-thickness: 1.5px; text-underline-offset: 3px; background-color: rgb(209 36 47 / 0.09); }
      ::highlight(pv-link) { text-decoration: underline wavy #d1242f; text-decoration-thickness: 1.5px; text-underline-offset: 3px; background-color: rgb(209 36 47 / 0.18); }`;
    document.head.append(s);
  }
  const flags: Range[] = [];
  const links: Range[] = [];
  for (const f of found) {
    for (const fl of f.analysis.flags) for (const sp of fl.spans) {
      const r = sp.start >= 0 ? rangeFor(f, sp.start, sp.end) : null;
      if (r) flags.push(r);
    }
    for (const l of f.analysis.links) {
      if (l.verdict === "official" || l.verdict === "unknown" || l.span.start < 0) continue;
      const r = rangeFor(f, l.span.start, l.span.end);
      if (r) links.push(r);
    }
  }
  CSS.highlights.set("pv-flag", new Highlight(...flags));
  CSS.highlights.set("pv-link", new Highlight(...links));
}

export function clearPaint() {
  if ("highlights" in CSS) {
    CSS.highlights.delete("pv-flag");
    CSS.highlights.delete("pv-link");
  }
}

export function visible(el: Element) {
  const r = el.getBoundingClientRect();
  return r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
}

/** Text that sits inside a box on screen (fallback for Look when vision is unavailable). */
export function textInRect(rect: { x: number; y: number; width: number; height: number }, host: Element) {
  const parts: string[] = [];
  const range = document.createRange();
  for (const n of textNodes(document.body, host)) {
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.left < rect.x + rect.width && r.right > rect.x && r.top < rect.y + rect.height && r.bottom > rect.y) {
        parts.push(n.data);
        break;
      }
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
