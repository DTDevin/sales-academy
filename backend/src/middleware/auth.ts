/**
 * JWT auth middleware – verifies access token and attaches user to request.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err: AppError = new Error('Missing or invalid Authorization header');
    err.statusCode = 401;
    return next(err);
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    if (decoded.type !== 'access') {
      const err: AppError = new Error('Invalid token type');
      err.statusCode = 401;
      return next(err);
    }
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    next();
  } catch {
    const err: AppError = new Error('Invalid or expired token');
    err.statusCode = 401;
    return next(err);
  }
}
