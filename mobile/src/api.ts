import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';
const ACCESS_KEY = 'dm_access_token';
const REFRESH_KEY = 'dm_refresh_token';

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  avatar?: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  title: string;
  description?: string;
  price: number | string;
  type?: string;
  thumbnail?: string;
  fileUrl?: string;
  visibility?: string;
  reviewStatus?: string;
  seller?: { id?: string; fullName?: string };
  Category?: { id?: string; name?: string };
};

export type NewProduct = {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  type: string;
  fileUrl: string;
  thumbnail?: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number | string;
  Product?: Product;
};

export type Cart = {
  id: string;
  status?: string;
  CartItems?: CartItem[];
};

export type OrderItem = {
  id: string;
  productId: string;
  orderId?: string;
  quantity: number;
  price: number | string;
  Product?: Product;
};

export type Order = {
  id: string;
  userId?: string;
  status?: string;
  totalAmount?: number | string;
  createdAt?: string;
  OrderItems?: OrderItem[];
};

export type LicenseItem = {
  id: string;
  userId: string;
  productId: string;
  orderId?: string;
  status?: string;
  Product?: Product;
};

export type ProductReview = {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createdAt?: string;
  user?: { id: string; fullName: string; avatar?: string };
};

export type UserReport = {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason?: string;
  status?: 'open' | 'reviewed' | 'dismissed';
};

export type Wallet = {
  id: string;
  userId?: string;
  balance?: number | string;
  escrowBalance?: number | string;
  depositBalance?: number | string;
  contractStatus?: string;
  minimumDeposit?: number | string;
};

export type WithdrawalRequest = {
  id: string;
  amount: number | string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
};

export type UserWalletTxn = {
  id: string;
  type?: string;
  amount?: number | string;
  note?: string;
  status?: string;
  createdAt?: string;
};

export type PaymentCreateResult = {
  orderId: string;
  paymentId?: string;
  status: string;
  totalAmount?: number;
  requiredAmount?: number;
  redirectUrl?: string;
};

export type ChatUser = Pick<User, 'id' | 'fullName' | 'avatar' | 'role'>;

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: ChatUser;
};

export type ChatParticipant = {
  id: string;
  userId: string;
  user: ChatUser;
  lastReadAt?: string;
};

export type ChatConversation = {
  id: string;
  participants: ChatParticipant[];
  product?: { id: string; title: string } | null;
  messages?: ChatMessage[];
  lastMessageAt: string;
};

export type ChatContact = {
  user: ChatUser;
  productId: string | null;
};

async function readTokens() {
  return {
    access: await SecureStore.getItemAsync(ACCESS_KEY),
    refresh: await SecureStore.getItemAsync(REFRESH_KEY),
  };
}

export async function getAccessToken() {
  return (await readTokens()).access;
}

