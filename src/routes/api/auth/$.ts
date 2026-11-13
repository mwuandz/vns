import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

async function credentialAccountExists() {
  const sql = await getSql();
  const rows = await sql<{ ok: number }>`select 1 as ok from "account"
    where "providerId" = 'credential' and "password" is not null
    limit 1`;
  return rows.length > 0;
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (url.pathname.endsWith("/sign-up/email") && (await credentialAccountExists())) {
          return Response.json(
            { message: "Tòa soạn đã có tài khoản. Hãy đăng nhập." },
            { status: 403 },
          );
        }
        return auth.handler(request);
      },
    },
  },
});
