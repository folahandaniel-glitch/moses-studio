import type { Metadata } from "next";
import type { Blocks } from "./types";

export function siteUrl(blocks?: Blocks): string {
  const raw = blocks?.seo.site_url || process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export function robotsFor(blocks: Blocks): Metadata["robots"] {
  return blocks.seo.robots === "noindex" ? { index: false, follow: false } : { index: true, follow: true };
}

export function buildMetadata(blocks: Blocks, opts: { title?: string; description?: string; path?: string; image?: string; type?: "website" | "article" } = {}): Metadata {
  const base = siteUrl(blocks);
  const title = opts.title || blocks.seo.title;
  const description = opts.description || blocks.seo.description;
  const image = opts.image || blocks.seo.og_image_url;
  const abs = (u: string) => (u.startsWith("http") ? u : `${base}${u}`);
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description,
    keywords: blocks.seo.keywords || undefined,
    alternates: { canonical: `${base}${opts.path ?? ""}` || "/" },
    robots: robotsFor(blocks),
    icons: blocks.site.favicon_url ? { icon: blocks.site.favicon_url } : undefined,
    openGraph: { title, description, url: `${base}${opts.path ?? ""}`, siteName: blocks.site.name, type: opts.type ?? "website", images: image ? [{ url: abs(image) }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, site: blocks.seo.twitter_handle || undefined, images: image ? [abs(image)] : undefined },
  };
}
