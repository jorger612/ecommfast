import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  requestReturn,
  approveReturn,
  rejectReturn,
  ReturnWindowExpiredError,
  ReturnQuantityExceededError,
} from '../services/returns.service';

export const returnsRouter = Router();

const returnSchema = z.object({
  sale_id:      z.string().uuid(),
  sale_item_id: z.string().uuid(),
  quantity:     z.number().int().positive(),
  reason:       z.string().min(10).max(500),
});

// POST /api/returns — customer requests a return
returnsRouter.post(
  '/',
  authenticate,
  validate(returnSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await requestReturn({ ...req.body, user_id: req.user!.userId });
      res.status(201).json({ data: result });
    } catch (err) {
      if (err instanceof ReturnWindowExpiredError) {
        res.status(422).json({
          error: 'RETURN_WINDOW_EXPIRED',
          message: 'El plazo de devolución de 30 días ha expirado.',
          sale_date: err.saleDate,
          deadline: err.deadline,
        });
        return;
      }
      if (err instanceof ReturnQuantityExceededError) {
        res.status(422).json({
          error: 'QUANTITY_EXCEEDED',
          message: 'La cantidad a devolver supera la cantidad comprada.',
        });
        return;
      }
      throw err;
    }
  },
);

// PATCH /api/admin/returns/:id/approve
returnsRouter.patch(
  '/admin/:id/approve',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    await approveReturn(req.params.id, req.user!.userId);
    res.json({ data: { message: 'Return approved and stock restored.' } });
  },
);

// PATCH /api/admin/returns/:id/reject
returnsRouter.patch(
  '/admin/:id/reject',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    await rejectReturn(req.params.id);
    res.json({ data: { message: 'Return rejected.' } });
  },
);
