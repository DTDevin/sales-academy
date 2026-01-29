/**
 * Team-Chat Routes – REST API
 * Chats, Nachrichten, Mitglieder, Reaktionen
 */
import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as teamchatService from '../services/teamchat.service';
import * as presenceService from '../services/presence.service';

const router = Router();
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════
// CHATS
// ═══════════════════════════════════════════════════════════════

/** Liste aller Chats des Users */
router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const chats = await teamchatService.listChats(req.userId!);
    res.json(chats);
  } catch (e) {
    next(e);
  }
});

/** Chat by ID */
router.get('/:chatId', async (req: AuthRequest, res: Response, next) => {
  try {
    const chat = await teamchatService.getChatById(req.params.chatId, req.userId!);
    if (!chat) return res.status(404).json({ error: 'Chat nicht gefunden' });
    res.json(chat);
  } catch (e) {
    next(e);
  }
});

/** Direct Chat starten/abrufen */
router.post('/direct', async (req: AuthRequest, res: Response, next) => {
  try {
    const targetUserId = req.body.user_id;
    if (!targetUserId) return res.status(400).json({ error: 'user_id erforderlich' });
    if (targetUserId === req.userId) return res.status(400).json({ error: 'Kann keinen Chat mit sich selbst starten' });
    
    const chat = await teamchatService.getOrCreateDirectChat(req.userId!, targetUserId);
    const fullChat = await teamchatService.getChatById(chat.id, req.userId!);
    res.status(201).json(fullChat);
  } catch (e) {
    next(e);
  }
});

/** Gruppe erstellen */
router.post('/group', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, member_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'name erforderlich' });
    
    const members = Array.isArray(member_ids) ? member_ids : [];
    const chat = await teamchatService.createGroupChat(req.userId!, name, members, description);
    const fullChat = await teamchatService.getChatById(chat.id, req.userId!);
    res.status(201).json(fullChat);
  } catch (e) {
    next(e);
  }
});

/** Chat aktualisieren */
router.patch('/:chatId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { name, description, avatar_url } = req.body;
    const chat = await teamchatService.updateChat(req.params.chatId, req.userId!, { name, description, avatar_url });
    if (!chat) return res.status(404).json({ error: 'Chat nicht gefunden' });
    res.json(chat);
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════
// MITGLIEDER
// ═══════════════════════════════════════════════════════════════

/** Mitglieder eines Chats */
router.get('/:chatId/members', async (req: AuthRequest, res: Response, next) => {
  try {
    const isMember = await teamchatService.isMember(req.params.chatId, req.userId!);
    if (!isMember) return res.status(403).json({ error: 'Kein Zugriff' });
    
    const members = await teamchatService.getChatMembers(req.params.chatId);
    res.json(members);
  } catch (e) {
    next(e);
  }
});

/** Mitglied hinzufügen */
router.post('/:chatId/members', async (req: AuthRequest, res: Response, next) => {
  try {
    const { user_id, role } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id erforderlich' });
    
    await teamchatService.addMember(req.params.chatId, req.userId!, user_id, role || 'member');
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** Mitglied entfernen */
router.delete('/:chatId/members/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await teamchatService.removeMember(req.params.chatId, req.userId!, req.params.userId);
    if (!ok) return res.status(404).json({ error: 'Nicht gefunden' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/** Gruppe verlassen */
router.post('/:chatId/leave', async (req: AuthRequest, res: Response, next) => {
  try {
    await teamchatService.removeMember(req.params.chatId, req.userId!, req.userId!);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════
// NACHRICHTEN
// ═══════════════════════════════════════════════════════════════

/** Nachrichten eines Chats (paginiert) */
router.get('/:chatId/messages', async (req: AuthRequest, res: Response, next) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const before = req.query.before as string | undefined;
    
    const messages = await teamchatService.getMessages(req.params.chatId, req.userId!, limit, before);
    res.json(messages);
  } catch (e) {
    next(e);
  }
});

/** Nachricht senden */
router.post('/:chatId/messages', async (req: AuthRequest, res: Response, next) => {
  try {
    const { content, content_type, reply_to_id, attachments } = req.body;
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'content erforderlich' });
    }
    
    const message = await teamchatService.sendMessage(
      req.params.chatId,
      req.userId!,
      content.trim(),
      content_type || 'text',
      reply_to_id,
      attachments
    );
    res.status(201).json(message);
  } catch (e) {
    next(e);
  }
});

/** Als gelesen markieren */
router.post('/:chatId/read', async (req: AuthRequest, res: Response, next) => {
  try {
    const { message_id } = req.body;
    await teamchatService.markAsRead(req.params.chatId, req.userId!, message_id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════
// EINZELNE NACHRICHTEN
// ═══════════════════════════════════════════════════════════════

/** Nachricht bearbeiten */
router.patch('/messages/:messageId', async (req: AuthRequest, res: Response, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content erforderlich' });
    
    const message = await teamchatService.editMessage(req.params.messageId, req.userId!, content);
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden oder keine Berechtigung' });
    res.json(message);
  } catch (e) {
    next(e);
  }
});

/** Nachricht löschen */
router.delete('/messages/:messageId', async (req: AuthRequest, res: Response, next) => {
  try {
    const ok = await teamchatService.deleteMessage(req.params.messageId, req.userId!);
    if (!ok) return res.status(404).json({ error: 'Nachricht nicht gefunden oder keine Berechtigung' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════
// REAKTIONEN
// ═══════════════════════════════════════════════════════════════

/** Reaktion hinzufügen */
router.post('/messages/:messageId/reactions', async (req: AuthRequest, res: Response, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'emoji erforderlich' });
    
    const reactions = await teamchatService.addReaction(req.params.messageId, req.userId!, emoji);
    res.json(reactions);
  } catch (e) {
    next(e);
  }
});

/** Reaktion entfernen */
router.delete('/messages/:messageId/reactions/:emoji', async (req: AuthRequest, res: Response, next) => {
  try {
    const reactions = await teamchatService.removeReaction(req.params.messageId, req.userId!, req.params.emoji);
    res.json(reactions);
  } catch (e) {
    next(e);
  }
});

/** Reaktions-Katalog */
router.get('/reactions/catalog', async (_req: AuthRequest, res: Response, next) => {
  try {
    const catalog = await teamchatService.getReactionCatalog();
    res.json(catalog);
  } catch (e) {
    next(e);
  }
});

// ═══════════════════════════════════════════════════════════════
// USER SUCHE & PRESENCE
// ═══════════════════════════════════════════════════════════════

/** User suchen */
router.get('/users/search', async (req: AuthRequest, res: Response, next) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    
    const users = await teamchatService.searchUsers(q, req.userId!, limit);
    res.json(users);
  } catch (e) {
    next(e);
  }
});

/** Eigene Presence setzen */
router.patch('/presence', async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, status_text } = req.body;
    if (!status) return res.status(400).json({ error: 'status erforderlich' });
    
    const presence = await presenceService.setPresence(req.userId!, status, status_text);
    res.json(presence);
  } catch (e) {
    next(e);
  }
});

/** Presence eines Users */
router.get('/presence/:userId', async (req: AuthRequest, res: Response, next) => {
  try {
    const presence = await presenceService.getPresence(req.params.userId);
    res.json(presence || { user_id: req.params.userId, status: 'offline', last_seen_at: null });
  } catch (e) {
    next(e);
  }
});

export default router;
