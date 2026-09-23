import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { deleteReview as deleteReviewApi, getReviews, type ReviewRecord } from '../../api/reviews';

interface ReviewRow {
  id: number;
  productName: string;
  reviewerName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export function ReviewListPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const pageSize = 4;

  useEffect(() => { getReviews().then((response) => setReviews(response.data ?? [])); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reviews;
    return reviews.filter((review) => `${review.productName} ${review.reviewerName} ${review.content}`.toLowerCase().includes(normalized));
  }, [reviews, query]);

  const deleteReview = () => {
    if (deleteId === null) return;
    deleteReviewApi(deleteId).then(() => {
      setReviews((items) => items.filter((review) => review.id !== deleteId));
      toast.success('Đã ẩn đánh giá khỏi hệ thống');
    }).finally(() => setDeleteId(null));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reviews</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý đánh giá</h1>
      </div>
      <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo sản phẩm, người đánh giá, nội dung..." />
      <DataTable
        columns={[
          { key: 'productName', header: 'Sản phẩm', render: (row) => <div><div className="font-semibold text-slate-800">{row.productName}</div><div className="text-xs text-slate-500">{row.reviewerName}</div></div> },
          { key: 'rating', header: 'Rating', render: (row) => <span className="font-semibold text-amber-500">{'★'.repeat(row.rating)}<span className="text-slate-200">{'★'.repeat(5 - row.rating)}</span></span> },
          { key: 'content', header: 'Nội dung', render: (row) => <span className="text-slate-600">{row.content}</span> },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'actions', header: 'Thao tác', render: (row) => <button type="button" onClick={() => setDeleteId(row.id)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">Ẩn đánh giá</button> },
        ]}
        data={filtered.slice((page - 1) * pageSize, page * pageSize)}
        rowNumberOffset={(page - 1) * pageSize}
      />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      <ConfirmDialog open={deleteId !== null} title="Xác nhận ẩn đánh giá" description="Đánh giá sẽ được ẩn khỏi danh sách hiển thị. Bạn có chắc chắn muốn tiếp tục?" confirmLabel="Ẩn đánh giá" onConfirm={deleteReview} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
