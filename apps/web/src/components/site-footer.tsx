import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-subtle">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            A calm second opinion, right where the message is. Checks run on your device; nothing is stored.
          </p>
        </div>
        <FooterCol title="Product" links={[["Live demo", "/demo"], ["Check a message", "/check"], ["How it works", "/#how"], ["How the score works", "/scoring"], ["Privacy & security", "/privacy"]]} />
        <FooterCol title="If you were scammed" links={[["Call 1930", "tel:1930"], ["cybercrime.gov.in", "https://cybercrime.gov.in"], ["Report on Sanchar Saathi", "https://sancharsaathi.gov.in"]]} />
      </div>
      <div className="container-page border-t border-border py-6 text-sm text-muted-foreground">
        © 2026 Pause &amp; Verify · Built for the 24-hour prototype hackathon, PS05
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
