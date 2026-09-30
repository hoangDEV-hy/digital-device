import api from './client';
import type { ApiResponse } from '../types/auth';

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reporter?: { id: string; fullName: string; email: string };
  reason?: string;
  createdAt?: string;
  status: 'open' | 'reviewed' | 'dismissed';
}

export const getReports = async () => {
  const response = await api.get<ApiResponse<ReportRecord[]>>('/admin/reports');
  return response.data;
};

export const resolveReport = async (id: string) => {
  const response = await api.post<ApiResponse<ReportRecord>>(`/admin/reports/${id}/resolve`);
  return response.data;
};

export const dismissReport = async (id: string) => {
  const response = await api.post<ApiResponse<ReportRecord>>(`/admin/reports/${id}/dismiss`);
  return response.data;
};
