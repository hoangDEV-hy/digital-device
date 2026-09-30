import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { deleteProduct, getProducts, updateProductApproval, updateProductVisibility, type ProductRecord } from '../../api/products';

export function ProductListPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await getProducts();
      setProducts(response.data ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const reviewProduct = async (product: ProductRecord, status: 'approved' | 'rejected') => {
    setBusyProductId(product.id);
    try {
      await updateProductApproval(product.id, status);
      setProducts((items) => items.map((item) => item.id === product.id ? {
        ...item,
        status,
        visible: status === 'approved' ? 'active' : 'inactive',
      } : item));
      toast.success(status === 'approved' ? 'Đã duyệt sản phẩm' : 'Đã từ chối sản phẩm');
    } finally {
      setBusyProductId(null);
    }
  };

  const updateVisibility = async (product: ProductRecord) => {
    const visibility = product.visible === 'active' ? 'inactive' : 'active';
    setBusyProductId(product.id);
    try {
      await updateProductVisibility(product.id, visibility);
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, visible: visibility } : item));
      toast.success(visibility === 'active' ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyProductId(deleteTarget.id);
    try {
      await deleteProduct(deleteTarget.id);
      setProducts((items) => items.filter((item) => item.id !== deleteTarget.id));
      toast.success('Đã xóa sản phẩm');
      setDeleteTarget(null);
    } finally {
      setBusyProductId(null);
    }
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => `${product.name} ${product.categoryName ?? ''} ${product.sellerName ?? ''}`.toLowerCase().includes(normalized));
  }, [products, query]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Products</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý sản phẩm</h1>
        </div>
        <button type="button" onClick={() => void loadProducts()} disabled={loading} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>Không tải được danh sách sản phẩm. Kiểm tra backend rồi thử tải lại.</span>
          <button type="button" onClick={() => void loadProducts()} className="font-semibold underline">Thử lại</button>
        </div>
      )}

      <SearchFilterBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Tìm theo tên, danh mục, seller..."
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Sản phẩm', render: (row) => <div><div className="font-semibold text-slate-800">{row.name}</div><div className="text-xs text-slate-500">{row.type}</div></div> },
          { key: 'category', header: 'Danh mục', render: (row) => row.categoryName ?? '-' },
          { key: 'seller', header: 'Seller', render: (row) => row.sellerName ?? '-' },
          { key: 'type', header: 'Loại' },
          { key: 'price', header: 'Giá', render: (row) => <span className="font-medium text-slate-700">{row.price.toLocaleString('vi-VN')}đ</span> },
          { key: 'status', header: 'Duyệt', render: (row) => <StatusBadge label={row.status === 'approved' ? 'Approved' : row.status === 'pending' ? 'Pending' : 'Rejected'} tone={row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'} /> },
          { key: 'visible', header: 'Hiển thị', render: (row) => <StatusBadge label={row.visible === 'active' ? 'Active' : 'Inactive'} tone={row.visible === 'active' ? 'info' : 'neutral'} /> },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'actions', header: 'Thao tác', render: (row) => (
            <div className="flex flex-wrap gap-2">
              <Link to={`/products/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Chi tiết</Link>
              <button type="button" disabled={busyProductId === row.id} onClick={() => setDeleteTarget(row)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-50">Xóa</button>
              {row.status === 'pending' && <>
                <button type="button" disabled={busyProductId === row.id} onClick={() => reviewProduct(row, 'approved')} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Duyệt</button>
                <button type="button" disabled={busyProductId === row.id} onClick={() => reviewProduct(row, 'rejected')} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">Từ chối</button>
              </>}
              {row.status === 'approved' && <button type="button" disabled={busyProductId === row.id} onClick={() => updateVisibility(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{row.visible === 'active' ? 'Ẩn' : 'Hiện'}</button>}
            </div>
          ) },
        ]}
        data={paginated}
        loading={loading}
        rowNumberOffset={(page - 1) * pageSize}
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      <ConfirmDialog open={Boolean(deleteTarget)} title="Xóa sản phẩm?" description={`Sản phẩm “${deleteTarget?.name ?? ''}” sẽ bị xóa khỏi hệ thống.`} confirmLabel="Xóa sản phẩm" onConfirm={handleDelete} onCancel={() => !busyProductId && setDeleteTarget(null)} />
    </div>
  );
}
