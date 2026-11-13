"use client";
import { useMemo } from "react";
import { Lock, RotateCw } from "lucide-react";
import { analyze, SAMPLES } from "@pv/engine";
import { Highlighted, Island } from "@pv/island";
import { useIslandServices } from "@/components/use-island-services";

/** A browser window with a real scam SMS and the real island, already alerting. */
export function HeroDemo() {
  const sample = SAMPLES[0]!;
  const analysis = useMemo(() => analyze({ text: sample.text }), [sample.text]);
  const ai = useIslandServices(sample.text);
  return (
    <div className="relative animate-rise [animation-delay:120ms]">
      <div className="relative h-[34rem] overflow-hidden rounded-[28px] border border-border bg-subtle shadow-float">
        <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <i className="size-3 rounded-full bg-border-strong" /><i className="size-3 rounded-full bg-border-strong" /><i className="size-3 rounded-full bg-border-strong" />
          </span>
          <span className="flex h-8 flex-1 items-center gap-2 rounded-full bg-muted px-3 text-xs text-muted-foreground">
            <Lock className="size-3" />messages.example.com
          </span>
          <RotateCw className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-3 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-muted font-display font-semibold text-secondary-fg">V</span>
            <div>
              <p className="text-sm font-semibold">{sample.from}</p>
              <p className="text-xs text-muted-foreground">{sample.handle}</p>
            </div>
          </div>
          <p className="max-w-md rounded-[20px] rounded-tl-md bg-background p-5 text-[15px] leading-[1.75] shadow-card">
            <Highlighted text={sample.text} analysis={analysis} />
          </p>
        </div>
        <Island {...ai} analysis={analysis} inline context="this message" initialMode="alert" />
      </div>
    </div>
  );
}
