import type { Analysis } from "@pv/engine";

type Seg = { start: number; end: number; kind: string; tag?: string };

/** Renders message text with each red flag underlined, and bad links tagged inline. */
export function Highlighted({ text, analysis }: { text: string; analysis: Analysis | null }) {
  if (!analysis || analysis.level === "safe") return <>{text}</>;
  const segs: Seg[] = [];
  for (const f of analysis.flags) for (const s of f.spans) if (s.start >= 0) segs.push({ start: s.start, end: s.end, kind: f.kind });
  for (const l of analysis.links) {
    if (l.verdict === "official" || l.verdict === "unknown" || l.span.start < 0) continue;
    const tag = l.verdict === "lookalike" && l.entity ? `not ${l.entity.name.replace("State Bank of India", "SBI")}` : l.verdict === "shortener" ? "hidden link" : "unsafe link";
    segs.push({ start: l.span.start, end: l.span.end, kind: "link", tag });
  }
  segs.sort((a, b) => a.start - b.start || b.end - a.end);
  // Drop overlaps: keep the first (longest) span at each position.
  const clean: Seg[] = [];
  for (const s of segs) if (!clean.length || s.start >= clean[clean.length - 1]!.end) clean.push(s);

  const out: React.ReactNode[] = [];
  let at = 0;
  clean.forEach((s, i) => {
    if (s.start > at) out.push(text.slice(at, s.start));
    out.push(
      <span key={i} className="pv-mark-text" data-kind={s.kind === "link" ? "link" : "flag"}>{text.slice(s.start, s.end)}</span>,
    );
    if (s.tag) out.push(<span key={`t${i}`} className="pv-tag">⚠ {s.tag}</span>);
    at = s.end;
  });
  out.push(text.slice(at));
  return <>{out}</>;
}
