import api from './client';
import type { ApiResponse } from '../types/auth';

export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type ProductVisibility = 'active' | 'inactive';

export interface ProductRecord {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  categoryName?: string;
  sellerId?: string;
  sellerName?: string;
  type?: string;
  thumbnail?: string;
  fileUrl?: string;
  fileName?: string;
  status: ProductStatus;
  visible: ProductVisibility;
  reviewStatus?: ProductStatus;
  visibility?: ProductVisibility;
  createdAt?: string;
  avgRating?: number;
}

export const getProducts = async () => {
  const statuses: ProductStatus[] = ['pending', 'approved', 'rejected'];
  const responses = await Promise.all(statuses.map((reviewStatus) =>
    api.get<ApiResponse<{ items: ProductRecord[] }>>('/products/search', {
      params: { pageSize: 100, reviewStatus },
    }),
  ));
  return {
    success: responses.every((response) => response.data.success),
    data: responses.flatMap((response) => response.data.data?.items ?? []).map(normalizeProduct),
  };
};

const normalizeProduct = (product: ProductRecord & {
  title?: string;
  reviewStatus?: ProductStatus;
  visibility?: ProductVisibility;
  Category?: { name?: string };
  seller?: { id?: string; fullName?: string };
}) => ({
  ...product,
  name: product.name ?? product.title ?? '',
  categoryName: product.categoryName ?? product.Category?.name,
  sellerId: product.sellerId ?? product.seller?.id,
  sellerName: product.sellerName ?? product.seller?.fullName,
  status: product.status ?? product.reviewStatus,
  visible: product.visible ?? product.visibility,
});

export const getProductById = async (id: string) => {
  const response = await api.get<ApiResponse<ProductRecord>>(`/admin/products/${id}`);
  const product = response.data.data as ProductRecord & Parameters<typeof normalizeProduct>[0];
  return { ...response.data, data: product ? normalizeProduct(product) : product };
};

export const updateProductApproval = async (id: string, status: ProductStatus) => {
  const action = status === 'approved' ? 'approve' : 'reject';
  const response = await api.post<ApiResponse<null>>(`/admin/products/${id}/${action}`);
  return response.data;
};

export const updateProductVisibility = async (id: string, visibility: ProductVisibility) => {
  const response = await api.put<ApiResponse<ProductRecord>>(`/products/${id}`, { visibility });
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete<ApiResponse<null>>(`/products/${id}`);
  return response.data;
};
