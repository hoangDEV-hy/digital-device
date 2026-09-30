import api from './client';
import type { ApiResponse } from '../types/auth';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface PaymentRecord {
  id: string;
  orderId: string;
  method?: string;
  status: PaymentStatus;
  providerTxId?: string;
  paidAt?: string;
  createdAt?: string;
  Order?: {
    id: string;
    totalAmount: number | string;
    User?: { fullName: string; email: string };
  };
}

export const getPayments = async () => {
  const response = await api.get<ApiResponse<PaymentRecord[]>>('/admin/payments');
  return response.data;
};
