import type { ReactNode } from 'react';

export interface ColumnConfig<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-10 rounded bg-slate-200" />
          <div className="h-10 rounded bg-slate-200" />
          <div className="h-10 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={`px-4 py-3 font-semibold ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-slate-200 hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${String(column.key)}`} className={`px-4 py-3 ${column.className || ''}`}>
                      {column.render ? column.render(row) : (row[column.key as keyof T] as ReactNode) || '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
