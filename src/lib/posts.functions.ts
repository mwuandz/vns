import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { deskRole } from "@/lib/staff.functions";
import { canPublish, isChief } from "@/lib/roles";
import {
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
  status?: string | null;
  publish_at?: Date | string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  deleted_at?: Date | string | null;
  owner_name?: string | null;
};

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
  if (/^\/media\/[a-f0-9]{32}$/.test(value)) return value;
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
  if (cover.startsWith("/media/") && /^\/media\/[a-f0-9]{32}$/.test(cover)) safeCover = cover;
  else if (cover) {
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
    author: row.author || "Tòa soạn",
    featured: flag(row.featured),
    published: flag(row.published),
    reads: num(row.reads),
    minutes: Math.max(1, num(row.minutes) || 1),
    publishedAt: iso(row.published_at),
    updatedAt: iso(row.updated_at),
    status: row.status || (flag(row.published) ? "published" : "draft"),
    publishAt: row.publish_at ? iso(row.publish_at) : "",
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
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
  status: "draft" | "review" | "scheduled" | "published";
  publishAt: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
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
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) throw new Error("Chuyên mục không hợp lệ");
  const cover = cleanCover(text(raw.cover, 600));
  const kicker = text(raw.kicker, 90);
  const author = text(raw.author, 80) || "Tòa soạn";
  const featured = raw.featured === true;
  const allowed = ["draft", "review", "scheduled", "published"] as const;
  const picked = allowed.find((item) => item === raw.status);
  const status = picked ?? (raw.published === true ? "published" : "draft");
  const publishAt = text(raw.publishAt, 40);
  if (status === "scheduled" && !publishAt) throw new Error("Hẹn giờ cần chọn thời điểm đăng");
  const seoTitle = text(raw.seoTitle, 70);
  const seoDescription = text(raw.seoDescription, 160);
  const slug = text(raw.slug, 80)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  let minutes = Number(raw.minutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 60) minutes = estimateMinutes(body);
  const goingLive = status === "published" || status === "scheduled";
  if (goingLive && excerpt.length < 12) throw new Error("Bài công khai cần một đoạn sapo");
  if (goingLive && body.length < 40) throw new Error("Bài công khai cần phần thân dài hơn");
  return {
    title,
    excerpt,
    body,
    category: category as CategorySlug,
    cover,
    kicker,
    author,
    featured,
    published: status === "published",
    status,
    publishAt,
    seoTitle,
    seoDescription,
    slug,
    minutes: Math.round(minutes),
  };
}

async function ownsPost(id: number, userId: string) {
  const role = await deskRole(userId);
  const sql = await getSql();
  const rows = await sql<{ owner_id: string | null; status: string; deleted_at: Date | string | null }>`
    select owner_id, status, deleted_at from posts where id = ${id} limit 1`;
  const row = rows[0];
  if (!row || row.deleted_at) throw new Error("Không tìm thấy bài");
  const own = row.owner_id === userId;
  if (!isChief(role) && !own && !(role === "btv" && row.status === "review")) {
    throw new Error("Bạn chỉ sửa được bài của mình");
  }
  return role;
}

function liveStatus(role: Awaited<ReturnType<typeof deskRole>>, input: PostInput) {
  if (!canPublish(role) && (input.status === "published" || input.status === "scheduled")) {
    throw new Error("Phóng viên gửi duyệt, không tự xuất bản");
  }
  const publishAt = input.status === "scheduled" ? input.publishAt : "";
  let when = "";
  if (publishAt) {
    const text = publishAt.length === 16 ? `${publishAt}:00+07:00` : publishAt;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) throw new Error("Giờ đăng không hợp lệ");
    when = date.toISOString();
  }
  return {
    status: input.status,
    published: input.status === "published",
    featured: canPublish(role) ? input.featured : false,
    publishAt: when,
  };
}

async function note(userId: string, action: string, postId: number | null, detail: string) {
  const sql = await getSql();
  const names = await sql<{ name: string }>`select name from "user" where id = ${userId} limit 1`;
  await sql`insert into activity_log (actor_id, actor_name, action, post_id, detail)
    values (${userId}, ${names[0]?.name ?? ""}, ${action}, ${postId}, ${detail.slice(0, 180)})`;
}

async function publishDue() {
  const sql = await getSql();
  await sql`update posts
    set published = true, status = 'published', published_at = coalesce(publish_at, now()), updated_at = now()
    where deleted_at is null and status = 'scheduled' and publish_at is not null and publish_at <= now()`;
}

