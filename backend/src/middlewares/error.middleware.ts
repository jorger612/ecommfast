import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request data.',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
}
