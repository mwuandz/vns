create table if not exists media (
  id text primary key,
  mime text not null,
  bytes bytea not null,
  created_at timestamptz not null default now()
);
