import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loadTrash, purgePost, restorePost } from "@/lib/posts.functions";

export const Route = createFileRoute("/quan-tri/thung-rac")({
  head: () => ({ meta: [{ title: "Thùng rác — Vietnam Sports Daily" }] }),
  component: TrashPage,
});

function TrashPage() {
  const fetchTrash = useServerFn(loadTrash);
  const restore = useServerFn(restorePost);
  const purge = useServerFn(purgePost);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTrash>> | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    setData(await fetchTrash());
  }

  useEffect(() => {
    let live = true;
    fetchTrash()
      .then((rows) => {
        if (live) setData(rows);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được thùng rác");
      });
    return () => {
      live = false;
    };
  }, [fetchTrash]);

  async function run(id: number, kind: "restore" | "purge") {
    setPending(true);
    setError("");
    try {
      if (kind === "restore") await restore({ data: id });
      else await purge({ data: id });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không xử lý được bài");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">← Danh sách</Link>
          <h1>Thùng rác</h1>
        </div>
      </div>
      <p className="note">Bài xóa nhầm còn ở đây. Khôi phục để đưa lại bàn biên tập.</p>
      {error ? <p className="form-error">{error}</p> : null}
      {!data && !error ? <p className="note">Đang mở…</p> : null}
      <div className="desk-list">
        {data?.posts.map((post) => (
          <article key={post.id} className="desk-item">
            <div>
              <h2>{post.title}</h2>
            </div>
            <div className="desk-actions">
              <button className="btn" type="button" disabled={pending} onClick={() => run(post.id, "restore")}>
                Khôi phục
              </button>
              {data.role === "admin" ? (
                <button className="btn ghost" type="button" disabled={pending} onClick={() => run(post.id, "purge")}>
                  Xóa hẳn
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {data && !data.posts.length ? <p className="note">Thùng rác đang trống.</p> : null}
    </>
  );
}
