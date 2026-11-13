import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { loadFooterBanner, saveFooterBanner, type FooterBanner } from "@/lib/banner.functions";

export const Route = createFileRoute("/quan-tri/banner")({
  loader: () => loadFooterBanner(),
  head: () => ({ meta: [{ title: "Banner cuối trang — Vietnam Sports Daily" }] }),
  component: BannerPage,
});

function BannerPage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(saveFooterBanner);
  const [form, setForm] = useState<FooterBanner>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function patch(next: Partial<FooterBanner>) {
    setSaved(false);
    setForm((current) => ({ ...current, ...next }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);
    try {
      const stored = await save({ data: form });
      setForm(stored);
      setSaved(true);
      await router.invalidate();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được banner");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">
            ← Danh sách
          </Link>
          <h1>Banner cuối trang</h1>
        </div>
      </div>
      <form className="editor" onSubmit={onSubmit}>
        <p className="note">
          Ảnh hiện phía trên chân trang, trên mọi trang báo. Dán link ảnh và link đích. Để trống rồi tắt nếu chưa có
          quảng cáo.
        </p>
        <label>
          Link ảnh
          <input
            value={form.imageUrl}
            placeholder="https://"
            onChange={(event) => patch({ imageUrl: event.target.value })}
          />
        </label>
        <label>
          Link khi bấm
          <input
            value={form.href}
            placeholder="https://"
            onChange={(event) => patch({ href: event.target.value })}
          />
        </label>
        <label>
          Tên nhà quảng cáo
          <input
            value={form.label}
            maxLength={80}
            placeholder="Ví dụ: Nhà tài trợ vòng đấu"
            onChange={(event) => patch({ label: event.target.value })}
          />
        </label>
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => patch({ enabled: event.target.checked })}
            />
            Đang hiện trên báo
          </label>
        </div>
        {form.imageUrl ? (
          <div className="ad-preview">
            <span className="ad-kicker">Xem trước</span>
            <img src={form.imageUrl} alt="" />
          </div>
        ) : null}
        {error ? <p className="form-error">{error}</p> : null}
        {saved ? <p className="note">Đã lưu banner.</p> : null}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu banner"}
        </button>
      </form>
    </>
  );
}
