import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';
const ACCESS_KEY = 'dm_access_token';
const REFRESH_KEY = 'dm_refresh_token';

export type User = { id: string; fullName: string; email: string; phone?: string; role?: string; avatar?: string };
export type Product = { id: string; title: string; description?: string; price: number | string; type?: string; thumbnail?: string; seller?: { fullName?: string }; Category?: { name?: string } };
export type Cart = { id: string; CartItems?: { id: string; productId: string; price: number | string; quantity: number; Product?: Product }[] };

async function readTokens() {
  return { access: await SecureStore.getItemAsync(ACCESS_KEY), refresh: await SecureStore.getItemAsync(REFRESH_KEY) };
}

export async function saveSession(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const tokens = await readTokens();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (tokens.access) headers.set('Authorization', `Bearer ${tokens.access}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Không kết nối được máy chủ sau 12 giây. Kiểm tra backend và EXPO_PUBLIC_API_URL (${API_URL}).`);
    }
    throw new Error(`Không thể kết nối máy chủ tại ${API_URL}. Kiểm tra Wi-Fi, IP máy tính và Windows Firewall.`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && retry && tokens.refresh) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refresh }),
    });
    if (refreshResponse.ok) {
      const refreshed = await refreshResponse.json();
      await SecureStore.setItemAsync(ACCESS_KEY, refreshed.data.accessToken);
      return request<T>(path, options, false);
    }
    await clearSession();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Không thể kết nối máy chủ');
  return body as T;
}

export const api = {
  login: (email: string, password: string) => request<{ data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload: { fullName: string; email: string; phone: string; password: string }) => request<{ data: { id: string } }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request<{ data: User }>('/users/me'),
  products: (query = '') => request<{ data: { items: Product[]; total: number } }>(`/products/approved${query ? `?${query}` : ''}`),
  categories: () => request<{ data: { id: string; name: string }[] }>('/categories'),
  cart: () => request<{ data: Cart }>('/cart'),
  addToCart: (productId: string) => request('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) }),
  removeFromCart: (itemId: string) => request(`/cart/items/${itemId}`, { method: 'DELETE' }),
  checkout: () => request<{ data: { orderId: string; totalAmount: number } }>('/cart/checkout', { method: 'POST' }),
  orders: () => request<{ data: any[] }>('/orders/my'),
  library: () => request<{ data: any[] }>('/content/my-library'),
  logout: async () => { const { refresh } = await readTokens(); await request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: refresh }) }, false).catch(() => undefined); await clearSession(); },
};

export async function hasSession() { return Boolean((await readTokens()).refresh); }
