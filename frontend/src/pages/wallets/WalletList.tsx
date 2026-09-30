import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getAdminWallets, resumeSeller, suspendSeller, updateWallet, type WalletRecord, type WalletUpdateType } from '../../api/wallets';

const money = (value: number | string) => `${Number(value).toLocaleString('vi-VN')}đ`;

export function WalletListPage() {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<WalletRecord | null>(null);
  const [type, setType] = useState<WalletUpdateType>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sellerActionTarget, setSellerActionTarget] = useState<WalletRecord | null>(null);

  const reload = async () => {
    const response = await getAdminWallets();
    setWallets(response.data ?? []);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const submitUpdate = async () => {
    if (!target || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      toast.error('Nhập số tiền lớn hơn 0');
      return;
    }
    setBusy(true);
    try {
      await updateWallet({ userId: target.userId, type, amount: Number(amount), note: note.trim() || undefined });
      await reload();
      setTarget(null);
      setAmount('');
      setNote('');
      toast.success('Đã cập nhật số dư ví');
    } finally {
      setBusy(false);
    }
  };

  const changeSellerStatus = async () => {
    if (!sellerActionTarget) return;
    setBusy(true);
    try {
      if (sellerActionTarget.contractStatus === 'suspended') {
        await resumeSeller(sellerActionTarget.userId);
        toast.success('Đã khôi phục quyền seller nếu tiền ký quỹ đủ mức tối thiểu');
      } else {
        await suspendSeller(sellerActionTarget.userId);
        toast.success('Đã tạm ngưng quyền seller và khóa tài khoản');
      }
      await reload();
      setSellerActionTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const filtered = wallets.filter((wallet) => `${wallet.User?.fullName ?? ''} ${wallet.User?.email ?? ''} ${wallet.userId}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Wallets</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Ví và hợp đồng seller</h1></div>
    <SearchFilterBar query={query} onQueryChange={setQuery} placeholder="Tìm theo seller, email hoặc user ID..." />
    <DataTable columns={[
      { key: 'user', header: 'Người dùng', render: (row) => <div><div className="font-medium text-slate-800">{row.User?.fullName ?? '—'}</div><div className="text-xs text-slate-500">{row.User?.email ?? row.userId}</div></div> },
      { key: 'balance', header: 'Khả dụng', render: (row) => money(row.balance) },
      { key: 'escrowBalance', header: 'Escrow', render: (row) => money(row.escrowBalance) },
      { key: 'depositBalance', header: 'Ký quỹ', render: (row) => <div>{money(row.depositBalance)}<div className="text-xs text-slate-500">Tối thiểu {money(row.minimumDeposit)}</div></div> },
      { key: 'contractStatus', header: 'Hợp đồng', render: (row) => <StatusBadge label={row.contractStatus} tone={row.contractStatus === 'registered' ? 'success' : row.contractStatus === 'suspended' ? 'danger' : 'neutral'} /> },
      { key: 'actions', header: 'Thao tác', render: (row) => <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => { setTarget(row); setType('deposit'); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">Điều chỉnh ví</button>{row.contractStatus !== 'inactive' && <button type="button" disabled={busy} onClick={() => setSellerActionTarget(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">{row.contractStatus === 'suspended' ? 'Khôi phục' : 'Tạm ngưng'}</button>}</div> },
    ]} data={filtered} loading={loading} />

    {target && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Điều chỉnh ví</h2><button type="button" onClick={() => setTarget(null)} aria-label="Đóng">×</button></div>
      <p className="mt-1 text-sm text-slate-500">{target.User?.fullName ?? target.userId}</p>
      <label className="mt-5 block text-sm font-medium">Loại giao dịch<select value={type} onChange={(event) => setType(event.target.value as WalletUpdateType)} className="mt-1 w-full rounded-lg border border-slate-300 p-2"><option value="deposit">Cộng số dư</option><option value="escrow_hold">Giữ escrow</option><option value="escrow_release">Nhả escrow</option><option value="penalty">Khấu trừ/Phạt</option></select></label>
      <label className="mt-4 block text-sm font-medium">Số tiền (VND)<input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <label className="mt-4 block text-sm font-medium">Ghi chú<input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2" /></label>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setTarget(null)} className="rounded-lg border px-3 py-2 text-sm">Hủy</button><button type="button" disabled={busy} onClick={submitUpdate} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Xác nhận'}</button></div>
    </div></div>}
    <ConfirmDialog open={Boolean(sellerActionTarget)} title={sellerActionTarget?.contractStatus === 'suspended' ? 'Khôi phục quyền seller?' : 'Tạm ngưng seller?'} description={sellerActionTarget?.contractStatus === 'suspended' ? 'Backend chỉ khôi phục tài khoản khi tiền ký quỹ đạt mức tối thiểu.' : 'Thao tác này sẽ tạm ngưng hợp đồng và khóa tài khoản người dùng.'} confirmLabel={busy ? 'Đang xử lý...' : sellerActionTarget?.contractStatus === 'suspended' ? 'Khôi phục' : 'Tạm ngưng'} onConfirm={changeSellerStatus} onCancel={() => !busy && setSellerActionTarget(null)} />
  </div>;
}
