import api from './client';
import type { ApiResponse } from '../types/auth';

export interface CategoryRecord {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
}

export const getCategories = async () => {
  const response = await api.get<ApiResponse<CategoryRecord[]>>('/categories');
  return response.data;
};

export const createCategory = async (payload: { name: string; description?: string }) => {
  const response = await api.post<ApiResponse<CategoryRecord>>('/categories', payload);
  return response.data;
};

export const updateCategory = async (id: number, payload: { name: string; description?: string }) => {
  const response = await api.put<ApiResponse<CategoryRecord>>(`/categories/${id}`, payload);
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await api.delete<ApiResponse<null>>(`/categories/${id}`);
  return response.data;
};
