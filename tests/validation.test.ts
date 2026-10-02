import { describe, expect, it } from "vitest";
import { contactSchema, parseBlockForm, parseProjectForm } from "@/lib/validation";
import { SECTIONS } from "@/lib/sections";

const form = (entries: Record<string, string>) => {
  const f = new FormData();
  Object.entries(entries).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("contact form validation", () => {
  const valid = { name: "Ada Obi", email: "ada@example.com", phone: "+234 813 419 8744", subject: "Project", message: "I would like to discuss a project." };
  it("accepts a valid enquiry", () => expect(contactSchema.safeParse(valid).success).toBe(true));
  it("rejects bad email, short message and bad phone", () => {
    const r = contactSchema.safeParse({ ...valid, email: "nope", message: "short", phone: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(r.error.flatten().fieldErrors).sort()).toEqual(["email", "message", "phone"]);
  });
  it("allows an empty phone", () => expect(contactSchema.safeParse({ ...valid, phone: "" }).success).toBe(true));
});

describe("content block parsing", () => {
  it("parses lines and repeater pairs", () => {
    const { data, errors } = parseBlockForm(SECTIONS.about.fields.filter((f) => f.name === "capabilities"), form({ capabilities: "One\n\n Two \nThree" }));
    expect(errors).toEqual([]);
    expect(data.capabilities).toEqual(["One", "Two", "Three"]);
    const pairs = parseBlockForm(SECTIONS.headings.fields.filter((f) => f.name === "why_items"), form({ "why_items.0.title": "A", "why_items.0.text": "B", "why_items.1.title": "", "why_items.1.text": "" }));
    expect(pairs.data.why_items).toEqual([{ title: "A", text: "B" }]);
  });
  it("rejects unsafe links and invalid colours", () => {
    const hero = parseBlockForm(SECTIONS.hero.fields.filter((f) => f.name === "primary_href"), form({ primary_href: "javascript:alert(1)" }));
    expect(hero.errors.length).toBe(1);
    const theme = parseBlockForm(SECTIONS.theme.fields.filter((f) => f.name === "accent"), form({ accent: "red" }));
    expect(theme.errors.length).toBe(1);
  });
});

describe("project form parsing", () => {
  const base = { title: "Brand Film", status: "ONGOING", services_provided: "Direction, Editing", tools_used: "", sort_order: "3" };
  it("normalises a valid project", () => {
    const { parsed, gallery } = parseProjectForm(form({ ...base, "gallery.0.url": "/a.webp", "gallery.0.alt": "A", "gallery.1.url": "javascript:x" }));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slug).toBe("brand-film");
      expect(parsed.data.services_provided).toEqual(["Direction", "Editing"]);
      expect(parsed.data.published).toBe(false);
    }
    expect(gallery).toEqual([{ url: "/a.webp", alt: "A" }]);
  });
  it("rejects arbitrary statuses and unsafe links", () => {
    expect(parseProjectForm(form({ ...base, status: "DONE" })).parsed.success).toBe(false);
    expect(parseProjectForm(form({ ...base, external_url: "javascript:alert(1)" })).parsed.success).toBe(false);
  });
});
