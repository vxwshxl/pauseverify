"use client";
import { useRef, useState } from "react";
import jsQR from "jsqr";
import { ArrowUp, ImageUp, Link2, X } from "lucide-react";
import { analyze, SAMPLES, type Analysis } from "@pv/engine";
import { Highlighted } from "@pv/island";
import { ThemedIsland } from "@/components/themed-island";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { label: "Bank “account blocked”", id: "sbi-kyc" },
  { label: "Power cut tonight", id: "power-cut" },
  { label: "Digital arrest", id: "digital-arrest" },
  { label: "Real SBI OTP", id: "sbi-otp" },
];

async function decodeQr(file: File): Promise<string | null> {
  const bmp = await createImageBitmap(file);
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
  const [image, setImage] = useState<{ name: string; url: string; qr: string | null } | null>(null);
  const [checked, setChecked] = useState<{ text: string; analysis: Analysis } | null>(null);
  const [scanning, setScanning] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function run(t = text, qr = image?.qr ?? undefined) {
    if (!t.trim() && !qr) return;
    setScanning(true);
    setChecked(null);
    setTimeout(() => {
      setChecked({ text: t, analysis: analyze({ text: t, qr }) });
      setScanning(false);
    }, 550);
  }

  async function pick(f: File | undefined) {
    if (!f) return;
    const qr = await decodeQr(f).catch(() => null);
    setImage({ name: f.name, url: URL.createObjectURL(f), qr });
  }

  return (
    <div className="container-page pb-40 pt-12 sm:pt-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-balance text-center font-display text-[40px] font-semibold leading-[1.05] sm:text-[56px]">Got a message that feels off?</h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-lg text-secondary-fg">Paste it here, or drop in a screenshot. We’ll show you exactly what’s worrying about it — and how to check safely.</p>

        <form onSubmit={(e) => { e.preventDefault(); run(); }}
          className="mt-10 rounded-[28px] border border-border bg-background p-2 shadow-float transition-shadow duration-[180ms] focus-within:border-border-strong">
          <label htmlFor="msg" className="sr-only">Message, link or text from a screenshot</label>
          <textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} rows={4}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
            placeholder="Paste the message or link…"
            className="block w-full resize-none rounded-[22px] bg-transparent px-5 pb-2 pt-4 text-[17px] leading-relaxed outline-none placeholder:text-muted-foreground" />
          {image && (
            <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-subtle p-2 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
              <img src={image.url} alt="" className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium">{image.name}</p>
                <p className="text-muted-foreground">{image.qr ? "QR code found — we’ll check where it pays" : "No QR code found. Reading text from images comes next."}</p>
              </div>
              <button type="button" onClick={() => setImage(null)} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Remove image"><X className="size-4" /></button>
            </div>
          )}
          <div className="flex items-center gap-2 px-2 pb-1">
            <button type="button" onClick={() => file.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-secondary-fg hover:bg-muted hover:text-foreground">
              <ImageUp className="size-[18px]" strokeWidth={1.75} />Screenshot
            </button>
            <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex"><Link2 className="size-4" strokeWidth={1.75} />Links work too</span>
            <button type="submit" disabled={!text.trim() && !image?.qr}
              className="ml-auto inline-flex h-12 items-center gap-2 rounded-full bg-brand pl-5 pr-4 text-[15px] font-semibold text-white dark:text-background transition-[transform,opacity] duration-[120ms] active:scale-[0.97] disabled:opacity-40">
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
              <button key={ex.id} type="button" onClick={() => { setText(s.text); setImage(null); run(s.text, undefined); }}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors duration-[120ms] hover:border-foreground">
                {ex.label}
              </button>
            );
          })}
        </div>

        {checked && (
          <section aria-label="What we found" className={cn("mt-12 animate-rise rounded-[24px] border border-border bg-subtle p-6 sm:p-8")}>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">The message, with the warning signs marked</p>
            <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.8]"><Highlighted text={checked.text} analysis={checked.analysis} /></p>
            <p className="mt-6 text-sm text-muted-foreground">The full explanation is in the panel at the bottom of your screen.</p>
          </section>
        )}
      </div>
      <ThemedIsland analysis={checked?.analysis ?? null} scanning={scanning} context="what you paste" />
    </div>
  );
}
