import api from './client';
import type { ApiResponse } from '../types/auth';

export interface UserRecord {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
  status: 'active' | 'locked';
  avatar?: string;
  createdAt?: string;
}

export const getUsers = async () => {
  const response = await api.get<ApiResponse<UserRecord[]>>('/users');
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await api.get<ApiResponse<UserRecord>>(`/users/${id}`);
  return response.data;
};

export const toggleUserStatus = async (id: number) => {
  const response = await api.patch<ApiResponse<UserRecord>>(`/users/${id}/status`);
  return response.data;
};

export const grantDeviceIpAccess = async (id: number) => {
  const response = await api.patch<ApiResponse<UserRecord>>(`/users/${id}/device-ip`);
  return response.data;
};
