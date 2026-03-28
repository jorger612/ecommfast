import { pool } from '../config/db';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  parent_id: string | null;
  children?: Category[];
}

/**
 * Returns active category tree using recursive CTE.
 * Handles cascade: if parent is inactive, subtree is excluded.
 */
export async function findActiveCategoryTree(): Promise<Category[]> {
  const { rows } = await pool.query<Category>(
    `WITH RECURSIVE active_tree AS (
       SELECT id, name, slug, description, is_active, sort_order, parent_id
       FROM categories
       WHERE is_active = true AND parent_id IS NULL
       UNION ALL
       SELECT c.id, c.name, c.slug, c.description, c.is_active, c.sort_order, c.parent_id
       FROM categories c
       INNER JOIN active_tree p ON p.id = c.parent_id
       WHERE c.is_active = true
     )
     SELECT * FROM active_tree ORDER BY sort_order ASC`,
  );

  return buildTree(rows, null);
}

function buildTree(rows: Category[], parentId: string | null): Category[] {
  return rows
    .filter((r) => r.parent_id === parentId)
    .map((r) => ({ ...r, children: buildTree(rows, r.id) }));
}
