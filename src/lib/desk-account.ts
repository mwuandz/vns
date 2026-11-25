export const ACCOUNT_DOMAIN = "desk.vietnamsportsdaily.vn";

export function deskAccount(raw: string) {
  const text = raw.trim().toLowerCase();
  if (!text) throw new Error("Nhập tài khoản");
  if (text.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new Error("Tài khoản không hợp lệ");
    return { email: text, name: text.split("@")[0] || text };
  }
  if (!/^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(text)) {
    throw new Error("Tài khoản 3–32 ký tự: chữ không dấu, số, dấu chấm hoặc gạch");
  }
  return { email: `${text}@${ACCOUNT_DOMAIN}`, name: text };
}
