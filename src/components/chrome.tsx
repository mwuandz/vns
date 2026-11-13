import type { ReactNode } from "react";
import { Link, useRouteContext, useRouterState } from "@tanstack/react-router";
import { editionLine, categoryLabel, type Post } from "@/lib/magazine";

const NAV = [
  { to: "/", label: "Trang chủ", exact: true },
  { to: "/muc/$slug", params: { slug: "bong-da" }, label: "Bóng đá" },
  { to: "/muc/$slug", params: { slug: "v-league" }, label: "V-League" },
  { to: "/muc/$slug", params: { slug: "doi-tuyen" }, label: "Đội tuyển" },
  { to: "/muc/$slug", params: { slug: "mma" }, label: "MMA" },
  { to: "/muc/$slug", params: { slug: "quoc-te" }, label: "Quốc tế" },
  { to: "/muc/$slug", params: { slug: "chuyen-nhuong" }, label: "Chuyển nhượng" },
  { to: "/muc/$slug", params: { slug: "the-thao" }, label: "Các môn khác" },
  { to: "/muc/$slug", params: { slug: "goc-nhin" }, label: "Góc nhìn" },
] as const;

export function SiteChrome({
  breaking,
  children,
}: {
  breaking?: { title: string; slug: string } | null;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { footerBanner } = useRouteContext({ from: "__root__" });
  const showAd = Boolean(footerBanner?.enabled && footerBanner.imageUrl);

  return (
    <>
      <div className="top">
        <div className="wrap">
          <span>
            <strong>Vietnam Sports Daily</strong>
            &nbsp;/&nbsp; The sports desk
          </span>
          <div className="top-right">
            <span className="hide-sm">{editionLine()}</span>
            <Link to="/quan-tri">Bàn biên tập</Link>
          </div>
        </div>
      </div>
      <header className="mast">
        <div className="wrap">
          <Link to="/" className="logo">
            <img src="/brand-logo.jpg" alt="Vietnam Sports Daily" />
          </Link>
          <div className="edition">
            Independent sports coverage
            <b>Bản tin của Lê Phan</b>
            Football · MMA · More
          </div>
        </div>
      </header>
      <nav className="nav">
        <div className="wrap">
          {NAV.map((item) => {
            const href = "params" in item ? `/muc/${item.params.slug}` : item.to;
            const active = "exact" in item ? pathname === "/" : pathname === href;
            return "params" in item ? (
              <Link
                key={item.label}
                to={item.to}
                params={item.params}
                className={active ? "active" : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <Link key={item.label} to={item.to} className={active ? "active" : undefined}>
                {item.label}
              </Link>
            );
          })}
          <Link to="/tin" className={pathname === "/tin" ? "live active" : "live"}>
            <i className="dot" /> Latest news
          </Link>
        </div>
      </nav>
      <div className="breaking">
        <div className="wrap">
          <b>NEWS ALERT</b>
          {breaking ? (
            <Link to="/bai/$slug" params={{ slug: breaking.slug }}>
              {breaking.title}
            </Link>
          ) : (
            <span>Những câu chuyện thể thao đáng đọc hôm nay.</span>
          )}
        </div>
      </div>
      <main className="page wrap">{children}</main>
      {showAd ? (
        <aside className="ad-slot">
          <div className="wrap">
            <span className="ad-kicker">
              Quảng cáo{footerBanner.label ? ` · ${footerBanner.label}` : ""}
            </span>
            {footerBanner.href ? (
              <a href={footerBanner.href} target="_blank" rel="sponsored noopener noreferrer">
                <img src={footerBanner.imageUrl} alt={footerBanner.label || "Quảng cáo"} />
              </a>
            ) : (
              <img src={footerBanner.imageUrl} alt={footerBanner.label || "Quảng cáo"} />
            )}
          </div>
        </aside>
      ) : null}
      <footer className="site">
        <div className="wrap">
          <div className="foot">
            <div>
              <div className="foot-logo">
                VIETNAM <span>SPORTS</span>
                <br />
                DAILY.
              </div>
              <p>
                Tờ tin thể thao của phóng viên Lê Phan. Bóng đá Việt Nam, MMA và những môn đang giữ chân người
                xem — viết chậm hơn tin chạy, rõ hơn một dòng tỷ số.
              </p>
            </div>
            <div>
              <h4>Chuyên mục</h4>
              <Link to="/muc/$slug" params={{ slug: "v-league" }}>
                V-League
              </Link>
              <Link to="/muc/$slug" params={{ slug: "doi-tuyen" }}>
                Đội tuyển Việt Nam
              </Link>
              <Link to="/muc/$slug" params={{ slug: "quoc-te" }}>
                Bóng đá quốc tế
              </Link>
              <Link to="/muc/$slug" params={{ slug: "chuyen-nhuong" }}>
                Chuyển nhượng
              </Link>
              <Link to="/muc/$slug" params={{ slug: "mma" }}>
                MMA & võ thuật
              </Link>
            </div>
            <div>
              <h4>Tòa soạn</h4>
              <Link to="/quan-tri">Bàn biên tập</Link>
              <Link to="/tin">Tin đã đăng</Link>
              <Link to="/muc/$slug" params={{ slug: "goc-nhin" }}>
                Góc nhìn Lê Phan
              </Link>
              <a href="mailto:lephan@vietnamsportsdaily.vn">lephan@vietnamsportsdaily.vn</a>
            </div>
          </div>
          <div className="copy">
            <span>© 2026 Vietnam Sports Daily</span>
            <span>Lê Phan · Independent sports coverage</span>
          </div>
        </div>
      </footer>
    </>
  );
}

export function StoryCard({ post }: { post: Post }) {
  return (
    <Link to="/bai/$slug" params={{ slug: post.slug }} className="card">
      <div className="photo">
        {post.cover ? <img src={post.cover} alt="" /> : null}
      </div>
      <div className="cardbody">
        <div className="category">{categoryLabel(post.category)}</div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="meta">
          {post.author} · {post.minutes} phút đọc
        </div>
      </div>
    </Link>
  );
}

export function SportsBar() {
  const items = [
    { slug: "bong-da", name: "Bóng đá", en: "Football" },
    { slug: "mma", name: "MMA & võ thuật", en: "Combat" },
    { slug: "bong-ro", name: "Bóng rổ", en: "Basketball" },
    { slug: "tennis", name: "Tennis", en: "Tennis" },
    { slug: "the-thao-khac", name: "Thể thao khác", en: "More sports" },
  ];
  return (
    <div className="sportbar">
      {items.map((item) => (
        <Link key={item.slug} to="/muc/$slug" params={{ slug: item.slug }} className="sport">
          <b>{item.name}</b>
          <span>{item.en} ↗</span>
        </Link>
      ))}
    </div>
  );
}
