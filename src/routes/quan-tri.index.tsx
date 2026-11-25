import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useSectionLabel } from "@/components/chrome";
import { formatWhen } from "@/lib/magazine";
import { STATUS_LABEL, isChief } from "@/lib/roles";
import { loadDesk } from "@/lib/posts.functions";

export const Route = createFileRoute("/quan-tri/")({
  head: () => ({ meta: [{ title: "Bàn biên tập — Vietnam Sports Daily" }] }),
  component: DeskHome,
});

function DeskHome() {
  const fetchDesk = useServerFn(loadDesk);
  const label = useSectionLabel();
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
        <h1>{isChief(data.role) ? "Bài viết" : data.role === "btv" ? "Bài của tôi và chờ duyệt" : "Bài của tôi"}</h1>
        <div className="desk-actions">
          {data.role === "admin" ? (
            <>
              <Link className="btn ghost" to="/quan-tri/thanh-vien">
                Tài khoản
              </Link>
              <Link className="btn ghost" to="/quan-tri/tuy-chinh">
                Tùy chỉnh
              </Link>
            </>
          ) : null}
          <Link className="btn ghost" to="/quan-tri/thong-ke">
            Thống kê
          </Link>
          <Link className="btn ghost" to="/quan-tri/thung-rac">
            Thùng rác
          </Link>
          {isChief(data.role) ? (
            <Link className="btn ghost" to="/quan-tri/nhat-ky">
              Nhật ký
            </Link>
          ) : null}
          <Link className="btn" to="/quan-tri/viet">
            Viết bài mới
          </Link>
        </div>
      </div>
      {data.posts.length ? (
      <div className="desk-list">
        {data.posts.map((post) => (
          <article key={post.id} className="desk-item">
            <div>
              <div className="category">{label(post.category)}</div>
              <h2>{post.title}</h2>
              {data.role === "admin" && post.ownerName ? <p className="note">{post.ownerName}</p> : null}
              <div className="meta">
                <span className={post.status === "published" ? "badge" : "badge draft"}>
                  {STATUS_LABEL[post.status] ?? "Nháp"}
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
      ) : (
        <p className="note">Chưa có bài nào của bạn.</p>
      )}
    </>
  );
}
