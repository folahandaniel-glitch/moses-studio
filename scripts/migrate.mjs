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

const rawUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const url = rawUrl && cleanUrl(rawUrl);
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
let sql;

/** Inserts the placeholder portfolio: categories, services, slides, projects with galleries, process steps and gallery. */
async function seedPortfolio(tx, defaults) {
  let i = 0;
  for (const sv of defaults.services) await tx`insert into ms_services (title, short_description, icon, image_url, sort_order) values (${sv.title}, ${sv.short_description}, ${sv.icon}, ${sv.image ?? ""}, ${i++})`;
  i = 0;
  const catIds = {};
  for (const c of defaults.categories) {
    const [row] = await tx`insert into ms_categories (name, slug, description, sort_order) values (${c.name}, ${c.slug}, ${c.description}, ${i++})
      on conflict (slug) do update set name = excluded.name returning id`;
    catIds[c.slug] = row.id;
  }
  i = 0;
  for (const sl of defaults.slides) await tx`insert into ms_hero_slides (image_url, alt, caption, sort_order) values (${sl.image_url}, ${sl.alt}, ${sl.caption}, ${i++})`;
  i = 0;
  for (const p of defaults.projects) {
    const [row] = await tx`insert into ms_projects (title, slug, short_description, full_description, category_id, status, featured_image_url, featured, published, sort_order)
      values (${p.title}, ${p.slug}, ${p.description}, ${"Placeholder project description. Replace this with the real story of the project from the admin dashboard."}, ${catIds[p.category]}, ${p.status}, ${p.image}, ${p.featured}, true, ${i++})
      on conflict (slug) do nothing returning id`;
    if (!row) continue;
    let g = 0;
    for (const url of p.gallery ?? []) await tx`insert into ms_project_images (project_id, url, alt, sort_order) values (${row.id}, ${url}, ${p.title}, ${g++})`;
  }
  i = 0;
  for (const st of defaults.process) await tx`insert into ms_process_steps (title, description, image_url, sort_order) values (${st.title}, ${st.text}, ${st.image}, ${i++})`;
  i = 0;
  for (const gi of defaults.gallery) await tx`insert into ms_gallery_images (image_url, alt, caption, sort_order) values (${gi.image}, ${gi.alt}, ${gi.caption}, ${i++})`;
}

/**
 * One-time upgrade of sites that still hold the original placeholder content.
 * Anything the owner has already changed is left untouched.
 */
async function upgradePlaceholders(defaults) {
  const [done] = await sql`select 1 from ms_schema_migrations where name = 'data-portfolio-placeholders-v1'`;
  if (done) return;
  await sql.begin(async (tx) => {
    const samples = await tx`select id from ms_projects where slug like 'sample-project-0%'`;
    const [{ n: total }] = await tx`select count(*)::int as n from ms_projects`;
    const untouched = samples.length === total; // only the four original samples exist
    if (untouched) {
      await tx`delete from ms_projects where slug like 'sample-project-0%'`;
      await tx`delete from ms_categories where slug in ('category-one', 'category-two', 'category-three')`;
      await tx`delete from ms_services where title in ('Service one', 'Service two', 'Service three')`;
      await tx`delete from ms_hero_slides where image_url like '/placeholders/%'`;
      const [{ n: steps }] = await tx`select count(*)::int as n from ms_process_steps`;
      if (steps === 0) await seedPortfolio(tx, defaults);
      const set = async (section, key, oldValue, value) => {
        await tx`update ms_content_blocks set data = jsonb_set(data, ${[key]}, ${tx.json(value)}) where section = ${section} and (data->${key}) = ${tx.json(oldValue)}`;
      };
      const old = { hero: { eyebrow: "Moses Studio", heading: "Creative work, crafted with care and clear purpose.", subtitle: "A creative studio for brands and people who value quality.", description: "Placeholder introduction. Replace this text from the admin dashboard under Hero.", primary_label: "View works", secondary_label: "Start a conversation" },
        about: { introduction: "Placeholder introduction. Replace this with a short welcome to your studio from the admin dashboard under About.", cta_label: "Work with us" },
        cta: { heading: "Have a project in mind?", description: "Tell us what you are planning and we will get back to you.", button_label: "Get in touch" },
        headings: { services_heading: "What we can do for you", services_intro: "Placeholder services are listed below. Replace them with your real services in the admin dashboard.", works_heading: "Selected works", works_intro: "A growing collection of projects. Filter by category to explore." } };
      for (const [section, keys] of Object.entries(old)) for (const [key, oldValue] of Object.entries(keys)) await set(section, key, oldValue, defaults.blocks[section][key]);
      await tx`update ms_content_blocks set data = jsonb_set(data, '{image_url}', ${tx.json(defaults.blocks.about.image_url)}) where section = 'about' and (data->>'image_url') = ''`;
      await tx`update ms_content_blocks set data = jsonb_set(data, '{why_items}', ${tx.json(defaults.blocks.headings.why_items)}) where section = 'headings' and data->'why_items'->0->>'text' like 'Placeholder reason%'`;
      log("replaced placeholder content with the new studio portfolio");
    }
    await tx`insert into ms_schema_migrations (name) values ('data-portfolio-placeholders-v1') on conflict do nothing`;
  });
}

