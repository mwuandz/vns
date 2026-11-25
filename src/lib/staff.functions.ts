import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { asRole, type DeskRole } from "@/lib/roles";
import { deskAccount } from "@/lib/desk-account";
import { getSql } from "@/lib/db";

export type StaffMember = {
  id: string;
  name: string;
  role: DeskRole;
  locked: boolean;
  createdAt: string;
};

export async function deskRole(userId: string): Promise<DeskRole> {
  const sql = await getSql();
  const rows = await sql<{ desk_role: string }>`select desk_role from "user" where id = ${userId} limit 1`;
  return asRole(rows[0]?.desk_role);
}

export async function assertDeskOpen(userId: string) {
  if (!userId || userId === "dev-user") return;
  const sql = await getSql();
  const rows = await sql<{ locked: boolean | string | null }>`select locked from "user" where id = ${userId} limit 1`;
  const locked = rows[0]?.locked;
  if (locked === true || locked === "t" || locked === "true") throw new Error("Tài khoản đã bị khóa");
}

export async function requireDeskAdmin(userId: string, message = "Chỉ admin được làm việc này") {
  if ((await deskRole(userId)) !== "admin") throw new Error(message);
}

async function roleOf(userId: string) {
  return deskRole(userId);
}

async function requireAdmin(userId: string) {
  if ((await roleOf(userId)) !== "admin") throw new Error("Chỉ admin được cấp tài khoản");
}

function toMember(row: { id: string; name: string; desk_role: string; locked: boolean | string; createdAt: Date | string }): StaffMember {
  return {
    id: row.id,
    name: row.name,
    role: asRole(row.desk_role),
    locked: row.locked === true || row.locked === "t" || row.locked === "true",
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export const loadMyRole = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => ({ role: await deskRole(context.userId) }));

export const claimFounder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admins = await sql<{ ok: number }>`select 1 as ok from "user" where desk_role = 'admin' limit 1`;
    if (!admins.length) {
      await sql`update "user" set desk_role = 'admin' where id = ${context.userId}`;
    }
    return { role: await roleOf(context.userId) };
  });

export const loadStaff = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const role = await roleOf(context.userId);
    const rows = await sql<{ id: string; name: string; desk_role: string; locked: boolean | string; createdAt: Date | string }>`
      select u.id, u.name, u.desk_role, u.locked, u."createdAt" as "createdAt"
      from "user" u
      inner join "account" a on a."userId" = u.id and a."providerId" = 'credential'
      order by u."createdAt" asc`;
    return { role, me: context.userId, members: rows.map(toMember) };
  });

export const createEditor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const source = input as { username?: unknown; password?: unknown; role?: unknown };
    const account = deskAccount(String(source.username ?? ""));
    const password = String(source.password ?? "");
    if (password.length < 8) throw new Error("Mật khẩu tối thiểu 8 ký tự");
    if (password.length > 72) throw new Error("Mật khẩu quá dài");
    const role = source.role === "tong-bt" || source.role === "phong-vien" ? source.role : "btv";
    return { ...account, password, role };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    const { randomBytes } = await import("node:crypto");
    const { hashPassword } = await import("better-auth/crypto");
    const sql = await getSql();
    const existing = await sql<{ ok: number }>`select 1 as ok from "user" where email = ${data.email} limit 1`;
    if (existing.length) throw new Error("Tài khoản này đã có");
    const id = randomBytes(16).toString("hex");
    const hash = await hashPassword(data.password);
    await sql`insert into "user" (id, name, email, "emailVerified", desk_role, "createdAt", "updatedAt")
      values (${id}, ${data.name}, ${data.email}, true, ${data.role}, now(), now())`;
    await sql`insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (${`${id}-credential`}, ${id}, 'credential', ${id}, ${hash}, now(), now())`;
    await sql`insert into activity_log (actor_id, actor_name, action, detail)
      values (${context.userId}, 'Admin', 'cấp tài khoản', ${data.name})`;
    return { id, name: data.name, role: data.role };
  });

export const revokeEditor = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => {
    const text = String(id ?? "").trim();
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(text)) throw new Error("Tài khoản không hợp lệ");
    return text;
  })
  .handler(async ({ data: id, context }) => {
    await requireAdmin(context.userId);
    if (id === context.userId) throw new Error("Không gỡ tài khoản đang dùng");
    const sql = await getSql();
    const rows = await sql<{ desk_role: string }>`select desk_role from "user" where id = ${id} limit 1`;
    if (!rows[0]) throw new Error("Không thấy tài khoản");
    if (rows[0].desk_role === "admin") throw new Error("Không gỡ tài khoản admin");
    await sql`delete from "user" where id = ${id}`;
    await sql`insert into activity_log (actor_id, actor_name, action, detail)
      values (${context.userId}, 'Admin', 'xóa tài khoản', ${id})`;
    return { ok: true };
  });

export const setLocked = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const source = input as { id?: unknown; locked?: unknown };
    const id = String(source.id ?? "").trim();
    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(id)) throw new Error("Tài khoản không hợp lệ");
    return { id, locked: source.locked === true };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context.userId);
    if (data.id === context.userId) throw new Error("Không khóa tài khoản đang dùng");
    const sql = await getSql();
    const rows = await sql<{ desk_role: string; name: string }>`select desk_role, name from "user" where id = ${data.id} limit 1`;
    if (!rows[0]) throw new Error("Không thấy tài khoản");
    if (rows[0].desk_role === "admin") throw new Error("Không khóa tài khoản admin");
    await sql`update "user" set locked = ${data.locked}, "updatedAt" = now() where id = ${data.id}`;
    await sql`insert into activity_log (actor_id, actor_name, action, detail)
      values (${context.userId}, 'Admin', ${data.locked ? "khóa tài khoản" : "mở khóa"}, ${rows[0].name})`;
    return { ok: true };
  });
