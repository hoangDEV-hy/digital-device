import api from './client';
import type { ApiResponse } from '../types/auth';

export interface DashboardSummary {
  newUsersCount: number;
  lockedUsersCount: number;
  pendingProductsCount: number;
  unresolvedReportsCount: number;
  revenueByPeriod: Array<{
    label: string;
    revenue: number;
  }>;
}

export const getDashboardSummary = async () => {
  const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard');
  return response.data;
};
