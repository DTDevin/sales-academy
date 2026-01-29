/**
 * Document service – Upload (local), Version, Teilen. Metadaten in DB.
 */
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { config } from '../config';
import { Document, DocumentVersion } from '../types';
import { AppError } from '../middleware/errorHandler';

const UPLOAD_DIR = path.resolve(process.cwd(), config.upload.dir);

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
}

function isAllowedMime(mime: string): boolean {
  return (config.upload.allowedMime as readonly string[]).includes(mime) || 
         (config.upload.allowedMime as readonly string[]).some((a) => mime.startsWith(a));
}

export async function listDocuments(userId: string, folderId?: string | null): Promise<Document[]> {
  let q = 'SELECT id, user_id, folder_id, name, file_path, mime_type, size, version, checksum, meta, created_at, updated_at FROM documents WHERE user_id = $1';
  const params: unknown[] = [userId];
  if (folderId !== undefined && folderId !== null) {
    params.push(folderId);
    q += ' AND folder_id = $2';
  }
  q += ' ORDER BY updated_at DESC';
  const r = await pool.query<Document>(q, params);
  return r.rows;
}

export async function getDocumentById(id: string, userId: string): Promise<Document | null> {
  const r = await pool.query<Document>(
    'SELECT id, user_id, folder_id, name, file_path, mime_type, size, version, checksum, meta, created_at, updated_at FROM documents WHERE id = $1 AND (user_id = $2 OR EXISTS (SELECT 1 FROM document_shares WHERE document_id = $1 AND shared_with_user_id = $2))',
    [id, userId]
  );
  return r.rows[0] ?? null;
}

export async function getDocumentFilePath(id: string, userId: string): Promise<{ filePath: string; name: string; mimeType: string | null } | null> {
  const doc = await getDocumentById(id, userId);
  if (!doc) return null;
  const fullPath = path.join(UPLOAD_DIR, doc.file_path);
  if (!fs.existsSync(fullPath)) return null;
  return { filePath: fullPath, name: doc.name, mimeType: doc.mime_type };
}

export async function createDocument(
  userId: string,
  name: string,
  filePath: string,
  mimeType: string,
  size: number,
  folderId?: string | null
): Promise<Document> {
  ensureUploadDir();
  if (!isAllowedMime(mimeType)) {
    const err: AppError = new Error('Dateityp nicht erlaubt');
    err.statusCode = 400;
    throw err;
  }
  if (size > config.upload.maxFileSizeBytes) {
    const err: AppError = new Error('Datei zu groß');
    err.statusCode = 400;
    throw err;
  }
  const id = uuidv4();
  const relPath = path.join(userId, id + '_' + safeFileName(name));
  const destDir = path.join(UPLOAD_DIR, userId);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(UPLOAD_DIR, relPath);
  fs.renameSync(filePath, destPath);
  await pool.query(
    'INSERT INTO documents (id, user_id, folder_id, name, file_path, mime_type, size, version) VALUES ($1, $2, $3, $4, $5, $6, $7, 1)',
    [id, userId, folderId ?? null, name, relPath, mimeType, size]
  );
  await pool.query(
    'INSERT INTO document_versions (document_id, version, file_path, size) VALUES ($1, 1, $2, $3)',
    [id, relPath, size]
  );
  const r = await pool.query<Document>(
    'SELECT id, user_id, folder_id, name, file_path, mime_type, size, version, checksum, meta, created_at, updated_at FROM documents WHERE id = $1',
    [id]
  );
  return r.rows[0];
}

export async function addVersion(
  documentId: string,
  userId: string,
  name: string,
  filePath: string,
  mimeType: string,
  size: number
): Promise<Document | null> {
  const doc = await getDocumentById(documentId, userId);
  if (!doc || doc.user_id !== userId) return null;
  if (!isAllowedMime(mimeType)) {
    const err: AppError = new Error('Dateityp nicht erlaubt');
    err.statusCode = 400;
    throw err;
  }
  if (size > config.upload.maxFileSizeBytes) {
    const err: AppError = new Error('Datei zu groß');
    err.statusCode = 400;
    throw err;
  }
  const newVersion = doc.version + 1;
  const relPath = path.join(userId, documentId + '_v' + newVersion + '_' + safeFileName(name));
  const destPath = path.join(UPLOAD_DIR, relPath);
  ensureUploadDir();
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(filePath, destPath);
  await pool.query(
    'UPDATE documents SET file_path = $1, mime_type = $2, size = $3, version = $4, updated_at = now() WHERE id = $5',
    [relPath, mimeType, size, newVersion, documentId]
  );
  await pool.query(
    'INSERT INTO document_versions (document_id, version, file_path, size) VALUES ($1, $2, $3, $4)',
    [documentId, newVersion, relPath, size]
  );
  const r = await pool.query<Document>(
    'SELECT id, user_id, folder_id, name, file_path, mime_type, size, version, checksum, meta, created_at, updated_at FROM documents WHERE id = $1',
    [documentId]
  );
  return r.rows[0] ?? null;
}

