import api from './client';
import type { ApiResponse } from '../types/auth';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  status: 'active' | 'locked';
  avatar?: string;
  deviceIp?: string | null;
  createdAt?: string;
}

export const getUsers = async () => {
  const response = await api.get<ApiResponse<{ items: UserRecord[]; total: number }>>('/admin/users', {
    params: { page: 1, pageSize: 100 },
  });
  return { success: response.data.success, data: response.data.data?.items ?? [] };
};

export const getUserById = async (id: string) => {
  const response = await api.get<ApiResponse<UserRecord>>(`/admin/users/${id}`);
  return response.data;
};

export const lockUser = async (id: string) => {
  const response = await api.post<ApiResponse<null>>(`/admin/users/${id}/lock`);
  return response.data;
};

export const unlockUser = async (id: string) => {
  const response = await api.post<ApiResponse<null>>(`/admin/users/${id}/unlock`);
  return response.data;
};

export const resetDeviceIp = async (id: string) => {
  const response = await api.post<ApiResponse<null>>(`/admin/users/${id}/reset-device-ip`);
  return response.data;
};
