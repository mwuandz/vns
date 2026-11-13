import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { categoryLabel, formatWhen } from "@/lib/magazine";
import { loadDesk } from "@/lib/posts.functions";

export const Route = createFileRoute("/quan-tri/")({
  head: () => ({ meta: [{ title: "Bàn biên tập — Vietnam Sports Daily" }] }),
  component: DeskHome,
});

function DeskHome() {
  const fetchDesk = useServerFn(loadDesk);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchDesk>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchDesk()
      .then((rows) => {
        if (live) setData(rows);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được bàn biên tập");
      });
    return () => {
      live = false;
    };
  }, [fetchDesk]);

  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="note">Đang mở bàn biên tập…</p>;

  return (
    <>
      <div className="stats">
        <div className="stat">
          <b>{data.published}</b>
          <span>Đang lên sóng</span>
        </div>
        <div className="stat">
          <b>{data.drafts}</b>
          <span>Bản nháp</span>
        </div>
        <div className="stat">
          <b>{data.reads}</b>
          <span>Lượt đọc</span>
        </div>
      </div>
      <div className="desk-head">
        <h1>Bài viết</h1>
        <div className="desk-actions">
          <Link className="btn ghost" to="/quan-tri/banner">
            Banner cuối trang
          </Link>
          <Link className="btn" to="/quan-tri/viet">
            Viết bài mới
          </Link>
        </div>
      </div>
      <div className="desk-list">
        {data.posts.map((post) => (
          <article key={post.id} className="desk-item">
            <div>
              <div className="category">{categoryLabel(post.category)}</div>
              <h2>{post.title}</h2>
              <div className="meta">
                <span className={post.published ? "badge" : "badge draft"}>
                  {post.published ? "Công khai" : "Nháp"}
                </span>
                {post.featured ? <span className="badge star">Trang nhất</span> : null}
                <span>
                  {" "}
                  · {formatWhen(post.updatedAt)} · {post.reads} đọc
                </span>
              </div>
            </div>
            <div className="desk-actions">
              <Link className="btn" to="/quan-tri/$id" params={{ id: String(post.id) }}>
                Sửa
              </Link>
              {post.published ? (
                <Link className="btn ghost" to="/bai/$slug" params={{ slug: post.slug }}>
                  Xem
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
