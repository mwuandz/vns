create table if not exists footer_banner (
  id smallint primary key default 1 check (id = 1),
  image_url text not null default '',
  href text not null default '',
  label text not null default '',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into footer_banner (id) values (1) on conflict (id) do nothing;
