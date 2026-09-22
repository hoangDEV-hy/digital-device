import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { createCategory, deleteCategory, getCategories, updateCategory, type CategoryRecord } from '../../api/categories';

interface CategoryRow {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export function CategoryListPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => { getCategories().then((response) => setCategories(response.data ?? [])); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return categories;
    return categories.filter((category) => `${category.name} ${category.description}`.toLowerCase().includes(normalized));
  }, [categories, query]);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (category: CategoryRow) => {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      toast.error('Tên danh mục không được để trống');
      return;
    }

    const duplicate = categories.some((category) => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingId);
    if (duplicate) {
      toast.error('Tên danh mục đã tồn tại');
      return;
    }

    if (editingId !== null) {
      updateCategory(editingId, { name, description }).then((response) => {
        setCategories((items) => items.map((item) => item.id === editingId ? response.data : item));
      });
      toast.success('Cập nhật danh mục thành công');
    } else {
      createCategory({ name, description }).then((response) => {
        setCategories((items) => [response.data, ...items]);
        toast.success('Thêm danh mục thành công');
      });
    }

    setModalOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!pendingDeleteId) return;
    const exists = categories.some((category) => category.id === pendingDeleteId);
    if (!exists) {
      toast.error('Danh mục không tồn tại');
      setConfirmOpen(false);
      return;
    }

    deleteCategory(pendingDeleteId).then(() => {
      setCategories((items) => items.filter((item) => item.id !== pendingDeleteId));
      toast.success('Xóa danh mục thành công');
    }).finally(() => { setConfirmOpen(false); setPendingDeleteId(null); });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categories</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý danh mục</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Thêm danh mục
        </button>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={(value) => setQuery(value)}
        placeholder="Tìm kiếm theo tên hoặc mô tả..."
      />

      <DataTable
        columns={[
          { key: 'id', header: 'ID', render: (row) => <span className="font-semibold text-slate-700">#{row.id}</span> },
          { key: 'name', header: 'Tên danh mục', render: (row) => <div><div className="font-semibold text-slate-800">{row.name}</div><div className="text-xs text-slate-500">{row.description}</div></div> },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'active' ? 'Đang hiển thị' : 'Tạm ẩn'} tone={row.status === 'active' ? 'success' : 'neutral'} /> },
          { key: 'actions', header: 'Thao tác', render: (row) => (
            <div className="flex gap-2">
              <button type="button" onClick={() => openEditModal(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Sửa</button>
              <button type="button" onClick={() => { setPendingDeleteId(row.id); setConfirmOpen(true); }} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Xóa</button>
            </div>
          ) },
        ]}
        data={filtered}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-800">{editingId !== null ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tên danh mục</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  placeholder="Ví dụ: Sách điện tử"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                  placeholder="Mô tả ngắn về danh mục"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Hủy</button>
              <button type="button" onClick={handleSubmit} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editingId !== null ? 'Lưu thay đổi' : 'Thêm mới'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Xác nhận xóa danh mục"
        description="Hành động này sẽ xóa danh mục khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
        confirmLabel="Xóa"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
