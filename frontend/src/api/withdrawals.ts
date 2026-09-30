import api from './client';
import type { ApiResponse } from '../types/auth';

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequestRecord {
  id: string;
  amount: number | string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: WithdrawalStatus;
  createdAt: string;
  reviewedAt?: string | null;
  adminNote?: string | null;
  user: { id: string; fullName: string; email: string };
}

export async function getWithdrawalRequests(status?: WithdrawalStatus) {
  const response = await api.get<ApiResponse<WithdrawalRequestRecord[]>>('/admin/withdrawals', {
    params: status ? { status } : undefined,
  });
  return response.data.data ?? [];
}

export async function reviewWithdrawalRequest(id: string, action: 'approve' | 'reject', note?: string) {
  const response = await api.post<ApiResponse<WithdrawalRequestRecord>>(`/admin/withdrawals/${id}/${action}`, { note });
  return response.data;
}