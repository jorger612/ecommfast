import { Router, Request, Response } from 'express';
import { findPublicProducts, findProductBySlug } from '../models/product.model';
import { findActiveCategoryTree } from '../models/category.model';
import { pool } from '../config/db';

export const productsRouter = Router();

// GET /api/products
productsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const products = await findPublicProducts({
    category_slug: req.query.category_slug as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json({ data: products });
});

// GET /api/products/:slug
productsRouter.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const product = await findProductBySlug(req.params.slug);
  if (!product) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found.' });
    return;
  }
  res.json({ data: product });
});

// GET /api/categories
export const categoriesRouter = Router();
categoriesRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const tree = await findActiveCategoryTree();
  res.json({ data: tree });
});

// GET /api/banners — active banners within date range
export const bannersRouter = Router();
bannersRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    `SELECT id, title, image_url, link_url, start_date, end_date, sort_order
     FROM banners
     WHERE is_active = true
       AND start_date <= CURRENT_DATE
       AND end_date >= CURRENT_DATE
     ORDER BY sort_order ASC`,
  );
  res.json({ data: rows });
});
