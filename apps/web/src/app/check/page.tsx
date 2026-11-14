import type { Metadata } from "next";
import { Checker } from "./checker";

export const metadata: Metadata = {
  title: "Check a message",
  description: "Paste a suspicious message or link, or drop a screenshot. See exactly what’s worrying about it and how to check safely — free, in nine Indian languages.",
  alternates: { canonical: "/check" },
};

export default function CheckPage() {
  return <Checker />;
}