export async function listVersions(documentId: string, userId: string): Promise<DocumentVersion[]> {
  const doc = await getDocumentById(documentId, userId);
  if (!doc) return [];
  const r = await pool.query<DocumentVersion>(
    'SELECT id, document_id, version, file_path, size, created_at FROM document_versions WHERE document_id = $1 ORDER BY version DESC',
    [documentId]
  );
  return r.rows;
}

export async function shareDocument(documentId: string, ownerId: string, sharedWithUserId: string, permission: 'read' | 'write'): Promise<boolean> {
  const doc = await getDocumentById(documentId, ownerId);
  if (!doc || doc.user_id !== ownerId) return false;
  await pool.query(
    'INSERT INTO document_shares (document_id, shared_with_user_id, permission) VALUES ($1, $2, $3) ON CONFLICT (document_id, shared_with_user_id) DO UPDATE SET permission = $3',
    [documentId, sharedWithUserId, permission]
  );
  return true;
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const r = await pool.query<{ id: string }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  return r.rows[0]?.id ?? null;
}

export interface DocumentShareEntry {
  shared_with_user_id: string;
  email: string;
  permission: string;
}

/** Liste der Freigaben eines Dokuments (nur Eigentümer). */
export async function listDocumentShares(documentId: string, userId: string): Promise<DocumentShareEntry[]> {
  const doc = await getDocumentById(documentId, userId);
  if (!doc || doc.user_id !== userId) return [];
  const r = await pool.query<{ shared_with_user_id: string; email: string; permission: string }>(
    `SELECT s.shared_with_user_id, u.email, s.permission
     FROM document_shares s
     JOIN users u ON u.id = s.shared_with_user_id
     WHERE s.document_id = $1
     ORDER BY s.created_at ASC`,
    [documentId]
  );
  return r.rows;
}

export async function unshareDocument(documentId: string, ownerId: string, sharedWithUserId: string): Promise<boolean> {
  const r = await pool.query(
    'DELETE FROM document_shares WHERE document_id = $1 AND shared_with_user_id = $2 AND EXISTS (SELECT 1 FROM documents WHERE id = $1 AND user_id = $3)',
    [documentId, sharedWithUserId, ownerId]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function deleteDocument(documentId: string, userId: string): Promise<boolean> {
  const doc = await getDocumentById(documentId, userId);
  if (!doc || doc.user_id !== userId) return false;
  const fullPath = path.join(UPLOAD_DIR, doc.file_path);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  const versions = await pool.query<{ file_path: string }>('SELECT file_path FROM document_versions WHERE document_id = $1', [documentId]);
  for (const v of versions.rows) {
    const vp = path.join(UPLOAD_DIR, v.file_path);
    if (fs.existsSync(vp)) fs.unlinkSync(vp);
  }
  await pool.query('DELETE FROM document_shares WHERE document_id = $1', [documentId]);
  await pool.query('DELETE FROM document_versions WHERE document_id = $1', [documentId]);
  await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
  return true;
}

/** Löscht alle physischen Dateien der Dokumente eines Users (vor User-Löschung). DB-Cascade löscht die Zeilen. */
export async function deleteAllUserDocumentFiles(userId: string): Promise<void> {
  const r = await pool.query<{ id: string; file_path: string }>(
    'SELECT id, file_path FROM documents WHERE user_id = $1',
    [userId]
  );
  for (const doc of r.rows) {
    const fullPath = path.join(UPLOAD_DIR, doc.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    const versions = await pool.query<{ file_path: string }>('SELECT file_path FROM document_versions WHERE document_id = $1', [doc.id]);
    for (const v of versions.rows) {
      const vp = path.join(UPLOAD_DIR, v.file_path);
      if (fs.existsSync(vp)) fs.unlinkSync(vp);
    }
  }
}