export const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export async function saveSession(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, retry = true, multipart = false): Promise<T> {
  const tokens = await readTokens();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !multipart) {
    headers.set('Content-Type', 'application/json');
  }
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
    const reason = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new Error(`Không thể kết nối máy chủ tại ${API_URL}${path}.${reason} Kiểm tra Wi-Fi, IP máy tính và Windows Firewall.`);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && retry && tokens.refresh) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refresh }),
    });
    if (refreshResponse.ok) {
      const refreshed = await refreshResponse.json();
      await SecureStore.setItemAsync(ACCESS_KEY, refreshed.data.accessToken);
      return request<T>(path, options, false, multipart);
    }
    await clearSession();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Không thể kết nối máy chủ');
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ data: { user: User; accessToken: string; refreshToken: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { fullName: string; email: string; phone: string; password: string }) =>
    request<{ data: { id: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ data: User }>('/users/me'),

  products: (query = '') =>
    request<{ data: { items: Product[]; total: number } }>(`/products/approved${query ? `?${query}` : ''}`),

  productById: (productId: string) => request<{ data: Product }>(`/products/${productId}`),

  myProducts: () => request<{ data: Product[] }>('/products/mine'),

  createProduct: (product: NewProduct) =>
    request<{ data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  uploadProductFile: async (uri: string, name: string, mimeType: string) => {
    const fileResponse = await fetch(uri);
    if (!fileResponse.ok) throw new Error(`Không đọc được file đã chọn (${fileResponse.status}).`);
    const blob = await fileResponse.blob();
    const formData = new FormData();
    formData.append('file', blob, name);
    return request<{ data: { path: string } }>('/uploads/file', {
      method: 'POST',
      body: formData,
    }, true, true);
  },

  uploadProductThumbnail: async (uri: string, name: string, mimeType: string) => {
    const fileResponse = await fetch(uri);
    if (!fileResponse.ok) throw new Error(`Không đọc được ảnh đã chọn (${fileResponse.status}).`);
    const blob = await fileResponse.blob();
    const formData = new FormData();
    formData.append('image', blob, name);
    return request<{ data: { path: string } }>('/uploads/image', {
      method: 'POST',
      body: formData,
    }, true, true);
  },

  categories: () => request<{ data: { id: string; name: string }[] }>('/categories'),

  cart: () => request<{ data: Cart }>('/cart'),

  addToCart: (productId: string) =>
    request<{ data: { id: string } }>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1 }),
    }),

  removeFromCart: (itemId: string) => request(`/cart/items/${itemId}`, { method: 'DELETE' }),

  checkout: () => request<{ data: { orderId: string; totalAmount: number } }>('/cart/checkout', { method: 'POST' }),

  createPayment: (orderId: string, method = 'mock') =>
    request<{ data: PaymentCreateResult }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, method }),
    }),

  mockIpnSuccess: (orderId: string) => {
    const providerTxId = `MOCK-${Date.now()}`;
    return request<{ data?: unknown }>(`/payments/mock-ipn?orderId=${encodeURIComponent(orderId)}&status=success&providerTxId=${encodeURIComponent(providerTxId)}`);
  },

  orders: () => request<{ data: Order[] }>('/orders/my'),

  chatContacts: () => request<{ data: ChatContact[] }>('/chat/contacts'),

  chatConversations: () => request<{ data: ChatConversation[] }>('/chat/conversations'),

  startChat: (participantId: string, productId?: string | null) =>
    request<{ data: ChatConversation }>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId, ...(productId ? { productId } : {}) }),
    }),

  chatMessages: (conversationId: string) =>
    request<{ data: ChatMessage[] }>(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`),

  sendChatMessage: (conversationId: string, content: string) =>
    request<{ data: ChatMessage }>(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  markChatRead: (conversationId: string) =>
    request(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, { method: 'POST' }),

  library: () => request<{ data: LicenseItem[] }>('/content/my-library'),

  productReviews: (productId: string) =>
    request<{ data: ProductReview[] }>(`/reviews/products/${encodeURIComponent(productId)}`),

  createProductReview: (productId: string, rating: number, content: string) =>
    request<{ data: ProductReview }>(`/reviews/products/${encodeURIComponent(productId)}`, {
      method: 'POST',
      body: JSON.stringify({ rating, content }),
    }),

  createReport: (reportedUserId: string, reason: string) =>
    request<{ data: UserReport }>('/reports', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId, reason }),
    }),

  getSignedContentUrl: (productId: string) =>
    request<{ data: { url: string } }>(`/content/signed/${productId}`),

  walletSummary: () => request<{ data: Wallet }>('/wallets/me'),

  walletTransactions: () => request<{ data: UserWalletTxn[] }>('/wallets/transactions'),

  withdrawalRequests: () => request<{ data: WithdrawalRequest[] }>('/wallets/withdrawals/me'),

  createWithdrawalRequest: (payload: { amount: number; bankName: string; bankAccount: string; accountHolder: string }) =>
    request<{ data: { request: WithdrawalRequest; wallet: Wallet } }>('/wallets/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  depositWallet: (amount: number) =>
    request<{ data: Wallet }>('/wallets/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  registerSellerContract: (amount?: number) =>
    request<{ data: { wallet: Wallet; user: User } }>('/wallets/register-seller-contract', {
      method: 'POST',
      body: JSON.stringify(amount === undefined ? {} : { amount }),
    }),

  updateProfile: (payload: Partial<User>) =>
    request<{ data: User }>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  logout: async () => {
    const { refresh } = await readTokens();
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh }),
    }, false).catch(() => undefined);
    await clearSession();
  },
};

export async function hasSession() {
  return Boolean((await readTokens()).refresh);
}
