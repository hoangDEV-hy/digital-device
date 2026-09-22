import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getPayments, type PaymentRecord, type PaymentStatus } from '../../api/payments';

const statusLabels: Record<PaymentStatus, string> = { pending: 'Pending', success: 'Success', failed: 'Failed' };
const statusTones: Record<PaymentStatus, 'warning' | 'success' | 'danger'> = { pending: 'warning', success: 'success', failed: 'danger' };
export function PaymentListPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 4;

  useEffect(() => { getPayments().then((response) => setPayments(response.data ?? [])); }, []);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const text = `${payment.id} ${payment.orderId} ${payment.transactionCode ?? ''}`.toLowerCase();
      return (!normalized || text.includes(normalized)) && (status === 'all' || payment.status === status) && (method === 'all' || payment.method === method);
    });
  }, [payments, query, status, method]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý thanh toán</h1></div>
      <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo mã thanh toán, đơn hàng..." />
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select value={status} onChange={(event) => { setStatus(event.target.value as 'all' | PaymentStatus); setPage(1); }}><option value="all">Tất cả trạng thái</option><option value="pending">Pending</option><option value="success">Success</option><option value="failed">Failed</option></select>
        <select value={method} onChange={(event) => { setMethod(event.target.value); setPage(1); }}><option value="all">Tất cả phương thức</option><option value="MoMo">MoMo</option><option value="VNPay">VNPay</option><option value="Banking">Banking</option></select>
        <span className="text-sm text-slate-500">{filtered.length} giao dịch</span>
      </div>
      <DataTable columns={[
        { key: 'id', header: 'Mã thanh toán', render: (row) => <span className="font-semibold text-slate-800">#{row.id}</span> },
        { key: 'orderId', header: 'Đơn hàng', render: (row) => <Link to={`/orders/${row.orderId}`} className="font-medium text-orange-600">#{row.orderId}</Link> },
        { key: 'method', header: 'Phương thức' },
        { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={statusLabels[row.status]} tone={statusTones[row.status]} /> },
        { key: 'transactionCode', header: 'Mã giao dịch', render: (row) => row.transactionCode ?? '-' },
        { key: 'paidAt', header: 'Thời gian', render: (row) => row.paidAt ?? '-' },
      ]} data={paginated} />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
