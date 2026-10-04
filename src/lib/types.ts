export type ProjectStatus = "PRECIOUS" | "ONGOING" | "READY";
export const PROJECT_STATUSES: ProjectStatus[] = ["PRECIOUS", "ONGOING", "READY"];
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  PRECIOUS: "Previous Works",
  ONGOING: "Ongoing Works",
  READY: "Ready Works",
};
export const STATUS_SHORT: Record<ProjectStatus, string> = { PRECIOUS: "Previous", ONGOING: "Ongoing", READY: "Ready" };

export interface Pair {
  title: string;
  text: string;
}

export interface SiteBlock { name: string; tagline: string; logo_url: string; favicon_url: string }
export interface ThemeBlock {
  mode: "light" | "dark"; accent: string; accent2: string; accent3: string; background: string; text: string; footer_bg: string;
  color_precious: string; color_ongoing: string; color_ready: string; heading_font: "serif" | "sans";
}
export interface HeroBlock { eyebrow: string; heading: string; subtitle: string; description: string; primary_label: string; primary_href: string; secondary_label: string; secondary_href: string }
export interface AboutBlock { eyebrow: string; heading: string; introduction: string; biography: string; statement: string; capabilities: string[]; years_experience: string; location: string; image_url: string; cta_label: string; cta_href: string }
export interface HeadingsBlock {
  services_eyebrow: string; services_heading: string; services_intro: string;
  works_eyebrow: string; works_heading: string; works_intro: string;
  precious_title: string; precious_intro: string; ongoing_title: string; ongoing_intro: string; ready_title: string; ready_intro: string;
  categories_heading: string; spotlight_eyebrow: string;
  process_eyebrow: string; process_heading: string; process_intro: string;
  gallery_eyebrow: string; gallery_heading: string; gallery_intro: string;
  why_eyebrow: string; why_heading: string; why_items: Pair[];
  testimonials_eyebrow: string; testimonials_heading: string;
}
export interface CtaBlock { heading: string; description: string; button_label: string; button_href: string }
export interface ContactBlock { eyebrow: string; heading: string; description: string; phone: string; whatsapp: string; whatsapp_message: string; email: string; notify_email: string; address: string; hours: string }
export interface FooterBlock { text: string; credit: string; backend_label: string }
export interface SeoBlock { title: string; description: string; og_image_url: string; twitter_handle: string; site_url: string; robots: "index" | "noindex"; keywords: string }

export interface Blocks {
  site: SiteBlock; theme: ThemeBlock; hero: HeroBlock; about: AboutBlock; headings: HeadingsBlock;
  cta: CtaBlock; contact: ContactBlock; footer: FooterBlock; seo: SeoBlock;
}
export type BlockName = keyof Blocks;

export interface NavItem { id: string; label: string; href: string }
export interface Slide { id: string; image_url: string; alt: string; caption: string; link_href: string }
export interface Service { id: string; title: string; short_description: string; detailed_description: string; icon: string; image_url: string }
export interface ProcessStep { id: string; title: string; description: string; image_url: string }
export interface GalleryImage { id: string; image_url: string; alt: string; caption: string }
export interface Category { id: string; name: string; slug: string; description: string }
export interface Testimonial { id: string; author_name: string; author_role: string; quote: string; avatar_url: string }
export interface SocialLink { id: string; network: string; url: string }

export interface ProjectCard {
  id: string; title: string; slug: string; short_description: string;
  status: ProjectStatus; featured: boolean; featured_image_url: string;
  category_id: string | null; category_name: string | null; category_slug: string | null;
}

export interface ProjectDetail extends ProjectCard {
  full_description: string; video_url: string; client_name: string; location: string;
  project_date: string | null; completion_date: string | null;
  services_provided: string[]; tools_used: string[]; external_url: string;
  seo_title: string; seo_description: string; updated_at: string;
  images: { id: string; url: string; alt: string }[];
}

export interface SiteData {
  blocks: Blocks;
  navigation: NavItem[];
  slides: Slide[];
  services: Service[];
  process: ProcessStep[];
  gallery: GalleryImage[];
  categories: Category[];
  projects: ProjectCard[];
  testimonials: Testimonial[];
  socials: SocialLink[];
}
