import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';

interface ReviewRow {
  id: number;
  productName: string;
  reviewerName: string;
  rating: number;
  content: string;
  createdAt: string;
}

const initialReviews: ReviewRow[] = [
  { id: 9001, productName: 'Ebook UX Mastery', reviewerName: 'Nguyễn Minh Anh', rating: 5, content: 'Nội dung rõ ràng, nhiều ví dụ thực tế.', createdAt: '2026-09-15' },
  { id: 9002, productName: 'React Native Pro', reviewerName: 'Trần Hoàng Nam', rating: 4, content: 'Bài giảng tốt, phần nâng cao nên bổ sung thêm.', createdAt: '2026-09-14' },
  { id: 9003, productName: 'Design System Kit', reviewerName: 'Lê Linh Đan', rating: 2, content: 'File tải xuống chưa đầy đủ như mô tả.', createdAt: '2026-09-13' },
  { id: 9004, productName: 'SQL Advanced Guide', reviewerName: 'Đỗ An Nhiên', rating: 5, content: 'Tài liệu hữu ích và trình bày dễ theo dõi.', createdAt: '2026-09-12' },
];

export function ReviewListPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return reviews;
    return reviews.filter((review) => `${review.productName} ${review.reviewerName} ${review.content}`.toLowerCase().includes(normalized));
  }, [reviews, query]);

  const deleteReview = () => {
    if (deleteId === null) return;
    setReviews((items) => items.filter((review) => review.id !== deleteId));
    toast.success('Đã ẩn đánh giá khỏi hệ thống');
    setDeleteId(null);
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
      />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      <ConfirmDialog open={deleteId !== null} title="Xác nhận ẩn đánh giá" description="Đánh giá sẽ được ẩn khỏi danh sách hiển thị. Bạn có chắc chắn muốn tiếp tục?" confirmLabel="Ẩn đánh giá" onConfirm={deleteReview} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