async function main() {
  log(`connecting to ${hostOf(url)}`);
  sql = postgres(url, { max: 1, onnotice: () => {}, connect_timeout: 20 });
  await sql`select 1`;
  log("connected");
  await sql`create table if not exists ms_schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const dir = path.resolve("migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const [done] = await sql`select 1 from ms_schema_migrations where name = ${file}`;
    if (done) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(fs.readFileSync(path.join(dir, file), "utf8"));
      await tx`insert into ms_schema_migrations (name) values (${file})`;
    });
    console.log(`[migrate] applied ${file}`);
  }

  const defaults = JSON.parse(fs.readFileSync(path.resolve("db/defaults.json"), "utf8"));
  const [{ count: seeded }] = await sql`select count(*)::int as count from ms_content_blocks`;
  if (seeded === 0) {
    await sql.begin(async (tx) => {
      for (const [section, data] of Object.entries(defaults.blocks)) {
        await tx`insert into ms_content_blocks (section, data) values (${section}, ${tx.json(data)})`;
      }
      let i = 0;
      for (const n of defaults.navigation) await tx`insert into ms_navigation_items (label, href, sort_order) values (${n.label}, ${n.href}, ${i++})`;
      await seedPortfolio(tx, defaults);
    });
    await sql`insert into ms_schema_migrations (name) values ('data-portfolio-placeholders-v1') on conflict do nothing`;
    log("inserted default placeholder content");
  } else {
    await upgradePlaceholders(defaults);
  }

  // ADMIN_EMAIL / ADMIN_PASSWORD describe the owner account. It is created when missing, and its password is
  // re-applied from the environment if it differs, so the owner can always sign in with the values set in Vercel.
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password.length >= 10) {
    const [existing] = await sql`select id, password_hash from ms_admin_users where email = ${email}`;
    if (!existing) {
      await sql`insert into ms_admin_users (email, name, password_hash, role) values (${email}, ${process.env.ADMIN_NAME || "Administrator"}, ${await bcrypt.hash(password, 12)}, 'SUPER_ADMIN')`;
      log("created administrator account");
    } else if (!(await bcrypt.compare(password, existing.password_hash))) {
      await sql`update ms_admin_users set password_hash = ${await bcrypt.hash(password, 12)}, token_version = token_version + 1, active = true, role = 'SUPER_ADMIN' where id = ${existing.id}`;
      log("administrator password updated from ADMIN_PASSWORD");
    } else {
      log("administrator account is up to date");
    }
  } else {
    const [{ count }] = await sql`select count(*)::int as count from ms_admin_users`;
    if (count === 0) log("no administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 characters) and deploy again.");
  }
}

main()
  .catch((err) => {
    console.error("[migrate] failed:", err.code || "", err.message);
    if (err.cause) console.error("[migrate] cause:", err.cause.message || err.cause);
    process.exitCode = 1;
  })
  .finally(async () => { clearTimeout(watchdog); await sql?.end({ timeout: 5 }); });
