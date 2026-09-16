import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/users", label: "Người dùng" },
  { to: "/categories", label: "Danh mục" },
  { to: "/products", label: "Sản phẩm" },
  { to: "/orders", label: "Đơn hàng" },
  { to: "/payments", label: "Thanh toán" },
  { to: "/licenses", label: "License" },
  { to: "/reviews", label: "Đánh giá" },
  { to: "/reports", label: "Report vi phạm" },
];

export function Layout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <aside className="w-72 border-r border-slate-200 bg-slate-900 text-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-400 font-bold text-slate-900">
            A
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Admin
            </div>
            <div className="text-lg font-bold text-white">Northstar</div>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-700 text-white shadow-inner"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Workspace / Admin Panel
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {user?.fullName || "Admin"}
                </div>
                <div className="text-[11px] text-slate-500">Administrator</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
