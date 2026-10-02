-- =====================================================================
-- PORTFOLIO TEMPLATE: DATABASE SETUP
-- Run this whole file once in Supabase: SQL Editor > New query > Run
-- =====================================================================

-- 1. TABLES ------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('super_admin','admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.site_settings (
  id          int primary key default 1 check (id = 1),
  content     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

create table if not exists public.works (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  category     text,
  description  text,
  image_url    text,
  link_url     text,
  published    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint messages_len check (
    char_length(name) between 1 and 120 and
    char_length(email) between 3 and 200 and
    char_length(message) between 1 and 4000
  )
);

insert into public.site_settings (id, content) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- 2. ROLE HELPERS ------------------------------------------------------

create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_super()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

-- 3. ROW LEVEL SECURITY ------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.site_settings  enable row level security;
alter table public.works          enable row level security;
alter table public.messages       enable row level security;

-- profiles: staff can read the team list. Changes are made only by the
-- secure /api/admins function (service role), never from the browser.
drop policy if exists "staff read profiles" on public.profiles;
create policy "staff read profiles" on public.profiles
  for select to authenticated using (public.is_staff());

-- site_settings: public can read, staff can write
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings
  for select using (true);
drop policy if exists "staff insert settings" on public.site_settings;
create policy "staff insert settings" on public.site_settings
  for insert to authenticated with check (public.is_staff());
drop policy if exists "staff update settings" on public.site_settings;
create policy "staff update settings" on public.site_settings
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- works: public sees published items, staff manage everything
drop policy if exists "read works" on public.works;
create policy "read works" on public.works
  for select using (published = true or public.is_staff());
drop policy if exists "staff insert works" on public.works;
create policy "staff insert works" on public.works
  for insert to authenticated with check (public.is_staff());
drop policy if exists "staff update works" on public.works;
create policy "staff update works" on public.works
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff delete works" on public.works;
create policy "staff delete works" on public.works
  for delete to authenticated using (public.is_staff());

-- messages: anyone can send, only staff can read and manage
drop policy if exists "anyone sends message" on public.messages;
create policy "anyone sends message" on public.messages
  for insert with check (true);
drop policy if exists "staff read messages" on public.messages;
create policy "staff read messages" on public.messages
  for select to authenticated using (public.is_staff());
drop policy if exists "staff update messages" on public.messages;
create policy "staff update messages" on public.messages
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "staff delete messages" on public.messages;
create policy "staff delete messages" on public.messages
  for delete to authenticated using (public.is_staff());

-- 4. IMAGE STORAGE -----------------------------------------------------

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

drop policy if exists "public read portfolio files" on storage.objects;
create policy "public read portfolio files" on storage.objects
  for select using (bucket_id = 'portfolio');
drop policy if exists "staff upload portfolio files" on storage.objects;
create policy "staff upload portfolio files" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_staff());
drop policy if exists "staff update portfolio files" on storage.objects;
create policy "staff update portfolio files" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_staff());
drop policy if exists "staff delete portfolio files" on storage.objects;
create policy "staff delete portfolio files" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_staff());

-- 5. CREATE THE FIRST SUPER ADMIN -------------------------------------
-- Step A: Supabase > Authentication > Users > Add user > Create new user
--         (enter your email and a strong password, tick "Auto Confirm User").
-- Step B: replace the email below with the same email, remove the two
--         leading dashes on each line, then run this block.

-- insert into public.profiles (id, email, full_name, role)
-- select id, email, 'Your Full Name', 'super_admin'
-- from auth.users where email = 'YOUR_EMAIL_HERE';
