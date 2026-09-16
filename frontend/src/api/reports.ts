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
  const response = await api.get<ApiResponse<ReportRecord[]>>('/reports');
  return response.data;
};

export const resolveReport = async (id: number) => {
  const response = await api.patch<ApiResponse<ReportRecord>>(`/reports/${id}/resolve`);
  return response.data;
};
