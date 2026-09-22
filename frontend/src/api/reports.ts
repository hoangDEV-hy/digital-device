import api from './client';
import type { ApiResponse } from '../types/auth';

export interface ReportRecord {
  id: number;
  reporterName?: string;
  reportedUserName?: string;
  reportedProductName?: string;
  reason?: string;
  createdAt?: string;
  status: 'pending' | 'resolved';
}

export const getReports = async () => {
  const response = await api.get<ApiResponse<ReportRecord[]>>('/admin/reports');
  return {
    success: response.data.success,
    data: (response.data.data ?? []).map((report: ReportRecord & { status: string }) => ({
      ...report,
      status: report.status === 'open' ? 'pending' : 'resolved',
    })),
  };
};

export const resolveReport = async (id: number) => {
  const response = await api.patch<ApiResponse<ReportRecord>>(`/admin/reports/${id}/resolve`);
  return response.data;
};
