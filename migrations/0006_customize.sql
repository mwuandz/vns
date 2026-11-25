create table if not exists site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Vietnam Sports Daily',
  desk_line text not null default 'The sports desk',
  tagline text not null default 'Bản tin thể thao',
  edition_left text not null default 'Independent sports coverage',
  edition_right text not null default 'Football · MMA · More',
  footer_text text not null default 'Tờ tin thể thao. Bóng đá Việt Nam, MMA và những môn đang giữ chân người xem — viết chậm hơn tin chạy, rõ hơn một dòng tỷ số.',
  logo_url text not null default '',
  accent text not null default '#d71920',
  show_breaking boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

create table if not exists sections (
  slug text primary key,
  label text not null,
  show_nav boolean not null default true,
  show_footer boolean not null default false,
  assignable boolean not null default true,
  sort integer not null default 0
);

insert into sections (slug, label, show_nav, show_footer, assignable, sort) values
  ('bong-da', 'Bóng đá', true, false, true, 1),
  ('v-league', 'V-League', true, true, true, 2),
  ('doi-tuyen', 'Đội tuyển', true, true, true, 3),
  ('mma', 'MMA', true, true, true, 4),
  ('quoc-te', 'Quốc tế', true, true, true, 5),
  ('chuyen-nhuong', 'Chuyển nhượng', true, true, true, 6),
  ('the-thao', 'Các môn khác', true, false, false, 7),
  ('goc-nhin', 'Góc nhìn', true, true, true, 8),
  ('bong-ro', 'Bóng rổ', false, false, true, 9),
  ('tennis', 'Tennis', false, false, true, 10),
  ('the-thao-khac', 'Thể thao khác', false, false, true, 11)
on conflict (slug) do nothing;

create table if not exists ad_slots (
  slot text primary key,
  image_url text not null default '',
  href text not null default '',
  label text not null default '',
  enabled boolean not null default false
);

insert into ad_slots (slot) values ('mast'), ('article'), ('footer')
on conflict (slot) do nothing;

update ad_slots as slot
set image_url = banner.image_url,
    href = banner.href,
    label = banner.label,
    enabled = banner.enabled
from footer_banner as banner
where slot.slot = 'footer' and banner.id = 1;
