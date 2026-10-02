import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export type AdminRole = "SUPER_ADMIN" | "ADMIN";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Resolves the signed-in administrator, re-checking the database so revoked sessions stop working. */
export async function getAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const [row] = await sql<(AdminUser & { token_version: number; active: boolean })[]>`
    select id, email, name, role, token_version, active from ms_admin_users where id = ${session.uid}`;
  if (!row || !row.active || row.token_version !== session.tv) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/unauthorized");
  return admin;
}

/** Strong enough for an admin account: length plus mixed character classes. */
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include upper case, lower case and a number.";
  }
  return null;
}
