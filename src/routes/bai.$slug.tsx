import { useEffect } from "react";
import { createFileRoute, Link, notFound, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArticleBody } from "@/components/article-body";
import { AdPlacement, SiteChrome, useSectionLabel } from "@/components/chrome";
import { formatWhen } from "@/lib/magazine";
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
        title: loaderData
          ? `${loaderData.post.seoTitle || loaderData.post.title} — Vietnam Sports Daily`
          : "Bài viết",
      },
      {
        name: "description",
        content: loaderData?.post.seoDescription || loaderData?.post.excerpt || "",
      },
    ],
  }),
  notFoundComponent: Missing,
  component: Article,
});

function Article() {
  const { post, related, breaking } = Route.useLoaderData();
  const { chrome } = useRouteContext({ from: "__root__" });
  const label = useSectionLabel();
  const markRead = useServerFn(bumpReads);

  useEffect(() => {
    const key = `vsd-read:${post.slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void markRead({ data: post.slug }).catch(() => undefined);
  }, [markRead, post.slug]);

  return (
    <SiteChrome breaking={breaking}>
      <article className="post">
        <Link className="category" to="/muc/$slug" params={{ slug: post.category }}>
          {post.kicker || label(post.category)}
        </Link>
        <h1>{post.title}</h1>
        <p className="deck">{post.excerpt}</p>
        <div className="byline">
          {post.author} · {formatWhen(post.publishedAt)} · {post.minutes} phút đọc
        </div>
        {post.cover ? (
          <figure className="story-figure">
            <img src={post.cover} alt="" />
          </figure>
        ) : null}
        <AdPlacement ad={chrome.ads.article} plain />
        <ArticleBody body={post.body} />
        <AdPlacement ad={chrome.ads.after} plain />
        {related.length ? (
          <section className="more-posts">
            <h2>Bài khác</h2>
            {related.map((item) => (
              <Link key={item.id} to="/bai/$slug" params={{ slug: item.slug }}>
                <strong>{item.title}</strong>
                <span>{label(item.category)}</span>
              </Link>
            ))}
          </section>
        ) : null}
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
