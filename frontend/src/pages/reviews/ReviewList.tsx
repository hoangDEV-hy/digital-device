import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { getReviews, deleteReview, type ReviewRecord } from '../../api/reviews';
import { useAdminDataRefresh } from '../../hooks/useAdminDataRefresh';

export function ReviewListPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    getReviews().then((response) => setReviews(response.data ?? [])).finally(() => setLoading(false));
  }, []);
  useAdminDataRefresh(() => getReviews().then((response) => setReviews(response.data ?? [])));

  const filtered = useMemo(() => reviews.filter((review) => `${review.user?.fullName ?? ''} ${review.user?.email ?? ''} ${review.Product?.title ?? ''} ${review.content}`.toLowerCase().includes(query.trim().toLowerCase())), [reviews, query]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deleteReview(deleteId);
      setReviews((items) => items.filter((item) => item.id !== deleteId));
      toast.success('Đã xóa đánh giá');
      setDeleteId(null);
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reviews</p><h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý đánh giá</h1></div>
    <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo người đánh giá, sản phẩm hoặc nội dung..." />
    <DataTable columns={[
      { key: 'user', header: 'Người đánh giá', render: (row) => <div>{row.user?.fullName ?? '—'}<div className="text-xs text-slate-500">{row.user?.email}</div></div> },
      { key: 'product', header: 'Sản phẩm', render: (row) => row.Product?.title ?? row.productId },
      { key: 'rating', header: 'Điểm', render: (row) => <span className="font-semibold">{row.rating}/5</span> },
      { key: 'content', header: 'Nội dung', render: (row) => <p className="max-w-xl whitespace-normal">{row.content}</p> },
      { key: 'createdAt', header: 'Ngày đăng' },
      { key: 'actions', header: 'Thao tác', render: (row) => <button type="button" onClick={() => setDeleteId(row.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700">Xóa</button> },
    ]} data={filtered.slice((page - 1) * pageSize, page * pageSize)} loading={loading} rowNumberOffset={(page - 1) * pageSize} />
    <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    <ConfirmDialog open={Boolean(deleteId)} title="Xóa đánh giá?" description="Đánh giá sẽ bị xóa khỏi marketplace." confirmLabel={busy ? 'Đang xóa...' : 'Xóa đánh giá'} onConfirm={handleDelete} onCancel={() => !busy && setDeleteId(null)} />
  </div>;
}
