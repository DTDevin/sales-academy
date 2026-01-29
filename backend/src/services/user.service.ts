/**
 * User & Profile service – get/update current user and profile; Konto löschen (DSGVO).
 */
import { pool } from '../db/pool';
import { UserPublic, Profile, ProfileUpdate } from '../types';
import { AppError } from '../middleware/errorHandler';
import * as documentService from './document.service';

export async function getUserById(userId: string): Promise<UserPublic | null> {
  const r = await pool.query<{ id: string; email: string; role: string; created_at: Date }>(
    'SELECT id, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return { id: row.id, email: row.email, role: row.role, created_at: row.created_at };
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const r = await pool.query<Profile>(
    'SELECT user_id, display_name, avatar_url, preferences, track_default, timezone, created_at, updated_at FROM profiles WHERE user_id = $1',
    [userId]
  );
  if (r.rows.length === 0) return null;
  return r.rows[0];
}

export async function updateProfile(userId: string, data: ProfileUpdate): Promise<Profile> {
  const allowed = ['display_name', 'avatar_url', 'preferences', 'track_default', 'timezone'];
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const key of allowed) {
    const v = (data as Record<string, unknown>)[key];
    if (v === undefined) continue;
    if (key === 'preferences' && v !== null && typeof v !== 'object') continue;
    updates.push(`${key} = $${i}`);
    values.push(v);
    i++;
  }
  if (updates.length === 0) {
    const p = await getProfileByUserId(userId);
    if (!p) {
      const err: AppError = new Error('Profile not found');
      err.statusCode = 404;
      throw err;
    }
    return p;
  }
  values.push(userId);
  const q = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${i} RETURNING user_id, display_name, avatar_url, preferences, track_default, timezone, created_at, updated_at`;
  const r = await pool.query<Profile>(q, values);
  if (r.rows.length === 0) {
    const err: AppError = new Error('Profile not found');
    err.statusCode = 404;
    throw err;
  }
  return r.rows[0];
}

/**
 * Konto unwiderruflich löschen (DSGVO): alle Dokumentdateien vom Disk, dann User – DB-CASCADE löscht Profil, Leads, Chat, Stats, Dokument-Metadaten.
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  await documentService.deleteAllUserDocumentFiles(userId);
  const r = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  return (r.rowCount ?? 0) > 0;
}
