// Applies SQL migrations, inserts default placeholder content once, and creates the first admin from env vars.
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import bcrypt from "bcryptjs";

/** Neon strings carry options (channel_binding) that the driver would forward to the server and be rejected. */
function cleanUrl(raw) {
  const u = new URL(raw);
  for (const key of ["channel_binding", "options"]) u.searchParams.delete(key);
  if (!u.searchParams.has("sslmode") && !/localhost|127\.0\.0\.1/.test(u.hostname)) u.searchParams.set("sslmode", "require");
  return u.toString();
}

/**
 * Connection poolers ignore the search_path startup setting, so use a direct connection.
 * Neon: the pooled host contains "-pooler"; the direct host is the same name without it.
 */
function directUrl(raw) {
  const u = new URL(cleanUrl(raw));
  u.hostname = u.hostname.replace("-pooler", "");
  return u.toString();
}

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const candidates = rawUrl ? [...new Set([directUrl(rawUrl), cleanUrl(rawUrl)])] : [];
let url = candidates[0];
const hostOf = (u) => new URL(u).hostname.replace(/^[^.]*/, "<db>");
const log = (msg) => console.log(`[migrate] ${msg}`);

// Never let a stuck connection hang the whole deployment.
const watchdog = setTimeout(() => {
  console.error("[migrate] timed out after 120s waiting for the database. Check that the Neon database is active and DATABASE_URL is correct.");
  process.exit(1);
}, 120_000);
watchdog.unref?.();
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping database setup.");
  process.exit(0);
}
// The app lives in its own schema so it never collides with other apps sharing the same database.
const SCHEMA = (process.env.DB_SCHEMA || "moses_studio").replace(/[^a-z0-9_]/gi, "");
const opts = { max: 1, onnotice: () => {}, connect_timeout: 20, connection: { search_path: SCHEMA } };
let sql;

async function connect() {
  let lastError;
  for (const candidate of candidates) {
    url = candidate;
    log(`connecting to ${hostOf(candidate)} (${candidate.includes("-pooler") ? "pooled" : "direct"})`);
    const bootstrap = postgres(candidate, { max: 1, onnotice: () => {}, connect_timeout: 20 });
    try {
      await bootstrap.unsafe(`create schema if not exists "${SCHEMA}"`);
    } catch (err) {
      lastError = err;
      log(`connection failed: ${err.code || ""} ${err.message}`);
      continue;
    } finally {
      await bootstrap.end({ timeout: 5 });
    }
    const attempt = postgres(candidate, opts);
    const [{ schema }] = await attempt`select current_schema() as schema`;
    if (schema === SCHEMA) return attempt;
    log(`this connection ignores the schema setting (got "${schema}"), trying the next option`);
    await attempt.end({ timeout: 5 });
  }
  throw lastError ?? new Error(`no connection honoured the "${SCHEMA}" schema setting; refusing to touch other tables`);
}

async function main() {
  sql = await connect();
  log(`using schema "${SCHEMA}"`);
  await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const dir = path.resolve("migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const [done] = await sql`select 1 from schema_migrations where name = ${file}`;
    if (done) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(fs.readFileSync(path.join(dir, file), "utf8"));
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    console.log(`[migrate] applied ${file}`);
  }

  const defaults = JSON.parse(fs.readFileSync(path.resolve("db/defaults.json"), "utf8"));
  const [{ count: seeded }] = await sql`select count(*)::int as count from content_blocks`;
  if (seeded === 0) {
    await sql.begin(async (tx) => {
      for (const [section, data] of Object.entries(defaults.blocks)) {
        await tx`insert into content_blocks (section, data) values (${section}, ${tx.json(data)})`;
      }
      let i = 0;
      for (const n of defaults.navigation) await tx`insert into navigation_items (label, href, sort_order) values (${n.label}, ${n.href}, ${i++})`;
      i = 0;
      for (const s of defaults.services) await tx`insert into services (title, short_description, icon, sort_order) values (${s.title}, ${s.short_description}, ${s.icon}, ${i++})`;
      i = 0;
      const catIds = {};
      for (const c of defaults.categories) {
        const [row] = await tx`insert into categories (name, slug, description, sort_order) values (${c.name}, ${c.slug}, ${c.description}, ${i++}) returning id`;
        catIds[c.slug] = row.id;
      }
      i = 0;
      for (const s of defaults.slides) await tx`insert into hero_slides (image_url, alt, caption, sort_order) values (${s.image_url}, ${s.alt}, ${s.caption}, ${i++})`;
      i = 0;
      for (const p of defaults.projects) {
        await tx`insert into projects (title, slug, short_description, full_description, category_id, status, featured_image_url, featured, published, sort_order)
          values (${p.title}, ${p.slug}, 'Placeholder project. Edit or delete it in the admin dashboard.', 'Placeholder project description. Replace this with the real story of the project from the admin dashboard.', ${catIds[p.category]}, ${p.status}, ${p.image}, ${p.featured}, true, ${i++})`;
      }
    });
    console.log("[migrate] inserted default placeholder content");
  }

  const [{ count: admins }] = await sql`select count(*)::int as count from admin_users`;
  if (admins === 0) {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    if (email && password.length >= 10) {
      const hash = await bcrypt.hash(password, 12);
      await sql`insert into admin_users (email, name, password_hash, role) values (${email}, ${process.env.ADMIN_NAME || "Administrator"}, ${hash}, 'SUPER_ADMIN')`;
      console.log("[migrate] created first administrator account");
    } else {
      console.log("[migrate] no administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 characters) and run again.");
    }
  }
}

main()
  .catch((err) => {
    console.error("[migrate] failed:", err.code || "", err.message);
    if (err.cause) console.error("[migrate] cause:", err.cause.message || err.cause);
    process.exitCode = 1;
  })
  .finally(async () => { clearTimeout(watchdog); await sql?.end({ timeout: 5 }); });
