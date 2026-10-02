# Moses Studio

A premium one-page creative portfolio with a full admin dashboard. Everything visitors see (text, images, colours, services, projects, testimonials, contact details, SEO) is stored in the database and edited from `/admin`, with no code changes.

The previous Supabase/plain-HTML template is kept untouched in `legacy/` for reference only. It is not used by this application.

## Technology stack

- Next.js 15 (App Router), React 19, TypeScript (strict)
- Tailwind CSS 3
- PostgreSQL through `postgres` (works with Neon, Supabase, Vercel Postgres or any Postgres, supplied by `DATABASE_URL`)
- Own session authentication: bcrypt password hashing, signed httpOnly `SameSite=Strict` cookie, role based access
- Vercel Blob for image storage (local disk fallback for development), `sharp` for automatic image optimisation
- Zod for server side validation, Vitest for unit tests

## Features

- Premium one-page site: animated hero carousel, About, Services, Portfolio (Precious / Ongoing / Ready works, category filters, "show more" pagination that stays fast with 100+ projects), project spotlight, Why choose us, Testimonials, Call to action, Contact, Footer
- Dynamic project pages at `/work/<slug>` with gallery, video, related works and contact CTA
- Admin dashboard: Dashboard statistics (real database values), Site Settings, Theme, Navigation, Hero Carousel, Hero, About, Services, Section Headings, Testimonials, Call To Action, Contact, Social Links, Footer, SEO, Portfolio (create, edit, delete, duplicate, publish and unpublish, feature, change status, reorder, galleries), Categories, Media Library, Enquiries, Users, Security, Activity Log
- Contact form with server validation, honeypot, minimum fill time, database rate limiting and optional Resend email notification; call and WhatsApp buttons
- SEO: per page metadata, canonical URLs, Open Graph, X card, `sitemap.xml`, `robots.txt`, JSON-LD, semantic headings, alt text
- Accessibility: skip link, keyboard navigation, visible focus, ARIA labels, reduced motion support, accessible dialogs and forms
- Security: password hashing, session revocation (token version), middleware plus per request authorisation, server side validation, parameterised SQL, upload content validation (real image decode, size limit, re-encoded to WebP), rate limiting, security headers, activity logging, no secrets in client code

## Architecture

```
migrations/        SQL migrations (applied in order by scripts/migrate.mjs)
db/defaults.json   Single source of the editable placeholder content seeded once
scripts/           migrate.mjs (migrations, default content, first admin)
src/lib/           db, auth, session, validation, content (cached data access), storage, rate limiting
src/app/(site)/    public pages (home, /work/[slug])
src/app/admin/     dashboard pages and server actions
src/app/api/admin/ authenticated upload and media endpoints
src/components/    site/ and admin/ components
tests/             unit tests
```

Content model: `content_blocks` (site, theme, hero, about, headings, cta, contact, footer, seo) plus relational tables for navigation, hero slides, services, categories, projects, project images, testimonials, social links, contact submissions, media, admin users, activity logs and rate limits. Project status is a PostgreSQL enum (`PRECIOUS`, `ONGOING`, `READY`). Public reads are cached with a content tag that every admin save invalidates.

## Local development

```bash
cp .env.example .env.local      # fill in the values
npm install
npm run db:migrate              # creates tables, default content and the first admin
npm run dev
```

Public site: http://localhost:3000, admin: http://localhost:3000/admin

## Environment variables

See `.env.example`. Required: `DATABASE_URL`, `AUTH_SECRET` (32+ characters), `ADMIN_EMAIL` and `ADMIN_PASSWORD` (only used when no administrator exists yet), `NEXT_PUBLIC_SITE_URL`. Recommended: `BLOB_READ_WRITE_TOKEN` (image storage on Vercel). Optional: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL`.

## Database setup

`npm run db:migrate` (also run automatically by `npm run build`) applies pending migrations, inserts the placeholder content once (only when the content table is empty), and creates the first Super Admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` when no administrator exists. No credentials are stored in the repository. Change the password from Admin > Security after the first sign-in, then remove `ADMIN_PASSWORD` from the environment.

## Testing

```bash
npm run lint && npm run typecheck && npm test && npm run build:app
```

The release was also verified in a real browser (Chromium): all breakpoints from 320px to 1920px with no horizontal overflow or console errors, admin login, project create / edit / status change / unpublish / duplicate / delete, content editing reflected on the public page, contact form validation and submission, phone and WhatsApp links, mobile menu, and protected routes returning 401 or redirects when signed out.

## Deploying to Vercel

1. Create a PostgreSQL database (Neon through the Vercel Marketplace has a free tier) and copy its connection string.
2. In Vercel (team `fodan`) choose Add New > Project, import `folahandaniel-glitch/moses-portfolio`. Framework: Next.js (auto detected). Build command is `npm run build` (already the default script, it runs migrations then builds).
3. Add environment variables: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 48`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `NEXT_PUBLIC_SITE_URL` (your production URL).
4. Storage tab > Create Blob store, connect it to the project (this adds `BLOB_READ_WRITE_TOKEN`).
5. Optional: add `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL` for email notifications.
6. Deploy, open `/admin`, sign in, change the password, then delete `ADMIN_PASSWORD` from the project settings.

## Content management

- Add a project: Admin > Portfolio > Add project. Choose status (Precious, Ongoing, Ready), category, images, then tick Published. Drafts never appear publicly.
- Change status, publish, feature or reorder: Admin > Portfolio, use the buttons on each row.
- Change contact details: Admin > Contact (phone, WhatsApp number and message, email, address, hours).
- Change the footer: Admin > Footer. Social networks: Admin > Social Links (only configured networks are shown).
- Update SEO: Admin > SEO (site wide) and the "Search engines" section of each project.
- Logo, favicon, colours and fonts: Admin > Site Settings and Theme.
- Placeholder text and sample projects are clearly marked. Replace or delete them from the dashboard.

## Remaining human actions

- Create the Vercel project and add the environment variables above (needs your Vercel authorisation).
- Provide real content: biography, services, projects, photography, testimonials (nothing was invented).
- Custom domain and DNS (Cloudflare or other) when you are ready, then set `NEXT_PUBLIC_SITE_URL` and Admin > SEO > Website address.
