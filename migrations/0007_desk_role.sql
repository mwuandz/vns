alter table "user" add column if not exists desk_role text not null default 'editor';

update "user"
set desk_role = 'admin'
where id = (
  select u.id
  from "user" u
  inner join "account" a on a."userId" = u.id
  where a."providerId" = 'credential'
  order by u."createdAt" asc
  limit 1
)
and not exists (select 1 from "user" where desk_role = 'admin');
