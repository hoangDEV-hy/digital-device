import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';

import { getReports, resolveReport as resolveReportApi, type ReportRecord } from '../../api/reports';

export function ReportListPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 4;

  useEffect(() => { getReports().then((response) => setReports(response.data ?? [])); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const text = `${report.id} ${report.reporterName ?? ''} ${report.reportedUserName ?? ''} ${report.reason ?? ''}`.toLowerCase();
      return (!normalized || text.includes(normalized)) && (status === 'all' || report.status === status);
    });
  }, [reports, query, status]);

  const resolveReport = (id: number) => {
    resolveReportApi(id).then(() => {
      setReports((items) => items.map((report) => report.id === id ? { ...report, status: 'resolved' } : report));
      toast.success('Đã đánh dấu report là resolved');
    });
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý report vi phạm</h1>
      </div>
      <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo người báo cáo, seller, sản phẩm..." />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {(['all', 'pending', 'resolved'] as const).map((option) => (
          <button key={option} type="button" onClick={() => { setStatus(option); setPage(1); }} className={`rounded-xl px-3 py-2 text-sm font-medium ${status === option ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {option === 'all' ? 'Tất cả' : option === 'pending' ? 'Pending' : 'Resolved'}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'reporterName', header: 'Người báo cáo' },
          { key: 'reportedUserName', header: 'User bị báo cáo', render: (row) => <Link to={`/users/${row.reportedUserId}`} className="font-medium text-orange-600 hover:text-orange-700">{row.reportedUserName}</Link> },
          { key: 'reportedProductName', header: 'Sản phẩm' },
          { key: 'reason', header: 'Lý do' },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'pending' ? 'Pending' : 'Resolved'} tone={row.status === 'pending' ? 'warning' : 'success'} /> },
          { key: 'actions', header: 'Thao tác', render: (row) => row.status === 'pending' ? <button type="button" onClick={() => resolveReport(row.id)} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Resolve</button> : <span className="text-xs text-slate-400">Đã xử lý</span> },
        ]}
        data={filtered.slice((page - 1) * pageSize, page * pageSize)}
        rowNumberOffset={(page - 1) * pageSize}
      />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
