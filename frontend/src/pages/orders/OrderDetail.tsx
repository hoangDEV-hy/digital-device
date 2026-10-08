import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOrderById, processAdminRefund, type OrderRecord, type OrderStatus } from '../../api/orders';
import api from '../../api/client';
import type { ApiResponse } from '../../types/auth';
import { StatusBadge } from '../../components/StatusBadge';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

const statusTone: Record<OrderStatus, 'warning' | 'success' | 'danger' | 'neutral'> = { pending: 'warning', paid: 'success', failed: 'danger', cancelled: 'neutral' };

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<OrderRecord>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');

  const reload = () => getOrderById(id).then((response) => setOrder(response.data));
  useEffect(() => {
    if (id) reload().finally(() => setLoading(false));
  }, [id]);
  useAdminDataRefresh(reload);

  const releaseEscrow = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const response = await api.post<ApiResponse<{ totalReleased: number }>>('/wallets/escrow/release', { orderId: order.id });
      if (!response.data.success) throw new Error(response.data.message || 'Không thể nhả escrow');
      await reload();
      toast.success(`Đã chuyển ${Number(response.data.data?.totalReleased ?? 0).toLocaleString('vi-VN')}đ vào ví seller`);
    } finally {
      setBusy(false);
    }
  };

  const submitRefund = async () => {
    if (!order) return;
    const amount = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0 || amount > Number(order.totalAmount))) {
      toast.error('Số tiền hoàn phải lớn hơn 0 và không vượt quá tổng đơn');
      return;
    }
    setBusy(true);
    try {
      await processAdminRefund({ orderId: order.id, refundAmount: amount, reason: reason.trim() || undefined });
      await reload();
      setRefundOpen(false);
      toast.success('Đã xử lý hoàn tiền');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Đang tải đơn hàng...</div>;
  if (!order) return <div className="p-6 text-sm text-slate-500">Không tìm thấy đơn hàng.</div>;

  return <div className="space-y-6">
    <Link to="/orders" className="text-sm font-medium text-orange-700">← Danh sách đơn hàng</Link>
    <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-widest text-slate-400">Order {order.id}</p><h1 className="mt-2 text-2xl font-bold">Chi tiết đơn hàng</h1></div><div className="flex items-center gap-2"><StatusBadge label={order.status} tone={statusTone[order.status]} />{order.status === 'paid' && !order.escrowReleased && <><button type="button" disabled={busy} onClick={releaseEscrow} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Nhả escrow</button><button type="button" disabled={busy} onClick={() => setRefundOpen(true)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">Hoàn tiền</button></>}</div></section>
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Sản phẩm trong đơn</h2><div className="mt-3 divide-y">{order.OrderItems?.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{item.Product?.title ?? item.productId}</p><p className="text-slate-500">Số lượng {item.quantity} · {Number(item.price).toLocaleString('vi-VN')}đ/đơn vị</p></div><strong>{(Number(item.price) * item.quantity).toLocaleString('vi-VN')}đ</strong></div>)}</div><div className="mt-4 flex justify-between border-t pt-4 font-semibold"><span>Tổng cộng</span><span>{Number(order.totalAmount).toLocaleString('vi-VN')}đ</span></div></div>
      <div className="space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Khách hàng</h2><p className="mt-3 text-sm">{order.User?.fullName ?? '—'}</p><p className="text-sm text-slate-500">{order.User?.email ?? order.userId}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Thanh toán</h2><dl className="mt-3 space-y-3 text-sm"><div className="flex justify-between gap-2"><dt className="text-slate-500">Phương thức</dt><dd>{order.Payment?.method ?? '—'}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Trạng thái</dt><dd>{order.Payment?.status ?? '—'}</dd></div><div><dt className="text-slate-500">Mã giao dịch</dt><dd className="mt-1 break-all">{order.Payment?.providerTxId ?? '—'}</dd></div><div><dt className="text-slate-500">Đã trả lúc</dt><dd className="mt-1">{order.Payment?.paidAt ?? '—'}</dd></div><div><dt className="text-slate-500">Escrow</dt><dd className="mt-1">{order.escrowReleased ? `Đã nhả ${order.releasedAt ?? ''}` : 'Đang giữ'}</dd></div></dl></div></div>
    </section>
    {refundOpen && <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Hoàn tiền đơn hàng</h2><p className="mt-1 text-sm text-slate-500">Để trống số tiền để hoàn toàn bộ {Number(order.totalAmount).toLocaleString('vi-VN')}đ.</p><label className="mt-4 block text-sm">Số tiền hoàn<input type="number" min="1" max={Number(order.totalAmount)} value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><label className="mt-4 block text-sm">Lý do<input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setRefundOpen(false)} className="rounded-lg border px-3 py-2 text-sm">Hủy</button><button type="button" disabled={busy} onClick={submitRefund} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Xác nhận hoàn</button></div></div></div>}
  </div>;
}
