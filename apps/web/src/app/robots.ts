import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Answer engines and AI crawlers are welcome: being quoted correctly is the point.
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: `${SITE.url}/sitemap.xml`, host: SITE.url };
}
