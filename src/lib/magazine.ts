export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover: string;
  kicker: string;
  author: string;
  featured: boolean;
  published: boolean;
  reads: number;
  minutes: number;
  publishedAt: string;
  updatedAt: string;
  status: string;
  publishAt: string;
  seoTitle: string;
  seoDescription: string;
};

export const CATEGORIES = [
  { slug: "bong-da", label: "Bóng đá", en: "Football" },
  { slug: "v-league", label: "V-League", en: "Domestic league" },
  { slug: "doi-tuyen", label: "Đội tuyển quốc gia", en: "National team" },
  { slug: "quoc-te", label: "Bóng đá quốc tế", en: "World football" },
  { slug: "chuyen-nhuong", label: "Chuyển nhượng", en: "Transfers" },
  { slug: "mma", label: "MMA / Võ thuật", en: "Combat sports" },
  { slug: "bong-ro", label: "Bóng rổ", en: "Basketball" },
  { slug: "tennis", label: "Tennis", en: "Tennis" },
  { slug: "the-thao-khac", label: "Thể thao khác", en: "Other sports" },
  { slug: "goc-nhin", label: "Góc nhìn", en: "Features" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const GROUPS: Record<string, { label: string; categories: CategorySlug[] }> = {
  "bong-da": {
    label: "Bóng đá",
    categories: ["bong-da", "v-league", "doi-tuyen", "quoc-te", "chuyen-nhuong"],
  },
  "the-thao": {
    label: "Các môn khác",
    categories: ["the-thao-khac", "bong-ro", "tennis"],
  },
};

export const COVERS = [
  {
    id: "pitch",
    label: "Sân đêm",
    url: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "football",
    label: "Bóng đá",
    url: "https://images.unsplash.com/photo-1574629810360-7ef9b9b1a7c4?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "mma",
    label: "MMA",
    url: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "stadium",
    label: "Khán đài",
    url: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "bike",
    label: "Đua xe",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "basket",
    label: "Bóng rổ",
    url: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "tennis",
    label: "Tennis",
    url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "track",
    label: "Đường chạy",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1600&q=80",
  },
] as const;

export function categoryLabel(slug: string) {
  return CATEGORIES.find((item) => item.slug === slug)?.label ?? slug;
}

export function resolveSection(slug: string) {
  const group = GROUPS[slug];
  if (group) return group;
  const category = CATEGORIES.find((item) => item.slug === slug);
  if (!category) return null;
  return { label: category.label, categories: [category.slug] };
}

export function slugify(input: string) {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "bai-viet";
}

export function estimateMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 160) || 1);
}

export function editionLine(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
  const day = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
  return `${weekday} · ${day}`.toLocaleUpperCase("vi-VN");
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "strike"; text: string }
  | { type: "link"; text: string; href: string };

export type Block =
  | { type: "p" | "quote" | "h2"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; title: string }
  | { type: "hr" };

const INLINE = /~~([^~]+)~~|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function videoEmbed(url: string): { src: string; title: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = parsed.pathname.replace(/^\//, "").split("/")[0] ?? "";
    return /^[\w-]{6,20}$/.test(id)
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, title: "YouTube" }
      : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const fromQuery = parsed.searchParams.get("v") ?? "";
    const fromPath = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const id = /^[\w-]{6,20}$/.test(fromQuery) ? fromQuery : fromPath;
    return /^[\w-]{6,20}$/.test(id)
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, title: "YouTube" }
      : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = parsed.pathname.split("/").filter((part) => /^\d+$/.test(part)).pop() ?? "";
    return id ? { src: `https://player.vimeo.com/video/${id}`, title: "Vimeo" } : null;
  }
  if (/\.(mp4|webm)$/i.test(parsed.pathname)) return { src: parsed.toString(), title: "file" };
  return null;
}

export function inlineMarks(text: string): Inline[] {
  const marks: Inline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > cursor) marks.push({ type: "text", text: text.slice(cursor, index) });
    if (match[1]) marks.push({ type: "strike", text: match[1] });
    else if (match[2]) marks.push({ type: "bold", text: match[2] });
    else if (match[3]) marks.push({ type: "italic", text: match[3] });
    else if (match[4] && match[5]) marks.push({ type: "link", text: match[4], href: match[5] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) marks.push({ type: "text", text: text.slice(cursor) });
  return marks.length ? marks : [{ type: "text", text }];
}

export function articleBlocks(body: string): Block[] {
  return body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk === "---") return { type: "hr" };
      const image = chunk.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/media\/)[^\s)]+)\)$/);
      if (image?.[2]) return { type: "image", alt: image[1] ?? "", src: image[2] };
      const video = chunk.match(/^@\[([^\]]*)\]\(((?:https?:\/\/|\/media\/)[^\s)]+)\)$/);
      if (video?.[2] && (video[2].startsWith("/media/") || videoEmbed(video[2]))) {
        return { type: "video", src: video[2], title: video[1] || "Video" };
      }
      if (chunk.startsWith("## ")) return { type: "h2", inlines: inlineMarks(chunk.slice(3).trim()) };
      if (chunk.startsWith(">")) {
        const quote = chunk
          .split("\n")
          .map((line) => line.replace(/^>\s?/, ""))
          .join(" ")
          .trim();
        return { type: "quote", inlines: inlineMarks(quote) };
      }
      const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length && lines.every((line) => /^[-*]\s+/.test(line))) {
        return { type: "list", ordered: false, items: lines.map((line) => inlineMarks(line.replace(/^[-*]\s+/, ""))) };
      }
      if (lines.length && lines.every((line) => /^\d+\.\s+/.test(line))) {
        return { type: "list", ordered: true, items: lines.map((line) => inlineMarks(line.replace(/^\d+\.\s+/, ""))) };
      }
      return { type: "p", inlines: inlineMarks(chunk) };
    });
}
