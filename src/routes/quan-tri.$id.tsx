import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PostForm } from "@/components/post-form";
import type { Post } from "@/lib/magazine";
import { loadEditor } from "@/lib/posts.functions";

export const Route = createFileRoute("/quan-tri/$id")({
  head: () => ({ meta: [{ title: "Sửa bài — Vietnam Sports Daily" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const numeric = Number(id);
  const fetchPost = useServerFn(loadEditor);
  const [post, setPost] = useState<Post | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(numeric) || numeric < 1) {
      setMissing(true);
      return;
    }
    let live = true;
    fetchPost({ data: numeric })
      .then((row) => {
        if (!live) return;
        if (!row) setMissing(true);
        else setPost(row);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được bài");
      });
    return () => {
      live = false;
    };
  }, [fetchPost, numeric]);

  if (missing) {
    return (
      <div className="empty">
        <h2>Không thấy bài</h2>
        <Link to="/quan-tri">Về danh sách</Link>
      </div>
    );
  }
  if (error) return <p className="form-error">{error}</p>;
  if (!post) return <p className="note">Đang mở bài…</p>;

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">
            ← Danh sách
          </Link>
          <h1>Sửa bài</h1>
        </div>
        <span className="more">{post.slug}</span>
      </div>
      <PostForm post={post} />
    </>
  );
}
