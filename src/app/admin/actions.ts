"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import { checkPassword, hashPassword, passwordProblem, requireAdmin, requireSuperAdmin, type AdminRole } from "@/lib/auth";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity";
import { CONTENT_TAG } from "@/lib/content";
import { SECTIONS } from "@/lib/sections";
import { COLLECTIONS } from "@/lib/collections";
import { loginSchema, parseBlockForm, parseProjectForm } from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { removeStoredFile } from "@/lib/storage";

const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5Wn1xYz2yJk3XhZk7Jz7q2m3e0n8y6u";


/**
 * Actions finish by "redirecting" with a notice. The redirect is returned to the client form (see ActionForm)
 * instead of using Next's navigation machinery, which keeps saving reliable on every browser.
 */
class RedirectSignal extends Error {
  constructor(public to: string) { super("redirect"); }
}
export interface ActionResult { redirect?: string; error?: string }
const redirect = (to: string): never => { throw new RedirectSignal(to); };
const withQuery = (path: string, key: string, value: string) => `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
const done = (path: string, notice: string): never => redirect(withQuery(path, "notice", notice));
const failed = (path: string, error: string): never => redirect(withQuery(path, "error", error));

async function run(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? {};
  } catch (err) {
    if (err instanceof RedirectSignal) return { redirect: err.to };
    if (isRedirectError(err)) return { redirect: String((err as { digest: string }).digest.split(";")[2]) };
    throw err;
  }
}
const refresh = () => (process.env.NO_REFRESH ? undefined : revalidateTag(CONTENT_TAG));

/* ----------------------------- authentication ----------------------------- */

async function loginImpl(form: FormData): Promise<ActionResult | void> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter a valid email address and password." };
  const { email, password } = parsed.data;

  const ip = await clientIp();
  if (!(await rateLimit(`login-ip:${ip}`, 20, 900)) || !(await rateLimit(`login-email:${email}`, 6, 900))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const [user] = await sql<{ id: string; email: string; password_hash: string; token_version: number; active: boolean }[]>`
    select id, email, password_hash, token_version, active from ms_admin_users where email = ${email}`;
  const ok = await checkPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) {
    await logActivity({ id: "", email }, "login.failed");
    return { error: "Incorrect email or password." };
  }
  await sql`delete from ms_rate_limits where key in (${`login-email:${email}`}, ${`login-ip:${ip}`})`;
  await sql`update ms_admin_users set last_login_at = now() where id = ${user.id}`;
  await setSessionCookie({ uid: user.id, tv: user.token_version });
  await logActivity(user, "login");
  redirect("/admin");
}

async function logoutImpl(): Promise<ActionResult | void> {
  await clearSessionCookie();
  redirect("/admin/login");
}

async function changeOwnPasswordImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from ms_admin_users where id = ${admin.id}`;
  if (!(await checkPassword(current, row.password_hash))) failed("/admin/security", "Your current password is incorrect.");
  if (next !== confirm) failed("/admin/security", "The new passwords do not match.");
  const problem = passwordProblem(next);
  if (problem) failed("/admin/security", problem);
  const [updated] = await sql<{ token_version: number }[]>`update ms_admin_users set password_hash = ${await hashPassword(next)}, token_version = token_version + 1 where id = ${admin.id} returning token_version`;
  await setSessionCookie({ uid: admin.id, tv: updated.token_version });
  await logActivity(admin, "password.changed");
  done("/admin/security", "Password updated. Other devices have been signed out.");
}

/* ------------------------------ users (super) ------------------------------ */

async function createUserImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireSuperAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role: AdminRole = form.get("role") === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2) failed("/admin/users", "Enter a valid name and email address.");
  const problem = passwordProblem(password);
  if (problem) failed("/admin/users", problem);
  try {
    await sql`insert into ms_admin_users (email, name, password_hash, role) values (${email}, ${name}, ${await hashPassword(password)}, ${role})`;
  } catch {
    failed("/admin/users", "An account with that email already exists.");
  }
  await logActivity(admin, "user.created", "admin_user", email);
  done("/admin/users", `Account created for ${email}.`);
}

async function resetUserPasswordImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id"));
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) failed("/admin/users", problem);
  await sql`update ms_admin_users set password_hash = ${await hashPassword(password)}, token_version = token_version + 1 where id = ${id}`;
  await logActivity(admin, "user.password_reset", "admin_user", id);
  done("/admin/users", "Password reset. The user has been signed out everywhere.");
}

