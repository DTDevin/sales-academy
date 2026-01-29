/**
 * Chat routes – Threads, Nachrichten; alle geschützt, alle nach user_id.
 */
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as chatService from '../services/chat.service';

const router = Router();
router.use(requireAuth);

router.get('/threads', async (req: AuthRequest, res: Response, next) => {
  try {
    const threads = await chatService.listThreads(req.userId!);
    res.json(threads);
  } catch (e) {
    next(e);
  }
});

router.post('/threads', async (req: AuthRequest, res: Response, next) => {
  try {
    const track = (req.body?.track as string) || 'amy';
    const thread = await chatService.getOrCreateThread(req.userId!, track);
    res.status(201).json(thread);
  } catch (e) {
    next(e);
  }
});

router.get('/threads/:threadId/messages', async (req: AuthRequest, res: Response, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
    const messages = await chatService.listMessages(req.params.threadId, req.userId!, limit);
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

router.post('/threads/:threadId/messages', async (req: AuthRequest, res: Response, next) => {
  try {
    const content = req.body?.content ?? req.body?.message;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'content (oder message) erforderlich' });
    }
    const track = (req.body?.track as string) || 'amy';
    const result = await chatService.sendUserMessageAndGetBotReply(
      req.params.threadId,
      req.userId!,
      content.trim(),
      track
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
