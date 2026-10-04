create table ms_process_steps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

create table ms_gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text not null default '',
  caption text not null default '',
  sort_order int not null default 0,
  published boolean not null default true
);

-- Section headings for the new sections (existing keys are never overwritten).
update ms_content_blocks set data = jsonb_build_object(
    'process_eyebrow', 'Our process', 'process_heading', 'From first idea to finished model',
    'process_intro', 'A clear, collaborative way of working that keeps you informed at every stage.',
    'gallery_eyebrow', 'Studio gallery', 'gallery_heading', 'A closer look', 'gallery_intro', 'Highlights from across our recent work.'
  ) || data
  where section = 'headings';
