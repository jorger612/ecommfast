import { pool } from '../config/db';
import { incrementStockForReturn } from './inventory.service';

const RETURN_WINDOW_DAYS = 30;

export interface ReturnRequest {
  sale_id: string;
  sale_item_id: string;
  quantity: number;
  reason: string;
  user_id: string;
}

export class ReturnWindowExpiredError extends Error {
  constructor(
    public readonly saleDate: Date,
    public readonly deadline: Date,
  ) {
    super('Return window of 30 days has expired.');
    this.name = 'ReturnWindowExpiredError';
  }
}

export class ReturnQuantityExceededError extends Error {
  constructor() {
    super('Return quantity exceeds the quantity originally purchased.');
    this.name = 'ReturnQuantityExceededError';
  }
}

/**
 * Creates a return request after validating the 30-day window.
 * The window is computed using the DB server's NOW() — never the client date (T02).
 */
export async function requestReturn(req: ReturnRequest): Promise<{ return_id: string }> {
  const client = await pool.connect();
  try {
    // Fetch sale and item data from DB (trusted source for dates)
    const { rows: saleRows } = await client.query<{
      paid_at: Date;
      status: string;
      quantity: number;
      product_id: string;
    }>(
      `SELECT s.paid_at, s.status, si.quantity, si.product_id
       FROM sales s
       JOIN sale_items si ON si.id = $2 AND si.sale_id = s.id
       WHERE s.id = $1 AND s.user_id = $3`,
      [req.sale_id, req.sale_item_id, req.user_id],
    );

    if (saleRows.length === 0) {
      throw new Error('Sale or item not found.');
    }

    const { paid_at, status, quantity: originalQty, product_id } = saleRows[0];

    if (status !== 'paid' && status !== 'delivered' && status !== 'shipped') {
      throw new Error(`Sale status '${status}' is not eligible for returns.`);
    }

    // Validate 30-day window using server date (T02 — never trust client date)
    const deadline = new Date(paid_at);
    deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);

    const { rows: nowRows } = await client.query<{ now: Date }>('SELECT NOW() AS now');
    const serverNow = nowRows[0].now;

    if (serverNow > deadline) {
      throw new ReturnWindowExpiredError(paid_at, deadline);
    }

    if (req.quantity > originalQty) {
      throw new ReturnQuantityExceededError();
    }

    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO returns (sale_id, sale_item_id, quantity, reason, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [req.sale_id, req.sale_item_id, req.quantity, req.reason],
    );

    return { return_id: rows[0].id };
  } finally {
    client.release();
  }
}

/**
 * Admin approves a return: increments stock and marks as completed.
 */
export async function approveReturn(
  returnId: string,
  adminId: string,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query<{
      quantity: number;
      product_id: string;
      status: string;
    }>(
      `SELECT r.quantity, si.product_id, r.status
       FROM returns r
       JOIN sale_items si ON si.id = r.sale_item_id
       WHERE r.id = $1 FOR UPDATE`,
      [returnId],
    );

    if (rows.length === 0) throw new Error('Return not found.');
    if (rows[0].status !== 'pending') throw new Error('Return is not in pending status.');

    const { quantity, product_id } = rows[0];

    await incrementStockForReturn(client, product_id, quantity, returnId, adminId);

    await client.query(
      `UPDATE returns SET status = 'completed', resolved_at = NOW() WHERE id = $1`,
      [returnId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function rejectReturn(returnId: string): Promise<void> {
  await pool.query(
    `UPDATE returns SET status = 'rejected', resolved_at = NOW() WHERE id = $1 AND status = 'pending'`,
    [returnId],
  );
}
