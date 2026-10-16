-- Optimised uploaded images, used when no external blob storage is configured.
create table ms_media_files (
  id uuid primary key default gen_random_uuid(),
  data bytea not null,
  mime_type text not null default 'image/webp',
  created_at timestamptz not null default now()
);
