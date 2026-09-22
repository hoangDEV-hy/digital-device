import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { getOrderById, type OrderRecord, type OrderStatus } from '../../api/orders';

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

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderRecord>();

  useEffect(() => { if (id) getOrderById(id).then((response) => setOrder(response.data)); }, [id]);

  if (!order) return <div className="p-6 text-sm text-slate-500">Không tìm thấy đơn hàng.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <Link to="/orders" className="text-sm font-medium text-orange-600 hover:text-orange-700">← Danh sách đơn hàng</Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order #{id}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Chi tiết đơn hàng</h1>
        </div>
        <StatusBadge label={statusLabels[order.status]} tone={statusTones[order.status]} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Sản phẩm trong đơn</h2>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-800">Đơn hàng #{order.id}</p>
                <p className="mt-1 text-sm text-slate-500">Chi tiết sản phẩm được lưu trong database.</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p>{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                <p className="mt-1 font-semibold text-slate-800">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <div className="text-right"><p className="text-sm text-slate-500">Tổng thanh toán</p><p className="mt-1 text-2xl font-bold text-orange-600">{order.totalAmount.toLocaleString('vi-VN')}đ</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Thông tin thanh toán</h2>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="text-slate-500">Phương thức</p><p className="mt-1 font-medium text-slate-800">Chưa có dữ liệu</p></div>
              <div><p className="text-slate-500">Mã giao dịch</p><p className="mt-1 font-medium text-slate-800">Chưa có dữ liệu</p></div>
              <div><p className="text-slate-500">Thời gian tạo</p><p className="mt-1 font-medium text-slate-800">{order.createdAt}</p></div>
              <div><p className="text-slate-500">Thời gian thanh toán</p><p className="mt-1 font-medium text-slate-800">Chưa có dữ liệu</p></div>
            </div>
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin khách hàng</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div><p className="text-slate-500">Họ tên</p><p className="mt-1 font-medium text-slate-800">{order.customerName}</p></div>
            <div><p className="text-slate-500">Email</p><p className="mt-1 font-medium text-slate-800">Chưa có dữ liệu</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
