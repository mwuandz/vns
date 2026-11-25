import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  addSection,
  loadChrome,
  saveAds,
  saveSections,
  saveSettings,
  type AdSlot,
  type ChromeData,
  type SectionItem,
  type SiteSettings,
} from "@/lib/customize.functions";
import { loadMyRole } from "@/lib/staff.functions";
import type { DeskRole } from "@/lib/roles";

export const Route = createFileRoute("/quan-tri/tuy-chinh")({
  loader: () => loadChrome(),
  head: () => ({ meta: [{ title: "Tùy chỉnh — Vietnam Sports Daily" }] }),
  component: TunePage,
});

function TunePage() {
  const initial = Route.useLoaderData();
  const router = useRouter();
  const fetchRole = useServerFn(loadMyRole);
  const [chrome, setChrome] = useState<ChromeData>(initial);
  const [role, setRole] = useState<DeskRole | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchRole()
      .then((result) => {
        if (live) setRole(result.role);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được quyền");
      });
    return () => {
      live = false;
    };
  }, [fetchRole]);

  async function refresh() {
    await router.invalidate();
  }

  return (
    <>
      <div className="desk-head">
        <div>
          <Link className="more" to="/quan-tri">
            ← Danh sách
          </Link>
          <h1>Tùy chỉnh tờ báo</h1>
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {role === null && !error ? <p className="note">Đang mở…</p> : null}
      {role && role !== "admin" ? (
        <p className="note">Chỉ admin được tùy chỉnh giao diện, chuyên mục và quảng cáo.</p>
      ) : null}
      {role === "admin" ? (
        <>
          <SettingsForm initial={chrome.settings} onSaved={refresh} />
          <SectionsForm sections={chrome.sections} onChange={(next) => setChrome(next)} />
          <AdsForm initial={chrome.ads} onSaved={refresh} />
        </>
      ) : null}
    </>
  );
}

function SettingsForm({ initial, onSaved }: { initial: SiteSettings; onSaved: () => Promise<void> }) {
  const save = useServerFn(saveSettings);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => setForm(initial), [initial]);

  function patch(next: Partial<SiteSettings>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await save({ data: form });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được giao diện");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="editor tune-block" onSubmit={onSubmit}>
      <h2>Giao diện</h2>
      <label>
        Tên tờ báo
        <input value={form.siteName} onChange={(event) => patch({ siteName: event.target.value })} />
      </label>
      <div className="split">
        <label>
          Dòng phụ trên đầu
          <input value={form.deskLine} onChange={(event) => patch({ deskLine: event.target.value })} />
        </label>
        <label>
          Khẩu hiệu
          <input value={form.tagline} onChange={(event) => patch({ tagline: event.target.value })} />
        </label>
      </div>
      <div className="split">
        <label>
          Dòng trái masthead
          <input value={form.editionLeft} onChange={(event) => patch({ editionLeft: event.target.value })} />
        </label>
        <label>
          Dòng phải masthead
          <input value={form.editionRight} onChange={(event) => patch({ editionRight: event.target.value })} />
        </label>
      </div>
      <label>
        Logo (link ảnh https, để trống để dùng logo mặc định)
        <input
          value={form.logoUrl}
          placeholder="https://"
          onChange={(event) => patch({ logoUrl: event.target.value })}
        />
      </label>
      {form.logoUrl ? (
        <div className="ad-preview">
          <img src={form.logoUrl} alt="" />
        </div>
      ) : null}
      <label>
        Màu nhấn
        <span className="swatch">
          <input type="color" value={form.accent} onChange={(event) => patch({ accent: event.target.value })} />
          <input value={form.accent} onChange={(event) => patch({ accent: event.target.value })} />
        </span>
      </label>
      <label>
        Chữ chân trang
        <textarea className="sapo" value={form.footerText} onChange={(event) => patch({ footerText: event.target.value })} />
      </label>
      <label>
        Facebook
        <input value={form.facebookUrl} placeholder="https://facebook.com/..." onChange={(event) => patch({ facebookUrl: event.target.value })} />
      </label>
      <label>
        YouTube
        <input value={form.youtubeUrl} placeholder="https://youtube.com/..." onChange={(event) => patch({ youtubeUrl: event.target.value })} />
      </label>
      <label>
        TikTok
        <input value={form.tiktokUrl} placeholder="https://tiktok.com/@..." onChange={(event) => patch({ tiktokUrl: event.target.value })} />
      </label>
      <div className="checks">
        <label>
          <input
            type="checkbox"
            checked={form.showBreaking}
            onChange={(event) => patch({ showBreaking: event.target.checked })}
          />
          Hiện thanh tin nóng
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu giao diện"}
      </button>
    </form>
  );
}

