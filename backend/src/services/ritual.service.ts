/**
 * Ritual service – tägliche Checkliste (4 Punkte) pro User.
 */
import { pool } from '../db/pool';

function todayDateString(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/** checked = [bool, bool, bool, bool] für die 4 Ritual-Items */
export async function getRitual(userId: string): Promise<{ checked: boolean[] }> {
  const today = todayDateString();
  const r = await pool.query<{ checked: unknown }>(
    'SELECT checked FROM user_ritual WHERE user_id = $1 AND ritual_date = $2::date',
    [userId, today]
  );
  const row = r.rows[0];
  if (!row || !Array.isArray(row.checked)) {
    return { checked: [false, false, false, false] };
  }
  const checked = row.checked.slice(0, 4).map((v) => Boolean(v));
  while (checked.length < 4) checked.push(false);
  return { checked };
}

export async function setRitual(userId: string, checked: boolean[]): Promise<{ checked: boolean[] }> {
  const today = todayDateString();
  const arr = checked.slice(0, 4);
  while (arr.length < 4) arr.push(false);
  const json = JSON.stringify(arr);
  await pool.query(
    `INSERT INTO user_ritual (user_id, ritual_date, checked)
     VALUES ($1, $2::date, $3::jsonb)
     ON CONFLICT (user_id, ritual_date) DO UPDATE SET checked = $3::jsonb, updated_at = now()`,
    [userId, today, json]
  );
  return { checked: arr };
}
