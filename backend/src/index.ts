/**
 * Sales Academy API – Entry point.
 * Enterprise C: helmet, cors, rate-limit, structured errors.
 * Now with WebSocket for real-time Team-Chat! 🚀
 */
import * as path from 'path';
import * as fs from 'fs';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { pool } from './db/pool';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import leadsRoutes from './routes/leads.routes';
import leadgenRoutes from './routes/leadgen.routes';
import chatRoutes from './routes/chat.routes';
import documentsRoutes from './routes/documents.routes';
import teamchatRoutes from './routes/teamchat.routes';
import { initWebSocket } from './websocket';

// ═══════════════════════════════════════════════════════════════
// AUTO-MIGRATION: Run database migrations on startup
// ═══════════════════════════════════════════════════════════════
async function runMigrations(): Promise<void> {
  console.log('[Migration] Starting database migrations...');
  
  // Create migrations table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  
  // Get already applied migrations
  const applied = (await pool.query<{ name: string }>('SELECT name FROM schema_migrations ORDER BY name')).rows.map(r => r.name);
  
  // Find migrations directory
  const migrationsDir = path.join(__dirname, 'db', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('[Migration] No migrations directory found at:', migrationsDir);
    return;
  }
  
  // Get and sort SQL files
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  for (const file of files) {
    const name = path.basename(file, '.sql');
    if (applied.includes(name)) {
      console.log('[Migration] Already applied:', name);
      continue;
    }
    
    console.log('[Migration] Applying:', name);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    console.log('[Migration] ✓ Applied:', name);
  }
  
  console.log('[Migration] All migrations complete!');
}

const app = express();
const server = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '256kb' }));

// Safe request logging (method, path, status, duration only – no Auth, Cookie, or body)
app.use(requestLogger);

// General rate limit
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter limit for auth
app.use(
  '/api/auth',
  rateLimit({
    windowMs: config.rateLimit.authWindowMs,
    max: config.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', async (_req, res) => {
  const ts = new Date().toISOString();
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', ts });
  } catch {
    res.status(503).json({ status: 'error', db: 'unavailable', ts });
  }
});

// Static files for uploads (avatars, etc.)
const uploadsDir = path.resolve(process.cwd(), config.upload.dir);
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/leadgen', leadgenRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/team-chat', teamchatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Initialize WebSocket for real-time Team-Chat
initWebSocket(server);

// ═══════════════════════════════════════════════════════════════
// START SERVER: Run migrations first, then start listening
// ═══════════════════════════════════════════════════════════════
async function startServer(): Promise<void> {
  try {
    // Run migrations before anything else
    await runMigrations();
    
    // Start server
    server.listen(config.port, () => {
      console.log(`[Sales Academy API] listening on port ${config.port} (${config.nodeEnv})`);
      console.log(`[WebSocket] Real-time Team-Chat enabled 🚀`);
    });
  } catch (error) {
    console.error('[Startup] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
