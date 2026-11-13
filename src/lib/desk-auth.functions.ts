import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const loadDeskAccount = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<{ ok: number }>`select 1 as ok from "account"
    where "providerId" = 'credential' and "password" is not null
    limit 1`;
  return { hasAccount: rows.length > 0 };
});
