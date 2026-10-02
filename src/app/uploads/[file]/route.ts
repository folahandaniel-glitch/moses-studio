import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/** Serves locally stored uploads when no cloud storage is configured (local development only). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-z0-9-]+\.webp$/.test(file)) return new NextResponse("Not found", { status: 404 });
  try {
    const data = await fs.readFile(path.join(process.cwd(), "public", "uploads", file));
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
