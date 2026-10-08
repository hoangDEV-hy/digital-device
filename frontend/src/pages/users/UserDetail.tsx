import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getUserById, lockUser, resetDeviceIp, unlockUser, type UserRecord } from '../../api/users';
import { getReports, type ReportRecord } from '../../api/reports';
import { StatusBadge } from '../../components/StatusBadge';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';
import { useAuthStore } from '../../store/authStore';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [user, setUser] = useState<UserRecord>();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [userResponse, reportResponse] = await Promise.all([getUserById(id), getReports()]);
    setUser(userResponse.data);
    setReports((reportResponse.data ?? []).filter((report) => report.reportedUserId === id));
  };

  useEffect(() => {
    if (id) reload().finally(() => setLoading(false));
  }, [id]);
  useAdminDataRefresh(reload);

  const updateStatus = async () => {
    if (!user) return;
    setBusy(true);
    try {
      if (user.status === 'active') await lockUser(user.id);
      else await unlockUser(user.id);
      await reload();
      toast.success(user.status === 'active' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
    } finally {
      setBusy(false);
    }
  };

  const clearDeviceIp = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await resetDeviceIp(user.id);
      setUser({ ...user, deviceIp: null });
      toast.success('Đã đặt lại liên kết IP');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Đang tải người dùng...</div>;
  if (!user) return <div className="p-6 text-sm text-slate-500">Không tìm thấy người dùng.</div>;

  return <div className="space-y-6">
    <Link to="/users" className="text-sm font-medium text-orange-700">← Danh sách người dùng</Link>
    <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
      <div><p className="text-xs uppercase tracking-widest text-slate-400">User {user.id}</p><h1 className="mt-2 text-2xl font-bold">{user.fullName}</h1><p className="mt-1 text-sm text-slate-500">{user.email}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !user.deviceIp} onClick={clearDeviceIp} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Đặt lại IP</button><button type="button" disabled={busy || user.id === currentUserId} onClick={updateStatus} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">{user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}</button></div>
    </section>
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Thông tin tài khoản</h2><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Điện thoại</dt><dd className="mt-1">{user.phone || '—'}</dd></div><div><dt className="text-slate-500">Vai trò</dt><dd className="mt-1">{user.role}</dd></div><div><dt className="text-slate-500">Trạng thái</dt><dd className="mt-1"><StatusBadge label={user.status} tone={user.status === 'active' ? 'success' : 'danger'} /></dd></div><div><dt className="text-slate-500">IP thiết bị</dt><dd className="mt-1">{user.deviceIp || 'Chưa liên kết'}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="mt-1">{user.createdAt || '—'}</dd></div></dl></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Báo cáo về tài khoản ({reports.length})</h2><div className="mt-3 divide-y">{reports.length === 0 ? <p className="py-4 text-sm text-slate-500">Chưa có báo cáo.</p> : reports.map((report) => <div key={report.id} className="py-3 text-sm"><div className="flex justify-between gap-3"><span>{report.reason || 'Không có nội dung'}</span><StatusBadge label={report.status} tone={report.status === 'open' ? 'warning' : 'neutral'} /></div><p className="mt-1 text-xs text-slate-500">Bởi {report.reporter?.fullName ?? report.reporterId} · {report.createdAt}</p></div>)}</div></div>
    </section>
  </div>;
}
