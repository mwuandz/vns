import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "");
        if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Không thấy file", { status: 404 });
        const sql = await getSql();
        const rows = await sql<{ mime: string; bytes: Uint8Array }>`select mime, bytes from media where id = ${id} limit 1`;
        const row = rows[0];
        if (!row?.bytes) return new Response("Không thấy file", { status: 404 });
        const raw = row.bytes instanceof Uint8Array ? row.bytes : new Uint8Array(row.bytes);
        const body = Buffer.from(raw);
        const blob = new Blob([body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)]);
        return new Response(blob, {
          headers: {
            "content-type": row.mime || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
