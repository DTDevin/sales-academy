/**
 * Simple request validation – body/params must contain required string fields.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function requireBody(...keys: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      const err: AppError = new Error('Request body must be a JSON object');
      err.statusCode = 400;
      return next(err);
    }
    for (const key of keys) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        const err: AppError = new Error(`Missing or empty field: ${key}`);
        err.statusCode = 400;
        return next(err);
      }
      if (typeof body[key] !== 'string') {
        const err: AppError = new Error(`Field must be string: ${key}`);
        err.statusCode = 400;
        return next(err);
      }
    }
    next();
  };
}
