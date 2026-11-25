import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { authClient, authEnabled } from "@/lib/auth/client";
import { loadDeskAccount } from "@/lib/desk-auth.functions";
import { deskAccount } from "@/lib/desk-account";
import { claimFounder } from "@/lib/staff.functions";

const BEARER_KEY = "grok-auth.bearer-token";

function rememberSession(response: Response) {
  const token = response.headers.get("set-auth-token");
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* private mode */
  }
}

function explain(raw: string) {
  if (/invalid email or password/i.test(raw)) return "Sai tài khoản hoặc mật khẩu";
  if (/already exists|already in use/i.test(raw)) return "Tài khoản này đã có";
  if (/password.*(short|least|8)|too short/i.test(raw)) return "Mật khẩu tối thiểu 8 ký tự";
  return raw;
}

export function DeskAuthForm() {
  const fetchAccount = useServerFn(loadDeskAccount);
  const claim = useServerFn(claimFounder);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let live = true;
    fetchAccount()
      .then((result) => {
        if (live) setHasAccount(result.hasAccount);
      })
      .catch(() => {
        if (live) setHasAccount(true);
      });
    return () => {
      live = false;
    };
  }, [fetchAccount]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!authEnabled) {
      setError("Đăng nhập đang tắt.");
      return;
    }
    setPending(true);
    try {
      const account = deskAccount(username);
      if (password.length < 8) throw new Error("Mật khẩu tối thiểu 8 ký tự");
      if (!hasAccount && password !== confirm) throw new Error("Mật khẩu nhập lại chưa khớp");
      const result = hasAccount
        ? await authClient.signIn.email(
            { email: account.email, password, rememberMe: true },
            { onSuccess: (ctx) => rememberSession(ctx.response) },
          )
        : await authClient.signUp.email(
            { email: account.email, password, name: account.name },
            { onSuccess: (ctx) => rememberSession(ctx.response) },
          );
      if (result.error) throw new Error(result.error.message || "Không đăng nhập được");
      try {
        await claim();
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "";
        if (message.includes("khóa")) {
          await authClient.signOut();
          throw new Error("Tài khoản đã bị khóa");
        }
      }
      window.location.assign("/quan-tri");
    } catch (caught) {
      setError(explain(caught instanceof Error ? caught.message : "Không đăng nhập được"));
      setPending(false);
    }
  }

  return (
    <form className="desk-auth" onSubmit={onSubmit}>
      {hasAccount === null ? <p className="note">Đang mở khóa…</p> : null}
      {hasAccount === false ? (
        <p className="note">Lần đầu: đây là tài khoản admin. Biên tập viên do admin cấp sau, không tự đăng ký.</p>
      ) : null}
      <label>
        Tài khoản
        <input
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
      </label>
      <label>
        Mật khẩu
        <input
          name="password"
          type="password"
          autoComplete={hasAccount ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </label>
      {hasAccount === false ? (
        <label>
          Nhập lại mật khẩu
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={8}
          />
        </label>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn" type="submit" disabled={pending || hasAccount === null}>
        {pending ? "Đang vào…" : hasAccount ? "Đăng nhập" : "Tạo tài khoản"}
      </button>
    </form>
  );
}
