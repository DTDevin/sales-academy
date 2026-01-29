/**
 * Simple migration runner: runs SQL files in src/db/migrations in order.
 * Creates schema_migrations table to track applied migrations.
 */
import * as fs from 'fs';
import * as path from 'path';
import { pool } from './pool';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations(): Promise<string[]> {
  const r = await pool.query<{ name: string }>('SELECT name FROM schema_migrations ORDER BY name');
  return r.rows.map((row) => row.name);
}

async function up(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const name = path.basename(file, '.sql');
    if (applied.includes(name)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    console.log('[migrate] applied:', name);
  }
}

async function down(): Promise<void> {
  const applied = await appliedMigrations();
  if (applied.length === 0) return;
  const last = applied[applied.length - 1];
  // For 001_initial: drop tables in reverse order
  if (last === '001_initial') {
    await pool.query('DROP TRIGGER IF EXISTS users_updated_at ON users');
    await pool.query('DROP TRIGGER IF EXISTS profiles_updated_at ON profiles');
    await pool.query('DROP TABLE IF EXISTS profiles');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.query('DROP FUNCTION IF EXISTS set_updated_at()');
    await pool.query("DELETE FROM schema_migrations WHERE name = '001_initial'");
    console.log('[migrate] reverted: 001_initial');
  } else if (last === '002_leads') {
    await pool.query('DROP TRIGGER IF EXISTS leads_updated_at ON leads');
    await pool.query('DROP TABLE IF EXISTS leads');
    await pool.query('DROP TABLE IF EXISTS lead_sources');
    await pool.query('DROP TABLE IF EXISTS abteilungen');
    await pool.query('DROP TABLE IF EXISTS branchen');
    await pool.query("DELETE FROM schema_migrations WHERE name = '002_leads'");
    console.log('[migrate] reverted: 002_leads');
  } else if (last === '003_chat') {
    await pool.query('DROP TABLE IF EXISTS chat_messages');
    await pool.query('DROP TABLE IF EXISTS chat_threads');
    await pool.query("DELETE FROM schema_migrations WHERE name = '003_chat'");
    console.log('[migrate] reverted: 003_chat');
  } else if (last === '004_documents') {
    await pool.query('DROP TRIGGER IF EXISTS documents_updated_at ON documents');
    await pool.query('DROP TABLE IF EXISTS document_shares');
    await pool.query('DROP TABLE IF EXISTS document_versions');
    await pool.query('DROP TABLE IF EXISTS documents');
    await pool.query("DELETE FROM schema_migrations WHERE name = '004_documents'");
    console.log('[migrate] reverted: 004_documents');
  } else if (last === '005_user_daily_stats') {
    await pool.query('DROP TRIGGER IF EXISTS user_daily_stats_updated_at ON user_daily_stats');
    await pool.query('DROP TABLE IF EXISTS user_daily_stats');
    await pool.query("DELETE FROM schema_migrations WHERE name = '005_user_daily_stats'");
    console.log('[migrate] reverted: 005_user_daily_stats');
  } else if (last === '006_user_ritual') {
    await pool.query('DROP TRIGGER IF EXISTS user_ritual_updated_at ON user_ritual');
    await pool.query('DROP TABLE IF EXISTS user_ritual');
    await pool.query("DELETE FROM schema_migrations WHERE name = '006_user_ritual'");
    console.log('[migrate] reverted: 006_user_ritual');
  } else if (last === '007_team_chat') {
    await pool.query('DROP TRIGGER IF EXISTS user_presence_updated_at ON user_presence');
    await pool.query('DROP TRIGGER IF EXISTS team_chats_updated_at ON team_chats');
    await pool.query('DROP TABLE IF EXISTS reaction_catalog');
    await pool.query('DROP TABLE IF EXISTS team_message_reads');
    await pool.query('DROP TABLE IF EXISTS team_message_reactions');
    await pool.query('DROP TABLE IF EXISTS team_messages');
    await pool.query('DROP TABLE IF EXISTS team_chat_members');
    await pool.query('DROP TABLE IF EXISTS team_chats');
    await pool.query('DROP TABLE IF EXISTS user_presence');
    await pool.query("DELETE FROM schema_migrations WHERE name = '007_team_chat'");
    console.log('[migrate] reverted: 007_team_chat');
  }
}

const cmd = process.argv[2];
if (cmd === 'up') up().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
else if (cmd === 'down') down().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
else {
  console.error('Usage: npm run migrate:up | npm run migrate:down');
  process.exit(1);
}
