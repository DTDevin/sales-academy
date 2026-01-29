/**
 * Safe request logging – method, path, statusCode, duration only.
 * NEVER log: Authorization, Cookie, req.body, or any token/password.
 */
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    if (res.statusCode >= 500) {
      console.error('[API] ' + msg);
    } else if (res.statusCode >= 400) {
      console.warn('[API] ' + msg);
    } else {
      console.log('[API] ' + msg);
    }
  });
  next();
}