async function setUserActiveImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id"));
  const active = form.get("active") === "true";
  if (id === admin.id) failed("/admin/users", "You cannot deactivate your own account.");
  await sql`update ms_admin_users set active = ${active}, token_version = token_version + 1 where id = ${id}`;
  await logActivity(admin, active ? "user.activated" : "user.deactivated", "admin_user", id);
  done("/admin/users", active ? "Account activated." : "Account deactivated.");
}

async function deleteUserImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireSuperAdmin();
  const id = String(form.get("id"));
  if (id === admin.id) failed("/admin/users", "You cannot delete your own account.");
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int as count from ms_admin_users where role = 'SUPER_ADMIN' and active and id <> ${id}`;
  if (count === 0) failed("/admin/users", "At least one active Super Admin must remain.");
  await sql`delete from ms_admin_users where id = ${id}`;
  await logActivity(admin, "user.deleted", "admin_user", id);
  done("/admin/users", "Account deleted.");
}

/* ------------------------------ content blocks ----------------------------- */

async function saveBlockImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const section = String(form.get("section"));
  const def = SECTIONS[section];
  const path = `/admin/content/${section}`;
  if (!def) failed("/admin", "Unknown section.");
  const { data, errors } = parseBlockForm(def.fields, form);
  if (errors.length) failed(path, errors[0]);
  await sql`update ms_content_blocks set data = data || ${sql.json(data as never)}, updated_at = now(), updated_by = ${admin.id} where section = ${section}`;
  await logActivity(admin, "content.updated", "content", section);
  refresh();
  done(path, "Changes saved. The website is updated.");
}

/* ---------------------------- generic collections --------------------------- */

function collectionValues(key: string, form: FormData) {
  const def = COLLECTIONS[key];
  const values: Record<string, string | boolean | number> = {};
  for (const f of def.fields) {
    if (f.type === "boolean") values[f.name] = form.get(f.name) === "on";
    else {
      const v = String(form.get(f.name) ?? "").replace(/\u0000/g, "").trim();
      if (f.max && v.length > f.max) failed(`/admin/c/${key}`, `${f.label} is too long.`);
      if ((f.type === "url" || f.type === "image") && v && !/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(v)) failed(`/admin/c/${key}`, `${f.label} must be a valid link.`);
      if (f.type === "select" && !f.options?.some((o) => o.value === v)) failed(`/admin/c/${key}`, `${f.label} is invalid.`);
      values[f.name] = v;
    }
  }
  const first = def.fields.find((f) => f.name === def.titleField);
  if (first && !values[def.titleField]) failed(`/admin/c/${key}`, `${first.label} is required.`);
  if (def.slugFrom) values.slug = slugify(String(values[def.slugFrom]));
  return values;
}

async function saveCollectionItemImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const key = String(form.get("collection"));
  const def = COLLECTIONS[key];
  if (!def) failed("/admin", "Unknown collection.");
  const id = String(form.get("id") || "");
  const values = collectionValues(key, form);
  const cols = Object.keys(values);
  try {
    if (id) {
      await sql`update ${sql(def.table)} set ${sql(values as never, ...cols)} where id = ${id}`;
    } else {
      const [{ next }] = await sql<{ next: number }[]>`select coalesce(max(sort_order), -1) + 1 as next from ${sql(def.table)}`;
      await sql`insert into ${sql(def.table)} ${sql({ ...values, sort_order: next } as never)}`;
    }
  } catch (err) {
    if ((err as { code?: string }).code === "23505") failed(`/admin/c/${key}`, "That name is already in use.");
    throw err;
  }
  await logActivity(admin, id ? "item.updated" : "item.created", def.table, id);
  refresh();
  done(`/admin/c/${key}`, `${def.singular[0].toUpperCase()}${def.singular.slice(1)} saved.`);
}

async function deleteCollectionItemImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const key = String(form.get("collection"));
  const def = COLLECTIONS[key];
  if (!def) failed("/admin", "Unknown collection.");
  const id = String(form.get("id"));
  await sql`delete from ${sql(def.table)} where id = ${id}`;
  await logActivity(admin, "item.deleted", def.table, id);
  refresh();
  done(`/admin/c/${key}`, "Deleted.");
}

async function renumber(table: string, id: string, dir: "up" | "down", order: ReturnType<typeof sql>) {
  const rows = await sql<{ id: string }[]>`select id from ${sql(table)} ${order}`;
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await sql.begin(async (tx) => {
    for (let n = 0; n < rows.length; n++) await tx`update ${sql(table)} set sort_order = ${n} where id = ${rows[n].id}`;
  });
}

async function moveCollectionItemImpl(form: FormData): Promise<ActionResult | void> {
  await requireAdmin();
  const key = String(form.get("collection"));
  const def = COLLECTIONS[key];
  if (!def?.sortable) failed("/admin", "Not sortable.");
  await renumber(def.table, String(form.get("id")), form.get("dir") === "up" ? "up" : "down", sql`order by sort_order, id`);
  refresh();
  redirect(`/admin/c/${key}`);
}

async function toggleCollectionVisibilityImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const key = String(form.get("collection"));
  const def = COLLECTIONS[key];
  const col = def?.visibilityField;
  if (!col) return failed("/admin", "Not available.");
  const id = String(form.get("id"));
  await sql`update ${sql(def.table)} set ${sql(col)} = not ${sql(col)} where id = ${id}`;
  await logActivity(admin, "item.visibility", def.table, id);
  refresh();
  redirect(`/admin/c/${key}`);
}

/* --------------------------------- projects -------------------------------- */

async function writeGallery(tx: typeof sql, projectId: string, gallery: { url: string; alt: string }[]) {
  await tx`delete from ms_project_images where project_id = ${projectId}`;
  for (let i = 0; i < gallery.length; i++) await tx`insert into ms_project_images (project_id, url, alt, sort_order) values (${projectId}, ${gallery[i].url}, ${gallery[i].alt}, ${i})`;
}

async function saveProjectImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const id = String(form.get("id") || "");
  const back = id ? `/admin/projects/${id}` : "/admin/projects/new";
  const { parsed, gallery } = parseProjectForm(form);
  if (!parsed.success) return failed(back, parsed.error.issues[0]?.message ?? "Please check the form.");
  const p = parsed.data;
  if (!p.slug) return failed(back, "A title is required to create the web address.");
  let savedId = id;
  try {
    await sql.begin(async (tx) => {
      const fields = {
        title: p.title, slug: p.slug, short_description: p.short_description, full_description: p.full_description, category_id: p.category_id,
        status: p.status, featured_image_url: p.featured_image_url, video_url: p.video_url, client_name: p.client_name, location: p.location,
        project_date: p.project_date, completion_date: p.completion_date, services_provided: p.services_provided, tools_used: p.tools_used,
        external_url: p.external_url, sort_order: p.sort_order, featured: p.featured, published: p.published, seo_title: p.seo_title, seo_description: p.seo_description,
      };
      const cols = Object.keys(fields);
      if (id) await tx`update ms_projects set ${tx(fields as never, ...cols)}, updated_at = now() where id = ${id}`;
      else {
        const [row] = await tx<{ id: string }[]>`insert into ms_projects ${tx(fields as never, ...cols)} returning id`;
        savedId = row.id;
      }
      await writeGallery(tx as unknown as typeof sql, savedId, gallery);
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") failed(back, "Another project already uses that web address. Change the slug.");
    throw err;
  }
  await logActivity(admin, id ? "project.updated" : "project.created", "project", savedId, p.title);
  refresh();
  done(`/admin/projects/${savedId}`, "Project saved.");
}

async function deleteProjectImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const [row] = await sql<{ title: string }[]>`delete from ms_projects where id = ${id} returning title`;
  await logActivity(admin, "project.deleted", "project", id, row?.title ?? "");
  refresh();
  done("/admin/projects", "Project deleted.");
}

async function duplicateProjectImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const [src] = await sql<{ title: string; slug: string }[]>`select title, slug from ms_projects where id = ${id}`;
  if (!src) failed("/admin/projects", "Project not found.");
  const slug = `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
  const [copy] = await sql<{ id: string }[]>`
    insert into ms_projects (title, slug, short_description, full_description, category_id, status, featured_image_url, video_url, client_name, location,
      project_date, completion_date, services_provided, tools_used, external_url, sort_order, featured, published, seo_title, seo_description)
    select ${`${src.title} (copy)`}, ${slug}, short_description, full_description, category_id, status, featured_image_url, video_url, client_name, location,
      project_date, completion_date, services_provided, tools_used, external_url, sort_order, false, false, seo_title, seo_description
    from ms_projects where id = ${id} returning id`;
  await sql`insert into ms_project_images (project_id, url, alt, sort_order) select ${copy.id}, url, alt, sort_order from ms_project_images where project_id = ${id}`;
  await logActivity(admin, "project.duplicated", "project", copy.id, src.title);
  refresh();
  done(`/admin/projects/${copy.id}`, "Project duplicated as a draft.");
}

