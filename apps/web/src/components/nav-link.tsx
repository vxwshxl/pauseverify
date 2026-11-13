"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = href !== "/#how" && (path === href || path.startsWith(href + "/"));
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className={cn("relative shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium text-secondary-fg transition-colors duration-[120ms] hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground md:bg-transparent md:after:absolute md:after:inset-x-4 md:after:-bottom-[17px] md:after:h-0.5 md:after:rounded-full md:after:bg-foreground")}>
      {children}
    </Link>
  );
}
