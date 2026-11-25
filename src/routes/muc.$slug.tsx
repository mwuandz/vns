import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteChrome, JournalRow } from "@/components/chrome";
import { loadSection } from "@/lib/posts.functions";

export const Route = createFileRoute("/muc/$slug")({
  loader: async ({ params }) => {
    const data = await loadSection({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.label} — Vietnam Sports Daily` : "Chuyên mục" }],
  }),
  notFoundComponent: Missing,
  component: SectionPage,
});

function SectionPage() {
  const data = Route.useLoaderData();
  return (
    <SiteChrome breaking={data.breaking}>
      <div className="kicker">Chuyên mục</div>
      <div className="section-head">
        <h2>{data.label}</h2>
        <span className="more">{data.posts.length} bài</span>
      </div>
      {data.posts.length ? (
        <div className="entries">
          {data.posts.map((post) => (
            <JournalRow key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Chuyên mục đang chờ bài</h2>
          <p>Chưa có bài công khai trong {data.label}. Viết từ bàn biên tập khi bản thảo đã đủ.</p>
        </div>
      )}
    </SiteChrome>
  );
}

function Missing() {
  return (
    <SiteChrome>
      <div className="empty">
        <h2>Không có chuyên mục này</h2>
        <p>Mục bạn mở không nằm trong tờ Vietnam Sports Daily.</p>
      </div>
    </SiteChrome>
  );
}
