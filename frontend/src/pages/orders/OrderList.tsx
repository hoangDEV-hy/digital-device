import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getOrders, releaseEligibleEscrow, type OrderRecord, type OrderStatus } from '../../api/orders';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const statusTones: Record<OrderStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

export function OrderListPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    getOrders().then((response) => setOrders(response.data ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const productTitles = order.OrderItems?.map((item) => item.Product?.title ?? '').join(' ') ?? '';
      const matchesQuery = !normalized || `${order.id} ${order.User?.fullName ?? ''} ${order.User?.email ?? ''} ${productTitles} ${order.totalAmount}`.toLowerCase().includes(normalized);
      return matchesQuery && (status === 'all' || order.status === status);
    });
  }, [orders, query, status]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateStatus = (value: 'all' | OrderStatus) => {
    setStatus(value);
    setPage(1);
  };

  const releaseEscrowBatch = async () => {
    setReleasing(true);
    try {
      const response = await releaseEligibleEscrow();
      toast.success(`Đã xử lý ${response.data?.releasedCount ?? 0} đơn đủ điều kiện`);
      const ordersResponse = await getOrders();
      setOrders(ordersResponse.data ?? []);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý đơn hàng</h1>
        </div>
        <button type="button" disabled={releasing} onClick={releaseEscrowBatch} className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-700 disabled:opacity-50">{releasing ? 'Đang xử lý...' : 'Nhả escrow đủ điều kiện'}</button>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={updateQuery}
        placeholder="Tìm theo mã đơn, khách hàng hoặc sản phẩm..."
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {(['all', 'pending', 'paid', 'failed', 'cancelled'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => updateStatus(option)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${status === option ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {option === 'all' ? 'Tất cả' : statusLabels[option]}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'id', header: 'Mã đơn', render: (row) => <span className="font-mono text-xs text-slate-600">{row.id.slice(0, 8)}</span> },
          { key: 'User', header: 'Khách hàng', render: (row) => <div><div className="font-medium text-slate-800">{row.User?.fullName ?? '—'}</div><div className="text-xs text-slate-500">{row.User?.email ?? row.userId}</div></div> },
          { key: 'OrderItems', header: 'Sản phẩm', render: (row) => <div className="max-w-xs truncate">{row.OrderItems?.map((item) => item.Product?.title).filter(Boolean).join(', ') || '—'}</div> },
          { key: 'totalAmount', header: 'Tổng tiền', render: (row) => <span className="font-medium text-slate-700">{Number(row.totalAmount).toLocaleString('vi-VN')}đ</span> },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={statusLabels[row.status]} tone={statusTones[row.status]} /> },
          { key: 'createdAt', header: 'Thời gian' },
          { key: 'actions', header: 'Chi tiết', render: (row) => <Link to={`/orders/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Mở</Link> },
        ]}
        data={paginated}
        rowNumberOffset={(page - 1) * pageSize}
        loading={loading}
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
