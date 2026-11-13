import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const display = localFont({
  src: "../../public/fonts/InstrumentSans-Variable.woff2",
  variable: "--font-display",
  display: "swap",
  preload: true,
  weight: "400 700",
  adjustFontFallback: "Arial",
});

export { GeistSans as body, GeistMono as mono };
