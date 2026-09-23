import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getProducts, type ProductRecord } from '../../api/products';

interface ProductRow {
  id: number;
  name: string;
  category: string;
  seller: string;
  type: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  visible: 'active' | 'inactive';
  createdAt: string;
}

export function ProductListPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(4);

  useEffect(() => { getProducts().then((response) => setProducts(response.data ?? [])); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => `${product.name} ${product.category} ${product.seller}`.toLowerCase().includes(normalized));
  }, [query]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Products</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý sản phẩm</h1>
        </div>
      </div>

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
            <Link to={`/products/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Chi tiết
            </Link>
          ) },
        ]}
        data={paginated}
        rowNumberOffset={(page - 1) * pageSize}
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
