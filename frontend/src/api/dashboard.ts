import api from './client';
import type { ApiResponse } from '../types/auth';

export interface DashboardSummary {
  newUsers: number;
  lockedUsers: number;
  pendingProducts: number;
}

export const getDashboardSummary = async () => {
  const response = await api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary');
  return response.data;
};
