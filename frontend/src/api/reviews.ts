import api from './client';
import type { ApiResponse } from '../types/auth';

export interface ReviewRecord {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createdAt?: string;
  user?: { id: string; fullName: string; email: string };
  Product?: { id: string; title: string };
}

export const getReviews = async () => {
  const response = await api.get<ApiResponse<ReviewRecord[]>>('/admin/reviews');
  return response.data;
};

export const deleteReview = async (id: string) => {
  const response = await api.delete<ApiResponse<null>>(`/reviews/${id}`);
  return response.data;
};
