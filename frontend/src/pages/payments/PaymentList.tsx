import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getPayments, type PaymentRecord, type PaymentStatus } from '../../api/payments';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

const labels: Record<PaymentStatus, string> = { pending: 'Đang chờ', success: 'Thành công', failed: 'Thất bại' };
const tones: Record<PaymentStatus, 'warning' | 'success' | 'danger'> = { pending: 'warning', success: 'success', failed: 'danger' };

export function PaymentListPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    getPayments().then((response) => setPayments(response.data ?? [])).finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(() => getPayments().then((response) => setPayments(response.data ?? [])));

  const filtered = useMemo(() => payments.filter((payment) => {
    const text = `${payment.id} ${payment.orderId} ${payment.providerTxId ?? ''} ${payment.Order?.User?.fullName ?? ''} ${payment.Order?.User?.email ?? ''}`.toLowerCase();
    return (!query || text.includes(query.trim().toLowerCase())) && (status === 'all' || payment.status === status);
  }), [payments, query, status]);

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý thanh toán</h1></div>
    <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm mã payment, đơn hàng hoặc khách hàng..." />
    <div className="flex flex-wrap gap-2">{(['all', 'pending', 'success', 'failed'] as const).map((item) => <button key={item} type="button" onClick={() => { setStatus(item); setPage(1); }} className={`rounded-lg px-3 py-2 text-sm ${status === item ? 'bg-orange-500 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item === 'all' ? 'Tất cả' : labels[item]}</button>)}</div>
    <DataTable columns={[
      { key: 'id', header: 'Payment ID', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
      { key: 'orderId', header: 'Đơn hàng', render: (row) => <span className="font-mono text-xs">{row.orderId.slice(0, 8)}</span> },
      { key: 'customer', header: 'Khách hàng', render: (row) => <div>{row.Order?.User?.fullName ?? '—'}<div className="text-xs text-slate-500">{row.Order?.User?.email}</div></div> },
      { key: 'amount', header: 'Số tiền', render: (row) => `${Number(row.Order?.totalAmount ?? 0).toLocaleString('vi-VN')}đ` },
      { key: 'method', header: 'Phương thức' },
      { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={labels[row.status]} tone={tones[row.status]} /> },
      { key: 'providerTxId', header: 'Mã giao dịch' },
      { key: 'paidAt', header: 'Đã thanh toán lúc' },
    ]} data={filtered.slice((page - 1) * pageSize, page * pageSize)} loading={loading} rowNumberOffset={(page - 1) * pageSize} />
    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
  </div>;
}
