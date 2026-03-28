import { api } from './api';

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  photos: string[];
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  children?: Category[];
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sort_order: number;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  quantity_before: number;
  quantity_after: number;
  reason: string;
  created_at: string;
}

export const productsService = {
  list: (params?: { category_slug?: string; search?: string; page?: number }) =>
    api.get<{ data: Product[] }>('/products', { params }).then((r) => r.data.data),

  getBySlug: (slug: string) =>
    api.get<{ data: Product }>(`/products/${slug}`).then((r) => r.data.data),
};

export const categoriesService = {
  list: () => api.get<{ data: Category[] }>('/categories').then((r) => r.data.data),
};

export const bannersService = {
  list: () => api.get<{ data: Banner[] }>('/banners').then((r) => r.data.data),
};

// ─── ADMIN SERVICES ──────────────────────────────────────────────────────────

export type ProductPayload = {
  category_id: string; name: string; slug: string; description?: string;
  price: number; stock: number; photos: string[]; is_active: boolean; sort_order: number;
};

export const adminProductsService = {
  list: () => api.get<{ data: Product[] }>('/admin/products').then((r) => r.data.data),
  create: (body: ProductPayload) => api.post<{ data: Product }>('/admin/products', body).then((r) => r.data.data),
  update: (id: string, body: Partial<ProductPayload>) => api.patch<{ data: Product }>(`/admin/products/${id}`, body).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/admin/products/${id}`),
};

export type CategoryPayload = {
  name: string; slug: string; description?: string;
  is_active: boolean; sort_order: number; parent_id?: string | null;
};

export const adminCategoriesService = {
  list: () => api.get<{ data: Category[] }>('/admin/categories').then((r) => r.data.data),
  create: (body: CategoryPayload) => api.post<{ data: Category }>('/admin/categories', body).then((r) => r.data.data),
  update: (id: string, body: Partial<CategoryPayload>) => api.patch<{ data: Category }>(`/admin/categories/${id}`, body).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/admin/categories/${id}`),
};

export type BannerPayload = {
  title: string; image_url: string; link_url?: string;
  start_date: string; end_date: string; is_active: boolean; sort_order: number;
};

export const adminBannersService = {
  list: () => api.get<{ data: Banner[] }>('/admin/banners').then((r) => r.data.data),
  create: (body: BannerPayload) => api.post<{ data: Banner }>('/admin/banners', body).then((r) => r.data.data),
  update: (id: string, body: Partial<BannerPayload>) => api.patch<{ data: Banner }>(`/admin/banners/${id}`, body).then((r) => r.data.data),
  remove: (id: string) => api.delete(`/admin/banners/${id}`),
};

export const adminInventoryService = {
  logs: (product_id?: string) =>
    api.get<{ data: InventoryLog[] }>('/admin/inventory-logs', { params: product_id ? { product_id } : {} })
       .then((r) => r.data.data),
};
