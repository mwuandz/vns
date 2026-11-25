alter table "user" add column if not exists locked boolean not null default false;
update "user" set desk_role = 'btv' where desk_role = 'editor';

alter table posts add column if not exists status text not null default 'draft';
alter table posts add column if not exists publish_at timestamptz;
alter table posts add column if not exists seo_title text not null default '';
alter table posts add column if not exists seo_description text not null default '';
alter table posts add column if not exists deleted_at timestamptz;

update posts set status = 'published' where published = true and status = 'draft';

create table if not exists activity_log (
  id bigserial primary key,
  actor_id text,
  actor_name text not null default '',
  action text not null,
  post_id integer,
  detail text not null default '',
  created_at timestamptz not null default now()
);

insert into ad_slots (slot) values ('after') on conflict (slot) do nothing;
