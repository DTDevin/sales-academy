/**
 * Document routes – Upload, Download, Version, Teilen. Alle geschützt.
 */
import * as path from 'path';
import * as fs from 'fs';
import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import * as documentService from '../services/document.service';

const router = Router();
const UPLOAD_DIR = path.resolve(process.cwd(), config.upload.dir);
const TMP_DIR = path.join(UPLOAD_DIR, 'tmp');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    cb(null, TMP_DIR);
  },
  filename: (_req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    cb(null, Date.now() + '_' + safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSizeBytes },
});

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const folderId = req.query.folder_id as string | undefined;
    const list = await documentService.listDocuments(req.userId!, folderId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const doc = await documentService.getDocumentById(req.params.id, req.userId!);
    if (!doc) return res.status(404).json({ error: 'Dokument nicht gefunden' });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/download', async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await documentService.getDocumentFilePath(req.params.id, req.userId!);
    if (!result) return res.status(404).json({ error: 'Dokument nicht gefunden' });
    res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(result.name) + '"');
    if (result.mimeType) res.setHeader('Content-Type', result.mimeType);
    res.sendFile(result.filePath, (err) => {
      if (err) next(err);
    });
  } catch (e) {
    next(e);
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Keine Datei (field: file)' });
    const name = (req.body?.name as string) || file.originalname || 'Unbenannt';
    const folderId = req.body?.folder_id as string | undefined;
    const doc = await documentService.createDocument(
      req.userId!,
      name,
      file.path,
      file.mimetype,
      file.size,
      folderId || null
    );
    res.status(201).json(doc);
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(e);
  }
});

router.post('/:id/version', upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Keine Datei (field: file)' });
    const name = (req.body?.name as string) || file.originalname || 'Unbenannt';
    const doc = await documentService.addVersion(
      req.params.id,
      req.userId!,
      name,
      file.path,
      file.mimetype,
      file.size
    );
    if (!doc) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }
    res.json(doc);
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(e);
  }
});

router.get('/:id/versions', async (req: AuthRequest, res: Response, next) => {
  try {
    const versions = await documentService.listVersions(req.params.id, req.userId!);
    res.json(versions);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/shares', async (req: AuthRequest, res: Response, next) => {
  try {
    const shares = await documentService.listDocumentShares(req.params.id, req.userId!);
    res.json(shares);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/share', async (req: AuthRequest, res: Response, next) => {
  try {
    let sharedWithUserId = req.body?.shared_with_user_id as string | undefined;
    const sharedWithEmail = req.body?.shared_with_email as string | undefined;
    const permission = (req.body?.permission as string) || 'read';
    if (!sharedWithUserId && sharedWithEmail) {
      sharedWithUserId = await documentService.getUserIdByEmail(sharedWithEmail) ?? undefined;
      if (!sharedWithUserId) return res.status(404).json({ error: 'Nutzer mit dieser E-Mail nicht gefunden' });
    }
    if (!sharedWithUserId) return res.status(400).json({ error: 'shared_with_user_id oder shared_with_email erforderlich' });
    if (permission !== 'read' && permission !== 'write') return res.status(400).json({ error: 'permission: read oder write' });
    const ok = await documentService.shareDocument(req.params.id, req.userId!, sharedWithUserId, permission as 'read' | 'write');
    if (!ok) return res.status(404).json({ error: 'Dokument nicht gefunden' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/share/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await documentService.unshareDocument(req.params.id, req.userId!, req.params.userId);
    if (!ok) return res.status(404).json({ error: 'Nicht gefunden' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await documentService.deleteDocument(req.params.id, req.userId!);
    if (!ok) return res.status(404).json({ error: 'Dokument nicht gefunden' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
