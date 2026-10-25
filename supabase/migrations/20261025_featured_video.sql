alter table site_settings add column if not exists featured_video_url text not null default '';
alter table site_settings add column if not exists featured_video_caption text not null default '';
