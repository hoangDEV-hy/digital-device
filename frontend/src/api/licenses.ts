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
  const response = await api.get<ApiResponse<LicenseRecord[]>>('/admin/licenses');
  return {
    success: response.data.success,
    data: (response.data.data ?? []).map((license: LicenseRecord & { User?: { fullName?: string }; Product?: { title?: string } }) => ({
      ...license,
      customerName: license.customerName ?? license.User?.fullName,
      productName: license.productName ?? license.Product?.title,
    })),
  };
};

export const revokeLicense = async (id: number, reason?: string) => {
  const response = await api.patch<ApiResponse<LicenseRecord>>(`/admin/licenses/${id}/revoke`, { reason });
  return response.data;
};
