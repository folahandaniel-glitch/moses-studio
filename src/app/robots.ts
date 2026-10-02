import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { blocks } = await getSiteData();
  const base = siteUrl(blocks);
  if (blocks.seo.robots === "noindex") return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${base}/sitemap.xml`, host: base };
}
