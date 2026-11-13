import Link from "next/link";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-9 place-items-center rounded-[11px] bg-brand", className)}>
      <span className="flex gap-[3.5px]">
        <i className="block h-3.5 w-[3.5px] rounded-full bg-white" />
        <i className="block h-3.5 w-[3.5px] rounded-full bg-white" />
      </span>
    </span>
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
