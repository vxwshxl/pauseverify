"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface Rect { x: number; y: number; width: number; height: number }

/** Full-screen "drag a box around anything" layer. Reports the box in viewport pixels. */
export function LookOverlay({ onSelect, onCancel }: { onSelect: (r: Rect) => void; onCancel: () => void }) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Capture phase: inside the extension's shadow root, key events are stopped from bubbling
    // (so typing never triggers site shortcuts), which would otherwise swallow Escape.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    };
    window.addEventListener("keydown", onKey, true);
    layer.current?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  const box = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
    x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y),
  });

  return (
    <div className="pv-root">
      <div
        ref={layer}
        tabIndex={-1}
        className="pv-look"
        data-dragging={rect ? "true" : "false"}
        role="application"
        aria-label="Drag to select the part of the screen to check. Press Escape to cancel."
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest(".pv-look-hint")) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setStart({ x: e.clientX, y: e.clientY });
          setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
        }}
        onPointerMove={(e) => start && setRect(box(start, { x: e.clientX, y: e.clientY }))}
        onPointerUp={(e) => {
          if (!start) return;
          const r = box(start, { x: e.clientX, y: e.clientY });
          setStart(null);
          if (r.width < 12 || r.height < 12) return setRect(null);
          onSelect(r);
        }}
      >
        {rect && <div className="pv-look-rect" style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }} />}
        <div className="pv-look-hint">
          Drag over anything you want me to check
          <span className="pv-kbd">Esc</span>
          <button type="button" className="pv-icon-btn" onClick={onCancel} aria-label="Cancel"><X /></button>
        </div>
      </div>
    </div>
  );
}
