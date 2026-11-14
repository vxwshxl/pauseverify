import type { Metadata, Viewport } from "next";
import { display, body, mono } from "./fonts";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Pause & Verify — free anti-scam assistant for India", template: "%s · Pause & Verify" },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "scam checker India", "fake SMS checker", "KYC scam", "OTP fraud", "digital arrest scam", "UPI QR scam",
    "fake bank link", "phishing check", "cyber fraud 1930", "Assamese", "Bodo", "Manipuri", "Khasi", "Mizo",
    "Northeast India", "Chrome extension", "Bhashini",
  ],
  authors: SITE.members.map((name) => ({ name })),
  creator: SITE.team,
  category: "security",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_IN",
    title: "Pause & Verify — pause before you pay",
    description: "Spots scam warning signs where you read, explains them in nine Indian languages, and shows a safe way to check. Free and private.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pause & Verify — pause before you pay",
    description: "A free anti-scam assistant for India, in English, Hindi and seven Northeast languages.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: false },
};

// Who we are and what the product is, for search and answer engines.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: SITE.name, inLanguage: "en-IN", description: SITE.description },
    {
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE.url,
      applicationCategory: "SecurityApplication",
      operatingSystem: "Chrome, Edge, any modern browser",
      description: SITE.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      inLanguage: ["en", "hi", "as", "brx", "bn", "mni", "ne", "kha", "lus"],
      featureList: [
        "On-device scam detection", "Fake and look-alike link warnings", "UPI QR decoding",
        "Screenshot reading", "Explanations in nine Indian languages", "Read-aloud", "Masked, no-storage AI answers",
      ],
      author: { "@type": "Organization", name: SITE.team, member: SITE.members.map((name) => ({ "@type": "Person", name })) },
      sameAs: [SITE.repo],
    },
  ],
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
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
          <SiteHeader />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
      </body>
    </html>
  );
}
