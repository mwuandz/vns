import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  CATEGORIES,
  type CategorySlug,
  type Post,
  estimateMinutes,
  resolveSection,
  slugify,
} from "@/lib/magazine";

type Row = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover: string;
  kicker: string;
  author: string;
  featured: boolean | string | number;
  published: boolean | string | number;
  reads: number | string;
  minutes: number | string;
  published_at: Date | string;
  updated_at: Date | string;
};

const CATEGORY_SET = new Set<string>(CATEGORIES.map((item) => item.slug));

function flag(value: unknown) {
  return value === true || value === "t" || value === "true" || value === 1 || value === "1";
}

function num(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function iso(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date(0).toISOString();
}

function cleanCover(value: string) {
  if (!value) return "";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Ảnh bìa phải là đường dẫn https hợp lệ");
  }
  if (url.protocol !== "https:") throw new Error("Ảnh bìa phải dùng https");
  return url.toString().slice(0, 600);
}

export function toPost(row: Row): Post {
  const cover = typeof row.cover === "string" ? row.cover : "";
  let safeCover = "";
  if (cover) {
    try {
      const url = new URL(cover);
      if (url.protocol === "https:") safeCover = url.toString();
    } catch {
      safeCover = "";
    }
  }
  return {
    id: num(row.id),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category,
    cover: safeCover,
    kicker: row.kicker ?? "",
    author: row.author || "Lê Phan",
    featured: flag(row.featured),
    published: flag(row.published),
    reads: num(row.reads),
    minutes: Math.max(1, num(row.minutes) || 1),
    publishedAt: iso(row.published_at),
    updatedAt: iso(row.updated_at),
  };
}

export type PostInput = {
  title: string;
  excerpt: string;
  body: string;
  category: CategorySlug;
  cover: string;
  kicker: string;
  author: string;
  featured: boolean;
  published: boolean;
  minutes: number;
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanPost(input: unknown): PostInput {
  if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
  const raw = input as Record<string, unknown>;
  const title = text(raw.title, 180);
  if (title.length < 4) throw new Error("Tiêu đề cần ít nhất 4 ký tự");
  const excerpt = text(raw.excerpt, 360);
  const body = text(raw.body, 20000);
  const category = text(raw.category, 40);
  if (!CATEGORY_SET.has(category)) throw new Error("Chuyên mục không hợp lệ");
  const cover = cleanCover(text(raw.cover, 600));
  const kicker = text(raw.kicker, 90);
  const author = text(raw.author, 80) || "Lê Phan";
  const featured = raw.featured === true;
  const published = raw.published === true;
  let minutes = Number(raw.minutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) minutes = estimateMinutes(body);
  if (published && excerpt.length < 12) throw new Error("Bài công khai cần một đoạn sapo");
  if (published && body.length < 40) throw new Error("Bài công khai cần phần thân dài hơn");
  return {
    title,
    excerpt,
    body,
    category: category as CategorySlug,
    cover,
    kicker,
    author,
    featured,
    published,
    minutes: Math.round(minutes),
  };
}

async function uniqueSlug(base: string, ignoreId?: number) {
  const sql = await getSql();
  let slug = base || "bai-viet";
  for (let n = 2; n < 40; n += 1) {
    const rows = await sql<{ id: number }>`select id from posts where slug = ${slug} limit 1`;
    if (!rows.length || rows[0]?.id === ignoreId) return slug;
    slug = `${base}-${n}`.slice(0, 90);
  }
  return `${base}-${Date.now()}`.slice(0, 90);
}

function arrange(posts: Post[]) {
  const hero = posts.find((post) => post.featured) ?? posts[0] ?? null;
  const rest = posts.filter((post) => post.id !== hero?.id);
  const featuredRest = rest.filter((post) => post.featured);
  const sides = (featuredRest.length >= 2 ? featuredRest : rest).slice(0, 2);
  const used = new Set([hero?.id, ...sides.map((post) => post.id)]);
  const latest = posts.filter((post) => !used.has(post.id));
  const mostRead = [...posts].sort((a, b) => b.reads - a.reads || b.id - a.id).slice(0, 4);
  const breaking = posts[0] ?? null;
  return { hero, sides, latest, mostRead, breaking };
}

export const loadHome = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const found = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
    from posts where published = true order by published_at desc, id desc`;
  const posts = found.map(toPost);
  return { ...arrange(posts), total: posts.length };
});

export const loadArchive = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
    from posts where published = true order by published_at desc, id desc`;
  const posts = rows.map(toPost);
  return { posts, breaking: posts[0] ?? null };
});

