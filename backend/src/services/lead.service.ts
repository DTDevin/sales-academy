/**
 * Lead service – CRUD, Validierung (keine Halluzination), CSV-Import.
 * Nur definierte Felder; Quelle und Verifizierungsstatus werden gesetzt.
 */
import { pool } from '../db/pool';
import { Lead, LeadCreate, LeadUpdate } from '../types';
import { AppError } from '../middleware/errorHandler';

const VERIF_STATUS = ['ungeprüft', 'geprüft', 'abgelehnt'] as const;
const DEFAULT_QUELLE = 'manuell';

/** E-Mail-Format prüfen */
function isValidEmail(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(s.trim());
}

/** URL-Format prüfen */
function isValidUrl(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed === '') return false;
  try {
    new URL(trimmed.startsWith('http') ? trimmed : 'https://' + trimmed);
    return true;
  } catch {
    return false;
  }
}

/** PLZ (DE: 5 Ziffern) */
function isValidPlz(s: string | null | undefined): boolean {
  if (!s || typeof s !== 'string') return false;
  return /^\d{5}$/.test(s.trim());
}

export function validateLeadFields(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const emailPrimary = data.email_primary as string | undefined;
  const emailAlt = data.email_alternativ as string | undefined;
  const website = data.website as string | undefined;
  const plz = data.plz as string | undefined;
  const verifizierung = data.verifizierungsstatus as string | undefined;

  if (emailPrimary !== undefined && emailPrimary !== null && emailPrimary !== '' && !isValidEmail(emailPrimary)) {
    errors.push('email_primary: ungültiges Format');
  }
  if (emailAlt !== undefined && emailAlt !== null && emailAlt !== '' && !isValidEmail(emailAlt)) {
    errors.push('email_alternativ: ungültiges Format');
  }
  if (website !== undefined && website !== null && website !== '' && !isValidUrl(website)) {
    errors.push('website: ungültiges URL-Format');
  }
  if (plz !== undefined && plz !== null && plz !== '' && !isValidPlz(plz)) {
    errors.push('plz: 5 Ziffern erwartet (DE)');
  }
  if (verifizierung !== undefined && verifizierung !== null && !VERIF_STATUS.includes(verifizierung as typeof VERIF_STATUS[number])) {
    errors.push('verifizierungsstatus: ungeprüft | geprüft | abgelehnt');
  }
  return { valid: errors.length === 0, errors };
}

