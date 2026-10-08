import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getProductById, updateProductApproval, updateProductVisibility, type ProductRecord } from '../../api/products';
import { StatusBadge } from '../../components/StatusBadge';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<ProductRecord>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = () => getProductById(id).then((response) => setProduct(response.data));
  useEffect(() => {
    if (id) reload().finally(() => setLoading(false));
  }, [id]);
  useAdminDataRefresh(reload);

  const review = async (status: 'approved' | 'rejected') => {
    if (!product) return;
    setBusy(true);
    try {
      await updateProductApproval(product.id, status);
      await reload();
      toast.success(status === 'approved' ? 'Đã duyệt sản phẩm' : 'Đã từ chối sản phẩm');
    } finally {
      setBusy(false);
    }
  };

  const toggleVisibility = async () => {
    if (!product) return;
    setBusy(true);
    try {
      await updateProductVisibility(product.id, product.visible === 'active' ? 'inactive' : 'active');
      await reload();
      toast.success('Đã cập nhật trạng thái hiển thị');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Đang tải sản phẩm...</div>;
  if (!product) return <div className="p-6 text-sm text-slate-500">Không tìm thấy sản phẩm.</div>;

  return <div className="space-y-6">
    <Link to="/products" className="text-sm font-medium text-orange-700">← Danh sách sản phẩm</Link>
    <section className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center"><div><p className="text-xs uppercase tracking-widest text-slate-400">Product {product.id}</p><h1 className="mt-2 text-2xl font-bold">{product.name}</h1></div><div className="flex flex-wrap gap-2">{product.status === 'pending' && <><button type="button" disabled={busy} onClick={() => review('approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Duyệt</button><button type="button" disabled={busy} onClick={() => review('rejected')} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 disabled:opacity-50">Từ chối</button></>}{product.status === 'approved' && <button type="button" disabled={busy} onClick={toggleVisibility} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{product.visible === 'active' ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}</button>}</div></section>
    <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5">{product.thumbnail && <img src={product.thumbnail} alt={product.name} className="max-h-96 w-full rounded-lg object-contain" />}<h2 className="mt-5 font-semibold">Mô tả</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{product.description || 'Chưa có mô tả.'}</p><div className="mt-5"><h2 className="font-semibold">File nội dung</h2><a className="mt-2 block break-all text-sm text-orange-700" href={product.fileUrl} target="_blank" rel="noreferrer">{product.fileUrl || 'Chưa có file'}</a></div></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Chi tiết sản phẩm</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-slate-500">Seller</dt><dd className="mt-1">{product.sellerName ?? product.sellerId ?? '—'}</dd></div><div><dt className="text-slate-500">Danh mục</dt><dd className="mt-1">{product.categoryName ?? '—'}</dd></div><div><dt className="text-slate-500">Giá</dt><dd className="mt-1 font-medium">{Number(product.price).toLocaleString('vi-VN')}đ</dd></div><div><dt className="text-slate-500">Loại</dt><dd className="mt-1">{product.type ?? '—'}</dd></div><div className="flex items-center justify-between"><dt className="text-slate-500">Duyệt</dt><StatusBadge label={product.status} tone={product.status === 'approved' ? 'success' : product.status === 'pending' ? 'warning' : 'danger'} /></div><div className="flex items-center justify-between"><dt className="text-slate-500">Hiển thị</dt><StatusBadge label={product.visible} tone={product.visible === 'active' ? 'info' : 'neutral'} /></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="mt-1">{product.createdAt ?? '—'}</dd></div></dl></div>
    </section>
  </div>;
}
