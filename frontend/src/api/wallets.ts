import api from './client';
import type { ApiResponse } from '../types/auth';

export type WalletUpdateType = 'deposit' | 'escrow_hold' | 'escrow_release' | 'penalty';
export type SellerContractStatus = 'inactive' | 'registered' | 'suspended';

export interface WalletRecord {
  id: string;
  userId: string;
  balance: number | string;
  escrowBalance: number | string;
  depositBalance: number | string;
  minimumDeposit: number | string;
  contractStatus: SellerContractStatus;
  lastUpdated?: string;
  User?: { id: string; fullName: string; email: string; status: 'active' | 'locked' };
}

export const getAdminWallets = async () => {
  const response = await api.get<ApiResponse<WalletRecord[]>>('/wallets/admin/list');
  return response.data;
};

export const updateWallet = async (payload: {
  userId: string;
  type: WalletUpdateType;
  amount: number;
  note?: string;
}) => {
  const response = await api.post<ApiResponse<WalletRecord>>('/wallets/manual-update', payload);
  return response.data;
};

export const suspendSeller = async (userId: string) => {
  const response = await api.post<ApiResponse<unknown>>(`/wallets/admin/${userId}/suspend`);
  return response.data;
};

export const resumeSeller = async (userId: string) => {
  const response = await api.post<ApiResponse<unknown>>(`/wallets/admin/${userId}/resume`);
  return response.data;
};
