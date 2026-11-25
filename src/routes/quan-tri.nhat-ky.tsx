import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loadLog } from "@/lib/posts.functions";
import { formatWhen } from "@/lib/magazine";

export const Route = createFileRoute("/quan-tri/nhat-ky")({
  head: () => ({ meta: [{ title: "Nhật ký — Vietnam Sports Daily" }] }),
  component: LogPage,
});

function LogPage() {
  const fetchLog = useServerFn(loadLog);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchLog>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchLog()
      .then((rows) => {
        if (live) setData(rows);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được nhật ký");
      });
    return () => {
      live = false;
    };
  }, [fetchLog]);

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">← Danh sách</Link>
          <h1>Nhật ký</h1>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!data && !error ? <p className="note">Đang mở…</p> : null}
      <div className="desk-list">
        {data?.entries.map((entry, index) => (
          <article key={`${entry.at}-${index}`} className="desk-item">
            <div>
              <div className="category">{entry.actor} · {entry.action}</div>
              <h2>{entry.detail || entry.action}</h2>
              <p className="note">{formatWhen(entry.at)}</p>
            </div>
          </article>
        ))}
      </div>
      {data && !data.entries.length ? <p className="note">Chưa có hoạt động.</p> : null}
    </>
  );
}
