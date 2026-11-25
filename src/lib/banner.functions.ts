import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { requireDeskAdmin } from "@/lib/staff.functions";

export type FooterBanner = {
  imageUrl: string;
  href: string;
  label: string;
  enabled: boolean;
};

type Row = {
  image_url: string;
  href: string;
  label: string;
  enabled: boolean | string | number;
};

const EMPTY: FooterBanner = { imageUrl: "", href: "", label: "", enabled: false };

function flag(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function toBanner(row: Row | undefined): FooterBanner {
  if (!row) return EMPTY;
  return {
    imageUrl: row.image_url ?? "",
    href: row.href ?? "",
    label: row.label ?? "",
    enabled: flag(row.enabled),
  };
}

function httpUrl(value: unknown, name: string) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length > 2000) throw new Error(`${name} quá dài`);
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${name} phải là link http hoặc https`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} phải là link http hoặc https`);
  }
  return url.toString();
}

function cleanBanner(input: unknown): FooterBanner {
  if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
  const source = input as Record<string, unknown>;
  const imageUrl = httpUrl(source.imageUrl, "Ảnh banner");
  const href = httpUrl(source.href, "Link khi bấm");
  const label = String(source.label ?? "").trim().slice(0, 80);
  const enabled = source.enabled === true;
  if (enabled && !imageUrl) throw new Error("Bật banner thì cần link ảnh");
  return { imageUrl, href, label, enabled };
}

async function readBanner() {
  const sql = await getSql();
  const rows = await sql<Row>`select image_url, href, label, enabled from ad_slots where slot = 'footer' limit 1`;
  return toBanner(rows[0]);
}

export const loadFooterBanner = createServerFn({ method: "GET" }).handler(async () => readBanner());

export const saveFooterBanner = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => cleanBanner(input))
  .handler(async ({ data, context }) => {
    await requireDeskAdmin(context.userId, "Chỉ admin được sửa quảng cáo");
    const sql = await getSql();
    const rows = await sql<Row>`insert into ad_slots (slot, image_url, href, label, enabled)
      values ('footer', ${data.imageUrl}, ${data.href}, ${data.label}, ${data.enabled})
      on conflict (slot) do update set
        image_url = excluded.image_url,
        href = excluded.href,
        label = excluded.label,
        enabled = excluded.enabled
      returning image_url, href, label, enabled`;
    await sql`insert into footer_banner (id, image_url, href, label, enabled, updated_at)
      values (1, ${data.imageUrl}, ${data.href}, ${data.label}, ${data.enabled}, now())
      on conflict (id) do update set
        image_url = excluded.image_url,
        href = excluded.href,
        label = excluded.label,
        enabled = excluded.enabled,
        updated_at = now()`;
    return toBanner(rows[0]);
  });
