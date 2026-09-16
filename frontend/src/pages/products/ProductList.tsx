import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';

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

const products: ProductRow[] = [
  { id: 1, name: 'Ebook UX Mastery', category: 'Sách điện tử', seller: 'Minh Anh', type: 'ebook', price: 290000, status: 'pending', visible: 'active', createdAt: '2026-09-13' },
  { id: 2, name: 'React Native Pro', category: 'Khóa học video', seller: 'Hoàng Nam', type: 'video', price: 690000, status: 'approved', visible: 'active', createdAt: '2026-09-11' },
  { id: 3, name: 'Design System Kit', category: 'Template', seller: 'Linh Đan', type: 'template', price: 450000, status: 'rejected', visible: 'inactive', createdAt: '2026-09-09' },
  { id: 4, name: 'SQL Advanced Guide', category: 'Tài liệu', seller: 'An Nhiên', type: 'document', price: 180000, status: 'approved', visible: 'inactive', createdAt: '2026-09-08' },
  { id: 5, name: 'Motion Pack 2026', category: 'Template', seller: 'Cường Phạm', type: 'template', price: 520000, status: 'pending', visible: 'active', createdAt: '2026-09-07' },
];

export function ProductListPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(4);

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
          { key: 'category', header: 'Danh mục' },
          { key: 'seller', header: 'Seller' },
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
      />

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
