import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { slugify } from "@/lib/magazine";
import { requireDeskAdmin } from "@/lib/staff.functions";

export type SiteSettings = {
  siteName: string;
  deskLine: string;
  tagline: string;
  editionLeft: string;
  editionRight: string;
  footerText: string;
  logoUrl: string;
  accent: string;
  showBreaking: boolean;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

export type SectionItem = {
  slug: string;
  label: string;
  showNav: boolean;
  showFooter: boolean;
  assignable: boolean;
  sort: number;
};

export type AdSlot = {
  imageUrl: string;
  href: string;
  label: string;
  enabled: boolean;
};

export type ChromeData = {
  settings: SiteSettings;
  sections: SectionItem[];
  ads: { mast: AdSlot; article: AdSlot; after: AdSlot; footer: AdSlot };
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Vietnam Sports Daily",
  deskLine: "The sports desk",
  tagline: "Bản tin thể thao",
  editionLeft: "Independent sports coverage",
  editionRight: "Football · MMA · More",
  footerText:
    "Tờ tin thể thao. Bóng đá Việt Nam, MMA và những môn đang giữ chân người xem — viết chậm hơn tin chạy, rõ hơn một dòng tỷ số.",
  logoUrl: "",
  accent: "#d71920",
  showBreaking: true,
  facebookUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
};

const EMPTY_AD: AdSlot = { imageUrl: "", href: "", label: "", enabled: false };

function flag(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function socialUrl(value: unknown, name: string) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${name} phải là link https`);
  }
  if (url.protocol !== "https:") throw new Error(`${name} phải dùng https`);
  return url.toString().slice(0, 300);
}

function httpUrl(value: unknown, name: string) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.startsWith("/") && !text.startsWith("//") && text.length < 300) return text;
  if (text.length > 2000) throw new Error(`${name} quá dài`);
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(`${name} phải là link http, https hoặc đường dẫn /`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} phải là link http hoặc https`);
  }
  return url.toString();
}

function accentOf(value: unknown) {
  const text = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : DEFAULT_SETTINGS.accent;
}

function cleanAd(input: unknown, name: string): AdSlot {
  if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
  const source = input as Record<string, unknown>;
  const imageUrl = httpUrl(source.imageUrl, `Ảnh ${name}`);
  const href = httpUrl(source.href, `Link ${name}`);
  const label = clip(source.label, 80);
  const enabled = source.enabled === true;
  if (enabled && !imageUrl) throw new Error(`Bật ${name} thì cần link ảnh`);
  return { imageUrl, href, label, enabled };
}

type SettingsRow = {
  site_name: string;
  desk_line: string;
  tagline: string;
  edition_left: string;
  edition_right: string;
  footer_text: string;
  logo_url: string;
  accent: string;
  show_breaking: boolean | string | number;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
};

type SectionRow = {
  slug: string;
  label: string;
  show_nav: boolean | string | number;
  show_footer: boolean | string | number;
  assignable: boolean | string | number;
  sort: number | string;
};

type AdRow = {
  slot: string;
  image_url: string;
  href: string;
  label: string;
  enabled: boolean | string | number;
};

function toSettings(row: SettingsRow | undefined): SiteSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    siteName: row.site_name || DEFAULT_SETTINGS.siteName,
    deskLine: row.desk_line || DEFAULT_SETTINGS.deskLine,
    tagline: row.tagline || DEFAULT_SETTINGS.tagline,
    editionLeft: row.edition_left || DEFAULT_SETTINGS.editionLeft,
    editionRight: row.edition_right || DEFAULT_SETTINGS.editionRight,
    footerText: row.footer_text || DEFAULT_SETTINGS.footerText,
    logoUrl: row.logo_url ?? "",
    accent: accentOf(row.accent),
    showBreaking: flag(row.show_breaking),
    facebookUrl: row.facebook_url ?? "",
    youtubeUrl: row.youtube_url ?? "",
    tiktokUrl: row.tiktok_url ?? "",
  };
}

