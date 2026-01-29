/**
 * Academy Stats – Tagesstatistik (calls, connects, termine) und Streak.
 */
import { pool } from '../db/pool';

export interface DailyStats {
  calls: number;
  connects: number;
  termine: number;
  streak: number;
  stats_date: string;
}

function todayDateString(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export async function getOrCreateTodayRow(userId: string): Promise<{ calls: number; connects: number; termine: number }> {
  const today = todayDateString();
  const r = await pool.query<{ calls: number; connects: number; termine: number }>(
    'INSERT INTO user_daily_stats (user_id, stats_date, calls, connects, termine) VALUES ($1, $2::date, 0, 0, 0) ON CONFLICT (user_id, stats_date) DO UPDATE SET updated_at = now() RETURNING calls, connects, termine',
    [userId, today]
  );
  return r.rows[0] ?? { calls: 0, connects: 0, termine: 0 };
}

export async function getStats(userId: string): Promise<DailyStats> {
  const today = todayDateString();
  const row = await pool.query<{ calls: number; connects: number; termine: number }>(
    'SELECT calls, connects, termine FROM user_daily_stats WHERE user_id = $1 AND stats_date = $2::date',
    [userId, today]
  );
  const stats = row.rows[0] ?? { calls: 0, connects: 0, termine: 0 };
  const streak = await computeStreak(userId, today);
  return {
    calls: Number(stats.calls),
    connects: Number(stats.connects),
    termine: Number(stats.termine),
    streak,
    stats_date: today,
  };
}

async function computeStreak(userId: string, upToDate: string): Promise<number> {
  const r = await pool.query<{ stats_date: string }>(
    `SELECT stats_date::text AS stats_date FROM user_daily_stats
     WHERE user_id = $1 AND stats_date <= $2::date AND (calls > 0 OR termine > 0)
     ORDER BY stats_date DESC
     LIMIT 365`,
    [userId, upToDate]
  );
  const rows = r.rows;
  if (rows.length === 0) return 0;
  let streak = 0;
  const oneDay = 24 * 60 * 60 * 1000;
  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(upToDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.getFullYear() + '-' + String(expected.getMonth() + 1).padStart(2, '0') + '-' + String(expected.getDate()).padStart(2, '0');
    if (rows[i].stats_date === expectedStr) streak++;
    else break;
  }
  return streak;
}

export async function logCall(userId: string): Promise<DailyStats> {
  const today = todayDateString();
  await pool.query(
    `INSERT INTO user_daily_stats (user_id, stats_date, calls, connects, termine)
     VALUES ($1, $2::date, 1, 0, 0)
     ON CONFLICT (user_id, stats_date) DO UPDATE SET calls = user_daily_stats.calls + 1, updated_at = now()`,
    [userId, today]
  );
  return getStats(userId);
}

export async function logTermin(userId: string): Promise<DailyStats> {
  const today = todayDateString();
  await pool.query(
    `INSERT INTO user_daily_stats (user_id, stats_date, calls, connects, termine)
     VALUES ($1, $2::date, 0, 1, 1)
     ON CONFLICT (user_id, stats_date) DO UPDATE SET
       connects = user_daily_stats.connects + 1,
       termine = user_daily_stats.termine + 1,
       updated_at = now()`,
    [userId, today]
  );
  return getStats(userId);
}
