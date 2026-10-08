import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardSummary, ReportedUserSummary } from '../api/dashboard';
import { getDashboardSummary, getReportedUsers, getRevenue } from '../api/dashboard';
import { StatusBadge } from '../components/StatusBadge';
import { useAdminDataRefresh } from '../hooks/useAdminDataRefresh';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [reportedUsers, setReportedUsers] = useState<ReportedUserSummary[]>([]);
  const [revenueTotal, setRevenueTotal] = useState<number | string>(0);
  const [revenueByMonth, setRevenueByMonth] = useState<Array<{ period: string; total: number }>>([]);
  const [loading, setLoading] = useState(true);

  const refreshDashboard = async () => {
    const [summaryResponse, reportsResponse, totalResponse, monthlyResponse] = await Promise.all([
      getDashboardSummary(),
      getReportedUsers(),
      getRevenue('total'),
      getRevenue('month'),
    ]);
    setSummary(summaryResponse.data);
    setReportedUsers(reportsResponse.data?.items ?? []);
    setRevenueTotal(totalResponse.data?.totalRevenue ?? 0);
    setRevenueByMonth((monthlyResponse.data?.items ?? []).map((item) => ({
      period: item.period,
      total: Number(item.total),
    })).reverse());
  };

  useEffect(() => {
    refreshDashboard()
      .finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(refreshDashboard);

  const cards = [
    { label: 'Số user mới', value: summary?.newUsers ?? 0, tone: 'info' },
    { label: 'Số user bị khóa', value: summary?.lockedUsers ?? 0, tone: 'danger' },
    { label: 'Sản phẩm chờ duyệt', value: summary?.pendingProducts ?? 0, tone: 'warning' },
    { label: 'Tổng doanh thu', value: `${Number(revenueTotal).toLocaleString('vi-VN')}đ`, tone: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Tổng quan hệ thống</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-800">
                  {loading ? '...' : card.value}
                </p>
              </div>
              <StatusBadge label={card.label.slice(0, 6)} tone={card.tone as 'info' | 'danger' | 'warning' | 'neutral'} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h2 className="text-lg font-semibold text-slate-800">Doanh thu theo tháng</h2><p className="mt-1 text-sm text-slate-500">Tổng giá trị các đơn đã thanh toán</p></div>
          <div className="mt-4 h-72 w-full">
            {revenueByMonth.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueByMonth}>
              <defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="period" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
              <Area type="monotone" dataKey="total" stroke="#ea580c" fill="url(#revenueFill)" strokeWidth={2} />
            </AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-500">{loading ? 'Đang tải...' : 'Chưa có dữ liệu doanh thu.'}</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-800">Người dùng bị báo cáo</h2><p className="mt-1 text-sm text-slate-500">Sắp xếp theo số lượng report</p></div><StatusBadge label={`${reportedUsers.length} người`} tone="warning" /></div>
          <div className="mt-4 divide-y divide-slate-100">
            {loading ? <div className="py-6 text-sm text-slate-500">Đang tải dữ liệu...</div> : reportedUsers.length === 0 ? <div className="py-6 text-sm text-slate-500">Chưa có dữ liệu người dùng bị báo cáo.</div> : reportedUsers.map((item) => (
              <Link key={item.reportedUserId} to={`/users/${item.reportedUserId}`} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                <div><p className="font-medium text-slate-800">{item.user?.fullName ?? 'Người dùng không tồn tại'}</p><p className="text-xs text-slate-500">{item.user?.email ?? item.reportedUserId}</p></div>
                <StatusBadge label={`${item.reportsCount} báo cáo`} tone="danger" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
