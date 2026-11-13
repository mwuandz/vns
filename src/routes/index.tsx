import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteChrome, SportsBar, StoryCard } from "@/components/chrome";
import { categoryLabel } from "@/lib/magazine";
import { loadHome } from "@/lib/posts.functions";

export const Route = createFileRoute("/")({
  loader: () => loadHome(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const { hero, sides, latest, mostRead, breaking } = data;

  return (
    <SiteChrome breaking={breaking}>
      <div className="kicker">The front page / 01</div>
      {hero ? (
        <section className="hero">
          <Link to="/bai/$slug" params={{ slug: hero.slug }} className="hero-main">
            {hero.cover ? <img className="fill-photo" src={hero.cover} alt="" /> : null}
            <div className="shade" />
            <div className="hero-copy">
              <span className="pill">{hero.kicker || categoryLabel(hero.category)}</span>
              <h1>{hero.title}</h1>
              <p className="deck">{hero.excerpt}</p>
              <div className="byline">
                {hero.author} &nbsp;/&nbsp; {hero.minutes} phút đọc
              </div>
            </div>
          </Link>
          <div className="hero-side">
            {sides.map((post) => (
              <Link key={post.id} to="/bai/$slug" params={{ slug: post.slug }} className="hero-small">
                {post.cover ? <img className="fill-photo" src={post.cover} alt="" /> : null}
                <div className="shade" />
                <div className="smallcopy">
                  <span className="pill">{post.kicker || categoryLabel(post.category)}</span>
                  <h2>{post.title}</h2>
                  <div className="meta">
                    {post.author} · {categoryLabel(post.category)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="empty">
          <div className="category">Tòa soạn</div>
          <h2>Chưa có bài trên trang nhất</h2>
          <p>Lê Phan có thể viết bài đầu tiên từ bàn biên tập.</p>
          <Link className="btn" to="/quan-tri/viet">
            Viết bài
          </Link>
        </div>
      )}

      <section className="section" id="tin-moi">
        <div className="section-head">
          <h2>
            <span>01</span> / Latest stories
          </h2>
          <Link className="more" to="/tin">
            Xem tất cả ↗
          </Link>
        </div>
        <div className="news-layout">
          <div className="cards">
            {latest.length ? (
              latest.map((post) => <StoryCard key={post.id} post={post} />)
            ) : (
              <p className="note">Các bài trang nhất đang chiếm hết mặt báo. Mở mục tin để xem đầy đủ.</p>
            )}
          </div>
          <aside className="rail">
            <div className="railbox">
              <h3 className="railhead">Most read / Đọc nhiều</h3>
              {mostRead.map((post, index) => (
                <Link key={post.id} to="/bai/$slug" params={{ slug: post.slug }} className="rank">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <strong>{post.title}</strong>
                </Link>
              ))}
            </div>
            <div className="mma-feature">
              <div className="eyebrow">VSD Fight desk / 02</div>
              <h3>
                The fight
                <br />
                game.
              </h3>
              <p>MMA và những câu chuyện từ thế giới đối kháng, viết bởi Lê Phan.</p>
              <Link to="/muc/$slug" params={{ slug: "mma" }}>
                Explore combat sports ↗
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>
            <span>02</span> / Explore sports
          </h2>
          <span className="more">One newsroom. Every sport.</span>
        </div>
        <SportsBar />
      </section>

      <section className="newsletter" id="theo-doi">
        <div>
          <h2>Stay in the game.</h2>
          <p>Theo dõi Vietnam Sports Daily để không bỏ những bài Lê Phan vừa lên sóng.</p>
        </div>
        <Link to="/tin">Đọc tin mới ↗</Link>
      </section>
    </SiteChrome>
  );
}
