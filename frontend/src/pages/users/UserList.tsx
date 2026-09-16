import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';

interface UserRow {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  status: 'active' | 'locked';
  createdAt: string;
}

const users: UserRow[] = [
  { id: 1, fullName: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0901111222', role: 'customer', status: 'active', createdAt: '2026-09-14' },
  { id: 2, fullName: 'Trần Thị B', email: 'b@gmail.com', phone: '0988777666', role: 'admin', status: 'active', createdAt: '2026-09-12' },
  { id: 3, fullName: 'Lê Văn C', email: 'c@gmail.com', phone: '0912333444', role: 'customer', status: 'locked', createdAt: '2026-09-10' },
  { id: 4, fullName: 'Phạm Thị D', email: 'd@gmail.com', phone: '0922444555', role: 'customer', status: 'active', createdAt: '2026-09-09' },
  { id: 5, fullName: 'Hoàng Văn E', email: 'e@gmail.com', phone: '0933555666', role: 'customer', status: 'locked', createdAt: '2026-09-08' },
];

export function UserListPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(3);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!normalized) return true;
      return `${user.fullName} ${user.email}`.toLowerCase().includes(normalized);
    });
  }, [query]);

  const paginated = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Users</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý người dùng</h1>
        </div>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Tìm theo tên hoặc email..."
      />

      <DataTable
        columns={[
          { key: 'id', header: 'Mã', render: (row) => <span className="font-medium text-slate-700">USR-{row.id}</span> },
          { key: 'fullName', header: 'Họ tên', render: (row) => <div><div className="font-semibold text-slate-800">{row.fullName}</div><div className="text-xs text-slate-500">{row.email}</div></div> },
          { key: 'phone', header: 'SĐT' },
          { key: 'role', header: 'Vai trò', render: (row) => <StatusBadge label={row.role === 'admin' ? 'Admin' : 'Customer'} tone={row.role === 'admin' ? 'warning' : 'info'} /> },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'active' ? 'Active' : 'Locked'} tone={row.status === 'active' ? 'success' : 'danger'} /> },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'actions', header: 'Thao tác', render: (row) => (
            <div className="flex gap-2">
              <Link to={`/users/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Chi tiết
              </Link>
            </div>
          ) },
        ]}
        data={paginated}
      />

      <Pagination page={page} pageSize={pageSize} total={filteredUsers.length} onPageChange={setPage} />
    </div>
  );
}
