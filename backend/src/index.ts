import './config/env'; // Validates env on startup
import express from 'express';
import { pool } from './config/db';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';

import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/error.middleware';

import { authRouter } from './routes/auth.routes';
import { productsRouter, categoriesRouter, bannersRouter } from './routes/products.routes';
import { checkoutRouter } from './routes/checkout.routes';
import { returnsRouter } from './routes/returns.routes';
import { adminRouter } from './routes/admin.routes';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(pinoHttp({ logger }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true });

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/products',   productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/banners',    bannersRouter);
app.use('/api/checkout',   checkoutRouter);
app.use('/api/returns',    returnsRouter);
app.use('/api/admin',      adminRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── DB connection validation before accepting traffic ─────────────────────────
async function startServer() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('Database connection verified.');
  } catch (err) {
    logger.error(
      { err },
      'Cannot connect to PostgreSQL. Is the service running? Run: sudo service postgresql start',
    );
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info(`EcommFast API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

startServer();

export default app;
