import { getSql } from "@/lib/db";

export async function assertDeskOpen(userId: string) {
  if (!userId || userId === "dev-user") return;
  const sql = await getSql();
  const rows = await sql<{ locked: boolean | string | null }>`select locked from "user" where id = ${userId} limit 1`;
  const locked = rows[0]?.locked;
  if (locked === true || locked === "t" || locked === "true") throw new Error("Tài khoản đã bị khóa");
}
