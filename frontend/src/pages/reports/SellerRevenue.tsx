import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSellerRevenue, type SellerRevenueReport, type SellerRevenueRow } from '../../api/dashboard';
import { DataTable } from '../../components/DataTable';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export function SellerRevenuePage() {
  const [report, setReport] = useState<SellerRevenueReport | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSellerRevenue()
      .then((response) => setReport(response.data ?? null))
      .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Không tải được báo cáo doanh thu seller'))
      .finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(() =>
    getSellerRevenue().then((response) => setReport(response.data ?? null)),
  );

  const sellers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (report?.sellers ?? []).filter((seller) =>
      `${seller.fullName} ${seller.email} ${seller.sellerId}`.toLowerCase().includes(normalized),
    );
  }, [report, query]);

  const summary = report?.summary;
  const cards = [
    { label: 'Số lượng đã bán', value: (summary?.unitsSold ?? 0).toLocaleString('vi-VN') },
    { label: 'Doanh thu gộp', value: formatMoney(summary?.grossRevenue ?? 0) },
    { label: 'Admin nhận (commission 2%)', value: formatMoney(summary?.commissionReceived ?? 0) },
    { label: 'Seller thực nhận', value: formatMoney(summary?.sellerNetRevenue ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Báo cáo</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Doanh thu seller</h1>
        <p className="mt-1 text-sm text-slate-500">Tổng hợp sản phẩm bán thành công, phí nền tảng đã ghi nhận và doanh thu seller.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{loading ? '...' : card.value}</p>
          </section>
        ))}
      </div>

      <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Tìm seller theo tên, email hoặc ID..." />

      <DataTable<SellerRevenueRow>
        columns={[
          { key: 'seller', header: 'Seller', render: (row) => <div><div className="font-medium text-slate-800">{row.fullName}</div><div className="text-xs text-slate-500">{row.email || row.sellerId}</div></div> },
          { key: 'unitsSold', header: 'Sản phẩm đã bán', render: (row) => row.unitsSold.toLocaleString('vi-VN') },
          { key: 'grossRevenue', header: 'Doanh thu gộp', render: (row) => formatMoney(row.grossRevenue) },
          { key: 'commission', header: 'Admin nhận (2%)', render: (row) => formatMoney(row.commission) },
          { key: 'netRevenue', header: 'Seller thực nhận', render: (row) => <span className="font-semibold text-emerald-700">{formatMoney(row.netRevenue)}</span> },
        ]}
        data={sellers}
        loading={loading}
        emptyMessage="Chưa có seller hoặc đơn hàng đã thanh toán."
      />

      <p className="text-xs text-slate-500">Chỉ tính đơn đã thanh toán. Đơn cũ không có giao dịch commission được giữ nguyên doanh thu gộp, không bị tính phí hồi tố.</p>
    </div>
  );
}