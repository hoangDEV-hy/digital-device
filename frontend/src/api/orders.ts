import api from './client';
import type { ApiResponse } from '../types/auth';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface OrderRecord {
  id: string;
  userId: string;
  User?: { id: string; fullName: string; email: string };
  OrderItems?: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number | string;
    Product?: { id: string; title: string; type?: string };
  }>;
  Payment?: {
    id: string;
    method?: string;
    status: 'pending' | 'success' | 'failed';
    providerTxId?: string;
    paidAt?: string;
  };
  totalAmount: number;
  status: OrderStatus;
  escrowReleased?: boolean;
  releasedAt?: string | null;
  createdAt?: string;
}

export const getOrders = async () => {
  const response = await api.get<ApiResponse<OrderRecord[]>>('/orders/all');
  return response.data;
};

export const getOrderById = async (id: string) => {
  const response = await api.get<ApiResponse<OrderRecord>>(`/orders/${id}`);
  return response.data;
};

export const releaseEligibleEscrow = async () => {
  const response = await api.post<ApiResponse<{
    releasedCount: number;
    totalReleased: number;
    skippedOrders?: Array<{ orderId: string; reason: string }>;
  }>>('/orders/release-escrow');
  return response.data;
};

export const processAdminRefund = async (payload: { orderId: string; refundAmount?: number; reason?: string }) => {
  const response = await api.post<ApiResponse<{ orderId: string }>>('/wallets/admin/refund', payload);
  return response.data;
};
