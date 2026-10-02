import { z } from "zod";
import { isSafeHref, slugify } from "./utils";
import { PROJECT_STATUSES, type Pair } from "./types";
import type { FieldDef } from "./sections";

const clean = (s: unknown) => (typeof s === "string" ? s.replace(/\u0000/g, "").trim() : "");

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Phone may only contain digits, spaces, + ( ) and -.").optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Please enter a subject.").max(160),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(4000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

/** Parses a block form submission according to its field definitions. */
export function parseBlockForm(fields: FieldDef[], form: FormData): { data: Record<string, unknown>; errors: string[] } {
  const data: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const f of fields) {
    if (f.type === "lines") {
      data[f.name] = clean(form.get(f.name)).split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 30).map((l) => l.slice(0, f.max ?? 200));
    } else if (f.type === "pairs") {
      const pairs: Pair[] = [];
      for (let i = 0; i < 20; i++) {
        const title = clean(form.get(`${f.name}.${i}.title`));
        const text = clean(form.get(`${f.name}.${i}.text`));
        if (title || text) pairs.push({ title: title.slice(0, 120), text: text.slice(0, 600) });
      }
      data[f.name] = pairs;
    } else {
      const value = clean(form.get(f.name));
      if (f.max && value.length > f.max) errors.push(`${f.label} is too long (maximum ${f.max} characters).`);
      if ((f.type === "url" || f.type === "image") && !isSafeHref(value)) errors.push(`${f.label} must start with https://, /, # , mailto: or tel:.`);
      if (f.type === "color" && !/^#[0-9a-fA-F]{6}$/.test(value)) errors.push(`${f.label} must be a valid colour.`);
      if (f.type === "select" && !f.options?.some((o) => o.value === value)) errors.push(`${f.label} has an invalid choice.`);
      data[f.name] = value;
    }
  }
  return { data, errors };
}

const csv = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 30);
const optionalDate = z.string().trim().transform((v) => (v ? v : null)).refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date.");
const safeUrl = z.string().trim().max(1000).refine(isSafeHref, "Links must start with https://, / or #.");

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(160),
  slug: z.string().trim().max(100).optional().default(""),
  short_description: z.string().trim().max(400).default(""),
  full_description: z.string().trim().max(10000).default(""),
  category_id: z.string().uuid().nullable().catch(null),
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  featured_image_url: safeUrl.default(""),
  video_url: safeUrl.default(""),
  client_name: z.string().trim().max(160).default(""),
  location: z.string().trim().max(160).default(""),
  project_date: optionalDate,
  completion_date: optionalDate,
  services_provided: z.string().default("").transform(csv),
  tools_used: z.string().default("").transform(csv),
  external_url: safeUrl.default(""),
  sort_order: z.coerce.number().int().min(0).max(100000).default(0),
  featured: z.boolean(),
  published: z.boolean(),
  seo_title: z.string().trim().max(160).default(""),
  seo_description: z.string().trim().max(320).default(""),
});

export function parseProjectForm(form: FormData) {
  const get = (k: string) => clean(form.get(k));
  const parsed = projectSchema.safeParse({
    title: get("title"), slug: slugify(get("slug") || get("title")),
    short_description: get("short_description"), full_description: get("full_description"),
    category_id: get("category_id") || null, status: get("status"),
    featured_image_url: get("featured_image_url"), video_url: get("video_url"),
    client_name: get("client_name"), location: get("location"),
    project_date: get("project_date"), completion_date: get("completion_date"),
    services_provided: get("services_provided"), tools_used: get("tools_used"),
    external_url: get("external_url"), sort_order: get("sort_order") || 0,
    featured: form.get("featured") === "on", published: form.get("published") === "on",
    seo_title: get("seo_title"), seo_description: get("seo_description"),
  });
  const gallery: { url: string; alt: string }[] = [];
  for (let i = 0; i < 60; i++) {
    const url = get(`gallery.${i}.url`);
    if (url && isSafeHref(url)) gallery.push({ url, alt: get(`gallery.${i}.alt`).slice(0, 200) });
  }
  return { parsed, gallery };
}
