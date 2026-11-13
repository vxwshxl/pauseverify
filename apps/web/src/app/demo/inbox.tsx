"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Mail, MessageCircle, MessageSquareText, ScanSearch, UserRound, Inbox as InboxIcon } from "lucide-react";
import { analyze, SAMPLES, type Analysis, type Sample } from "@pv/engine";
import { Highlighted, Island, LookOverlay, type Rect } from "@pv/island";
import { qrInRect, textInRect } from "@/components/look-reader";
import { useIslandServices } from "@/components/use-island-services";
import { cn } from "@/lib/utils";

type Tab = "all" | Sample["channel"];
const TABS: { id: Tab; label: string; Icon: typeof Mail }[] = [
  { id: "all", label: "All", Icon: InboxIcon },
  { id: "sms", label: "Messages", Icon: MessageSquareText },
  { id: "whatsapp", label: "Chats", Icon: MessageCircle },
  { id: "email", label: "Email", Icon: Mail },
];

const LEVEL_DOT = { high: "bg-danger", caution: "bg-warning", safe: "bg-success" } as const;

export function Inbox() {
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [looking, setLooking] = useState(false);
  const [qrSrc, setQrSrc] = useState<Record<string, string>>({});
  const threadRef = useRef<HTMLDivElement>(null);
  const [checkedText, setCheckedText] = useState<string | undefined>();
  const ai = useIslandServices(checkedText);

  // Results for the list dots: computed on the device, instantly, for every message.
  const results = useMemo(() => Object.fromEntries(SAMPLES.map((s) => [s.id, analyze({ text: s.text, qr: s.qr })])), []);
  const list = SAMPLES.filter((s) => tab === "all" || s.channel === tab);
  const open = SAMPLES.find((s) => s.id === openId) ?? null;

  useEffect(() => {
    for (const s of SAMPLES) if (s.qr) QRCode.toDataURL(s.qr, { margin: 1, width: 360 }).then((src) => setQrSrc((m) => ({ ...m, [s.id]: src })));
  }, []);

  function select(s: Sample) {
    setOpenId(s.id);
    setAnalysis(null);
    setScanning(true);
    // A short, honest pause: the check itself takes milliseconds, but an instant flip
    // from "watching" to a red alert reads as a glitch rather than a result.
    setTimeout(() => {
      // QR images are only read when the person asks the island to look at them.
      setCheckedText(s.text);
      setAnalysis(analyze({ text: s.text }));
      setScanning(false);
    }, 650);
  }

  async function onLook(rect: Rect) {
    setLooking(false);
    const root = threadRef.current ?? document.body;
    setScanning(true);
    const [qr] = await Promise.all([qrInRect(root, rect), new Promise((r) => setTimeout(r, 700))]);
    // A QR is judged with the message it came in ("scan to receive…"), as a person would read it.
    const inBox = textInRect(root, rect);
    const text = qr ? [open?.text, inBox].filter(Boolean).join(" ") : inBox || open?.text || "";
    setCheckedText(text);
    setAnalysis(analyze({ text, qr: qr ?? undefined }));
    setScanning(false);
  }

  return (
    <div className="container-page pb-40 pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight sm:text-[40px]">Live demo</h1>
          <p className="mt-1 max-w-xl text-secondary-fg">A pretend inbox with real scam patterns from India. Open a message and watch the island at the bottom.</p>
        </div>
        <div role="tablist" aria-label="Filter messages" className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={cn("group flex flex-col items-center gap-1.5 rounded-xl px-4 pb-2 pt-2.5 text-[13px] font-medium text-muted-foreground transition-colors duration-[120ms] hover:text-foreground",
                tab === id && "text-foreground")}>
              <Icon className="size-6" strokeWidth={1.5} />
              <span className={cn("border-b-2 border-transparent pb-1.5 group-hover:border-border-strong", tab === id && "border-foreground group-hover:border-foreground")}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid overflow-hidden rounded-[24px] border border-border bg-background md:grid-cols-[22rem_1fr] md:shadow-card" style={{ minHeight: "36rem" }}>
        {/* List */}
        <ul className={cn("divide-y divide-border border-border md:border-r", open && "hidden md:block")} aria-label="Messages">
          {list.map((s) => {
            const r = results[s.id]!;
            return (
              <li key={s.id}>
                <button onClick={() => select(s)} aria-current={openId === s.id}
                  className={cn("flex w-full gap-3 px-5 py-4 text-left transition-colors duration-[120ms] hover:bg-subtle", openId === s.id && "bg-muted hover:bg-muted")}>
                  <Avatar name={s.from} channel={s.channel} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-semibold">{s.from}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{s.time}</span>
                    </span>
                    {s.subject && <span className="block truncate text-sm font-medium">{s.subject}</span>}
                    <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">{s.text}</span>
                  </span>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", LEVEL_DOT[r.level])} title={`${r.level} risk`} aria-label={`${r.level} risk`} />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Thread */}
        <section ref={threadRef} className={cn("flex min-w-0 flex-col bg-subtle", !open && "hidden md:flex")} aria-label="Conversation">
          {open ? (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-background px-5 py-3.5">
                <button className="grid size-9 place-items-center rounded-full hover:bg-muted md:hidden" onClick={() => setOpenId(null)} aria-label="Back to messages"><ArrowLeft className="size-5" /></button>
                <Avatar name={open.from} channel={open.channel} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{open.from}</p>
                  <p className="truncate text-sm text-muted-foreground">{open.handle}</p>
                </div>
              </header>
              <div className="flex-1 space-y-4 p-5 sm:p-8">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">{open.time}</p>
                <article className={cn("max-w-xl rounded-[20px] bg-background p-5 text-[15.5px] leading-relaxed shadow-card", open.channel === "email" ? "max-w-2xl" : "rounded-tl-md")}>
                  {open.subject && <h2 className="mb-3 font-display text-xl font-semibold leading-snug">{open.subject}</h2>}
                  <p className="whitespace-pre-line"><Highlighted text={open.text} analysis={analysis} /></p>
                  {open.qr && qrSrc[open.id] && (
                    <figure className="mt-4 w-48">
                      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, decoded by the Look tool */}
                      <img src={qrSrc[open.id]} alt="A QR code attached to the message" className="w-full rounded-xl border border-border bg-white p-2" />
                      <figcaption data-pv-ignore className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><ScanSearch className="size-3.5" />Tap the island’s scan button and drag over this QR</figcaption>
                    </figure>
                  )}
                </article>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-10 text-center">
              <div className="max-w-xs space-y-2">
                <MessageSquareText className="mx-auto size-10 text-muted-foreground" strokeWidth={1.25} />
                <p className="font-display text-xl font-semibold">Open any message</p>
                <p className="text-sm text-muted-foreground">Red dots are scams, green ones are genuine. Try the SBI one first — it’s the problem statement’s own example.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Island {...ai} analysis={analysis} scanning={scanning} context={open ? "this message" : "this inbox"} onLook={() => setLooking(true)} />
      {looking && <LookOverlay onSelect={onLook} onCancel={() => setLooking(false)} />}
    </div>
  );
}

function Avatar({ name, channel }: { name: string; channel: Sample["channel"] }) {
  const Icon = channel === "email" ? Mail : channel === "whatsapp" ? MessageCircle : MessageSquareText;
  const initial = /^[+\d]/.test(name) ? <UserRound className="size-5" strokeWidth={1.75} /> : name.slice(0, 1);
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-muted font-display text-base font-semibold text-secondary-fg">
      {initial}
      <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-foreground text-background">
        <Icon className="size-2.5" strokeWidth={2.5} />
      </span>
    </span>
  );
}
