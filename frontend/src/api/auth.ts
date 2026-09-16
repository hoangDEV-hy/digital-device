import api from "./client";
import type { ApiResponse, AuthTokens, LoginRequest } from "../types/auth";

export interface LoginResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    role: "admin" | "customer";
    status: "active" | "locked";
    avatar?: string;
    createdAt?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const loginAdmin = async (payload: LoginRequest) => {
  const response = await api.post<ApiResponse<LoginResponse>>(
    "/auth/login",
    payload,
  );
  return response.data;
};

export const logout = async () => {
  const response = await api.post<ApiResponse<null>>("/auth/logout");
  return response.data;
};

export const refreshToken = async (refreshTokenValue: string) => {
  const response = await api.post<ApiResponse<AuthTokens>>("/auth/refresh", {
    refreshToken: refreshTokenValue,
  });
  return response.data;
};
