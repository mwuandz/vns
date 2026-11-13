import { Link, createFileRoute } from "@tanstack/react-router";
import { PostForm } from "@/components/post-form";

export const Route = createFileRoute("/quan-tri/viet")({
  head: () => ({ meta: [{ title: "Viết bài — Vietnam Sports Daily" }] }),
  component: WritePage,
});

function WritePage() {
  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">
            ← Danh sách
          </Link>
          <h1>Bài mới</h1>
        </div>
      </div>
      <PostForm />
    </>
  );
}
