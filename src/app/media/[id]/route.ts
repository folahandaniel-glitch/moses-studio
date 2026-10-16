import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Serves uploaded images stored in the database. Files are immutable (new upload = new id), so they cache forever. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const etag = `"${id}"`;
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  try {
    const [row] = await sql<{ data: Buffer; mime_type: string }[]>`select data, mime_type from ms_media_files where id = ${id}`;
    if (!row) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(new Uint8Array(row.data), {
      headers: { "Content-Type": row.mime_type, "Cache-Control": "public, max-age=31536000, immutable", ETag: etag, "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    console.error("media fetch failed", err instanceof Error ? err.message : err);
    return new NextResponse("Unavailable", { status: 503 });
  }
}
