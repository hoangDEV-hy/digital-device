import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { getProductById, type ProductRecord } from '../../api/products';

export function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductRecord>();

  useEffect(() => { if (id) getProductById(id).then((response) => setProduct(response.data)); }, [id]);

  if (!product) return <div className="p-6 text-sm text-slate-500">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Product #{id}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">{product.name}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100">Duyệt</button>
            <button type="button" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">Từ chối</button>
            <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Ẩn / Hiện</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {product.thumbnail && <img src={product.thumbnail} alt={product.name} className="h-64 w-full rounded-2xl object-cover" />}
          <div className="mt-5">
            <h2 className="text-lg font-semibold text-slate-800">Mô tả</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">Thông tin sản phẩm</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3"><span>Danh mục</span><span className="font-medium text-slate-800">{product.categoryName ?? '-'}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Seller</span><span className="font-medium text-slate-800">{product.sellerName ?? '-'}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Loại</span><span className="font-medium text-slate-800">{product.type}</span></div>
              <div className="flex items-center justify-between gap-3"><span>Giá</span><span className="font-medium text-slate-800">{product.price.toLocaleString('vi-VN')}đ</span></div>
              <div className="flex items-center justify-between gap-3"><span>Trạng thái duyệt</span><StatusBadge label={product.status === 'approved' ? 'Approved' : product.status === 'pending' ? 'Pending' : 'Rejected'} tone={product.status === 'approved' ? 'success' : product.status === 'pending' ? 'warning' : 'danger'} /></div>
              <div className="flex items-center justify-between gap-3"><span>Hiển thị</span><StatusBadge label={product.visible === 'active' ? 'Active' : 'Inactive'} tone={product.visible === 'active' ? 'info' : 'neutral'} /></div>
              <div className="flex items-center justify-between gap-3"><span>Ngày tạo</span><span className="font-medium text-slate-800">{product.createdAt}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">File nội dung</h2>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {product.fileName ?? 'Chưa có file'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
