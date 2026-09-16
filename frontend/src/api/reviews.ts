import api from './client';
import type { ApiResponse } from '../types/auth';

export interface ReviewRecord {
  id: number;
  productName?: string;
  reviewerName?: string;
  rating: number;
  content?: string;
  createdAt?: string;
}

export const getReviews = async () => {
  const response = await api.get<ApiResponse<ReviewRecord[]>>('/reviews');
  return response.data;
};

export const deleteReview = async (id: number) => {
  const response = await api.delete<ApiResponse<null>>(`/reviews/${id}`);
  return response.data;
};
