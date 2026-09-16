import api from './client';
import type { ApiResponse } from '../types/auth';

export type LicenseStatus = 'active' | 'revoked';

export interface LicenseRecord {
  id: number;
  customerName?: string;
  productName?: string;
  orderId?: number;
  issuedAt?: string;
  status: LicenseStatus;
}

export const getLicenses = async () => {
  const response = await api.get<ApiResponse<LicenseRecord[]>>('/licenses');
  return response.data;
};

export const revokeLicense = async (id: number, reason?: string) => {
  const response = await api.patch<ApiResponse<LicenseRecord>>(`/licenses/${id}/revoke`, { reason });
  return response.data;
};
