import { useEffect, useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { createEditor, loadStaff, revokeEditor, setLocked, type StaffMember } from "@/lib/staff.functions";
import { ROLE_LABEL, type DeskRole } from "@/lib/roles";

export const Route = createFileRoute("/quan-tri/thanh-vien")({
  head: () => ({ meta: [{ title: "Tài khoản — Vietnam Sports Daily" }] }),
  component: StaffPage,
});

function StaffPage() {
  const fetchStaff = useServerFn(loadStaff);
  const create = useServerFn(createEditor);
  const revoke = useServerFn(revokeEditor);
  const lock = useServerFn(setLocked);
  const [role, setRole] = useState<DeskRole | null>(null);
  const [grant, setGrant] = useState<Exclude<DeskRole, "admin">>("btv");
  const [me, setMe] = useState("");
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [arm, setArm] = useState("");

  async function refresh() {
    const data = await fetchStaff();
    setRole(data.role);
    setMe(data.me);
    setMembers(data.members);
  }

  useEffect(() => {
    let live = true;
    fetchStaff()
      .then((data) => {
        if (!live) return;
        setRole(data.role);
        setMe(data.me);
        setMembers(data.members);
      })
      .catch((caught: unknown) => {
        if (live) setError(caught instanceof Error ? caught.message : "Không mở được danh sách");
      });
    return () => {
      live = false;
    };
  }, [fetchStaff]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNote("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại chưa khớp");
      return;
    }
    setPending(true);
    try {
      await create({ data: { username, password, role: grant } });
      setUsername("");
      setPassword("");
      setConfirm("");
      setNote("Đã cấp tài khoản. Biên tập viên đăng nhập bằng tên và mật khẩu vừa đặt.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tạo được tài khoản");
    } finally {
      setPending(false);
    }
  }

  async function onLock(member: StaffMember) {
    setPending(true);
    setError("");
    try {
      await lock({ data: { id: member.id, locked: !member.locked } });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không khóa được tài khoản");
    } finally {
      setPending(false);
    }
  }

  async function onRevoke(id: string) {
    if (arm !== id) {
      setArm(id);
      return;
    }
    setPending(true);
    setError("");
    try {
      await revoke({ data: id });
      setArm("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không gỡ được tài khoản");
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
          <h1>Tài khoản</h1>
        </div>
      </div>
      {role === null && !error ? <p className="note">Đang mở danh sách…</p> : null}
      {role !== "admin" && role !== null ? (
        <p className="note">Chỉ admin được cấp, khóa hoặc xóa tài khoản.</p>
      ) : null}
      {role === "admin" ? (
        <>
          <form className="editor tune-block" onSubmit={onCreate}>
            <h2>Cấp tài khoản biên tập viên</h2>
            <p className="note">Họ đăng nhập ở bàn biên tập. Không tự tạo thêm được tài khoản.</p>
            <label>
              Vai trò
              <select value={grant} onChange={(event) => setGrant(event.target.value as typeof grant)}>
                <option value="tong-bt">Tổng biên tập</option>
                <option value="btv">Biên tập viên</option>
                <option value="phong-vien">Phóng viên</option>
              </select>
            </label>
            <label>
              Tài khoản
              <input value={username} autoComplete="off" onChange={(event) => setUsername(event.target.value)} required />
            </label>
            <div className="split">
              <label>
                Mật khẩu
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <label>
                Nhập lại
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </label>
            </div>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Đang cấp…" : "Cấp tài khoản"}
            </button>
          </form>
          <div className="desk-list">
            {members.map((member) => (
              <article key={member.id} className="desk-item">
                <div>
                  <div className="category">
                    {ROLE_LABEL[member.role]}
                    {member.locked ? " · Đã khóa" : ""}
                  </div>
                  <h2>{member.name}</h2>
                </div>
                {member.role !== "admin" && member.id !== me ? (
                  <>
                    <button className="btn ghost" type="button" disabled={pending} onClick={() => onLock(member)}>
                      {member.locked ? "Mở khóa" : "Khóa"}
                    </button>
                    <button className="btn ghost" type="button" disabled={pending} onClick={() => onRevoke(member.id)}>
                      {arm === member.id ? "Bấm lần nữa để gỡ" : "Gỡ"}
                    </button>
                  </>
                ) : null}
              </article>
            ))}
          </div>
        </>
      ) : null}
      {note ? <p className="form-ok">{note}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </>
  );
}
