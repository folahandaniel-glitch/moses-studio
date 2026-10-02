import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await sql`select id, url, filename from media order by created_at desc limit 60`;
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
