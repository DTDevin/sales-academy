/**
 * Central configuration – environment and constants.
 * Never log secrets; validate required vars at startup.
 */
import dotenv from 'dotenv';

dotenv.config();

const required = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key] || String(process.env[key]).trim() === '') {
    throw new Error(`Missing required env: ${key}. Copy env.example to .env and set values.`);
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV! as 'development' | 'production' | 'test',
  port: parseInt(process.env.PORT!, 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || 'sales_academy_refresh',
    refreshCookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  cors: {
    // Development: Allow local origins
    // Production: Use CORS_ORIGIN env var (comma-separated for multiple origins)
    origin: process.env.NODE_ENV === 'development' 
      ? ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000']
      : (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim()),
    credentials: true,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    authWindowMs: 15 * 60 * 1000,
    authMax: 10,
  },
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://dt-devin.app.n8n.cloud/webhook/cf-chatbot',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSizeBytes: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10), // 10 MB
    allowedMime: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'text/csv'],
  },
} as const;
