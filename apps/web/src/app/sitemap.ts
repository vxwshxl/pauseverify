import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [["", 1], ["/demo", 0.9], ["/check", 0.9], ["/scoring", 0.8], ["/privacy", 0.7]];
  return pages.map(([path, priority]) => ({ url: `${SITE.url}${path}`, changeFrequency: "weekly", priority }));
}
