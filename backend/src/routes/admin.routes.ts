import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { pool } from '../config/db';

export const adminRouter = Router();

// All admin routes require auth + admin role
adminRouter.use(authenticate, requireAdmin);

// ─── PAYMENT PROVIDERS ────────────────────────────────────────────────────────
adminRouter.get('/payment-providers', async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    `SELECT id, name, is_enabled, apple_pay_enabled, google_pay_enabled, config FROM payment_providers ORDER BY name`,
  );
  res.json({ data: rows });
});

const paymentProviderSchema = z.object({
  is_enabled:          z.boolean().optional(),
  apple_pay_enabled:   z.boolean().optional(),
  google_pay_enabled:  z.boolean().optional(),
});

adminRouter.patch('/payment-providers/:name', validate(paymentProviderSchema), async (req: Request, res: Response): Promise<void> => {
  const { name } = req.params;
  const updates = req.body as z.infer<typeof paymentProviderSchema>;

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.is_enabled !== undefined) { fields.push(`is_enabled = $${values.push(updates.is_enabled)}`); }
  if (updates.apple_pay_enabled !== undefined) { fields.push(`apple_pay_enabled = $${values.push(updates.apple_pay_enabled)}`); }
  if (updates.google_pay_enabled !== undefined) { fields.push(`google_pay_enabled = $${values.push(updates.google_pay_enabled)}`); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'NO_FIELDS', message: 'No fields to update.' });
    return;
  }

  values.push(name);
  await pool.query(`UPDATE payment_providers SET ${fields.join(', ')}, updated_at = NOW() WHERE name = $${values.length}`, values);
  res.json({ data: { message: 'Provider updated.' } });
});

// ─── PRODUCTS ADMIN ───────────────────────────────────────────────────────────
const productSchema = z.object({
  category_id: z.string().uuid(),
  name:        z.string().min(1).trim(),
  slug:        z.string().min(1).trim(),
  description: z.string().optional(),
  price:       z.number().positive(),
  stock:       z.number().int().min(0),
  photos:      z.array(z.string().url()).max(5),
  is_active:   z.boolean().default(true),
  sort_order:  z.number().int().default(0),
});

adminRouter.get('/products', async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(`SELECT * FROM products ORDER BY sort_order ASC, created_at DESC`);
  res.json({ data: rows });
});

adminRouter.post('/products', validate(productSchema), async (req: Request, res: Response): Promise<void> => {
  const { category_id, name, slug, description, price, stock, photos, is_active, sort_order } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO products (category_id, name, slug, description, price, stock, photos, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [category_id, name, slug, description ?? null, price, stock, JSON.stringify(photos), is_active, sort_order],
  );
  res.status(201).json({ data: rows[0] });
});

adminRouter.patch('/products/:id', validate(productSchema.partial()), async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<z.infer<typeof productSchema>>;
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(body)) {
    if (val !== undefined) {
      const v = key === 'photos' ? JSON.stringify(val) : val;
      fields.push(`${key} = $${values.push(v)}`);
    }
  }
  if (fields.length === 0) { res.status(400).json({ error: 'NO_FIELDS' }); return; }
  values.push(req.params.id);
  const { rows } = await pool.query(`UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
  res.json({ data: rows[0] });
});

// ─── CATEGORIES ADMIN ─────────────────────────────────────────────────────────
const categorySchema = z.object({
  name:        z.string().min(1).trim(),
  slug:        z.string().min(1).trim(),
  description: z.string().optional(),
  is_active:   z.boolean().default(true),
  sort_order:  z.number().int().default(0),
  parent_id:   z.string().uuid().optional().nullable(),
});

adminRouter.post('/categories', validate(categorySchema), async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, is_active, sort_order, parent_id } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO categories (name, slug, description, is_active, sort_order, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, slug, description ?? null, is_active, sort_order, parent_id ?? null],
  );
  res.status(201).json({ data: rows[0] });
});

adminRouter.patch('/categories/:id', validate(categorySchema.partial()), async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<z.infer<typeof categorySchema>>;
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (val !== undefined) fields.push(`${key} = $${values.push(val)}`);
  }
  if (fields.length === 0) { res.status(400).json({ error: 'NO_FIELDS' }); return; }
  values.push(req.params.id);
  const { rows } = await pool.query(`UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
  res.json({ data: rows[0] });
});

// ─── BANNERS ADMIN ────────────────────────────────────────────────────────────
const bannerSchema = z.object({
  title:      z.string().min(1).trim(),
  image_url:  z.string().url(),
  link_url:   z.string().url().optional(),
  start_date: z.string().date(),
  end_date:   z.string().date(),
  is_active:  z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

adminRouter.post('/banners', validate(bannerSchema), async (req: Request, res: Response): Promise<void> => {
  const { title, image_url, link_url, start_date, end_date, is_active, sort_order } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO banners (title, image_url, link_url, start_date, end_date, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [title, image_url, link_url ?? null, start_date, end_date, is_active, sort_order],
  );
  res.status(201).json({ data: rows[0] });
});

// ─── INVENTORY LOGS ───────────────────────────────────────────────────────────
adminRouter.get('/inventory-logs', async (req: Request, res: Response): Promise<void> => {
  const productId = req.query.product_id as string | undefined;
  const params: unknown[] = [];
  const where = productId ? `WHERE il.product_id = $${params.push(productId)}` : '';

  const { rows } = await pool.query(
    `SELECT il.*, p.name AS product_name
     FROM inventory_logs il
     JOIN products p ON p.id = il.product_id
     ${where}
     ORDER BY il.created_at DESC
     LIMIT 200`,
    params,
  );
  res.json({ data: rows });
});
