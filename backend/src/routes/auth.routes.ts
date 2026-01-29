/**
 * Auth routes – register, login, refresh (cookie), logout.
 */
import { Router, Response } from 'express';
import { requireBody } from '../middleware/validate';
import { config } from '../config';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', requireBody('email', 'password'), async (req, res: Response, next) => {
  try {
    const result = await authService.register({
      email: req.body.email,
      password: req.body.password,
    });
    const refreshToken = authService.signRefreshToken(result.user.id, result.user.email);
    res.cookie(config.jwt.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.jwt.refreshCookieMaxAge,
      path: '/',
    });
    res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', requireBody('email', 'password'), async (req, res: Response, next) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });
    const refreshToken = authService.signRefreshToken(result.user.id, result.user.email);
    res.cookie(config.jwt.refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: config.jwt.refreshCookieMaxAge,
      path: '/',
    });
    res.json({
      user: result.user,
      accessToken: result.accessToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res: Response, next) => {
  try {
    const token = req.cookies?.[config.jwt.refreshCookieName] ?? req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    const result = await authService.refreshTokens(token);
    res.json({
      user: result.user,
      accessToken: result.accessToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (_req, res: Response) => {
  res.clearCookie(config.jwt.refreshCookieName, { path: '/', httpOnly: true });
  res.json({ ok: true });
});

export default router;
