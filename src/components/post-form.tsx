import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArticleBody } from "@/components/article-body";
import { getBearerToken } from "@/lib/auth/client";
import { loadChrome } from "@/lib/customize.functions";
import { CATEGORIES, COVERS, estimateMinutes, videoEmbed, type Post } from "@/lib/magazine";
import { createPost, deletePost, updatePost } from "@/lib/posts.functions";
import { canPublish, type DeskRole } from "@/lib/roles";
import { loadMyRole } from "@/lib/staff.functions";

function toVnInput(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

const EMPTY = {
  title: "",
  excerpt: "",
  body: "",
  category: "goc-nhin",
  cover: COVERS[0]?.url ?? "",
  kicker: "",
  author: "Tòa soạn",
  featured: false,
  published: false,
  status: "draft" as const,
  publishAt: "",
  seoTitle: "",
  seoDescription: "",
  slug: "",
  minutes: 4,
};

export function PostForm({ post }: { post?: Post }) {
  const router = useRouter();
  const create = useServerFn(createPost);
  const update = useServerFn(updatePost);
  const remove = useServerFn(deletePost);
  const [form, setForm] = useState(() =>
    post
      ? {
          title: post.title,
          excerpt: post.excerpt,
          body: post.body,
          category: post.category,
          cover: post.cover,
          kicker: post.kicker,
          author: post.author,
          featured: post.featured,
          published: post.published,
          status: (post.status || (post.published ? "published" : "draft")) as "draft" | "review" | "scheduled" | "published",
          publishAt: toVnInput(post.publishAt),
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          slug: post.slug,
          minutes: post.minutes,
        }
      : EMPTY,
  );
  const [sections, setSections] = useState<{ slug: string; label: string }[]>(
    CATEGORIES.map((item) => ({ slug: item.slug, label: item.label })),
  );
  const fetchRole = useServerFn(loadMyRole);
  const [role, setRole] = useState<DeskRole>("btv");
  const fetchChrome = useServerFn(loadChrome);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const past = useRef<string[]>([form.body]);
  const at = useRef(0);

  useEffect(() => {
    let live = true;
    fetchChrome()
      .then((data) => {
        if (!live) return;
        const items = data.sections.filter((item) => item.assignable).map((item) => ({
          slug: item.slug,
          label: item.label,
        }));
        if (items.length) setSections(items);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [fetchChrome]);

  useEffect(() => {
    let live = true;
    fetchRole()
      .then((result) => {
        if (live) setRole(result.role);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [fetchRole]);

  function commitBody(next: string) {
    const stack = past.current.slice(0, at.current + 1);
    if (stack[stack.length - 1] !== next) {
      stack.push(next);
      if (stack.length > 100) stack.shift();
      past.current = stack;
      at.current = stack.length - 1;
    }
    set("body", next);
  }

  function undoBody() {
    if (at.current <= 0) return;
    at.current -= 1;
    set("body", past.current[at.current] ?? "");
  }

  function redoBody() {
    if (at.current >= past.current.length - 1) return;
    at.current += 1;
    set("body", past.current[at.current] ?? "");
  }

  function insertBody(before: string, after = "", fallback = "") {
    const field = bodyRef.current;
    const current = form.body;
    const start = field?.selectionStart ?? current.length;
    const end = field?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || fallback;
    const next = `${current.slice(0, start)}${before}${selected}${after}${current.slice(end)}`;
    commitBody(next);
    requestAnimationFrame(() => {
      field?.focus();
      const cursor = start + before.length + selected.length + after.length;
      field?.setSelectionRange(cursor, cursor);
    });
  }

  function insertImage() {
    imageRef.current?.click();
  }

  function insertVideo() {
    videoRef.current?.click();
  }

  async function shrinkImage(file: File) {
    if (file.type === "image/gif") return file;
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Không đọc được ảnh"));
        el.src = url;
      });
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      return blob ?? file;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function uploadMedia(file: File, kind: "image" | "video") {
    const payload = kind === "image" ? await shrinkImage(file) : file;
    if (payload.size > 4 * 1024 * 1024) {
      throw new Error(kind === "video" ? "Video tối đa 4MB. Video dài hãy bấm Link video và dán YouTube." : "Ảnh vẫn quá nặng");
    }
    const data = new FormData();
    data.set("file", payload, kind === "image" ? "anh.jpg" : file.name || "video.mp4");
    const headers = new Headers();
    const token = getBearerToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch("/api/media", { method: "POST", body: data, headers, credentials: "include" });
    const json = (await response.json().catch(() => ({}))) as { url?: string; message?: string };
    if (!response.ok || !json.url) throw new Error(json.message || "Không tải được file");
    return json.url;
  }

  async function onPicked(kind: "image" | "video" | "cover", list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadMedia(file, kind === "video" ? "video" : "image");
      if (kind === "cover") set("cover", url);
      else if (kind === "image") commitBody(`${form.body.trimEnd()}\n\n![](${url})\n\n`);
      else commitBody(`${form.body.trimEnd()}\n\n@[Video](${url})\n\n`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tải được file");
    } finally {
      setBusy(false);
      if (imageRef.current) imageRef.current.value = "";
      if (videoRef.current) videoRef.current.value = "";
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  function insertImageLink() {
    const src = window.prompt("Dán link ảnh https");
    if (!src) return;
    if (!/^https:\/\/\S+$/.test(src.trim())) {
      setError("Link ảnh phải bắt đầu bằng https://");
      return;
    }
    commitBody(`${form.body.trimEnd()}\n\n![](${src.trim()})\n\n`);
  }

  function insertVideoLink() {
    const src = window.prompt("Dán link YouTube hoặc Vimeo");
    if (!src) return;
    const clean = src.trim();
    if (!videoEmbed(clean)) {
      setError("Chỉ nhúng được link YouTube hoặc Vimeo");
      return;
    }
    commitBody(`${form.body.trimEnd()}\n\n@[Video](${clean})\n\n`);
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setOk("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const payload = {
      ...form,
      minutes: form.minutes || estimateMinutes(form.body),
    };
    try {
      if (post) {
        await update({ data: { id: post.id, ...payload } });
        setOk("Đã lưu bài.");
        await router.invalidate();
      } else {
        const created = await create({ data: payload });
        await router.navigate({ to: "/quan-tri/$id", params: { id: String(created.id) } });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được bài");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!post) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await remove({ data: post.id });
      await router.navigate({ to: "/quan-tri" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không xóa được bài");
      setBusy(false);
    }
  }

  return (
    <form className="editor" onSubmit={onSubmit}>
      <label>
        Tiêu đề
        <input name="title" value={form.title} onChange={(event) => set("title", event.target.value)} required />
      </label>
      <div className="split">
        <label>
          Kicker
          <input
            value={form.kicker}
            placeholder="Spotlight · Bóng đá"
            onChange={(event) => set("kicker", event.target.value)}
          />
        </label>
        <label>
          Chuyên mục
          <select value={form.category} onChange={(event) => set("category", event.target.value)}>
            {sections.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Sapo
        <textarea
          className="sapo"
          name="excerpt"
          value={form.excerpt}
          onChange={(event) => set("excerpt", event.target.value)}
        />
      </label>
      <label>
        Thân bài
        <div className="compose-tools">
          <button type="button" onClick={undoBody}>Hoàn tác</button>
          <button type="button" onClick={redoBody}>Làm lại</button>
          <button type="button" onClick={() => insertBody("**", "**", "đậm")}>Đậm</button>
          <button type="button" onClick={() => insertBody("*", "*", "nghiêng")}>Nghiêng</button>
          <button type="button" onClick={() => insertBody("~~", "~~", "gạch")}>Gạch</button>
          <button type="button" onClick={() => insertBody("\n\n## ", "\n\n", "Tiêu đề nhỏ")}>Tiêu đề</button>
          <button type="button" onClick={() => insertBody("\n\n> ", "\n\n", "Câu trích")}>Trích</button>
          <button type="button" onClick={() => insertBody("\n\n- ", "\n- ", "Ý một")}>Gạch đầu dòng</button>
          <button type="button" onClick={() => insertBody("\n\n1. ", "\n2. ", "Ý một")}>Đánh số</button>
          <button type="button" onClick={() => insertBody("[", "](https://)", "chữ liên kết")}>Liên kết</button>
          <button type="button" onClick={insertImage}>Tải ảnh</button>
          <button type="button" onClick={insertImageLink}>Link ảnh</button>
          <button type="button" onClick={insertVideo}>Tải video</button>
          <button type="button" onClick={insertVideoLink}>Link video</button>
          <button type="button" onClick={() => insertBody("\n\n---\n\n")}>Kẻ ngang</button>
          <button type="button" onClick={() => setPreview((value) => !value)}>{preview ? "Soạn" : "Xem trước"}</button>
        </div>
        {preview ? (
          <div className="compose-preview">
            <ArticleBody body={form.body} />
          </div>
        ) : (
          <textarea
            ref={bodyRef}
            name="body"
            value={form.body}
            onChange={(event) => commitBody(event.target.value)}
            placeholder={"Mỗi đoạn cách một dòng trống.\nBôi chữ rồi bấm Đậm, Trích, Danh sách…"}
          />
        )}
        <input ref={imageRef} type="file" accept="image/*" hidden onChange={(event) => onPicked("image", event.target.files)} />
        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(event) => onPicked("video", event.target.files)} />
      </label>
      <p className="note">Ước chừng {estimateMinutes(form.body)} phút đọc theo độ dài hiện tại.</p>
      <div>
        <div className="category cover-label">Ảnh bìa</div>
        <div className="covers">
          {COVERS.map((cover) => (
            <button
              key={cover.id}
              type="button"
              className={form.cover === cover.url ? "on" : undefined}
              onClick={() => set("cover", cover.url)}
            >
              <img src={cover.url} alt="" />
              <span>{cover.label}</span>
            </button>
          ))}
        </div>
      </div>
      <label>
        Ảnh bìa: chọn file hoặc dán link https
        <input ref={coverRef} type="file" accept="image/*" onChange={(event) => onPicked("cover", event.target.files)} />
        <input
          value={form.cover}
          onChange={(event) => set("cover", event.target.value)}
          placeholder="https:// hoặc để trống sau khi chọn file"
        />
      </label>
      <div className="split">
        <label>
          Tác giả
          <input value={form.author} onChange={(event) => set("author", event.target.value)} />
        </label>
        <label>
          Phút đọc
          <input
            type="number"
            min={1}
            max={60}
            value={form.minutes}
            onChange={(event) => set("minutes", Number(event.target.value))}
          />
        </label>
      </div>
      <div className="split">
        <label>
          Tiêu đề SEO
          <input value={form.seoTitle} placeholder="Để trống thì dùng tiêu đề bài" onChange={(event) => set("seoTitle", event.target.value)} />
        </label>
        <label>
          Đường dẫn
          <input value={form.slug} placeholder="tu-dong-theo-tieu-de" onChange={(event) => set("slug", event.target.value)} />
        </label>
      </div>
      <label>
        Mô tả SEO
        <textarea className="sapo" value={form.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} />
      </label>
      <label>
        Trạng thái
        <select
          value={form.status}
          onChange={(event) => {
            const status = event.target.value as typeof form.status;
            set("status", status);
            set("published", status === "published");
          }}
        >
          <option value="draft">Nháp</option>
          <option value="review">Gửi duyệt</option>
          {canPublish(role) ? <option value="published">Xuất bản ngay</option> : null}
          {canPublish(role) ? <option value="scheduled">Hẹn giờ</option> : null}
        </select>
      </label>
      {form.status === "scheduled" ? (
        <label>
          Giờ đăng (giờ Việt Nam)
          <input type="datetime-local" value={form.publishAt} onChange={(event) => set("publishAt", event.target.value)} />
        </label>
      ) : null}
      <div className="checks">
        {canPublish(role) ? (
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => set("featured", event.target.checked)}
            />
            Đưa lên trang nhất
          </label>
        ) : (
          <p className="note">Phóng viên gửi duyệt. Biên tập viên hoặc tổng biên tập sẽ xuất bản.</p>
        )}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {ok ? <p className="form-ok">{ok}</p> : null}
      <div className="savebar">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Đang lưu…" : post ? "Lưu bài" : "Đăng bài"}
        </button>
        <div className="desk-actions">
          {post?.published ? (
            <Link className="btn ghost" to="/bai/$slug" params={{ slug: post.slug }}>
              Xem trên báo
            </Link>
          ) : null}
          {post ? (
            <button className="btn ghost" type="button" onClick={onDelete} disabled={busy}>
              {confirming ? "Bấm lần nữa để xóa" : "Xóa bài"}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