function toSection(row: SectionRow): SectionItem {
  return {
    slug: row.slug,
    label: row.label,
    showNav: flag(row.show_nav),
    showFooter: flag(row.show_footer),
    assignable: flag(row.assignable),
    sort: Number(row.sort) || 0,
  };
}

function toAd(row: AdRow | undefined): AdSlot {
  if (!row) return EMPTY_AD;
  return {
    imageUrl: row.image_url ?? "",
    href: row.href ?? "",
    label: row.label ?? "",
    enabled: flag(row.enabled),
  };
}

export async function readChrome(): Promise<ChromeData> {
  const sql = await getSql();
  const settingsRows = await sql<SettingsRow>`select site_name, desk_line, tagline, edition_left, edition_right, footer_text, logo_url, accent, show_breaking, facebook_url, youtube_url, tiktok_url
    from site_settings where id = 1 limit 1`;
  const sectionRows = await sql<SectionRow>`select slug, label, show_nav, show_footer, assignable, sort
    from sections order by sort asc, label asc`;
  const adRows = await sql<AdRow>`select slot, image_url, href, label, enabled from ad_slots`;
  const ads = new Map(adRows.map((row) => [row.slot, row]));
  return {
    settings: toSettings(settingsRows[0]),
    sections: sectionRows.map(toSection),
    ads: {
      mast: toAd(ads.get("mast")),
      article: toAd(ads.get("article")),
      after: toAd(ads.get("after")),
      footer: toAd(ads.get("footer")),
    },
  };
}

export const loadChrome = createServerFn({ method: "GET" }).handler(async () => readChrome());

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const source = input as Record<string, unknown>;
    const siteName = clip(source.siteName, 60);
    if (siteName.length < 2) throw new Error("Tên tờ báo cần ít nhất 2 ký tự");
    return {
      siteName,
      deskLine: clip(source.deskLine, 40) || DEFAULT_SETTINGS.deskLine,
      tagline: clip(source.tagline, 80) || DEFAULT_SETTINGS.tagline,
      editionLeft: clip(source.editionLeft, 80),
      editionRight: clip(source.editionRight, 80),
      footerText: clip(source.footerText, 400),
      logoUrl: httpUrl(source.logoUrl, "Logo"),
      accent: accentOf(source.accent),
      showBreaking: source.showBreaking === true,
      facebookUrl: socialUrl(source.facebookUrl, "Facebook"),
      youtubeUrl: socialUrl(source.youtubeUrl, "YouTube"),
      tiktokUrl: socialUrl(source.tiktokUrl, "TikTok"),
    } satisfies SiteSettings;
  })
  .handler(async ({ data, context }) => {
    await requireDeskAdmin(context.userId, "Chỉ admin được tùy chỉnh giao diện");
    const sql = await getSql();
    await sql`insert into site_settings (
        id, site_name, desk_line, tagline, edition_left, edition_right, footer_text, logo_url, accent, show_breaking,
        facebook_url, youtube_url, tiktok_url, updated_at
      ) values (
        1, ${data.siteName}, ${data.deskLine}, ${data.tagline}, ${data.editionLeft}, ${data.editionRight},
        ${data.footerText}, ${data.logoUrl}, ${data.accent}, ${data.showBreaking},
        ${data.facebookUrl}, ${data.youtubeUrl}, ${data.tiktokUrl}, now()
      )
      on conflict (id) do update set
        site_name = excluded.site_name,
        desk_line = excluded.desk_line,
        tagline = excluded.tagline,
        edition_left = excluded.edition_left,
        edition_right = excluded.edition_right,
        footer_text = excluded.footer_text,
        logo_url = excluded.logo_url,
        accent = excluded.accent,
        show_breaking = excluded.show_breaking,
        facebook_url = excluded.facebook_url,
        youtube_url = excluded.youtube_url,
        tiktok_url = excluded.tiktok_url,
        updated_at = now()`;
    return data;
  });

