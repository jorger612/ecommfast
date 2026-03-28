import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { env } from '../config/env';
import { validate } from '../middlewares/validate.middleware';

export const authRouter = Router();

const registerSchema = z.object({
  email:      z.string().email().trim().toLowerCase(),
  password:   z.string().min(8),
  first_name: z.string().min(1).trim(),
  last_name:  z.string().min(1).trim(),
  phone:      z.string().optional(),
});

const loginSchema = z.object({
  email:    z.string().email().trim().toLowerCase(),
  password: z.string().min(1),
});

authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, phone } = req.body;

  const { rows: existing } = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );
  if (existing.length > 0) {
    res.status(409).json({ error: 'EMAIL_TAKEN', message: 'Email already registered.' });
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query<{ id: string; role: string }>(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, role`,
    [email, password_hash, first_name, last_name, phone ?? null],
  );

  const user = rows[0];
  const accessToken = signAccessToken(user.id, user.role as 'customer' | 'admin');
  res.status(201).json({ data: { access_token: accessToken } });
});

authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { rows } = await pool.query<{ id: string; password_hash: string; role: string }>(
    `SELECT id, password_hash, role FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );

  if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    return;
  }

  const user = rows[0];
  const accessToken = signAccessToken(user.id, user.role as 'customer' | 'admin');
  const refreshToken = signRefreshToken(user.id);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ data: { access_token: accessToken } });
});

authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refresh_token');
  res.json({ data: { message: 'Logged out.' } });
});

function signAccessToken(userId: string, role: 'customer' | 'admin'): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}
