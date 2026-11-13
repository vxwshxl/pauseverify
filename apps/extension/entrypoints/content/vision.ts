import jsQR from "jsqr";
import type { Rect } from "@pv/island";
import { toJpeg } from "@pv/island";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Crops a visible-tab screenshot to the box the person dragged. */
export function crop(shot: HTMLImageElement, rect: Rect): HTMLCanvasElement {
  // The screenshot is in device pixels; the box is in CSS pixels.
  const sx = shot.naturalWidth / innerWidth;
  const sy = shot.naturalHeight / innerHeight;
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(rect.width * sx));
  c.height = Math.max(1, Math.round(rect.height * sy));
  c.getContext("2d")!.drawImage(shot, rect.x * sx, rect.y * sy, rect.width * sx, rect.height * sy, 0, 0, c.width, c.height);
  return c;
}

export function readQr(source: HTMLCanvasElement | HTMLImageElement): string | null {
  const c = document.createElement("canvas");
  c.width = "naturalWidth" in source ? source.naturalWidth : source.width;
  c.height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  return jsQR(d.data, d.width, d.height)?.data ?? null;
}

export { toJpeg };
