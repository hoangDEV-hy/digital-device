import api from './client';
import type { ApiResponse } from '../types/auth';

export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type ProductVisibility = 'active' | 'inactive';

export interface ProductRecord {
  id: number;
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  categoryName?: string;
  sellerName?: string;
  type?: string;
  thumbnail?: string;
  fileName?: string;
  status: ProductStatus;
  visible: ProductVisibility;
  createdAt?: string;
  avgRating?: number;
}

export const getProducts = async () => {
  const response = await api.get<ApiResponse<ProductRecord[]>>('/products');
  return response.data;
};

export const getProductById = async (id: number) => {
  const response = await api.get<ApiResponse<ProductRecord>>(`/products/${id}`);
  return response.data;
};

export const updateProductApproval = async (id: number, payload: { status: ProductStatus; reason?: string }) => {
  const response = await api.patch<ApiResponse<ProductRecord>>(`/products/${id}/approval`, payload);
  return response.data;
};

export const toggleProductVisibility = async (id: number) => {
  const response = await api.patch<ApiResponse<ProductRecord>>(`/products/${id}/visibility`);
  return response.data;
};
