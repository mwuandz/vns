alter table posts add column if not exists owner_id text;

update posts
set owner_id = (
  select id from "user" where desk_role = 'admin' order by "createdAt" asc limit 1
)
where owner_id is null;
