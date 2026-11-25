alter table site_settings add column if not exists facebook_url text not null default '';
alter table site_settings add column if not exists youtube_url text not null default '';
alter table site_settings add column if not exists tiktok_url text not null default '';
