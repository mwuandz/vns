import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { SignInGate, UserButton } from "@/lib/auth/gates";
import { DeskAuthForm } from "@/components/desk-auth";

export const Route = createFileRoute("/quan-tri")({
  component: DeskLayout,
});

function DeskLayout() {
  return (
    <div className="desk">
      <header className="desk-bar">
        <div className="wrap">
          <div>
            <b>Bàn biên tập</b>
          </div>
          <div className="desk-actions">
            <UserButton />
            <Link to="/">Xem blog</Link>
          </div>
        </div>
      </header>
      <div className="desk-main wrap">
        <SignInGate fallback={<DeskLock />}>
          <Outlet />
        </SignInGate>
      </div>
    </div>
  );
}

function DeskLock() {
  return (
    <div className="desk-lock">
      <div className="category">Tòa soạn</div>
      <h1>Bàn biên tập đã khóa</h1>
      <p>Nhập tài khoản và mật khẩu của tòa soạn. Không dùng Google hay X.</p>
      <DeskAuthForm />
    </div>
  );
}
