import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getOrders, type OrderRecord, type OrderStatus } from '../../api/orders';

interface OrderRow {
  id: number;
  customerName: string;
  productName: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
}

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
  const pageSize = 4;

  useEffect(() => { getOrders().then((response) => setOrders(response.data ?? [])); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalized || `${order.id} ${order.customerName ?? ''} ${order.totalAmount}`.toLowerCase().includes(normalized);
      return matchesQuery && (status === 'all' || order.status === status);
    });
  }, [query, status]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateStatus = (value: 'all' | OrderStatus) => {
    setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý đơn hàng</h1>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={updateQuery}
        placeholder="Tìm theo mã đơn, khách hàng, sản phẩm..."
        filterLabel="Bộ lọc trạng thái"
        onFilterClick={() => updateStatus(status === 'all' ? 'pending' : 'all')}
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
          { key: 'customerName', header: 'Khách hàng', render: (row) => <div className="font-medium text-slate-800">{row.customerName ?? '-'}</div> },
          { key: 'totalAmount', header: 'Tổng tiền', render: (row) => <span className="font-medium text-slate-700">{row.totalAmount.toLocaleString('vi-VN')}đ</span> },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={statusLabels[row.status]} tone={statusTones[row.status]} /> },
          { key: 'paymentMethod', header: 'Thanh toán', render: () => '-' },
          { key: 'createdAt', header: 'Thời gian' },
          { key: 'actions', header: 'Thao tác', render: (row) => <Link to={`/orders/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Chi tiết</Link> },
        ]}
        data={paginated}
        rowNumberOffset={(page - 1) * pageSize}
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
