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
  const response = await api.get<ApiResponse<ReviewRecord[]>>('/admin/reviews');
  return {
    success: response.data.success,
    data: (response.data.data ?? []).map((review: ReviewRecord & { user?: { fullName?: string }; Product?: { title?: string } }) => ({
      ...review,
      reviewerName: review.reviewerName ?? review.user?.fullName,
      productName: review.productName ?? review.Product?.title,
    })),
  };
};

export const deleteReview = async (id: number) => {
  const response = await api.delete<ApiResponse<null>>(`/reviews/${id}`);
  return response.data;
};
