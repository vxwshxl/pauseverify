import type { Metadata } from "next";
import { Checker } from "./checker";

export const metadata: Metadata = { title: "Check a message" };

export default function CheckPage() {
  return <Checker />;
}
