import { clsx, type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Digits only, suitable for wa.me links. */
export function whatsappNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function whatsappLink(raw: string, message = ""): string {
  const digits = whatsappNumber(raw);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function telLink(raw: string): string {
  return `tel:+${whatsappNumber(raw)}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(d);
}

/** Only allow http(s), relative, anchor, mailto and tel targets. */
export function isSafeHref(value: string): boolean {
  if (!value) return true;
  return /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(value.trim());
}

export function safeHref(value: string, fallback = "#"): string {
  return isSafeHref(value) ? value : fallback;
}

export function hexToRgbTriplet(hex: string, fallback = "0 0 0"): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Relative luminance based choice of readable text colour (as an rgb triplet). */
export function readableOn(hex: string): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(" ").map(Number);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.55 ? "20 18 15" : "255 255 255";
}

export function youtubeEmbed(url: string): string | null {
  const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/.exec(url);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  const v = /vimeo\.com\/(\d+)/.exec(url);
  return v ? `https://player.vimeo.com/video/${v[1]}` : null;
}

const triplet = (hex: string, fallback: string) => hexToRgbTriplet(hex, fallback).split(" ").map(Number);
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ");

export interface ThemeInput {
  mode: string; accent: string; background: string; text: string;
  accent2?: string; accent3?: string; footer_bg?: string; color_precious?: string; color_ongoing?: string; color_ready?: string;
}

/** Turns the editable theme into the CSS variables used by Tailwind colour tokens. */
export function themeVars(theme: ThemeInput): Record<string, string> {
  const dark = theme.mode === "dark";
  const bg = dark ? [15, 14, 12] : triplet(theme.background, "246 243 238");
  const ink = dark ? [241, 237, 230] : triplet(theme.text, "22 19 15");
  const accent = triplet(theme.accent, "168 116 59");
  return {
    "--c-bg": bg.join(" "),
    "--c-ink": ink.join(" "),
    "--c-surface": mix(bg, ink, dark ? 0.07 : 0.045),
    "--c-muted": mix(ink, bg, dark ? 0.35 : 0.38),
    "--c-line": mix(bg, ink, dark ? 0.16 : 0.13),
    "--c-accent": accent.join(" "),
    "--c-accent-ink": readableOn(theme.accent),
    "--c-accent2": triplet(theme.accent2 ?? "", "14 165 164").join(" "),
    "--c-accent3": triplet(theme.accent3 ?? "", "249 115 22").join(" "),
    "--c-footer": triplet(theme.footer_bg ?? "", "20 20 43").join(" "),
    "--c-precious": triplet(theme.color_precious ?? "", "217 119 6").join(" "),
    "--c-ongoing": triplet(theme.color_ongoing ?? "", "37 99 235").join(" "),
    "--c-ready": triplet(theme.color_ready ?? "", "5 150 105").join(" "),
  };
}
