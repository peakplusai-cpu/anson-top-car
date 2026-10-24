-- Canonical schema. Same contents as supabase/migrations/20261024_anson_top_car.sql
-- Apply in the Supabase SQL editor.

create table if not exists admin (
  id int primary key default 1 check (id = 1),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists staff (
  id text primary key,
  display_name text not null,
  role text not null,
  line_url text not null default '',
  line_id text not null default '',
  note text not null default '',
  line_user_id text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cars (
  id text primary key,
  slug text unique not null,
  make text not null,
  make_en text not null default '',
  model text not null,
  year int not null,
  price bigint not null,
  mileage int not null default 0,
  color text not null default '',
  interior text not null default '',
  engine text not null default '',
  horsepower int not null default 0,
  transmission text not null default '',
  drivetrain text not null default '',
  doors smallint not null default 4,
  body_type text not null default 'sedan',
  displacement text not null default '',
  options jsonb not null default '[]'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  story text not null default '',
  status text not null default 'available',
  published boolean not null default false,
  featured boolean not null default false,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cars add column if not exists body_type text not null default 'sedan';
alter table cars add column if not exists displacement text not null default '';
alter table cars add column if not exists specs jsonb not null default '[]'::jsonb;
alter table cars add column if not exists equipment jsonb not null default '[]'::jsonb;

alter table cars drop constraint if exists cars_doors_check;
alter table cars add constraint cars_doors_check check (doors in (2, 4, 5));

create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  instagram text not null default '',
  line_url text not null default '',
  instagram_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table site_settings add column if not exists line_url text not null default '';
alter table site_settings add column if not exists instagram_url text not null default '';

alter table admin enable row level security;
alter table staff enable row level security;
alter table cars enable row level security;
alter table site_settings enable row level security;

drop policy if exists staff_public_read on staff;
create policy staff_public_read on staff for select to anon, authenticated using (true);

drop policy if exists cars_public_read on cars;
create policy cars_public_read on cars for select to anon, authenticated using (published = true);

drop policy if exists settings_public_read on site_settings;
create policy settings_public_read on site_settings for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

drop policy if exists uploads_public_read on storage.objects;
create policy uploads_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'uploads');
