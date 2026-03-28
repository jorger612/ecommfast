import { PoolClient } from 'pg';
import { pool } from '../config/db';

export interface CheckoutItem {
  product_id: string;
  quantity: number;
}

export interface StockValidationError {
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
}

/**
 * Validates and decrements stock for all items atomically.
 * Uses SERIALIZABLE isolation to prevent race conditions (T01).
 * If any product lacks stock, the entire transaction rolls back.
 */
export async function decrementStockAtomic(
  items: CheckoutItem[],
  saleId: string,
  performedBy: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    for (const item of items) {
      const { rows } = await client.query<{ stock: number; name: string }>(
        `SELECT stock, name FROM products WHERE id = $1 FOR UPDATE`,
        [item.product_id],
      );

      if (rows.length === 0) {
        throw new ProductNotFoundError(item.product_id);
      }

      const product = rows[0];
      if (product.stock < item.quantity) {
        throw new InsufficientStockError({
          product_id: item.product_id,
          product_name: product.name,
          requested: item.quantity,
          available: product.stock,
        });
      }

      await client.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id],
      );

      await logInventoryMovement(client, {
        product_id: item.product_id,
        sale_id: saleId,
        delta: -item.quantity,
        reason: 'sale',
        performed_by: performedBy,
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Increments stock when a return is approved.
 */
export async function incrementStockForReturn(
  client: PoolClient,
  productId: string,
  quantity: number,
  returnId: string,
  performedBy: string,
): Promise<void> {
  await client.query(
    `UPDATE products SET stock = stock + $1 WHERE id = $2`,
    [quantity, productId],
  );

  await logInventoryMovement(client, {
    product_id: productId,
    return_id: returnId,
    delta: quantity,
    reason: 'return',
    performed_by: performedBy,
  });
}

async function logInventoryMovement(
  client: PoolClient,
  opts: {
    product_id: string;
    delta: number;
    reason: string;
    performed_by: string;
    sale_id?: string;
    return_id?: string;
  },
): Promise<void> {
  const { rows } = await client.query<{ stock: number }>(
    `SELECT stock FROM products WHERE id = $1`,
    [opts.product_id],
  );
  const stockAfter = rows[0]?.stock ?? 0;

  await client.query(
    `INSERT INTO inventory_logs (product_id, sale_id, return_id, delta, stock_after, reason, performed_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      opts.product_id,
      opts.sale_id ?? null,
      opts.return_id ?? null,
      opts.delta,
      stockAfter,
      opts.reason,
      opts.performed_by,
    ],
  );
}

export class InsufficientStockError extends Error {
  constructor(public readonly detail: StockValidationError) {
    super(`Insufficient stock for product ${detail.product_id}`);
    this.name = 'InsufficientStockError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(public readonly productId: string) {
    super(`Product not found: ${productId}`);
    this.name = 'ProductNotFoundError';
  }
}