function SectionsForm({
  sections,
  onChange,
}: {
  sections: SectionItem[];
  onChange: (next: ChromeData) => void;
}) {
  const save = useServerFn(saveSections);
  const create = useServerFn(addSection);
  const [rows, setRows] = useState(sections);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => setRows(sections), [sections]);

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const copy = [...rows];
    const current = copy[index];
    const other = copy[next];
    if (!current || !other) return;
    copy[index] = other;
    copy[next] = current;
    setRows(copy);
  }

  function patch(index: number, next: Partial<SectionItem>) {
    setRows((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const saved = await save({
        data: rows.map(({ slug, label, showNav, showFooter }) => ({ slug, label, showNav, showFooter })),
      });
      onChange(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được đề mục");
    } finally {
      setPending(false);
    }
  }

  async function onAdd() {
    setPending(true);
    setError("");
    try {
      const saved = await create({ data: name });
      setName("");
      onChange(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thêm được đề mục");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="editor tune-block" onSubmit={onSubmit}>
      <h2>Đề mục</h2>
      <p className="note">Đổi tên, đưa lên menu, đưa xuống chân trang, hoặc thêm mục mới. Kéo thứ tự bằng nút lên/xuống.</p>
      <div className="tune-list">
        {rows.map((item, index) => (
          <div key={item.slug} className="section-row">
            <label>
              Tên
              <input value={item.label} onChange={(event) => patch(index, { label: event.target.value })} />
            </label>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={item.showNav}
                  onChange={(event) => patch(index, { showNav: event.target.checked })}
                />
                Trên menu
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.showFooter}
                  onChange={(event) => patch(index, { showFooter: event.target.checked })}
                />
                Chân trang
              </label>
            </div>
            <div className="desk-actions">
              <button className="btn ghost" type="button" onClick={() => move(index, -1)} disabled={index === 0}>
                Lên
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
              >
                Xuống
              </button>
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu đề mục"}
      </button>
      <div className="add-section">
        <label>
          Thêm đề mục
          <input value={name} placeholder="Ví dụ: Cầu lông" onChange={(event) => setName(event.target.value)} />
        </label>
        <button className="btn ghost" type="button" disabled={pending || name.trim().length < 2} onClick={onAdd}>
          Thêm
        </button>
      </div>
    </form>
  );
}

function AdsForm({
  initial,
  onSaved,
}: {
  initial: ChromeData["ads"];
  onSaved: () => Promise<void>;
}) {
  const save = useServerFn(saveAds);
  const [ads, setAds] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => setAds(initial), [initial]);

  function patch(slot: keyof ChromeData["ads"], next: Partial<AdSlot>) {
    setAds((current) => ({ ...current, [slot]: { ...current[slot], ...next } }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await save({ data: ads });
      await onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được quảng cáo");
    } finally {
      setPending(false);
    }
  }

  const slots: { key: keyof ChromeData["ads"]; title: string; hint: string }[] = [
    { key: "mast", title: "Đầu trang", hint: "Hiện trên mọi trang, ngay dưới thanh chuyên mục." },
    { key: "article", title: "Giữa bài", hint: "Hiện sau ảnh bìa của từng bài." },
    { key: "after", title: "Cuối bài", hint: "Hiện sau phần thân bài." },
    { key: "footer", title: "Cuối trang", hint: "Hiện phía trên chân trang." },
  ];

  return (
    <form className="editor tune-block" onSubmit={onSubmit}>
      <h2>Vị trí quảng cáo</h2>
      {slots.map((slot) => {
        const ad = ads[slot.key];
        return (
          <fieldset key={slot.key} className="ad-field">
            <legend>{slot.title}</legend>
            <p className="note">{slot.hint}</p>
            <label>
              Link ảnh
              <input
                value={ad.imageUrl}
                placeholder="https://"
                onChange={(event) => patch(slot.key, { imageUrl: event.target.value })}
              />
            </label>
            <label>
              Link khi bấm
              <input
                value={ad.href}
                placeholder="https://"
                onChange={(event) => patch(slot.key, { href: event.target.value })}
              />
            </label>
            <label>
              Tên nhà quảng cáo
              <input value={ad.label} onChange={(event) => patch(slot.key, { label: event.target.value })} />
            </label>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={ad.enabled}
                  onChange={(event) => patch(slot.key, { enabled: event.target.checked })}
                />
                Đang hiện
              </label>
            </div>
          </fieldset>
        );
      })}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu quảng cáo"}
      </button>
    </form>
  );
}
