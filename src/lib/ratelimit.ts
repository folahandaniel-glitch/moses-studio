import "server-only";
import { headers } from "next/headers";
import { sql } from "./db";

/** Fixed-window limiter stored in PostgreSQL so it works across serverless instances. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limits (key, count, reset_at)
    values (${key}, 1, now() + (${windowSeconds} * interval '1 second'))
    on conflict (key) do update set
      count = case when rate_limits.reset_at < now() then 1 else rate_limits.count + 1 end,
      reset_at = case when rate_limits.reset_at < now() then now() + (${windowSeconds} * interval '1 second') else rate_limits.reset_at end
    returning count`;
  return row.count <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}
