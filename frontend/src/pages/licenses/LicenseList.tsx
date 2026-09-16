import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import type { LicenseStatus } from '../../api/licenses';

interface LicenseRow {
  id: number;
  customerName: string;
  productName: string;
  orderId: number;
  issuedAt: string;
  status: LicenseStatus;
}

const initialLicenses: LicenseRow[] = [
  { id: 7001, customerName: 'Nguyễn Minh Anh', productName: 'Ebook UX Mastery', orderId: 1001, issuedAt: '2026-09-15 10:26', status: 'active' },
  { id: 7002, customerName: 'Đỗ An Nhiên', productName: 'SQL Advanced Guide', orderId: 1005, issuedAt: '2026-09-13 08:37', status: 'active' },
  { id: 7003, customerName: 'Lê Linh Đan', productName: 'Design System Kit', orderId: 1003, issuedAt: '2026-09-14 16:49', status: 'revoked' },
  { id: 7004, customerName: 'Phạm Cường', productName: 'Motion Pack 2026', orderId: 1004, issuedAt: '2026-09-14 14:03', status: 'active' },
];

export function LicenseListPage() {
  const [licenses, setLicenses] = useState(initialLicenses);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | LicenseStatus>('all');
  const [page, setPage] = useState(1);
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return licenses.filter((license) => {
      const matchesQuery = !normalized || `${license.id} ${license.customerName} ${license.productName} ${license.orderId}`.toLowerCase().includes(normalized);
      return matchesQuery && (status === 'all' || license.status === status);
    });
  }, [licenses, query, status]);

  const revokeLicense = () => {
    if (revokeId === null) return;
    setLicenses((items) => items.map((license) => license.id === revokeId ? { ...license, status: 'revoked' } : license));
    toast.success('Đã thu hồi license');
    setRevokeId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Licenses</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý license</h1>
      </div>
      <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo license, khách hàng, sản phẩm..." />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {(['all', 'active', 'revoked'] as const).map((option) => (
          <button key={option} type="button" onClick={() => { setStatus(option); setPage(1); }} className={`rounded-xl px-3 py-2 text-sm font-medium ${status === option ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {option === 'all' ? 'Tất cả' : option === 'active' ? 'Active' : 'Revoked'}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'id', header: 'License', render: (row) => <span className="font-semibold text-slate-800">#{row.id}</span> },
          { key: 'customerName', header: 'Khách hàng' },
          { key: 'productName', header: 'Sản phẩm' },
          { key: 'orderId', header: 'Đơn hàng', render: (row) => <span className="text-orange-600">#{row.orderId}</span> },
          { key: 'issuedAt', header: 'Ngày cấp' },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'active' ? 'Active' : 'Revoked'} tone={row.status === 'active' ? 'success' : 'danger'} /> },
          { key: 'actions', header: 'Thao tác', render: (row) => row.status === 'active' ? <button type="button" onClick={() => setRevokeId(row.id)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Thu hồi</button> : <span className="text-xs text-slate-400">Đã thu hồi</span> },
        ]}
        data={filtered.slice((page - 1) * pageSize, page * pageSize)}
      />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      <ConfirmDialog open={revokeId !== null} title="Xác nhận thu hồi license" description="License sẽ không còn được sử dụng sau thao tác này. Bạn có chắc chắn muốn tiếp tục?" confirmLabel="Thu hồi" onConfirm={revokeLicense} onCancel={() => setRevokeId(null)} />
    </div>
  );
}
