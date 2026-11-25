import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { JournalRow, SiteChrome, SportsBar, useSectionLabel } from "@/components/chrome";
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
  const { hero, sides, latest, mostRead, breaking } = data;
  const journal = [...sides, ...latest];

  return (
    <SiteChrome breaking={breaking}>
      <header className="journal-intro">
        <div className="category">Nhật ký thể thao</div>
        <h2>{chrome.settings.tagline}</h2>
        <p>{chrome.settings.footerText}</p>
      </header>
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
          <div className="category">Nhật ký</div>
          <h2>Chưa có bài nào</h2>
          <p>Viết entry đầu tiên từ bàn biên tập.</p>
          <Link className="btn" to="/quan-tri/viet">
            Viết bài
          </Link>
        </div>
      )}

      <section className="section">
        <div className="journal-layout">
          <div>
            <div className="section-head">
              <h2>Mới viết</h2>
              <Link className="more" to="/tin">
                Tất cả bài
              </Link>
            </div>
            <div className="entries">
              {journal.length ? (
                journal.map((post) => <JournalRow key={post.id} post={post} />)
              ) : (
                <p className="note">Bài trang nhất đang là entry duy nhất.</p>
              )}
            </div>
          </div>
          <aside className="rail">
            <div className="railbox">
              <h3 className="railhead">Đọc lại</h3>
              {mostRead.map((post, index) => (
                <Link key={post.id} to="/bai/$slug" params={{ slug: post.slug }} className="rank">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <strong>{post.title}</strong>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Trên sân</h2>
          <span className="more">Chọn một môn</span>
        </div>
        <SportsBar />
      </section>
    </SiteChrome>
  );
}