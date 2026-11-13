import { useState, type FormEvent } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIES, COVERS, estimateMinutes, type Post } from "@/lib/magazine";
import { createPost, deletePost, updatePost } from "@/lib/posts.functions";

const EMPTY = {
  title: "",
  excerpt: "",
  body: "",
  category: "goc-nhin",
  cover: COVERS[0]?.url ?? "",
  kicker: "",
  author: "Lê Phan",
  featured: false,
  published: false,
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
          minutes: post.minutes,
        }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
            {CATEGORIES.map((item) => (
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
        <textarea
          name="body"
          value={form.body}
          onChange={(event) => set("body", event.target.value)}
          placeholder={"Mỗi đoạn cách một dòng trống.\n\n> Dòng bắt đầu bằng > sẽ thành trích dẫn."}
        />
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
        Hoặc dán link ảnh https
        <input
          value={form.cover}
          onChange={(event) => set("cover", event.target.value)}
          placeholder="https://"
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
      <div className="checks">
        <label>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => set("featured", event.target.checked)}
          />
          Đưa lên trang nhất
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) => set("published", event.target.checked)}
          />
          Công khai
        </label>
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
