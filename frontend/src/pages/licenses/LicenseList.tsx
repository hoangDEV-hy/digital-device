import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getLicenses, revokeLicense, type LicenseRecord } from '../../api/licenses';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

export function LicenseListPage() {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    getLicenses().then((response) => setLicenses(response.data ?? [])).finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(() => getLicenses().then((response) => setLicenses(response.data ?? [])));

  const filtered = useMemo(() => licenses.filter((license) => `${license.id} ${license.orderId} ${license.User?.fullName ?? ''} ${license.User?.email ?? ''} ${license.Product?.title ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())), [licenses, query]);

  const handleRevoke = async () => {
    if (!revokeId) return;
    setBusy(true);
    try {
      await revokeLicense(revokeId);
      setLicenses((items) => items.map((item) => item.id === revokeId ? { ...item, status: 'revoked' } : item));
      toast.success('Đã thu hồi license');
      setRevokeId(null);
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Licenses</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý license</h1></div>
    <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm license, khách hàng hoặc sản phẩm..." />
    <DataTable columns={[
      { key: 'id', header: 'License', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
      { key: 'customer', header: 'Khách hàng', render: (row) => <div>{row.User?.fullName ?? '—'}<div className="text-xs text-slate-500">{row.User?.email}</div></div> },
      { key: 'product', header: 'Sản phẩm', render: (row) => row.Product?.title ?? row.productId },
      { key: 'orderId', header: 'Mã đơn', render: (row) => <span className="font-mono text-xs">{row.orderId.slice(0, 8)}</span> },
      { key: 'issuedAt', header: 'Ngày cấp' },
      { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'active' ? 'Đang hoạt động' : 'Đã thu hồi'} tone={row.status === 'active' ? 'success' : 'neutral'} /> },
      { key: 'actions', header: 'Thao tác', render: (row) => row.status === 'active' ? <button type="button" onClick={() => setRevokeId(row.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700">Thu hồi</button> : '—' },
    ]} data={filtered.slice((page - 1) * pageSize, page * pageSize)} loading={loading} rowNumberOffset={(page - 1) * pageSize} />
    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    <ConfirmDialog open={Boolean(revokeId)} title="Thu hồi license?" description="Người dùng sẽ mất quyền truy cập nội dung đã mua." confirmLabel={busy ? 'Đang xử lý...' : 'Thu hồi'} onConfirm={handleRevoke} onCancel={() => !busy && setRevokeId(null)} />
  </div>;
}
