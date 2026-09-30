import api from './client';
import type { ApiResponse } from '../types/auth';

export type LicenseStatus = 'active' | 'revoked';

export interface LicenseRecord {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  issuedAt?: string;
  status: LicenseStatus;
  User?: { fullName: string; email: string };
  Product?: { title: string };
}

export const getLicenses = async () => {
  const response = await api.get<ApiResponse<LicenseRecord[]>>('/admin/licenses');
  return response.data;
};

export const revokeLicense = async (id: string) => {
  const response = await api.post<ApiResponse<null>>(`/admin/licenses/${id}/revoke`);
  return response.data;
};
