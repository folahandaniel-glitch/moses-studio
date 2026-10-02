import { describe, expect, it } from "vitest";
import { isSafeHref, safeHref, slugify, telLink, themeVars, whatsappLink, youtubeEmbed } from "@/lib/utils";

describe("contact links", () => {
  it("builds the tel link in international format", () => {
    expect(telLink("+234 813 419 8744")).toBe("tel:+2348134198744");
  });
  it("builds a WhatsApp link with an encoded message", () => {
    expect(whatsappLink("+234 813 419 8744", "Hello Moses Studio")).toBe("https://wa.me/2348134198744?text=Hello%20Moses%20Studio");
    expect(whatsappLink("+234 813 419 8744")).toBe("https://wa.me/2348134198744");
  });
});

describe("slugify", () => {
  it("creates clean URL slugs", () => {
    expect(slugify("  Café Brand: Identity & Web! ")).toBe("cafe-brand-identity-web");
    expect(slugify("---")).toBe("");
  });
});

describe("href safety", () => {
  it("accepts safe targets", () => {
    for (const v of ["https://example.com", "http://x.y", "/work/a", "#contact", "mailto:a@b.co", "tel:+234", ""]) expect(isSafeHref(v)).toBe(true);
  });
  it("rejects script and data URLs", () => {
    for (const v of ["javascript:alert(1)", "data:text/html,x", " JaVaScRiPt:1", "vbscript:x"]) expect(isSafeHref(v)).toBe(false);
    expect(safeHref("javascript:alert(1)")).toBe("#");
  });
});

describe("theme", () => {
  it("derives CSS variables from the editable theme", () => {
    const vars = themeVars({ mode: "light", accent: "#A8743B", background: "#F6F3EE", text: "#16130F" });
    expect(vars["--c-accent"]).toBe("168 116 59");
    expect(vars["--c-bg"]).toBe("246 243 238");
  });
  it("uses a dark palette in dark mode", () => {
    expect(themeVars({ mode: "dark", accent: "#ffffff", background: "#ffffff", text: "#000000" })["--c-bg"]).toBe("15 14 12");
  });
});

describe("video embeds", () => {
  it("supports YouTube and Vimeo and nothing else", () => {
    expect(youtubeEmbed("https://youtu.be/dQw4w9WgXcQ")).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbed("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
    expect(youtubeEmbed("https://evil.example/video")).toBeNull();
  });
});
