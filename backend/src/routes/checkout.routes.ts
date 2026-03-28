import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { decrementStockAtomic, InsufficientStockError, ProductNotFoundError } from '../services/inventory.service';
import { pool } from '../config/db';

export const checkoutRouter = Router();

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ).min(1),
  payment_provider: z.enum(['stripe', 'openpay', 'paypal']),
  payment_method_id: z.string().min(1),
});

checkoutRouter.post(
  '/',
  authenticate,
  validate(checkoutSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { items, payment_provider, payment_method_id } = req.body as z.infer<typeof checkoutSchema>;
    const userId = req.user!.userId;

    // 1. Verify payment provider is enabled
    const { rows: providerRows } = await pool.query(
      `SELECT is_enabled FROM payment_providers WHERE name = $1`,
      [payment_provider],
    );
    if (!providerRows[0]?.is_enabled) {
      res.status(422).json({ error: 'PROVIDER_DISABLED', message: `Payment provider '${payment_provider}' is not enabled.` });
      return;
    }

    // 2. Calculate total (snapshot prices from DB — never from client)
    const productIds = items.map((i) => i.product_id);
    const { rows: priceRows } = await pool.query<{ id: string; price: string; name: string }>(
      `SELECT id, price, name FROM products WHERE id = ANY($1) AND is_active = true`,
      [productIds],
    );

    if (priceRows.length !== productIds.length) {
      res.status(422).json({ error: 'PRODUCT_NOT_FOUND', message: 'One or more products not found.' });
      return;
    }

    const priceMap = new Map(priceRows.map((p) => [p.id, { price: parseFloat(p.price), name: p.name }]));
    const totalAmount = items.reduce((sum, item) => {
      return sum + (priceMap.get(item.product_id)?.price ?? 0) * item.quantity;
    }, 0);

    // 3. Create sale record (status: pending)
    const { rows: saleRows } = await pool.query<{ id: string }>(
      `INSERT INTO sales (user_id, total_amount, status, payment_provider)
       VALUES ($1, $2, 'pending', $3) RETURNING id`,
      [userId, totalAmount, payment_provider],
    );
    const saleId = saleRows[0].id;

    try {
      // 4. Decrement stock atomically (serializable TX) — rolls back if any item lacks stock
      await decrementStockAtomic(items, saleId, userId);

      // 5. Insert sale_items (price snapshot)
      for (const item of items) {
        const unitPrice = priceMap.get(item.product_id)!.price;
        await pool.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
          [saleId, item.product_id, item.quantity, unitPrice],
        );
      }

      // 6. Process payment (placeholder — real gateway call goes here)
      // const paymentResult = await paymentService.charge({ provider: payment_provider, method_id: payment_method_id, amount: totalAmount });

      // 7. Mark sale as paid
      await pool.query(
        `UPDATE sales SET status = 'paid', payment_reference = $1, paid_at = NOW() WHERE id = $2`,
        [payment_method_id, saleId],
      );

      res.status(201).json({
        data: { sale_id: saleId, status: 'paid', total_amount: totalAmount },
      });
    } catch (err) {
      // Cancel sale on any failure
      await pool.query(`UPDATE sales SET status = 'cancelled' WHERE id = $1`, [saleId]);

      if (err instanceof InsufficientStockError) {
        res.status(422).json({
          error: 'INSUFFICIENT_STOCK',
          message: `El producto '${err.detail.product_name}' no tiene stock suficiente.`,
          product_id: err.detail.product_id,
          available: err.detail.available,
          requested: err.detail.requested,
        });
        return;
      }
      if (err instanceof ProductNotFoundError) {
        res.status(422).json({ error: 'PRODUCT_NOT_FOUND', message: `Product not found: ${err.productId}` });
        return;
      }
      throw err;
    }
  },
);
