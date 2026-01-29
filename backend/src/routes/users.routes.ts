/**
 * User & Profile routes – GET/PATCH /users/me, GET/PATCH /users/me/profile, DELETE /users/me.
 * All require auth.
 */
import * as path from 'path';
import * as fs from 'fs';
import { Router, Response } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import * as userService from '../services/user.service';
import * as statsService from '../services/stats.service';
import * as ritualService from '../services/ritual.service';

const router = Router();

// Avatar upload setup
const AVATAR_DIR = path.resolve(process.cwd(), config.upload.dir, 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `avatar_${req.userId}_${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilder (jpg, png, gif, webp) erlaubt'));
    }
  },
});

router.use(requireAuth);

router.get('/me/ritual', async (req: AuthRequest, res: Response, next) => {
  try {
    const ritual = await ritualService.getRitual(req.userId!);
    res.json(ritual);
  } catch (e) {
    next(e);
  }
});

router.patch('/me/ritual', async (req: AuthRequest, res: Response, next) => {
  try {
    const checked = req.body?.checked;
    if (!Array.isArray(checked)) return res.status(400).json({ error: 'checked (Array von 4 Booleans) erforderlich' });
    const ritual = await ritualService.setRitual(req.userId!, checked);
    res.json(ritual);
  } catch (e) {
    next(e);
  }
});

router.get('/me/stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await statsService.getStats(req.userId!);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.post('/me/stats/log-call', async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await statsService.logCall(req.userId!);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.post('/me/stats/log-termin', async (req: AuthRequest, res: Response, next) => {
  try {
    const stats = await statsService.logTermin(req.userId!);
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.get('/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await userService.getUserById(req.userId!);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/me/profile', async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await userService.getProfileByUserId(req.userId!);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.patch('/me/profile', async (req: AuthRequest, res: Response, next) => {
  try {
    const body = req.body as Record<string, unknown>;
    const data = {
      display_name: body.display_name as string | undefined,
      avatar_url: body.avatar_url as string | undefined,
      preferences: body.preferences as Record<string, unknown> | undefined,
      track_default: body.track_default as string | undefined,
      timezone: body.timezone as string | undefined,
    };
    const profile = await userService.updateProfile(req.userId!, data);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

/** Avatar hochladen */
router.post('/me/avatar', avatarUpload.single('avatar'), async (req: AuthRequest, res: Response, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Kein Bild (field: avatar)' });
    
    // Get current profile to delete old avatar
    const currentProfile = await userService.getProfileByUserId(req.userId!);
    if (currentProfile?.avatar_url) {
      const oldPath = path.join(AVATAR_DIR, path.basename(currentProfile.avatar_url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    
    // Build URL for avatar
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    
    // Update profile
    const profile = await userService.updateProfile(req.userId!, { avatar_url: avatarUrl });
    res.json({ avatar_url: avatarUrl, profile });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(e);
  }
});

/** Avatar entfernen */
router.delete('/me/avatar', async (req: AuthRequest, res: Response, next) => {
  try {
    const currentProfile = await userService.getProfileByUserId(req.userId!);
    if (currentProfile?.avatar_url) {
      const avatarPath = path.join(AVATAR_DIR, path.basename(currentProfile.avatar_url));
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }
    
    await userService.updateProfile(req.userId!, { avatar_url: null as any });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/** Konto unwiderruflich löschen (DSGVO). Antwort 204; Client soll Token löschen und zu Login weiterleiten. */
router.delete('/me', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await userService.deleteAccount(req.userId!);
    if (!ok) return res.status(404).json({ error: 'User nicht gefunden' });
    res.clearCookie(config.jwt.refreshCookieName, { path: '/', httpOnly: true });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
