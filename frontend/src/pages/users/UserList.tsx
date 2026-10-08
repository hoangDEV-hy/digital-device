import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { getUsers, lockUser, resetDeviceIp, unlockUser, type UserRecord } from '../../api/users';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';
import { useAuthStore } from '../../store/authStore';

export function UserListPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const pageSize = 10;
  const currentUserId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    getUsers().then((response) => setUsers(response.data ?? [])).finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(() => getUsers().then((response) => setUsers(response.data ?? [])));

  const updateStatus = async (user: UserRecord) => {
    setBusyUserId(user.id);
    try {
      if (user.status === 'active') {
        await lockUser(user.id);
        setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: 'locked' } : item));
        toast.success('Đã khóa tài khoản');
      } else {
        await unlockUser(user.id);
        setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: 'active' } : item));
        toast.success('Đã mở khóa tài khoản');
      }
    } finally {
      setBusyUserId(null);
    }
  };

  const handleResetIp = async (user: UserRecord) => {
    setBusyUserId(user.id);
    try {
      await resetDeviceIp(user.id);
      setUsers((items) => items.map((item) => item.id === user.id ? { ...item, deviceIp: null } : item));
      toast.success('Đã đặt lại liên kết IP');
    } finally {
      setBusyUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!normalized) return true;
      return `${user.fullName} ${user.email}`.toLowerCase().includes(normalized);
    });
  }, [users, query]);

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
          { key: 'deviceIp', header: 'IP thiết bị' },
          { key: 'role', header: 'Vai trò', render: (row) => <StatusBadge label={row.role === 'admin' ? 'Admin' : 'Customer'} tone={row.role === 'admin' ? 'warning' : 'info'} /> },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'active' ? 'Active' : 'Locked'} tone={row.status === 'active' ? 'success' : 'danger'} /> },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'actions', header: 'Thao tác', render: (row) => (
            <div className="flex flex-wrap gap-2">
              <Link to={`/users/${row.id}`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700">Chi tiết</Link>
              <button type="button" disabled={busyUserId === row.id || row.id === currentUserId} onClick={() => updateStatus(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                {row.status === 'active' ? 'Khóa' : 'Mở khóa'}
              </button>
              <button type="button" disabled={busyUserId === row.id || !row.deviceIp} onClick={() => handleResetIp(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                Đặt lại IP
              </button>
            </div>
          ) },
        ]}
        data={paginated}
        loading={loading}
        rowNumberOffset={(page - 1) * pageSize}
      />

      <Pagination page={page} pageSize={pageSize} total={filteredUsers.length} onPageChange={setPage} />
    </div>
  );
}
