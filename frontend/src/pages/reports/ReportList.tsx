import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { DataTable } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { dismissReport, getReports, resolveReport, type ReportRecord } from '../../api/reports';

export function ReportListPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ReportRecord['status']>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    getReports().then((response) => setReports(response.data ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const text = `${report.id} ${report.reporter?.fullName ?? ''} ${report.reporter?.email ?? ''} ${report.reportedUserId} ${report.reason ?? ''}`.toLowerCase();
      return (!normalized || text.includes(normalized)) && (status === 'all' || report.status === status);
    });
  }, [reports, query, status]);

  const markReviewed = async (report: ReportRecord) => {
    setBusyReportId(report.id);
    try {
      await resolveReport(report.id);
      setReports((items) => items.map((item) => item.id === report.id ? { ...item, status: 'reviewed' } : item));
      toast.success('Đã đánh dấu báo cáo đã xem');
    } finally {
      setBusyReportId(null);
    }
  };

  const dismiss = async (report: ReportRecord) => {
    setBusyReportId(report.id);
    try {
      await dismissReport(report.id);
      setReports((items) => items.map((item) => item.id === report.id ? { ...item, status: 'dismissed' } : item));
      toast.success('Đã bỏ qua báo cáo');
    } finally {
      setBusyReportId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý report vi phạm</h1>
      </div>
      <SearchFilterBar query={query} onQueryChange={(value) => { setQuery(value); setPage(1); }} placeholder="Tìm theo người báo cáo, user ID hoặc lý do..." />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {(['all', 'open', 'reviewed', 'dismissed'] as const).map((option) => (
          <button key={option} type="button" onClick={() => { setStatus(option); setPage(1); }} className={`rounded-xl px-3 py-2 text-sm font-medium ${status === option ? 'bg-orange-500 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {option === 'all' ? 'Tất cả' : option === 'open' ? 'Mới' : option === 'reviewed' ? 'Đã xem' : 'Bỏ qua'}
          </button>
        ))}
      </div>
      <DataTable
        columns={[
          { key: 'reporter', header: 'Người báo cáo', render: (row) => <div><div className="font-medium text-slate-800">{row.reporter?.fullName ?? '—'}</div><div className="text-xs text-slate-500">{row.reporter?.email ?? row.reporterId}</div></div> },
          { key: 'reportedUserId', header: 'User bị báo cáo', render: (row) => <Link to={`/users/${row.reportedUserId}`} className="font-mono text-xs text-orange-700">{row.reportedUserId.slice(0, 8)}</Link> },
          { key: 'reason', header: 'Lý do' },
          { key: 'createdAt', header: 'Ngày tạo' },
          { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge label={row.status === 'open' ? 'Mới' : row.status === 'reviewed' ? 'Đã xem' : 'Bỏ qua'} tone={row.status === 'open' ? 'warning' : row.status === 'reviewed' ? 'success' : 'neutral'} /> },
          { key: 'actions', header: 'Thao tác', render: (row) => row.status === 'open' ? <div className="flex gap-2"><button type="button" disabled={busyReportId === row.id} onClick={() => markReviewed(row)} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50">Đã xem</button><button type="button" disabled={busyReportId === row.id} onClick={() => dismiss(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50">Bỏ qua</button></div> : '—' },
        ]}
        data={filtered.slice((page - 1) * pageSize, page * pageSize)}
        rowNumberOffset={(page - 1) * pageSize}
        loading={loading}
      />
      <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
    </div>
  );
}
