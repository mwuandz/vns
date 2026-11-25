import type { CSSProperties, ReactNode } from "react";
import { Link, useRouteContext, useRouterState } from "@tanstack/react-router";
import type { AdSlot } from "@/lib/customize.functions";
import { categoryLabel, formatWhen, type Post } from "@/lib/magazine";

export function useSectionLabel() {
  const { chrome } = useRouteContext({ from: "__root__" });
  return (slug: string) => chrome.sections.find((item) => item.slug === slug)?.label ?? categoryLabel(slug);
}

export function AdPlacement({ ad, plain = false }: { ad?: AdSlot; plain?: boolean }) {
  if (!ad?.enabled || !ad.imageUrl) return null;
  const figure = (
    <>
      <span className="ad-kicker">Quảng cáo{ad.label ? ` · ${ad.label}` : ""}</span>
      {ad.href ? (
        <a href={ad.href} target="_blank" rel="sponsored noopener noreferrer">
          <img src={ad.imageUrl} alt={ad.label || "Quảng cáo"} />
        </a>
      ) : (
        <img src={ad.imageUrl} alt={ad.label || "Quảng cáo"} />
      )}
    </>
  );
  if (plain) return <aside className="ad-slot in-story">{figure}</aside>;
  return (
    <aside className="ad-slot">
      <div className="wrap">{figure}</div>
    </aside>
  );
}

export function SiteChrome({ children }: { breaking?: { title: string; slug: string } | null; children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { chrome } = useRouteContext({ from: "__root__" });
  const { settings, ads } = chrome;
  const nav = chrome.sections.filter((item) => item.showNav);
  const footerSections = chrome.sections.filter((item) => item.showFooter);
  const tone = { ["--color-brand" as string]: settings.accent } as CSSProperties;

  return (
    <div className="blog" style={tone}>
      <header className="blog-head">
        <div className="wrap">
          <Link to="/" className="logo">
            <img src={settings.logoUrl || "/brand-logo.jpg"} alt="" />
          </Link>
          <div className="mast-id">
            <strong>{settings.siteName}</strong>
            <span>{settings.tagline}</span>
          </div>
          <nav className="blog-nav">
            <Link to="/" className={pathname === "/" ? "active" : undefined}>
              Trang chủ
            </Link>
            {nav.map((item) => {
              const href = `/muc/${item.slug}`;
              return (
                <Link
                  key={item.slug}
                  to="/muc/$slug"
                  params={{ slug: item.slug }}
                  className={pathname === href ? "active" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link to="/tin" className={pathname === "/tin" ? "active" : undefined}>
              Tất cả
            </Link>
          </nav>
        </div>
      </header>
      <AdPlacement ad={ads.mast} />
      <main className="page wrap">{children}</main>
      <AdPlacement ad={ads.footer} />
      <footer className="site">
        <div className="wrap blog-foot">
          <div className="foot-name">{settings.siteName}</div>
          <p>{settings.footerText}</p>
          <div className="foot-tags">
            {footerSections.map((item) => (
              <Link key={item.slug} to="/muc/$slug" params={{ slug: item.slug }}>
                {item.label}
              </Link>
            ))}
          </div>
          <SocialLinks
            facebook={settings.facebookUrl}
            youtube={settings.youtubeUrl}
            tiktok={settings.tiktokUrl}
          />
          <div className="copy">
            <span>© 2026 {settings.siteName}</span>
            <Link to="/quan-tri">Viết bài</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SocialLinks({ facebook, youtube, tiktok }: { facebook: string; youtube: string; tiktok: string }) {
  const items = [
    {
      href: facebook,
      label: "Facebook",
      tone: "fb",
      path: "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.25 10.44 22v-7.03H7.9v-2.91h2.54V9.84c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.25 22 17.08 22 12.06z",
    },
    {
      href: youtube,
      label: "YouTube",
      tone: "yt",
      path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5a3 3 0 0 0-2.1 2.1A31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z",
    },
    {
      href: tiktok,
      label: "TikTok",
      tone: "tt",
      path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z",
    },
  ].filter((item) => item.href);
  if (!items.length) return null;
  return (
    <div className="social">
      {items.map((item) => (
        <a key={item.label} className={item.tone} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={item.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}

export function JournalRow({ post }: { post: Post }) {
  const label = useSectionLabel();
  return (
    <Link to="/bai/$slug" params={{ slug: post.slug }} className="entry">
      {post.cover ? <img src={post.cover} alt="" /> : <span className="entry-ph" />}
      <div>
        <div className="category">{post.kicker || label(post.category)}</div>
        <h3>{post.title}</h3>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
        <div className="meta">
          {post.author} · {formatWhen(post.publishedAt)} · {post.minutes} phút đọc
        </div>
      </div>
    </Link>
  );
}

export function StoryCard({ post }: { post: Post }) {
  const label = useSectionLabel();
  return (
    <Link to="/bai/$slug" params={{ slug: post.slug }} className="card">
      <div className="photo">
        {post.cover ? <img src={post.cover} alt="" /> : null}
      </div>
      <div className="cardbody">
        <div className="category">{label(post.category)}</div>
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
