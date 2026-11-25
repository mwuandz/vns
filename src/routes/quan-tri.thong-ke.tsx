import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loadStats } from "@/lib/posts.functions";

export const Route = createFileRoute("/quan-tri/thong-ke")({
  head: () => ({ meta: [{ title: "Thống kê — Vietnam Sports Daily" }] }),
  component: StatsPage,
});

function StatsPage() {
  const fetchStats = useServerFn(loadStats);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchStats>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchStats()
      .then((rows) => {
        if (live) setData(rows);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được thống kê");
      });
    return () => {
      live = false;
    };
  }, [fetchStats]);

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">← Danh sách</Link>
          <h1>Thống kê</h1>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!data && !error ? <p className="note">Đang tính…</p> : null}
      {data ? (
        <>
          <div className="stats">
            <div className="stat"><b>{data.views}</b><span>Lượt xem</span></div>
            <div className="stat"><b>{data.published}</b><span>Bài đã đăng</span></div>
            <div className="stat"><b>{data.featured}</b><span>Bài nổi bật</span></div>
          </div>
          <h2 className="railhead">Đọc nhiều</h2>
          <div className="desk-list">
            {data.top.map((post) => (
              <article key={post.title} className="desk-item">
                <div>
                  <div className="category">{post.author}</div>
                  <h2>{post.title}</h2>
                  <p className="note">{post.reads} lượt {post.featured ? "· Nổi bật" : ""}</p>
                </div>
              </article>
            ))}
          </div>
          <h2 className="railhead">Theo tác giả</h2>
          <div className="desk-list">
            {data.authors.map((item) => (
              <article key={item.author} className="desk-item">
                <div>
                  <h2>{item.author}</h2>
                  <p className="note">{item.posts} bài · {item.reads} lượt xem</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
