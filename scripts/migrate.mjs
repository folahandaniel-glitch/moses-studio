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

// Prefer the direct (non pooled) connection for migrations when the host provides one.
const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const url = rawUrl && cleanUrl(rawUrl);
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping database setup.");
  process.exit(0);
}
// The app lives in its own schema so it never collides with other apps sharing the same database.
const SCHEMA = (process.env.DB_SCHEMA || "moses_studio").replace(/[^a-z0-9_]/gi, "");
const sql = postgres(url, { max: 1, onnotice: () => {}, connection: { search_path: SCHEMA } });

async function main() {
  const bootstrap = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await bootstrap.unsafe(`create schema if not exists "${SCHEMA}"`);
  } finally {
    await bootstrap.end();
  }
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
  .finally(() => sql.end());