async function quickUpdateProjectImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const field = String(form.get("field"));
  if (field === "published") await sql`update ms_projects set published = not published, updated_at = now() where id = ${id}`;
  else if (field === "featured") await sql`update ms_projects set featured = not featured, updated_at = now() where id = ${id}`;
  else if (field === "status") {
    const status = String(form.get("status"));
    if (!["PRECIOUS", "ONGOING", "READY"].includes(status)) failed("/admin/projects", "Invalid status.");
    await sql`update ms_projects set status = ${status}::ms_project_status, updated_at = now() where id = ${id}`;
  } else failed("/admin/projects", "Invalid change.");
  await logActivity(admin, `project.${field}`, "project", id);
  refresh();
  redirect("/admin/projects");
}

async function moveProjectImpl(form: FormData): Promise<ActionResult | void> {
  await requireAdmin();
  await renumber("ms_projects", String(form.get("id")), form.get("dir") === "up" ? "up" : "down", sql`order by sort_order, created_at desc, id`);
  refresh();
  redirect("/admin/projects");
}

/* ------------------------------ messages & media ----------------------------- */

async function toggleMessageReadImpl(form: FormData): Promise<ActionResult | void> {
  await requireAdmin();
  await sql`update ms_contact_submissions set is_read = not is_read where id = ${String(form.get("id"))}`;
  redirect("/admin/messages");
}

