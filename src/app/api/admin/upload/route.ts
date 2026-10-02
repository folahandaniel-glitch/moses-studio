import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { storeImage, UploadError } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // CSRF defence in depth on top of the SameSite=Strict session cookie.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await rateLimit(`upload:${admin.id}`, 60, 600))) return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

  try {
    const stored = await storeImage(file);
    const [row] = await sql<{ id: string }[]>`
      insert into ms_media (url, filename, mime_type, size_bytes, width, height, uploaded_by)
      values (${stored.url}, ${stored.filename}, ${stored.mimeType}, ${stored.sizeBytes}, ${stored.width}, ${stored.height}, ${admin.id}) returning id`;
    await logActivity(admin, "media.uploaded", "media", row.id, stored.filename);
    return NextResponse.json({ id: row.id, url: stored.url });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("upload failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
