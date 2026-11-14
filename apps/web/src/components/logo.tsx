import Link from "next/link";
import { MARK_PATH } from "@pv/island";
import { cn } from "@/lib/utils";

/** Pause stick + a play triangle soft enough to read as a "D": pause, then go. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={cn("size-9 shrink-0", className)}>
      <rect width="48" height="48" rx="14" className="fill-brand" />
      <g transform="translate(0.8 0)" fill="#fff"><rect x="10.4" y="13" width="5.2" height="22" rx="2.6" /><path d={MARK_PATH} /></g>
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-full font-display text-[19px] font-semibold tracking-[-0.03em] text-foreground">
      <Mark />
      <span>
        pause<span className="text-brand">&amp;</span>verify
      </span>
    </Link>
  );
}
