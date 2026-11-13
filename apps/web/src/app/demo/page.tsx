import type { Metadata } from "next";
import { Inbox } from "./inbox";

export const metadata: Metadata = { title: "Live demo" };

export default function DemoPage() {
  return <Inbox />;
}
