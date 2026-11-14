import type { Metadata } from "next";
import { Inbox } from "./inbox";

export const metadata: Metadata = {
  title: "Live demo",
  description: "A pretend inbox with real scam patterns from India — bank KYC, digital arrest, power-cut, QR refund and job scams. Open one and watch Pause & Verify explain it.",
  alternates: { canonical: "/demo" },
};

export default function DemoPage() {
  return <Inbox />;
}
