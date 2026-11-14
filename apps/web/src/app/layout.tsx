import type { Metadata, Viewport } from "next";
import { display, body, mono } from "./fonts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pause & Verify — check before you click, pay or share", template: "%s · Pause & Verify" },
  description:
    "A calm second opinion on suspicious messages. Pause & Verify spots scam warning signs, explains them in plain language, and shows you a safe way to check — right where the message is.",
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      {/* Some browser extensions (e.g. VPN add-ons) write attributes into <body> before React hydrates. */}
      <body className="flex min-h-dvh flex-col" suppressHydrationWarning>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
      </body>
    </html>
  );
}
