import { pool } from '../config/db';

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
  created_at: Date;
  updated_at: Date;
}

export interface ProductFilters {
  category_slug?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Returns active products whose category is also active (RF-06 cascade).
 * Products in inactive categories are NEVER returned.
 */
export async function findPublicProducts(filters: ProductFilters): Promise<Product[]> {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  const conditions: string[] = ['p.is_active = true', 'c.is_active = true'];

  if (filters.category_slug) {
    params.push(filters.category_slug);
    conditions.push(`c.slug = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }

  params.push(limit, offset);

  const { rows } = await pool.query<Product>(
    `SELECT p.id, p.category_id, p.name, p.slug, p.description,
            p.price, p.is_active, p.sort_order, p.photos,
            CASE WHEN p.stock > 0 THEN p.stock ELSE 0 END AS stock,
            p.created_at, p.updated_at
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.sort_order ASC, p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return rows;
}

export async function findProductBySlug(slug: string): Promise<Product | null> {
  const { rows } = await pool.query<Product>(
    `SELECT p.*
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND p.is_active = true AND c.is_active = true`,
    [slug],
  );
  return rows[0] ?? null;
}
