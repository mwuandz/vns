import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteChrome } from "@/components/chrome";
import { articleBlocks, categoryLabel, formatWhen } from "@/lib/magazine";
import { bumpReads, loadArticle } from "@/lib/posts.functions";

export const Route = createFileRoute("/bai/$slug")({
  loader: async ({ params }) => {
    const data = await loadArticle({ data: params.slug });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.post.title} — Vietnam Sports Daily` : "Bài viết",
      },
    ],
  }),
  notFoundComponent: Missing,
  component: Article,
});

function Article() {
  const { post, related, breaking } = Route.useLoaderData();
  const markRead = useServerFn(bumpReads);
  const blocks = articleBlocks(post.body);

  useEffect(() => {
    const key = `vsd-read:${post.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void markRead({ data: post.slug }).catch(() => undefined);
  }, [markRead, post.slug]);

  return (
    <SiteChrome breaking={breaking}>
      <article className="story">
        <div>
          <div className="kicker">{post.kicker || categoryLabel(post.category)}</div>
          <h1>{post.title}</h1>
          <p className="deck">{post.excerpt}</p>
          <div className="byline">
            {post.author} · {formatWhen(post.publishedAt)} · {post.minutes} phút đọc · {post.reads} lượt
          </div>
          {post.cover ? (
            <figure className="story-figure">
              <img src={post.cover} alt="" />
            </figure>
          ) : null}
          <div className="story-body">
            {blocks.map((block, index) =>
              block.type === "quote" ? (
                <blockquote key={index}>{block.text}</blockquote>
              ) : (
                <p key={index}>{block.text}</p>
              ),
            )}
          </div>
        </div>
        <aside className="rail">
          <div className="railbox">
            <h3 className="railhead">Cùng chuyên mục</h3>
            <div className="related">
              {related.length ? (
                related.map((item) => (
                  <Link key={item.id} to="/bai/$slug" params={{ slug: item.slug }}>
                    {item.cover ? <img src={item.cover} alt="" /> : <span className="ph" />}
                    <div>
                      <strong>{item.title}</strong>
                      <span>{categoryLabel(item.category)}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="note">Chưa có bài liền kề trong chuyên mục này.</p>
              )}
            </div>
          </div>
          <Link className="btn" to="/muc/$slug" params={{ slug: post.category }}>
            {categoryLabel(post.category)} ↗
          </Link>
        </aside>
      </article>
    </SiteChrome>
  );
}

function Missing() {
  return (
    <SiteChrome>
      <div className="empty">
        <h2>Bài không còn trên báo</h2>
        <p>Có thể đây là bản nháp, hoặc đường dẫn đã đổi.</p>
        <Link className="btn" to="/tin">
          Về tin mới
        </Link>
      </div>
    </SiteChrome>
  );
}
