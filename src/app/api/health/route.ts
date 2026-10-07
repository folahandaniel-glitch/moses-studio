import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const TABLES = ["ms_content_blocks", "ms_projects", "ms_hero_slides", "ms_services", "ms_process_steps", "ms_gallery_images", "ms_admin_users"] as const;

/** Public, secret-free status page: open /api/health to see whether the database and every table respond. */
export async function GET() {
  const checks: Record<string, string> = {};
  let ok = true;
  const started = Date.now();
  for (const table of TABLES) {
    try {
      const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from ${sql(table)}`;
      checks[table] = `ok (${n} rows)`;
    } catch (err) {
      ok = false;
      const e = err as { code?: string; message?: string };
      checks[table] = `FAILED ${e.code ?? ""} ${(e.message ?? "").slice(0, 120)}`.trim();
    }
  }
  return NextResponse.json({ ok, database: process.env.DATABASE_URL ? "configured" : "DATABASE_URL missing", authSecret: (process.env.AUTH_SECRET ?? "").length >= 32 ? "ok" : "missing or too short", tookMs: Date.now() - started, checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
