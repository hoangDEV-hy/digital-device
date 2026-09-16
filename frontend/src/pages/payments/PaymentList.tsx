import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import type { PaymentStatus } from '../../api/payments';

interface PaymentRow {
  id: number;
  orderId: number;
  customerName: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transactionCode: string;
  paidAt: string;
}

const payments: PaymentRow[] = [
  { id: 501, orderId: 1001, customerName: 'Nguyễn Minh Anh', amount: 290000, method: 'MoMo', status: 'success', transactionCode: 'MOMO-20260915-1001', paidAt: '2026-09-15 10:25' },
  { id: 502, orderId: 1002, customerName: 'Trần Hoàng Nam', amount: 690000, method: 'VNPay', status: 'pending', transactionCode: 'VNP-20260915-1002', paidAt: '2026-09-15 09:12' },
  { id: 503, orderId: 1003, customerName: 'Lê Linh Đan', amount: 450000, method: 'Banking', status: 'failed', transactionCode: 'BANK-20260914-1003', paidAt: '2026-09-14 16:48' },
  { id: 504, orderId: 1004, customerName: 'Phạm Cường', amount: 520000, method: 'MoMo', status: 'failed', transactionCode: 'MOMO-20260914-1004', paidAt: '2026-09-14 14:02' },
  { id: 505, orderId: 1005, customerName: 'Đỗ An Nhiên', amount: 180000, method: 'VNPay', status: 'success', transactionCode: 'VNP-20260913-1005', paidAt: '2026-09-13 08:36' },
];

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  success: 'Success',
  failed: 'Failed',
};

const statusTones: Record<PaymentStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  success: 'success',
  failed: 'danger',
};

export function PaymentListPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesQuery = !normalized || `${payment.id} ${payment.orderId} ${payment.customerName} ${payment.transactionCode}`.toLowerCase().includes(normalized);
      const matchesStatus = status === 'all' || payment.status === status;
      const matchesMethod = method === 'all' || payment.method === method;
      return matchesQuery && matchesStatus && matchesMethod;
    });
  }, [query, status, method]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý thanh toán</h1>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={(value) => { setQuery(value); resetPage(); }}
        placeholder="Tìm theo mã thanh toán, đơn hàng, khách hàng..."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={status}
          onChange={(event) => { setStatus(event.target.value as 'all' | PaymentStatus); resetPage(); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={method}
          onChange={(event) => { setMethod(event.target.value); resetPage(); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
        >
          <option value="all">Tất cả phương thức</option>
          <option value="MoMo">MoMo</option>
          <option value="VNPay">VNPay</option>
          <option value="Banking">Banking</option>
        </select>
        <span className="text-sm text-slate-500">{filtered.length} giao dịch</span>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: 'Mã thanh toán', render: (row) => <span className="font-semibold text-slate-800">#{row.id}</span> },
          { key: 'orderId', header: 'Đơn hàng', render: (row) => <Link to={`/orders/${row.orderId}`} className="font-medium text-orange-600 hover:text-orange-700">#{row.orderId}</Link> },
          { key: 'customerName', header: 'Khách hàng' },
          { key: 'amount', header: 'Số tiền', render: (row) => <span className="font-medium text-slate-700">{row.amount.toLocaleString('vi-VN')}đ</span> },
          { key: 'method', header: 'Phương thức' },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={statusLabels[row.status]} tone={statusTones[row.status]} /> },
          { key: 'transactionCode', header: 'Mã giao dịch' },
          { key: 'paidAt', header: 'Thời gian' },
        ]}
        data={paginated}
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
