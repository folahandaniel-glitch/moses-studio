import "server-only";
import { sql } from "./db";
import type { AdminUser } from "./auth";

export async function logActivity(
  admin: Pick<AdminUser, "id" | "email"> | null,
  action: string,
  entity = "",
  entityId = "",
  detail = "",
): Promise<void> {
  try {
    await sql`insert into ms_activity_logs (admin_id, admin_email, action, entity, entity_id, detail)
      values (${admin?.id || null}, ${admin?.email ?? ""}, ${action}, ${entity}, ${entityId}, ${detail.slice(0, 500)})`;
  } catch (err) {
    console.error("activity log failed", err instanceof Error ? err.message : err);
  }
}
