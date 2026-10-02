import { SERVICE_ICONS, SOCIAL_NETWORKS, type FieldDef } from "./sections";

export interface CollectionDef {
  key: string;
  table: string;
  title: string;
  singular: string;
  description: string;
  fields: FieldDef[];
  /** Field shown as the row title in lists. */
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  /** Boolean column controlling public visibility. */
  visibilityField?: "published" | "visible";
  sortable: boolean;
  slugFrom?: string;
}

const text = (name: string, label: string, max = 200, help?: string): FieldDef => ({ name, label, type: "text", max, help });
const area = (name: string, label: string, max = 2000, help?: string): FieldDef => ({ name, label, type: "textarea", max, help });
const image = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: "image", max: 1000, help });
const href = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: "url", max: 500, help });
const opts = (list: string[]) => list.map((v) => ({ value: v, label: v }));

export const COLLECTIONS: Record<string, CollectionDef> = {
  navigation: {
    key: "navigation", table: "navigation_items", title: "Navigation", singular: "menu item", sortable: true, titleField: "label", subtitleField: "href", visibilityField: "visible",
    description: "Links in the top menu. Use #about, #services, #works or #contact to scroll to a section.",
    fields: [text("label", "Label", 40), href("href", "Link", "Use #contact for a section on this page, or a full https:// address."), { name: "visible", label: "Show in menu", type: "boolean" }],
  },
  hero_slides: {
    key: "hero_slides", table: "hero_slides", title: "Hero Carousel", singular: "slide", sortable: true, titleField: "caption", subtitleField: "alt", imageField: "image_url", visibilityField: "published",
    description: "Full-screen images that rotate behind the hero heading. Use wide, high-quality images (at least 1920 pixels).",
    fields: [image("image_url", "Image"), text("alt", "Image description", 200, "Describe the image for visitors who cannot see it."), text("caption", "Caption", 120), href("link_href", "Optional link"), { name: "published", label: "Show on the website", type: "boolean" }],
  },
  services: {
    key: "services", table: "services", title: "Services", singular: "service", sortable: true, titleField: "title", subtitleField: "short_description", imageField: "image_url", visibilityField: "published",
    description: "What Moses Studio offers. Each service appears as a card on the website.",
    fields: [text("title", "Title", 120), area("short_description", "Short description", 400), area("detailed_description", "Detailed description", 3000, "Shown when a visitor opens Learn more."), { name: "icon", label: "Icon", type: "select", options: opts(SERVICE_ICONS) }, image("image_url", "Image", "Optional. Replaces the icon when set."), { name: "published", label: "Show on the website", type: "boolean" }],
  },
  categories: {
    key: "categories", table: "categories", title: "Portfolio Categories", singular: "category", sortable: true, titleField: "name", subtitleField: "description", slugFrom: "name",
    description: "Groups used to filter the portfolio. A category appears on the website once it has published projects.",
    fields: [text("name", "Name", 80), area("description", "Description", 300)],
  },
  testimonials: {
    key: "testimonials", table: "testimonials", title: "Testimonials", singular: "testimonial", sortable: true, titleField: "author_name", subtitleField: "quote", imageField: "avatar_url", visibilityField: "published",
    description: "Only add testimonials given by real clients with their permission.",
    fields: [text("author_name", "Client name", 120), text("author_role", "Role or company", 160), area("quote", "Testimonial", 1000), image("avatar_url", "Photo", "Optional."), { name: "published", label: "Show on the website", type: "boolean" }],
  },
  social_links: {
    key: "social_links", table: "social_links", title: "Social Links", singular: "social link", sortable: true, titleField: "network", subtitleField: "url", visibilityField: "visible",
    description: "Only networks you add here are shown on the website.",
    fields: [{ name: "network", label: "Network", type: "select", options: opts(SOCIAL_NETWORKS) }, href("url", "Profile address", "Full https:// address."), { name: "visible", label: "Show on the website", type: "boolean" }],
  },
};
