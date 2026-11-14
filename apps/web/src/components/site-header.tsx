import Link from "next/link";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="container-page flex h-20 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 md:flex">
          <NavLink href="/demo">Live demo</NavLink>
          <NavLink href="/check">Check a message</NavLink>
          <NavLink href="/#how">How it works</NavLink>
          <NavLink href="/scoring">Scoring</NavLink>
          <NavLink href="/privacy">Privacy</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link href="/demo" className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]">
            Try it
          </Link>
        </div>
      </div>
      <nav aria-label="Main" className="container-page flex gap-1 overflow-x-auto pb-3 md:hidden">
        <NavLink href="/demo">Live demo</NavLink>
        <NavLink href="/check">Check a message</NavLink>
        <NavLink href="/#how">How it works</NavLink>
        <NavLink href="/scoring">Scoring</NavLink>
        <NavLink href="/privacy">Privacy</NavLink>
      </nav>
    </header>
  );
}
