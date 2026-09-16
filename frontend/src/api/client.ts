import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import type { ApiResponse } from "../types/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const isApiErrorResponse = (
  error: unknown,
): error is AxiosError<{ success?: boolean; message?: string }> =>
  axios.isAxiosError(error) && Boolean(error.response);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<{ success?: boolean; message?: string }>) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      isApiErrorResponse(error) &&
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const { refreshToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<
          ApiResponse<{ accessToken: string; refreshToken: string }>
        >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        if (!data.success || !data.data?.accessToken) {
          throw new Error(data.message || "Refresh token failed");
        }

        const nextAccessToken = data.data.accessToken;
        const nextRefreshToken = data.data.refreshToken || refreshToken;
        const authState = useAuthStore.getState();
        authState.setAuth(
          authState.user ?? {
            id: 0,
            fullName: "Admin",
            email: "",
            role: "admin",
            status: "active",
          },
          nextAccessToken,
          nextRefreshToken,
        );

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        logout();
        window.location.href = "/login";
        const message = isApiErrorResponse(refreshError)
          ? refreshError.response?.data?.message || "Phiên đăng nhập đã hết hạn"
          : "Phiên đăng nhập đã hết hạn";
        toast.error(message);
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message || "Có lỗi xảy ra";
    if (message) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;