async function assertAssignable(category: string) {
  const sql = await getSql();
  const rows = await sql<{ ok: number }>`select 1 as ok from sections where slug = ${category} and assignable = true limit 1`;
  if (!rows.length) throw new Error("Chuyên mục không hợp lệ");
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
  await publishDue();
  const sql = await getSql();
  const found = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
    from posts where published = true and deleted_at is null order by published_at desc, id desc`;
  const posts = found.map(toPost);
  return { ...arrange(posts), total: posts.length };
});

export const loadArchive = createServerFn({ method: "GET" }).handler(async () => {
  await publishDue();
  const sql = await getSql();
  const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
    from posts where published = true and deleted_at is null order by published_at desc, id desc`;
  const posts = rows.map(toPost);
  return { posts, breaking: posts[0] ?? null };
});

export const loadSection = createServerFn({ method: "GET" })
  .validator((slug: string) => slug.trim().toLowerCase())
  .handler(async ({ data: slug }) => {
    await publishDue();
    const known = resolveSection(slug);
    const sql = await getSql();
    const named = await sql<{ label: string }>`select label from sections where slug = ${slug} limit 1`;
    if (!known && !named[0]) return null;
    const section = {
      label: named[0]?.label ?? known!.label,
      categories: known ? known.categories : [slug],
    };
    const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts
      where published = true and deleted_at is null
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
    await publishDue();
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at, status, publish_at, seo_title, seo_description
      from posts where slug = ${slug} and published = true and deleted_at is null limit 1`;
    const row = rows[0];
    if (!row) return null;
    const post = toPost(row);
    const relatedRows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at
      from posts
      where published = true and deleted_at is null and slug <> ${slug} and category = ${post.category}
      order by published_at desc limit 3`;
    const breakingRows = await sql<{ title: string; slug: string }>`select title, slug from posts where published = true and deleted_at is null order by published_at desc, id desc limit 1`;
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
    await sql`update posts set reads = reads + 1 where slug = ${slug} and published = true and deleted_at is null`;
    return { ok: true };
  });

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const role = await deskRole(context.userId);
    const chief = isChief(role);
    const rows = await sql<Row>`select p.id, p.slug, p.title, p.excerpt, ''::text as body, p.category, p.cover, p.kicker, p.author, p.featured, p.published, p.reads, p.minutes, p.published_at, p.updated_at, p.status, p.publish_at, u.name as owner_name
      from posts p
      left join "user" u on u.id = p.owner_id
      where p.deleted_at is null and (${chief} or p.owner_id = ${context.userId} or (${role === "btv"} and p.status = 'review'))
      order by p.updated_at desc, p.id desc`;
    const posts = rows.map((row) => ({ ...toPost(row), ownerName: row.owner_name ?? "" }));
    return {
      role,
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
  .handler(async ({ data: id, context }) => {
    await ownsPost(id, context.userId);
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at, status, publish_at, seo_title, seo_description
      from posts where id = ${id} and deleted_at is null limit 1`;
    return rows[0] ? toPost(rows[0]) : null;
  });

export const createPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => cleanPost(input))
  .handler(async ({ data, context }) => {
    const role = await deskRole(context.userId);
    const state = liveStatus(role, data);
    await assertAssignable(data.category);
    const sql = await getSql();
    const slug = await uniqueSlug(data.slug || slugify(data.title));
    const rows = await sql<Row>`insert into posts
      (slug, title, excerpt, body, category, cover, kicker, author, featured, published, minutes, owner_id, status, publish_at, seo_title, seo_description, published_at, updated_at)
      values (
        ${slug}, ${data.title}, ${data.excerpt}, ${data.body}, ${data.category}, ${data.cover},
        ${data.kicker}, ${data.author}, ${state.featured}, ${state.published}, ${data.minutes}, ${context.userId},
        ${state.status}, ${state.publishAt || null}, ${data.seoTitle}, ${data.seoDescription}, now(), now()
      )
      returning id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at`;
    const created = rows[0];
    if (!created) throw new Error("Không tạo được bài");
    await note(context.userId, state.status === "review" ? "gửi duyệt" : state.status === "published" ? "xuất bản" : "tạo bài", created.id, data.title);
    return toPost(created);
  });

export const updatePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
    const id = Number((input as { id?: unknown }).id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Bài không hợp lệ");
    return { id, ...cleanPost(input) };
  })
  .handler(async ({ data, context }) => {
    const role = await ownsPost(data.id, context.userId);
    const state = liveStatus(role, data);
    await assertAssignable(data.category);
    const sql = await getSql();
    const slug = data.slug ? await uniqueSlug(data.slug, data.id) : "";
    const rows = await sql<Row>`update posts set
      slug = case when ${slug} = '' then slug else ${slug} end,
      title = ${data.title},
      excerpt = ${data.excerpt},
      body = ${data.body},
      category = ${data.category},
      cover = ${data.cover},
      kicker = ${data.kicker},
      author = ${data.author},
      featured = ${state.featured},
      published = ${state.published},
      status = ${state.status},
      publish_at = ${state.publishAt || null},
      seo_title = ${data.seoTitle},
      seo_description = ${data.seoDescription},
      minutes = ${data.minutes},
      published_at = case when ${state.published} = true and published = false then now() else published_at end,
      updated_at = now()
      where id = ${data.id} and deleted_at is null
      returning id, slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at, status, publish_at, seo_title, seo_description`;
    const row = rows[0];
    if (!row) throw new Error("Không tìm thấy bài để lưu");
    const action = state.status === "published" ? "xuất bản" : state.status === "review" ? "gửi duyệt" : state.status === "scheduled" ? "hẹn giờ" : "sửa bài";
    await note(context.userId, action, row.id, data.title);
    return toPost(row);
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Bài không hợp lệ");
    return parsed;
  })
  .handler(async ({ data: id, context }) => {
    await ownsPost(id, context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: number; title: string }>`update posts set deleted_at = now(), published = false, updated_at = now()
      where id = ${id} and deleted_at is null returning id, title`;
    if (rows[0]) await note(context.userId, "xóa", id, rows[0].title);
    return { ok: rows.length > 0 };
  });

export const restorePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Bài không hợp lệ");
    return parsed;
  })
  .handler(async ({ data: id, context }) => {
    const role = await deskRole(context.userId);
    const sql = await getSql();
    const rows = await sql<{ owner_id: string | null; title: string }>`select owner_id, title from posts where id = ${id} and deleted_at is not null limit 1`;
    const row = rows[0];
    if (!row) throw new Error("Không thấy bài trong thùng rác");
    if (!isChief(role) && row.owner_id !== context.userId) throw new Error("Bạn chỉ khôi phục được bài của mình");
    await sql`update posts set deleted_at = null, updated_at = now() where id = ${id}`;
    await note(context.userId, "khôi phục", id, row.title);
    return { ok: true };
  });

export const purgePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Bài không hợp lệ");
    return parsed;
  })
  .handler(async ({ data: id, context }) => {
    if ((await deskRole(context.userId)) !== "admin") throw new Error("Chỉ admin được xóa vĩnh viễn");
    const sql = await getSql();
    const rows = await sql<{ title: string }>`delete from posts where id = ${id} and deleted_at is not null returning title`;
    if (!rows[0]) throw new Error("Không thấy bài trong thùng rác");
    await note(context.userId, "xóa vĩnh viễn", id, rows[0].title);
    return { ok: true };
  });

export const loadTrash = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await deskRole(context.userId);
    const chief = isChief(role);
    const sql = await getSql();
    const rows = await sql<Row>`select id, slug, title, excerpt, ''::text as body, category, cover, kicker, author, featured, published, reads, minutes, published_at, updated_at, status, deleted_at
      from posts where deleted_at is not null and (${chief} or owner_id = ${context.userId})
      order by deleted_at desc`;
    return { role, posts: rows.map(toPost) };
  });

export const loadStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await deskRole(context.userId);
    const chief = isChief(role);
    const sql = await getSql();
    const rows = await sql<{ title: string; author: string; reads: number | string; featured: boolean | string; published: boolean | string }>`
      select title, author, reads, featured, published from posts
      where deleted_at is null and (${chief} or owner_id = ${context.userId})
      order by reads desc, id desc`;
    const posts = rows.map((row) => ({
      title: row.title,
      author: row.author,
      reads: Number(row.reads) || 0,
      featured: row.featured === true || row.featured === "t",
      published: row.published === true || row.published === "t",
    }));
    const byAuthor = new Map<string, { author: string; posts: number; reads: number }>();
    for (const post of posts) {
      const current = byAuthor.get(post.author) ?? { author: post.author, posts: 0, reads: 0 };
      current.posts += 1;
      current.reads += post.reads;
      byAuthor.set(post.author, current);
    }
    return {
      role,
      views: posts.reduce((sum, post) => sum + post.reads, 0),
      published: posts.filter((post) => post.published).length,
      featured: posts.filter((post) => post.featured).length,
      top: posts.slice(0, 8),
      authors: [...byAuthor.values()].sort((a, b) => b.reads - a.reads),
    };
  });

export const loadLog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const role = await deskRole(context.userId);
    const chief = isChief(role);
    const sql = await getSql();
    const rows = await sql<{ actor_name: string; action: string; detail: string; created_at: Date | string }>`
      select actor_name, action, detail, created_at from activity_log
      where ${chief} or actor_id = ${context.userId}
      order by id desc limit 80`;
    return {
      role,
      entries: rows.map((row) => ({
        actor: row.actor_name || "Tòa soạn",
        action: row.action,
        detail: row.detail,
        at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
    };
  });

