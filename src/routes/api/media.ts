import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

const MAX_BYTES = 4 * 1024 * 1024;

function sniff(bytes: Uint8Array) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length > 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length > 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (bytes.length > 12 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
    return brand === "qt  " ? "video/quicktime" : "video/mp4";
  }
  return "";
}

export const Route = createFileRoute("/api/media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const headers = new Headers(request.headers);
        const token = request.headers.get("authorization");
        if (token) headers.set("Authorization", token);
        const session = await auth.api.getSession({ headers });
        if (!session?.user) {
          return Response.json({ message: "Hãy đăng nhập trước khi tải file." }, { status: 401 });
        }
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          return Response.json({ message: "Chưa chọn file." }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
          return Response.json(
            { message: "File tối đa 4MB. Ảnh sẽ được thu nhỏ. Video dài hãy dán link YouTube." },
            { status: 413 },
          );
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mime = sniff(bytes);
        if (!mime) {
          return Response.json({ message: "Chỉ nhận ảnh JPEG, PNG, WEBP, GIF hoặc video MP4, MOV, WEBM." }, { status: 400 });
        }
        const id = randomBytes(16).toString("hex");
        const sql = await getSql();
        await sql`insert into media (id, mime, bytes) values (${id}, ${mime}, ${Buffer.from(bytes)})`;
        return Response.json({ url: `/media/${id}`, mime });
      },
    },
  },
});
