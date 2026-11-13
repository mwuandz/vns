import { createFileRoute } from "@tanstack/react-router";
import { DeskAuthForm } from "@/components/desk-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — Vietnam Sports Daily" }] }),
  component: Login,
});

function Login() {
  return (
    <main className="desk">
      <div className="desk-main wrap">
        <div className="desk-lock">
          <div className="category">Vietnam Sports Daily</div>
          <h1>Đăng nhập tòa soạn</h1>
          <p>Dùng tài khoản và mật khẩu. Không đăng nhập bằng Google hay X.</p>
          <DeskAuthForm />
        </div>
      </div>
    </main>
  );
}
