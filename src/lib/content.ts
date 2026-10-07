import "server-only";
import { unstable_cache } from "next/cache";
import { sql } from "./db";
import defaults from "../../db/defaults.json";
import type {
  Blocks, Category, GalleryImage, NavItem, ProcessStep, ProjectCard, ProjectDetail, Service, Slide, SiteData, SocialLink, Testimonial,
} from "./types";

export const CONTENT_TAG = "content";

const projectCardColumns = () => sql`
  p.id, p.title, p.slug, p.short_description, p.status, p.featured, p.featured_image_url,
  p.category_id, c.name as category_name, c.slug as category_slug`;

/** Optional content must never take the whole page down: log the problem and show an empty list instead. */
async function optional<T>(label: string, query: PromiseLike<T[]>): Promise<T[]> {
  try {
    return await query;
  } catch (err) {
    console.error(`[content] ${label} unavailable:`, err instanceof Error ? err.message : err);
    return [];
  }
}

/** Saved blocks win; the shipped defaults fill any section or key that is missing (for example after an upgrade). */
function withDefaults(rows: { section: string; data: unknown }[]): Blocks {
  const saved = Object.fromEntries(rows.map((r) => [r.section, r.data as Record<string, unknown>]));
  const merged: Record<string, unknown> = {};
  for (const [section, base] of Object.entries(defaults.blocks)) merged[section] = { ...(base as object), ...(saved[section] ?? {}) };
  return merged as unknown as Blocks;
}

async function loadSiteData(): Promise<SiteData> {
  const [blockRows, navigation, slides, services, categories, projects, testimonials, socials, process, gallery] = await Promise.all([
    optional("content blocks", sql<{ section: keyof Blocks; data: unknown }[]>`select section, data from ms_content_blocks`),
    optional("navigation", sql<NavItem[]>`select id, label, href from ms_navigation_items where visible order by sort_order, label`),
    optional("slides", sql<Slide[]>`select id, image_url, alt, caption, link_href from ms_hero_slides where published order by sort_order`),
    optional("services", sql<Service[]>`select id, title, short_description, detailed_description, icon, image_url from ms_services where published order by sort_order`),
    optional("categories", sql<Category[]>`select id, name, slug, description from ms_categories order by sort_order, name`),
    optional("projects", sql<ProjectCard[]>`select ${projectCardColumns()} from ms_projects p left join ms_categories c on c.id = p.category_id
      where p.published order by p.sort_order, p.created_at desc`),
    optional("testimonials", sql<Testimonial[]>`select id, author_name, author_role, quote, avatar_url from ms_testimonials where published order by sort_order`),
    optional("social links", sql<SocialLink[]>`select id, network, url from ms_social_links where visible and url <> '' order by sort_order`),
    optional("process steps", sql<ProcessStep[]>`select id, title, description, image_url from ms_process_steps where published order by sort_order`),
    optional("gallery", sql<GalleryImage[]>`select id, image_url, alt, caption from ms_gallery_images where published order by sort_order`),
  ]);
  const blocks = withDefaults(blockRows);
  return { blocks, navigation, slides, services, process, gallery, categories, projects, testimonials, socials };
}

export const getSiteData = unstable_cache(loadSiteData, ["site-data"], { tags: [CONTENT_TAG], revalidate: 300 });

async function loadProject(slug: string): Promise<ProjectDetail | null> {
  const [project] = await sql<Omit<ProjectDetail, "images">[]>`
    select ${projectCardColumns()}, p.full_description, p.video_url, p.client_name, p.location,
      p.project_date::text, p.completion_date::text, p.services_provided, p.tools_used, p.external_url,
      p.seo_title, p.seo_description, p.updated_at::text
    from ms_projects p left join ms_categories c on c.id = p.category_id
    where p.slug = ${slug} and p.published`;
  if (!project) return null;
  const images = await sql<ProjectDetail["images"]>`select id, url, alt from ms_project_images where project_id = ${project.id} order by sort_order`;
  return { ...project, images };
}

export const getProject = (slug: string) => unstable_cache(() => loadProject(slug), ["project", slug], { tags: [CONTENT_TAG], revalidate: 300 })();
