import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { JournalRow, SiteChrome, useSectionLabel } from "@/components/chrome";
import { formatWhen } from "@/lib/magazine";
import { loadHome } from "@/lib/posts.functions";

export const Route = createFileRoute("/")({
  loader: () => loadHome(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const { chrome } = useRouteContext({ from: "__root__" });
  const label = useSectionLabel();
  const { hero, sides, latest, breaking } = data;
  const rest = [...sides, ...latest];

  return (
    <SiteChrome breaking={breaking}>
      <p className="about">{chrome.settings.footerText}</p>
      {hero ? (
        <Link to="/bai/$slug" params={{ slug: hero.slug }} className="lead">
          {hero.cover ? <img src={hero.cover} alt="" /> : null}
          <div className="lead-copy">
            <div className="category">{hero.kicker || label(hero.category)}</div>
            <h1>{hero.title}</h1>
            <p>{hero.excerpt}</p>
            <div className="meta">
              {hero.author} · {formatWhen(hero.publishedAt)} · {hero.minutes} phút đọc
            </div>
          </div>
        </Link>
      ) : (
        <div className="empty">
          <h2>Chưa có bài nào</h2>
          <p>Bài đầu tiên sẽ hiện ở đây.</p>
        </div>
      )}
      {rest.length ? (
        <section className="section">
          <div className="entries">
            {rest.map((post) => (
              <JournalRow key={post.id} post={post} />
            ))}
          </div>
          <p className="more-link">
            <Link to="/tin">Xem tất cả bài</Link>
          </p>
        </section>
      ) : null}
    </SiteChrome>
  );
}