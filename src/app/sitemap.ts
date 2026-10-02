import type { MetadataRoute } from "next";
import { sql } from "@/lib/db";
import { getSiteData } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { blocks } = await getSiteData();
  const base = siteUrl(blocks);
  const projects = await sql<{ slug: string; updated_at: Date }[]>`select slug, updated_at from ms_projects where published`;
  return [{ url: base, changeFrequency: "weekly", priority: 1 }, ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.updated_at, changeFrequency: "monthly" as const, priority: 0.7 }))];
}
