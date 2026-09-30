import api from './client';
import type { ApiResponse } from '../types/auth';

export interface DashboardSummary {
  newUsers: number;
  lockedUsers: number;
  pendingProducts: number;
}

export interface ReportedUserSummary {
  reportedUserId: string;
  reportsCount: number;
  lastReportAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    status: 'active' | 'locked';
    createdAt: string;
  } | null;
}

export interface RevenuePoint {
  period: string;
  total: number | string;
}

export const getDashboardSummary = async () => {
  const response = await api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
  return response.data;
};

export const getReportedUsers = async () => {
  const response = await api.get<ApiResponse<{ items: ReportedUserSummary[] }>>('/admin/dashboard/reported-users');
  return response.data;
};

export const getRevenue = async (period: 'total' | 'day' | 'month' = 'total') => {
  const response = await api.get<ApiResponse<{ totalRevenue?: number | string; period?: string; items?: RevenuePoint[] }>>('/admin/dashboard/revenue', {
    params: { period, page: 1, pageSize: 12 },
  });
  return response.data;
};
