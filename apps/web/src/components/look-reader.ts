import jsQR from "jsqr";
import type { Rect } from "@pv/island";

function intersects(a: DOMRect | Rect, b: Rect) {
  const ax = "left" in a ? a.left : a.x, ay = "top" in a ? a.top : a.y;
  return ax < b.x + b.width && ax + a.width > b.x && ay < b.y + b.height && ay + a.height > b.y;
}

/** Text that is visibly inside the selected box, read from the page itself. */
export function textInRect(root: HTMLElement, rect: Rect): string {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim()) continue;
    if (n.parentElement?.closest(".pv-root, [data-pv-ignore]")) continue;
    range.selectNodeContents(n);
    if (Array.from(range.getClientRects()).some((r) => intersects(r, rect))) parts.push(n.textContent);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Decodes a QR code from any image that overlaps the selected box. */
export async function qrInRect(root: HTMLElement, rect: Rect): Promise<string | null> {
  for (const img of Array.from(root.querySelectorAll("img"))) {
    if (!intersects(img.getBoundingClientRect(), rect)) continue;
    await img.decode().catch(() => {});
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx || !c.width) continue;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(data.data, data.width, data.height);
    if (code?.data) return code.data;
  }
  return null;
}
