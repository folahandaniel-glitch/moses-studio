create type ms_project_status as enum ('PRECIOUS', 'ONGOING', 'READY');

create table ms_admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'ADMIN' check (role in ('SUPER_ADMIN', 'ADMIN')),
  token_version int not null default 0,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table ms_content_blocks (
  section text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references ms_admin_users(id) on delete set null
);

create table ms_navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  sort_order int not null default 0,
  visible boolean not null default true
);

create table ms_hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text not null default '',
  caption text not null default '',
  link_href text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

create table ms_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null default '',
  detailed_description text not null default '',
  icon text not null default 'sparkle',
  image_url text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

create table ms_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order int not null default 0
);

create table ms_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  full_description text not null default '',
  category_id uuid references ms_categories(id) on delete set null,
  status ms_project_status not null default 'READY',
  featured_image_url text not null default '',
  video_url text not null default '',
  client_name text not null default '',
  location text not null default '',
  project_date date,
  completion_date date,
  services_provided text[] not null default '{}',
  tools_used text[] not null default '{}',
  external_url text not null default '',
  sort_order int not null default 0,
  featured boolean not null default false,
  published boolean not null default false,
  seo_title text not null default '',
  seo_description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ms_projects_public_idx on ms_projects (published, status, sort_order);
create index ms_projects_category_idx on ms_projects (category_id);

create table ms_project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references ms_projects(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order int not null default 0
);
create index ms_project_images_project_idx on ms_project_images (project_id, sort_order);

create table ms_testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text not null default '',
  quote text not null,
  avatar_url text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

create table ms_social_links (
  id uuid primary key default gen_random_uuid(),
  network text not null,
  url text not null,
  sort_order int not null default 0,
  visible boolean not null default true
);

create table ms_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table ms_media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  filename text not null,
  mime_type text not null,
  size_bytes int not null,
  width int,
  height int,
  alt text not null default '',
  uploaded_by uuid references ms_admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table ms_activity_logs (
  id bigserial primary key,
  admin_id uuid,
  admin_email text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);
create index ms_activity_logs_created_idx on ms_activity_logs (created_at desc);

create table ms_rate_limits (
  key text primary key,
  count int not null default 0,
  reset_at timestamptz not null
);
