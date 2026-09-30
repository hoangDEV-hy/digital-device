import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { getWithdrawalRequests, reviewWithdrawalRequest, type WithdrawalRequestRecord, type WithdrawalStatus } from '../../api/withdrawals';

const money = (value: number | string) => `${Number(value).toLocaleString('vi-VN')}đ`;
const statusLabel: Record<WithdrawalStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

export function WithdrawalRequestsPage() {
  const [items, setItems] = useState<WithdrawalRequestRecord[]>([]);
  const [filter, setFilter] = useState<WithdrawalStatus | 'all'>('pending');
  const [target, setTarget] = useState<WithdrawalRequestRecord | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const data = await getWithdrawalRequests(filter === 'all' ? undefined : filter);
    setItems(data);
  };

  useEffect(() => {
    setLoading(true);
    reload().catch(() => toast.error('Không tải được yêu cầu rút tiền')).finally(() => setLoading(false));
  }, [filter]);

  const confirmReview = async () => {
    if (!target || !action) return;
    setBusy(true);
    try {
      await reviewWithdrawalRequest(target.id, action, action === 'reject' ? 'Yêu cầu bị từ chối bởi admin' : undefined);
      toast.success(action === 'approve' ? 'Đã duyệt yêu cầu rút tiền' : 'Đã từ chối và hoàn tiền vào ví');
      setTarget(null);
      setAction(null);
      await reload();
    } catch {
      toast.error('Không thể xử lý yêu cầu rút tiền');
    } finally {
      setBusy(false);
    }
  };

  const statusTone = (status: WithdrawalStatus) => status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ví</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Yêu cầu rút tiền</h1>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lọc trạng thái yêu cầu rút tiền">
        {([
          ['pending', 'Chờ duyệt'],
          ['approved', 'Đã duyệt'],
          ['rejected', 'Đã từ chối'],
          ['all', 'Tất cả'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={filter === value} onClick={() => setFilter(value)} className={`rounded border px-3 py-2 text-sm font-medium ${filter === value ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          { key: 'user', header: 'Người yêu cầu', render: (row) => <div><div className="font-semibold text-slate-800">{row.user?.fullName || '—'}</div><div className="text-xs text-slate-500">{row.user?.email || row.user?.id}</div></div> },
          { key: 'amount', header: 'Số tiền', render: (row) => <span className="font-semibold">{money(row.amount)}</span> },
          { key: 'bank', header: 'Tài khoản nhận', render: (row) => <div><div className="font-medium">{row.bankName}</div><div>{row.bankAccount}</div><div className="text-xs text-slate-500">{row.accountHolder}</div></div> },
          { key: 'createdAt', header: 'Ngày gửi', render: (row) => new Date(row.createdAt).toLocaleString('vi-VN') },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={statusLabel[row.status]} tone={statusTone(row.status)} /> },
          { key: 'actions', header: 'Duyệt', render: (row) => row.status === 'pending' ? <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => { setTarget(row); setAction('approve'); }} className="rounded border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">Duyệt</button><button type="button" disabled={busy} onClick={() => { setTarget(row); setAction('reject'); }} className="rounded border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50">Từ chối</button></div> : row.adminNote || '—' },
        ]}
        data={items}
        loading={loading}
        emptyMessage="Không có yêu cầu rút tiền ở trạng thái này"
      />

      <ConfirmDialog
        open={Boolean(target && action)}
        title={action === 'approve' ? 'Duyệt yêu cầu rút tiền?' : 'Từ chối yêu cầu rút tiền?'}
        description={action === 'approve'
          ? `Xác nhận chuyển ${target ? money(target.amount) : ''} đến ${target?.bankName} · ${target?.bankAccount} (${target?.accountHolder}).`
          : `Yêu cầu ${target ? money(target.amount) : ''} sẽ bị từ chối và tiền được hoàn lại vào ví người dùng.`}
        confirmLabel={busy ? 'Đang xử lý...' : action === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối và hoàn tiền'}
        onConfirm={() => void confirmReview()}
        onCancel={() => { if (!busy) { setTarget(null); setAction(null); } }}
      />
    </section>
  );
}