export const loadSection = createServerFn({ method: "GET" })
  .validator((slug: string) => slug.trim().toLowerCase())
  .handler(async ({ data: slug }) => {
    const section = resolveSection(slug);
    if (!section) return null;
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts
      where published = true
      order by published_at desc, id desc`;
    const allowed = new Set<string>(section.categories);
    const posts = rows.map(toPost).filter((post) => allowed.has(post.category));
    const breaking = rows[0] ? { title: rows[0].title, slug: rows[0].slug } : null;
    return { label: section.label, slug, posts, breaking };
  });

export const loadArticle = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    const clean = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{1,90}$/.test(clean)) throw new Error("Đường dẫn bài không hợp lệ");
    return clean;
  })
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts where slug = ${slug} and published = true limit 1`;
    const row = rows[0];
    if (!row) return null;
    const post = toPost(row);
    const relatedRows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts
      where published = true and slug <> ${slug} and category = ${post.category}
      order by published_at desc limit 3`;
    const breakingRows = await sql<{ title: string; slug: string }>`select title, slug from posts where published = true order by published_at desc, id desc limit 1`;
    return {
      post,
      related: relatedRows.map(toPost),
      breaking: breakingRows[0] ?? { title: post.title, slug: post.slug },
    };
  });

export const bumpReads = createServerFn({ method: "POST" })
  .validator((slug: string) => {
    const clean = slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{1,90}$/.test(clean)) throw new Error("Đường dẫn bài không hợp lệ");
    return clean;
  })
  .handler(async ({ data: slug }) => {
    const sql = await getSql();
    await sql`update posts set reads = reads + 1 where slug = ${slug} and published = true`;
    return { ok: true };
  });

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
  const sql = await getSql();
  const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
    from posts order by updated_at desc, id desc`;
  const posts = rows.map(toPost);
  return {
    posts,
    published: posts.filter((post) => post.published).length,
    drafts: posts.filter((post) => !post.published).length,
    reads: posts.reduce((sum, post) => sum + post.reads, 0),
  };
});

export const loadEditor = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Bài không hợp lệ");
    return parsed;
  })
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts where id = ${id} limit 1`;
    return rows[0] ? toPost(rows[0]) : null;
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => cleanPost(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const slug = await uniqueSlug(slugify(data.title));
    const rows = await sql<Row>`insert into posts
      (slug, title, excerpt, body, category, cover, kicker, author, featured, published, minutes, published_at, updated_at)
      values (
        ${slug}, ${data.title}, ${data.excerpt}, ${data.body}, ${data.category}, ${data.cover},
        ${data.kicker}, ${data.author}, ${data.featured}, ${data.published}, ${data.minutes}, now(), now()
      )
      returning id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at`;
    const row = rows[0];
    if (!row) throw new Error("Không tạo được bài");
    return toPost(row);
  });

export const updatePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const id = Number((input as { id?: unknown }).id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Bài không hợp lệ");
    return { id, ...cleanPost(input) };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<Row>`update posts set
      title = ${data.title},
      excerpt = ${data.excerpt},
      body = ${data.body},
      category = ${data.category},
      cover = ${data.cover},
      kicker = ${data.kicker},
      author = ${data.author},
      featured = ${data.featured},
      published = ${data.published},
      minutes = ${data.minutes},
      published_at = case when ${data.published} = true and published = false then now() else published_at end,
      updated_at = now()
      where id = ${data.id}
      returning id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at`;
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy bài để lưu");
    return toPost(row);
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Bài không hợp lệ");
    return parsed;
  })
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number }>`delete from posts where id = ${id} returning id`;
    return { ok: rows.length > 0 };
  });
