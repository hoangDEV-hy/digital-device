import api from "./client";
import type { ApiResponse } from "../types/auth";

export type PaymentStatus = "pending" | "success" | "failed";

export interface PaymentRecord {
  id: number;
  orderId: number;
  method: string;
  status: PaymentStatus;
  transactionCode?: string;
  paidAt?: string;
}

export const getPayments = async () => {
  const response =
    await api.get<ApiResponse<PaymentRecord[]>>("/admin/payments");
  return response.data;
};