async function deleteMessageImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  await sql`delete from ms_contact_submissions where id = ${String(form.get("id"))}`;
  await logActivity(admin, "message.deleted", "contact_submission", String(form.get("id")));
  done("/admin/messages", "Message deleted.");
}

async function deleteMediaImpl(form: FormData): Promise<ActionResult | void> {
  const admin = await requireAdmin();
  const [row] = await sql<{ url: string }[]>`delete from ms_media where id = ${String(form.get("id"))} returning url`;
  if (row) await removeStoredFile(row.url);
  await logActivity(admin, "media.deleted", "media", String(form.get("id")));
  done("/admin/media", "File deleted. Pages that still use it will show a missing image until you replace it.");
}

export async function login(form: FormData): Promise<ActionResult> { return run(() => loginImpl(form)); }
export async function logout(): Promise<ActionResult> { return run(() => logoutImpl()); }
export async function changeOwnPassword(form: FormData): Promise<ActionResult> { return run(() => changeOwnPasswordImpl(form)); }
export async function createUser(form: FormData): Promise<ActionResult> { return run(() => createUserImpl(form)); }
export async function resetUserPassword(form: FormData): Promise<ActionResult> { return run(() => resetUserPasswordImpl(form)); }
export async function setUserActive(form: FormData): Promise<ActionResult> { return run(() => setUserActiveImpl(form)); }
export async function deleteUser(form: FormData): Promise<ActionResult> { return run(() => deleteUserImpl(form)); }
export async function saveBlock(form: FormData): Promise<ActionResult> { return run(() => saveBlockImpl(form)); }
export async function saveCollectionItem(form: FormData): Promise<ActionResult> { return run(() => saveCollectionItemImpl(form)); }
export async function deleteCollectionItem(form: FormData): Promise<ActionResult> { return run(() => deleteCollectionItemImpl(form)); }
export async function moveCollectionItem(form: FormData): Promise<ActionResult> { return run(() => moveCollectionItemImpl(form)); }
export async function toggleCollectionVisibility(form: FormData): Promise<ActionResult> { return run(() => toggleCollectionVisibilityImpl(form)); }
export async function saveProject(form: FormData): Promise<ActionResult> { return run(() => saveProjectImpl(form)); }
export async function deleteProject(form: FormData): Promise<ActionResult> { return run(() => deleteProjectImpl(form)); }
export async function duplicateProject(form: FormData): Promise<ActionResult> { return run(() => duplicateProjectImpl(form)); }
export async function quickUpdateProject(form: FormData): Promise<ActionResult> { return run(() => quickUpdateProjectImpl(form)); }
export async function moveProject(form: FormData): Promise<ActionResult> { return run(() => moveProjectImpl(form)); }
export async function toggleMessageRead(form: FormData): Promise<ActionResult> { return run(() => toggleMessageReadImpl(form)); }
export async function deleteMessage(form: FormData): Promise<ActionResult> { return run(() => deleteMessageImpl(form)); }
export async function deleteMedia(form: FormData): Promise<ActionResult> { return run(() => deleteMediaImpl(form)); }