export async function listLeads(
  userId: string,
  options: { limit?: number; offset?: number; verifizierungsstatus?: string } = {}
): Promise<{ leads: Lead[]; total: number }> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);
  const status = options.verifizierungsstatus;

  let where = 'WHERE user_id = $1';
  const params: unknown[] = [userId];
  if (status && VERIF_STATUS.includes(status as typeof VERIF_STATUS[number])) {
    params.push(status);
    where += ' AND verifizierungsstatus = $2';
  }

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM leads ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

  const q = `SELECT id, user_id, external_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primary, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen, meta, created_at, updated_at FROM leads ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const r = await pool.query<Lead>(q, [...params, limit, offset]);
  return { leads: r.rows, total };
}

export async function getLeadById(id: string, userId: string): Promise<Lead | null> {
  const r = await pool.query<Lead>(
    'SELECT id, user_id, external_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primary, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen, meta, created_at, updated_at FROM leads WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return r.rows[0] ?? null;
}

export async function createLead(userId: string, data: LeadCreate): Promise<Lead> {
  const validation = validateLeadFields(data as Record<string, unknown>);
  if (!validation.valid) {
    const err: AppError = new Error(validation.errors.join('; '));
    err.statusCode = 400;
    throw err;
  }
  const quelle = data.quelle ?? DEFAULT_QUELLE;
  const r = await pool.query<Lead>(
    `INSERT INTO leads (user_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primary, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ungeprüft', $16, $17)
     RETURNING id, user_id, external_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primary, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen, meta, created_at, updated_at`,
    [
      userId,
      data.firma ?? null,
      data.strasse ?? null,
      data.plz ?? null,
      data.ort ?? null,
      data.land ?? 'DE',
      data.website ?? null,
      data.branche_id ?? null,
      data.ansprechpartner_name ?? null,
      data.abteilung_id ?? null,
      data.email_primary ?? null,
      data.email_alternativ ?? null,
      data.telefon ?? null,
      data.mobil ?? null,
      quelle,
      data.notizen ?? null,
      null,
    ]
  );
  return r.rows[0];
}

export async function updateLead(id: string, userId: string, data: LeadUpdate): Promise<Lead | null> {
  const existing = await getLeadById(id, userId);
  if (!existing) return null;
  const validation = validateLeadFields(data as Record<string, unknown>);
  if (!validation.valid) {
    const err: AppError = new Error(validation.errors.join('; '));
    err.statusCode = 400;
    throw err;
  }
  const fields = [
    'firma', 'strasse', 'plz', 'ort', 'land', 'website', 'branche_id', 'ansprechpartner_name',
    'abteilung_id', 'email_primary', 'email_alternativ', 'telefon', 'mobil', 'verifizierungsstatus', 'notizen',
  ];
  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const key of fields) {
    const v = (data as Record<string, unknown>)[key];
    if (v === undefined) continue;
    if (key === 'verifizierungsstatus' && v !== null && !VERIF_STATUS.includes(v as typeof VERIF_STATUS[number])) continue;
    updates.push(`${key} = $${i}`);
    values.push(v === '' ? null : v);
    i++;
  }
  if (updates.length === 0) return existing;
  values.push(id, userId);
  const q = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING id, user_id, external_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primary, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen, meta, created_at, updated_at`;
  const r = await pool.query<Lead>(q, values);
  return r.rows[0] ?? null;
}

export async function deleteLead(id: string, userId: string): Promise<boolean> {
  const r = await pool.query('DELETE FROM leads WHERE id = $1 AND user_id = $2', [id, userId]);
  return (r.rowCount ?? 0) > 0;
}

/** CSV-Import: erste Zeile = Header, Spalten werden gemappt. Keine Halluzination – nur vorhandene Daten. */
export async function importLeadsCsv(
  userId: string,
  rows: Record<string, string>[],
  columnMap: Record<string, string>,
  quelle: string = 'import'
): Promise<{ created: number; errors: string[] }> {
  const created: string[] = [];
  const errors: string[] = [];
  const dbKeys = ['firma', 'strasse', 'plz', 'ort', 'land', 'website', 'branche_id', 'ansprechpartner_name', 'abteilung_id', 'email_primary', 'email_alternativ', 'telefon', 'mobil'];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const data: LeadCreate = { quelle };
    for (const [csvCol, dbCol] of Object.entries(columnMap)) {
      if (!dbKeys.includes(dbCol)) continue;
      const val = row[csvCol]?.trim();
      if (val) (data as Record<string, string>)[dbCol] = val;
    }
    const validation = validateLeadFields(data as Record<string, unknown>);
    if (!validation.valid) {
      errors.push(`Zeile ${i + 2}: ${validation.errors.join(', ')}`);
      continue;
    }
    try {
      const lead = await createLead(userId, data);
      created.push(lead.id);
    } catch (e) {
      errors.push(`Zeile ${i + 2}: ${e instanceof Error ? e.message : 'Fehler'}`);
    }
  }
  return { created: created.length, errors };
}

export async function listBranchen(): Promise<{ id: string; name: string }[]> {
  const r = await pool.query<{ id: string; name: string }>('SELECT id, name FROM branchen ORDER BY sort_order, name');
  return r.rows;
}

export async function listAbteilungen(): Promise<{ id: string; name: string }[]> {
  const r = await pool.query<{ id: string; name: string }>('SELECT id, name FROM abteilungen ORDER BY sort_order, name');
  return r.rows;
}
