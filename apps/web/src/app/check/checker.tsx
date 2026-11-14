"use client";
import { useRef, useState } from "react";
import jsQR from "jsqr";
import { ArrowUp, Eye, ImageUp, Link2, Loader2, X } from "lucide-react";
import { analyze, extractLinks, SAMPLES, type Analysis, type PageFacts } from "@pv/engine";
import { Highlighted, Island, toJpeg } from "@pv/island";
import { services, useIslandServices } from "@/components/use-island-services";

const EXAMPLES = [
  { label: "Bank “account blocked”", id: "sbi-kyc" },
  { label: "Power cut tonight", id: "power-cut" },
  { label: "Digital arrest", id: "digital-arrest" },
  { label: "Real SBI OTP", id: "sbi-otp" },
];

type Shot = { name: string; url: string; qr: string | null; reading: boolean; text?: string; seen?: string; error?: string };

function qrFrom(bmp: ImageBitmap): string | null {
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  return jsQR(d.data, d.width, d.height)?.data ?? null;
}

export function Checker() {
  const [text, setText] = useState("");
  const [shot, setShot] = useState<Shot | null>(null);
  const [checked, setChecked] = useState<{ text: string; analysis: Analysis } | null>(null);
  const [scanning, setScanning] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const ai = useIslandServices(checked?.text);

  async function run(t = text, s: Shot | null = shot) {
    const body = [t.trim(), s?.text].filter(Boolean).join("\n");
    if (!body && !s?.qr) return;
    setScanning(true);
    setChecked(null);
    // A link is opened safely on our server, so the verdict is about the real page: where it ends
    // up, what its forms ask for, how new the site is. Official links don't need it.
    const link = extractLinks(body).find((l) => l.verdict !== "official");
    const [page] = await Promise.all([
      link ? services.inspectPage(link.url).catch((): PageFacts | undefined => undefined) : Promise.resolve(undefined),
      new Promise((r) => setTimeout(r, 450)),
    ]);
    setChecked({ text: body, analysis: analyze({ text: body, qr: s?.qr ?? undefined, seen: s?.seen, page }) });
    setScanning(false);
  }

  async function pick(f: File | undefined) {
    if (!f) return;
    const bmp = await createImageBitmap(f);
    // QR codes are decoded on the device; the words are read by the vision model.
    const next: Shot = { name: f.name, url: URL.createObjectURL(f), qr: qrFrom(bmp), reading: true };
    setShot(next);
    try {
      const read = await services.readImage(await toJpeg(bmp));
      const done = { ...next, reading: false, text: read.text, seen: read.seen };
      setShot(done);
      run(text, done);
    } catch (e) {
      setShot({ ...next, reading: false, error: e instanceof Error ? e.message : "Couldn’t read the image" });
      if (next.qr) run(text, next);
    }
  }

  return (
    <div className="container-page pb-40 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-balance text-center font-display text-[40px] font-semibold leading-[1.05] sm:text-[56px]">Got a message that feels off?</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-lg text-secondary-fg">Paste it here, or drop in a screenshot. We’ll show you exactly what’s worrying about it — and how to check safely.</p>

        <form onSubmit={(e) => { e.preventDefault(); run(); }}
          onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="mt-10 rounded-[28px] border border-border bg-background p-2 shadow-float transition-shadow duration-[180ms] focus-within:border-border-strong">
          <label htmlFor="msg" className="sr-only">Message, link or text from a screenshot</label>
          <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={4}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
            onPaste={(e) => { const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); pick(f); } }}
            placeholder="Paste the message, a link, or a screenshot…"
            className="block w-full resize-none rounded-[22px] bg-transparent px-5 pb-2 pt-4 text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground" />
          {shot && (
            <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-subtle p-2 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={shot.url} alt="" className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{shot.name}</p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  {shot.reading ? (<><Loader2 className="size-3.5 animate-spin" />Reading the screenshot…</>)
                    : shot.error ? shot.error
                    : (<><Eye className="size-3.5" />{shot.qr ? "Read the text and a QR code" : "Read the text"}</>)}
                </p>
              </div>
              <button type="button" onClick={() => setShot(null)} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Remove image"><X className="size-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 px-2 pb-1">
            <button type="button" onClick={() => file.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-secondary-fg hover:bg-muted hover:text-foreground">
              <ImageUp className="size-[18px]" strokeWidth={1.75} />Screenshot
            </button>
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex"><Link2 className="size-4" strokeWidth={1.75} />Links work too</span>
            <button type="submit" disabled={(!text.trim() && !shot?.text && !shot?.qr) || shot?.reading}
              className="ml-auto inline-flex h-12 items-center gap-2 rounded-full bg-brand pl-5 pr-4 text-[15px] font-semibold text-white transition-[transform,opacity] duration-[120ms] active:scale-[0.97] disabled:opacity-40">
              Check it<ArrowUp className="size-[18px]" />
            </button>
          </div>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="py-1.5 text-sm text-muted-foreground">Try:</span>
          {EXAMPLES.map((ex) => {
            const s = SAMPLES.find((x) => x.id === ex.id)!;
            return (
              <button key={ex.id} type="button" onClick={() => { setText(s.text); setShot(null); run(s.text, null); }}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] hover:border-foreground">
                {ex.label}
              </button>
            );
          })}
        </div>

        {checked && (
          <section aria-label="What we found" className="mt-12 animate-rise rounded-[24px] border border-border bg-subtle p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">The message, with the warning signs marked</p>
            <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.8]">{checked.text ? <Highlighted text={checked.text} analysis={checked.analysis} /> : <em className="text-muted-foreground">No text — just a QR code.</em>}</p>
            <p className="mt-6 text-sm text-muted-foreground">The full explanation is in the panel at the bottom of your screen.</p>
          </section>
        )}
      </div>
      <Island {...ai} position="right" alwaysAlert analysis={checked?.analysis ?? null} scanning={scanning} context="what you paste" />
    </div>
  );
}
