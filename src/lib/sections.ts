/** Describes every editable block so the dashboard form, validation and saving share one definition. */
export type FieldType = "text" | "textarea" | "url" | "image" | "color" | "select" | "lines" | "pairs" | "boolean" | "number";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  options?: { value: string; label: string }[];
  max?: number;
}

export interface SectionDef {
  title: string;
  description: string;
  fields: FieldDef[];
}

const t = (name: string, label: string, help?: string, max = 200): FieldDef => ({ name, label, type: "text", help, max });
const area = (name: string, label: string, help?: string, max = 3000): FieldDef => ({ name, label, type: "textarea", help, max });
const link = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: "url", help: help ?? "Use #contact for a section on this page, or a full https:// address.", max: 500 });
const img = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: "image", help, max: 1000 });

export const SECTIONS: Record<string, SectionDef> = {
  site: {
    title: "Site Settings",
    description: "Your studio name, logo and favicon.",
    fields: [
      t("name", "Website title"),
      t("tagline", "Tagline", "Shown beside the name in the header and footer."),
      img("logo_url", "Logo", "Optional. Without a logo the studio name is shown as text."),
      img("favicon_url", "Favicon", "Small square icon shown in browser tabs."),
    ],
  },
  theme: {
    title: "Theme",
    description: "Colours and typography of the public website.",
    fields: [
      { name: "mode", label: "Appearance", type: "select", options: [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }] },
      { name: "accent", label: "Primary colour", type: "color", help: "Buttons, links and highlights." },
      { name: "accent2", label: "Secondary colour", type: "color", help: "Second highlight used in cards, icons and gradients." },
      { name: "accent3", label: "Third colour", type: "color", help: "Third highlight used in gradients and accents." },
      { name: "background", label: "Page background colour", type: "color", help: "Applies to the Light appearance." },
      { name: "text", label: "Text colour", type: "color", help: "Applies to the Light appearance." },
      { name: "footer_bg", label: "Footer colour", type: "color" },
      { name: "color_precious", label: "Previous Works colour", type: "color" },
      { name: "color_ongoing", label: "Ongoing Works colour", type: "color" },
      { name: "color_ready", label: "Ready Works colour", type: "color" },
      { name: "heading_font", label: "Heading style", type: "select", options: [{ value: "serif", label: "Elegant serif" }, { value: "sans", label: "Modern sans" }] },
    ],
  },
  hero: {
    title: "Hero",
    description: "The first thing visitors see, displayed over the carousel images.",
    fields: [
      t("eyebrow", "Small label above heading"),
      t("heading", "Heading", undefined, 160),
      t("subtitle", "Subtitle", undefined, 240),
      area("description", "Description", undefined, 600),
      t("primary_label", "Main button label", undefined, 40),
      link("primary_href", "Main button link"),
      t("secondary_label", "Second button label", undefined, 40),
      link("secondary_href", "Second button link"),
    ],
  },
  about: {
    title: "About",
    description: "Tell visitors who is behind Moses Studio. Leave optional fields empty to hide them.",
    fields: [
      t("eyebrow", "Small label"),
      t("heading", "Heading"),
      img("image_url", "Profile image"),
      area("introduction", "Introduction", undefined, 800),
      area("biography", "Biography", "Separate paragraphs with a blank line.", 4000),
      area("statement", "Professional statement", undefined, 600),
      { name: "capabilities", label: "Key capabilities", type: "lines", help: "One capability per line.", max: 120 },
      t("years_experience", "Years of experience", "Optional. Leave empty until you are ready to publish a real figure.", 40),
      t("location", "Location", "Optional.", 120),
      t("cta_label", "Button label", undefined, 40),
      link("cta_href", "Button link"),
    ],
  },
  headings: {
    title: "Section Headings",
    description: "Titles and introductions of every section of the one-page website.",
    fields: [
      t("services_eyebrow", "Services: small label"), t("services_heading", "Services: heading"), area("services_intro", "Services: introduction", undefined, 500),
      t("works_eyebrow", "Works: small label"), t("works_heading", "Works: heading"), area("works_intro", "Works: introduction", undefined, 500),
      t("precious_title", "Previous Works: title"), t("precious_intro", "Previous Works: introduction"),
      t("ongoing_title", "Ongoing Works: title"), t("ongoing_intro", "Ongoing Works: introduction"),
      t("ready_title", "Ready Works: title"), t("ready_intro", "Ready Works: introduction"),
      t("process_eyebrow", "Process: small label"), t("process_heading", "Process: heading"), area("process_intro", "Process: introduction", undefined, 500),
      t("gallery_eyebrow", "Gallery: small label"), t("gallery_heading", "Gallery: heading"), area("gallery_intro", "Gallery: introduction", undefined, 500),
      t("categories_heading", "Categories: heading"), t("spotlight_eyebrow", "Project in focus: small label"),
      t("why_eyebrow", "Why choose us: small label"), t("why_heading", "Why choose us: heading"),
      { name: "why_items", label: "Why choose us: reasons", type: "pairs", help: "Add as many reasons as you like." },
      t("testimonials_eyebrow", "Testimonials: small label"), t("testimonials_heading", "Testimonials: heading"),
    ],
  },
  cta: {
    title: "Call To Action",
    description: "The banner that invites visitors to get in touch.",
    fields: [t("heading", "Heading"), area("description", "Description", undefined, 500), t("button_label", "Button label", undefined, 40), link("button_href", "Button link")],
  },
  contact: {
    title: "Contact",
    description: "Contact details shown on the website and used by the call, WhatsApp and form actions.",
    fields: [
      t("eyebrow", "Small label"), t("heading", "Heading"), area("description", "Description", undefined, 500),
      t("phone", "Phone number", "International format, for example +234 813 419 8744.", 30),
      t("whatsapp", "WhatsApp number", "International format.", 30),
      t("whatsapp_message", "WhatsApp opening message", "Pre-filled text when a visitor opens WhatsApp.", 300),
      t("email", "Public email address", "Optional. Shown on the website when filled.", 200),
      t("notify_email", "Enquiry notification email", "Where contact form enquiries are emailed (needs the email service configured).", 200),
      t("address", "Address", "Optional.", 300), t("hours", "Opening hours", "Optional.", 200),
    ],
  },
  footer: {
    title: "Footer",
    description: "Text shown at the bottom of every page.",
    fields: [t("text", "Footer text", "The copyright year is added automatically."), t("credit", "Credit line"), t("backend_label", "Back end link label", "The small link to the dashboard sign in. Leave empty to hide it.", 30)],
  },
  seo: {
    title: "SEO and Sharing",
    description: "How the website appears in search results and when shared on social platforms.",
    fields: [
      t("title", "SEO title", "About 50 to 60 characters.", 120), area("description", "SEO description", "About 150 to 160 characters.", 300),
      img("og_image_url", "Social sharing image", "Recommended 1200 x 630 pixels."),
      t("twitter_handle", "X (Twitter) handle", "For example @mosesstudio.", 40),
      { name: "site_url", label: "Website address", type: "url", help: "Your live address, for example https://www.example.com. Used for canonical links and the sitemap.", max: 200 },
      { name: "robots", label: "Search engines", type: "select", options: [{ value: "index", label: "Allow indexing" }, { value: "noindex", label: "Hide from search engines" }] },
      t("keywords", "Keywords", "Comma separated. Optional.", 300),
    ],
  },
};

export const SOCIAL_NETWORKS = ["Facebook", "Instagram", "YouTube", "TikTok", "LinkedIn", "X", "Behance", "Dribbble", "Other"];
export const SERVICE_ICONS = ["sparkle", "layers", "compass", "pen", "camera", "film", "code", "palette", "megaphone", "box"];
