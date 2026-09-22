import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardSummary } from '../api/dashboard';
import { getDashboardSummary } from '../api/dashboard';
import { StatusBadge } from '../components/StatusBadge';

import { useEffect, useState } from 'react';

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then((response) => setSummary(response.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Số user mới', value: summary?.newUsers ?? 0, tone: 'info' },
    { label: 'Số user bị khóa', value: summary?.lockedUsers ?? 0, tone: 'danger' },
    { label: 'Sản phẩm chờ duyệt', value: summary?.pendingProducts ?? 0, tone: 'warning' },
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

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Doanh thu theo tháng</h2>
              <p className="text-sm text-slate-500">Theo dõi doanh thu và xu hướng tăng trưởng</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[]}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Người dùng đang bị report</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 rounded bg-slate-200" />
                <div className="h-12 rounded bg-slate-200" />
              </div>
            ) : <div className="text-sm text-slate-500">Chưa có dữ liệu người dùng bị report.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
