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
  sort_order: number;
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
