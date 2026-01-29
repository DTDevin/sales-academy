/**
 * Auth service – register, login, refresh. Passwords hashed with bcrypt.
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { config } from '../config';
import { JwtPayload, UserPublic } from '../types';
import { AppError } from '../middleware/errorHandler';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: UserPublic;
  accessToken: string;
  accessExpiresIn: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (email.length < 3) {
    const err: AppError = new Error('Invalid email');
    err.statusCode = 400;
    throw err;
  }
  if (!input.password || input.password.length < 8) {
    const err: AppError = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }
  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [id, email, password_hash, 'user']
    );
    await pool.query(
      'INSERT INTO profiles (user_id, track_default) VALUES ($1, $2)',
      [id, 'amy']
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('unique') || msg.includes('duplicate')) {
      const err: AppError = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
  const user: UserPublic = {
    id,
    email,
    role: 'user',
    created_at: new Date(),
  };
  const accessToken = signAccessToken(id, email);
  return {
    user,
    accessToken,
    accessExpiresIn: config.jwt.accessExpiresIn,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const r = await pool.query<{ id: string; email: string; role: string; password_hash: string; created_at: Date }>(
    'SELECT id, email, role, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  if (r.rows.length === 0) {
    const err: AppError = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const row = r.rows[0];
  const ok = await bcrypt.compare(input.password, row.password_hash);
  if (!ok) {
    const err: AppError = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const user: UserPublic = {
    id: row.id,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
  const accessToken = signAccessToken(row.id, row.email);
  return {
    user,
    accessToken,
    accessExpiresIn: config.jwt.accessExpiresIn,
  };
}

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: 'access' } as JwtPayload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions
  );
}

export function signRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email, type: 'refresh' } as JwtPayload,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  if (decoded.type !== 'refresh') {
    const err: AppError = new Error('Invalid token type');
    err.statusCode = 401;
    throw err;
  }
  return decoded;
}

export async function refreshTokens(refreshToken: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const r = await pool.query<{ id: string; email: string; role: string; created_at: Date }>(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [payload.sub]
  );
  if (r.rows.length === 0) {
    const err: AppError = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }
  const row = r.rows[0];
  const user: UserPublic = {
    id: row.id,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
  const accessToken = signAccessToken(row.id, row.email);
  return {
    user,
    accessToken,
    accessExpiresIn: config.jwt.accessExpiresIn,
  };
}
