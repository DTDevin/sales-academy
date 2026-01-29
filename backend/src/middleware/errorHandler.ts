/**
 * Global error handler – never leak stack or internals in production.
 */
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode < 500 ? (err.message || 'Bad Request') : 'Internal Server Error';
  const body: Record<string, unknown> = { error: message };
  if (config.nodeEnv === 'development' && err.stack) {
    body.stack = err.stack;
  }
  if (err.code) body.code = err.code;
  res.status(statusCode).json(body);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found', path: req.path });
}