export const saveSections = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!Array.isArray(input)) throw new Error("Dữ liệu không hợp lệ");
    return input.slice(0, 40).map((item, index) => {
      if (!item || typeof item !== "object") throw new Error("Đề mục không hợp lệ");
      const source = item as Record<string, unknown>;
      const slug = clip(source.slug, 40);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Đề mục không hợp lệ");
      const label = clip(source.label, 40);
      if (label.length < 2) throw new Error("Tên đề mục cần ít nhất 2 ký tự");
      return {
        slug,
        label,
        showNav: source.showNav === true,
        showFooter: source.showFooter === true,
        sort: index + 1,
      };
    });
  })
  .handler(async ({ data, context }) => {
    await requireDeskAdmin(context.userId, "Chỉ admin được tùy chỉnh đề mục");
    const sql = await getSql();
    for (const item of data) {
      await sql`update sections set
        label = ${item.label},
        show_nav = ${item.showNav},
        show_footer = ${item.showFooter},
        sort = ${item.sort}
        where slug = ${item.slug}`;
    }
    return readChrome();
  });

export const addSection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const label = clip(typeof input === "string" ? input : (input as { label?: unknown })?.label, 40);
    if (label.length < 2) throw new Error("Tên đề mục cần ít nhất 2 ký tự");
    return label;
  })
  .handler(async ({ data: label, context }) => {
    await requireDeskAdmin(context.userId, "Chỉ admin được thêm đề mục");
    const sql = await getSql();
    let slug = slugify(label).slice(0, 40);
    if (slug.length < 2) slug = "muc-moi";
    const taken = await sql<{ slug: string }>`select slug from sections where slug = ${slug} or slug like ${`${slug}-%`}`;
    const used = new Set(taken.map((row) => row.slug));
    if (used.has(slug)) {
      let n = 2;
      while (used.has(`${slug}-${n}`)) n += 1;
      slug = `${slug}-${n}`.slice(0, 40);
    }
    const maxSort = await sql<{ n: number | string }>`select coalesce(max(sort), 0) as n from sections`;
    const sort = Number(maxSort[0]?.n ?? 0) + 1;
    await sql`insert into sections (slug, label, show_nav, show_footer, assignable, sort)
      values (${slug}, ${label}, true, false, true, ${sort})`;
    return readChrome();
  });

export const saveAds = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const source = input as Record<string, unknown>;
    return {
      mast: cleanAd(source.mast, "quảng cáo đầu trang"),
      article: cleanAd(source.article, "quảng cáo giữa bài"),
      after: cleanAd(source.after ?? {}, "quảng cáo cuối bài"),
      footer: cleanAd(source.footer, "quảng cáo cuối trang"),
    };
  })
  .handler(async ({ data, context }) => {
    await requireDeskAdmin(context.userId, "Chỉ admin được sửa quảng cáo");
    const sql = await getSql();
    for (const slot of ["mast", "article", "after", "footer"] as const) {
      const ad = data[slot];
      await sql`insert into ad_slots (slot, image_url, href, label, enabled)
        values (${slot}, ${ad.imageUrl}, ${ad.href}, ${ad.label}, ${ad.enabled})
        on conflict (slot) do update set
          image_url = excluded.image_url,
          href = excluded.href,
          label = excluded.label,
          enabled = excluded.enabled`;
    }
    const footer = data.footer;
    await sql`insert into footer_banner (id, image_url, href, label, enabled, updated_at)
      values (1, ${footer.imageUrl}, ${footer.href}, ${footer.label}, ${footer.enabled}, now())
      on conflict (id) do update set
        image_url = excluded.image_url,
        href = excluded.href,
        label = excluded.label,
        enabled = excluded.enabled,
        updated_at = now()`;
    return data;
  });
