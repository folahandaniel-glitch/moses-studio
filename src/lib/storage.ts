import "server-only";
import { put, del } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { sql } from "./db";
import sharp, { type Metadata } from "sharp";
import { randomUUID } from "node:crypto";

/** Hosting platforms limit request bodies (Vercel: 4.5 MB), so the dashboard shrinks large photos before upload. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export interface StoredImage {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export class UploadError extends Error {}

/** Validates the real file content (not just the extension), optimises it to WebP and stores it. */
export async function storeImage(file: File): Promise<StoredImage> {
  if (!(file.type in ALLOWED)) throw new UploadError("Only JPG, PNG, WebP, AVIF or GIF images are allowed.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image is larger than 4 MB. Please choose a smaller file.");
  const input = Buffer.from(await file.arrayBuffer());

  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("That file is not a valid image.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "gif"].includes(meta.format)) {
    throw new UploadError("That file is not a supported image.");
  }

  const output = await sharp(input, { animated: false })
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40) || "image";
  const filename = `${base}-${randomUUID().slice(0, 8)}.webp`;

  let url = "";
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`media/${filename}`, output.data, { access: "public", contentType: "image/webp", addRandomSuffix: false });
      url = blob.url;
    } catch (err) {
      console.error("blob upload failed, using database storage:", err instanceof Error ? err.message : err);
    }
  }
  if (!url) {
    // Default storage: the optimised image (a few hundred KB) lives in PostgreSQL and is served from /media/<id>.
    const [row] = await sql<{ id: string }[]>`insert into ms_media_files (data, mime_type) values (${output.data}, 'image/webp') returning id`;
    url = `/media/${row.id}`;
  }

  return { url, filename, mimeType: "image/webp", sizeBytes: output.data.length, width: output.info.width, height: output.info.height };
}

export async function removeStoredFile(url: string): Promise<void> {
  try {
    if (url.startsWith("/media/")) {
      await sql`delete from ms_media_files where id::text = ${url.slice("/media/".length)}`;
    } else if (url.startsWith("/uploads/")) {
      await fs.unlink(path.join(process.cwd(), "public", url));
    } else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes("blob.vercel-storage.com")) {
      await del(url);
    }
  } catch {
    /* file already gone */
  }
}
