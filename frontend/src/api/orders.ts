import api from './client';
import type { ApiResponse } from '../types/auth';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface OrderRecord {
  id: number;
  customerName?: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt?: string;
}

export const getOrders = async () => {
  const response = await api.get<ApiResponse<OrderRecord[]>>('/orders/all');
  return response.data;
};

export const getOrderById = async (id: string | number) => {
  const response = await api.get<ApiResponse<OrderRecord>>(`/orders/${id}`);
  return response.data;
};
