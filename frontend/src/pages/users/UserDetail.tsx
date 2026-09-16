import { useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';

const user = {
  id: 1,
  fullName: 'Nguyễn Văn A',
  email: 'a@gmail.com',
  phone: '0901111222',
  role: 'customer',
  status: 'active',
  createdAt: '2026-09-14',
  reports: [
    { id: 1, reason: 'Spam nội dung', createdAt: '2026-09-10' },
    { id: 2, reason: 'Gian lận thanh toán', createdAt: '2026-09-12' },
  ],
};

export function UserDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">User #{id}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">{user.fullName}</h1>
          </div>
          <div className="flex gap-3">
            <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cấp quyền đổi IP
            </button>
            <button type="button" className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600">
              {user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin người dùng</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wide text-slate-400">Email</p><p className="mt-1 font-medium text-slate-700">{user.email}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-400">Số điện thoại</p><p className="mt-1 font-medium text-slate-700">{user.phone}</p></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-400">Vai trò</p><div className="mt-1"><StatusBadge label={user.role === 'admin' ? 'Admin' : 'Customer'} tone={user.role === 'admin' ? 'warning' : 'info'} /></div></div>
            <div><p className="text-xs uppercase tracking-wide text-slate-400">Trạng thái</p><div className="mt-1"><StatusBadge label={user.status === 'active' ? 'Active' : 'Locked'} tone={user.status === 'active' ? 'success' : 'danger'} /></div></div>
            <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wide text-slate-400">Ngày tạo</p><p className="mt-1 font-medium text-slate-700">{user.createdAt}</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Lịch sử report</h2>
          <div className="mt-4 space-y-3">
            {user.reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-700">{report.reason}</div>
                <div className="mt-1 text-xs text-slate-500">{report.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
