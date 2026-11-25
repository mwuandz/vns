import { createFileRoute } from "@tanstack/react-router";
import { SiteChrome, JournalRow } from "@/components/chrome";
import { loadArchive } from "@/lib/posts.functions";

export const Route = createFileRoute("/tin")({
  loader: () => loadArchive(),
  head: () => ({ meta: [{ title: "Tin đã đăng — Vietnam Sports Daily" }] }),
  component: Archive,
});

function Archive() {
  const { posts, breaking } = Route.useLoaderData();
  return (
    <SiteChrome breaking={breaking}>
      <div className="kicker">Nhật ký</div>
      <div className="section-head">
        <h2>Các bài đã đăng</h2>
        <span className="more">{posts.length} bài</span>
      </div>
      <div className="entries">
        {posts.map((post) => (
          <JournalRow key={post.id} post={post} />
        ))}
      </div>
    </SiteChrome>
  );
}
