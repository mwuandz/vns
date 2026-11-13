import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { loadFooterBanner } from "@/lib/banner.functions";
import appCss from "../styles.css?url";

const APP_NAME = "Vietnam Sports Daily";

export const Route = createRootRoute({
  beforeLoad: async () => ({
    footerBanner: await loadFooterBanner(),
  }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${APP_NAME} — Lê Phan` },
      {
        name: "description",
        content:
          "Vietnam Sports Daily — tờ thể thao của phóng viên Lê Phan. Bóng đá, V-League, đội tuyển, MMA và các môn khác.",
      },
      { name: "theme-color", content: "#171b22" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
