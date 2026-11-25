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
      <h1 className="page-title">{data.label}</h1>
      <p className="about">{data.posts.length} bài</p>
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
