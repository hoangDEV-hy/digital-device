import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getUsers, type UserRecord } from '../../api/users';

interface UserRow {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  status: 'active' | 'locked';
  createdAt: string;
}

export function UserListPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(3);

  useEffect(() => { getUsers().then((response) => setUsers(response.data ?? [])); }, []);

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
        rowNumberOffset={(page - 1) * pageSize}
      />

      <Pagination page={page} pageSize={pageSize} total={filteredUsers.length} onPageChange={setPage} />
    </div>
  );
}
