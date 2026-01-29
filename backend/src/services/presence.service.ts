/**
 * Presence Service – Online-Status Management
 * Echtzeit-Status für Team-Chat
 */
import { pool } from '../db/pool';
import { UserPresence, PresenceStatus } from '../types';

/** Presence abrufen */
export async function getPresence(userId: string): Promise<UserPresence | null> {
  const r = await pool.query<UserPresence>(
    'SELECT * FROM user_presence WHERE user_id = $1',
    [userId]
  );
  return r.rows[0] || null;
}

/** Presence setzen/aktualisieren */
export async function setPresence(
  userId: string,
  status: PresenceStatus,
  statusText?: string
): Promise<UserPresence> {
  const r = await pool.query<UserPresence>(
    `INSERT INTO user_presence (user_id, status, status_text, last_seen_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id) DO UPDATE SET 
       status = $2, 
       status_text = $3, 
       last_seen_at = now(),
       updated_at = now()
     RETURNING *`,
    [userId, status, statusText || null]
  );
  return r.rows[0];
}

/** User geht online */
export async function goOnline(userId: string): Promise<UserPresence> {
  return setPresence(userId, 'online');
}

/** User geht offline */
export async function goOffline(userId: string): Promise<UserPresence> {
  return setPresence(userId, 'offline');
}

/** Heartbeat (aktualisiert last_seen_at) */
export async function heartbeat(userId: string): Promise<void> {
  await pool.query(
    `UPDATE user_presence SET last_seen_at = now(), updated_at = now() WHERE user_id = $1`,
    [userId]
  );
}

/** Alle als offline markieren die zu lange inaktiv sind (> 5 Minuten) */
export async function cleanupStalePresence(): Promise<void> {
  await pool.query(
    `UPDATE user_presence SET status = 'offline' 
     WHERE status != 'offline' AND last_seen_at < now() - INTERVAL '5 minutes'`
  );
}

/** Presence von mehreren Usern */
export async function getPresenceMany(userIds: string[]): Promise<Map<string, PresenceStatus>> {
  if (userIds.length === 0) return new Map();
  
  const r = await pool.query<{ user_id: string; status: string }>(
    `SELECT user_id, status FROM user_presence WHERE user_id = ANY($1)`,
    [userIds]
  );
  
  const map = new Map<string, PresenceStatus>();
  for (const row of r.rows) {
    map.set(row.user_id, row.status as PresenceStatus);
  }
  
  // Nicht gefundene User sind offline
  for (const uid of userIds) {
    if (!map.has(uid)) {
      map.set(uid, 'offline');
    }
  }
  
  return map;
}
