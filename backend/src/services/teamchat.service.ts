/**
 * Team-Chat Service – Enterprise C-Level
 * 1:1 Chats, Gruppen, Nachrichten, Reaktionen, Lesebestätigungen
 */
import { pool } from '../db/pool';
import {
  TeamChat,
  TeamChatWithDetails,
  TeamChatMember,
  TeamChatMemberInfo,
  TeamMessage,
  TeamMessageWithSender,
  TeamMessagePreview,
  MessageReactionGroup,
  ReactionCatalogItem,
  UserSearchResult,
  TeamChatType,
  ChatMemberRole,
} from '../types';
import { AppError } from '../middleware/errorHandler';

// ═══════════════════════════════════════════════════════════════
// CHATS
// ═══════════════════════════════════════════════════════════════

/** Alle Chats eines Users mit Details */
export async function listChats(userId: string): Promise<TeamChatWithDetails[]> {
  const r = await pool.query<TeamChat & { member_ids: string[] }>(
    `SELECT tc.*, 
            ARRAY_AGG(tcm.user_id) AS member_ids
     FROM team_chats tc
     JOIN team_chat_members tcm ON tcm.chat_id = tc.id
     WHERE tc.id IN (SELECT chat_id FROM team_chat_members WHERE user_id = $1)
     GROUP BY tc.id
     ORDER BY tc.updated_at DESC`,
    [userId]
  );

  const chats: TeamChatWithDetails[] = [];
  for (const chat of r.rows) {
    const members = await getChatMembers(chat.id);
    const lastMessage = await getLastMessage(chat.id);
    const unreadCount = await getUnreadCount(chat.id, userId);
    
    chats.push({
      ...chat,
      members,
      last_message: lastMessage,
      unread_count: unreadCount,
    });
  }
  return chats;
}

/** Chat by ID */
export async function getChatById(chatId: string, userId: string): Promise<TeamChatWithDetails | null> {
  // Prüfen ob User Mitglied ist
  const memberCheck = await pool.query(
    'SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId]
  );
  if (memberCheck.rows.length === 0) return null;

  const r = await pool.query<TeamChat>(
    'SELECT * FROM team_chats WHERE id = $1',
    [chatId]
  );
  if (r.rows.length === 0) return null;

  const chat = r.rows[0];
  const members = await getChatMembers(chatId);
  const lastMessage = await getLastMessage(chatId);
  const unreadCount = await getUnreadCount(chatId, userId);

  return {
    ...chat,
    members,
    last_message: lastMessage,
    unread_count: unreadCount,
  };
}

/** Direct Chat zwischen zwei Usern finden oder erstellen */
export async function getOrCreateDirectChat(userId1: string, userId2: string): Promise<TeamChat> {
  // Existierenden Direct-Chat suchen
  const existing = await pool.query<TeamChat>(
    `SELECT tc.* FROM team_chats tc
     WHERE tc.type = 'direct'
     AND tc.id IN (
       SELECT chat_id FROM team_chat_members WHERE user_id = $1
       INTERSECT
       SELECT chat_id FROM team_chat_members WHERE user_id = $2
     )
     AND (SELECT COUNT(*) FROM team_chat_members WHERE chat_id = tc.id) = 2
     LIMIT 1`,
    [userId1, userId2]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Neuen Direct-Chat erstellen
  const chatResult = await pool.query<TeamChat>(
    `INSERT INTO team_chats (type, created_by) VALUES ('direct', $1)
     RETURNING *`,
    [userId1]
  );
  const chat = chatResult.rows[0];

  // Beide User hinzufügen
  await pool.query(
    `INSERT INTO team_chat_members (chat_id, user_id, role) VALUES ($1, $2, 'admin'), ($1, $3, 'admin')`,
    [chat.id, userId1, userId2]
  );

  return chat;
}

/** Gruppe erstellen */
export async function createGroupChat(
  creatorId: string,
  name: string,
  memberIds: string[],
  description?: string
): Promise<TeamChat> {
  if (!name || name.trim().length === 0) {
    const err: AppError = new Error('Gruppenname erforderlich');
    err.statusCode = 400;
    throw err;
  }

  // Chat erstellen
  const chatResult = await pool.query<TeamChat>(
    `INSERT INTO team_chats (type, name, description, created_by) 
     VALUES ('group', $1, $2, $3) RETURNING *`,
    [name.trim(), description || null, creatorId]
  );
  const chat = chatResult.rows[0];

  // Creator als Admin hinzufügen
  await pool.query(
    `INSERT INTO team_chat_members (chat_id, user_id, role) VALUES ($1, $2, 'admin')`,
    [chat.id, creatorId]
  );

  // Weitere Mitglieder hinzufügen
  for (const memberId of memberIds) {
    if (memberId !== creatorId) {
      await pool.query(
        `INSERT INTO team_chat_members (chat_id, user_id, role) VALUES ($1, $2, 'member')
         ON CONFLICT (chat_id, user_id) DO NOTHING`,
        [chat.id, memberId]
      );
    }
  }

  // System-Nachricht
  await addSystemMessage(chat.id, 'Gruppe wurde erstellt');

  return chat;
}

/** Chat updaten (Name, Beschreibung) */
export async function updateChat(
  chatId: string,
  userId: string,
  data: { name?: string; description?: string; avatar_url?: string }
): Promise<TeamChat | null> {
  // Nur Admins dürfen updaten
  const adminCheck = await pool.query(
    `SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2 AND role = 'admin'`,
    [chatId, userId]
  );
  if (adminCheck.rows.length === 0) {
    const err: AppError = new Error('Nur Admins können die Gruppe bearbeiten');
    err.statusCode = 403;
    throw err;
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${i++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${i++}`);
    values.push(data.description);
  }
  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${i++}`);
    values.push(data.avatar_url);
  }

  if (updates.length === 0) return getChatById(chatId, userId);

  values.push(chatId);
  const r = await pool.query<TeamChat>(
    `UPDATE team_chats SET ${updates.join(', ')}, updated_at = now() WHERE id = $${i} RETURNING *`,
    values
  );
  return r.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════
// MITGLIEDER
// ═══════════════════════════════════════════════════════════════

/** Mitglieder eines Chats */
export async function getChatMembers(chatId: string): Promise<TeamChatMemberInfo[]> {
  const r = await pool.query<TeamChatMemberInfo & { status?: string }>(
    `SELECT tcm.user_id, u.email, p.display_name, p.avatar_url, tcm.role,
            COALESCE(up.status, 'offline') as status
     FROM team_chat_members tcm
     JOIN users u ON u.id = tcm.user_id
     LEFT JOIN profiles p ON p.user_id = tcm.user_id
     LEFT JOIN user_presence up ON up.user_id = tcm.user_id
     WHERE tcm.chat_id = $1
     ORDER BY tcm.role DESC, tcm.joined_at ASC`,
    [chatId]
  );
  return r.rows.map(row => ({
    ...row,
    presence: row.status as any,
  }));
}

/** Mitglied hinzufügen */
export async function addMember(
  chatId: string,
  adminId: string,
  newUserId: string,
  role: ChatMemberRole = 'member'
): Promise<boolean> {
  // Prüfen ob Admin
  const adminCheck = await pool.query(
    `SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2 AND role = 'admin'`,
    [chatId, adminId]
  );
  if (adminCheck.rows.length === 0) {
    const err: AppError = new Error('Nur Admins können Mitglieder hinzufügen');
    err.statusCode = 403;
    throw err;
  }

  // Prüfen ob Gruppe
  const chatCheck = await pool.query<{ type: string }>(
    `SELECT type FROM team_chats WHERE id = $1`,
    [chatId]
  );
  if (chatCheck.rows[0]?.type !== 'group') {
    const err: AppError = new Error('Nur in Gruppen können Mitglieder hinzugefügt werden');
    err.statusCode = 400;
    throw err;
  }

  await pool.query(
    `INSERT INTO team_chat_members (chat_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (chat_id, user_id) DO NOTHING`,
    [chatId, newUserId, role]
  );

  // System-Nachricht
  const userName = await getUserDisplayName(newUserId);
  await addSystemMessage(chatId, `${userName} wurde hinzugefügt`);

  return true;
}

/** Mitglied entfernen */
export async function removeMember(chatId: string, adminId: string, removeUserId: string): Promise<boolean> {
  // Selbst verlassen ist immer erlaubt
  if (adminId !== removeUserId) {
    const adminCheck = await pool.query(
      `SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2 AND role = 'admin'`,
      [chatId, adminId]
    );
    if (adminCheck.rows.length === 0) {
      const err: AppError = new Error('Nur Admins können Mitglieder entfernen');
      err.statusCode = 403;
      throw err;
    }
  }

  const r = await pool.query(
    `DELETE FROM team_chat_members WHERE chat_id = $1 AND user_id = $2`,
    [chatId, removeUserId]
  );

  if ((r.rowCount ?? 0) > 0) {
    const userName = await getUserDisplayName(removeUserId);
    await addSystemMessage(chatId, `${userName} hat die Gruppe verlassen`);
  }

  return (r.rowCount ?? 0) > 0;
}

// ═══════════════════════════════════════════════════════════════
// NACHRICHTEN
// ═══════════════════════════════════════════════════════════════

/** Nachrichten laden (paginiert) */
export async function getMessages(
  chatId: string,
  userId: string,
  limit = 50,
  before?: string
): Promise<TeamMessageWithSender[]> {
  // Mitgliedschaft prüfen
  const memberCheck = await pool.query(
    'SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId]
  );
  if (memberCheck.rows.length === 0) {
    const err: AppError = new Error('Kein Zugriff auf diesen Chat');
    err.statusCode = 403;
    throw err;
  }

  let query = `
    SELECT tm.*, 
           u.email as sender_email, 
           p.display_name as sender_display_name, 
           p.avatar_url as sender_avatar_url
    FROM team_messages tm
    LEFT JOIN users u ON u.id = tm.sender_id
    LEFT JOIN profiles p ON p.user_id = tm.sender_id
    WHERE tm.chat_id = $1 AND tm.deleted_at IS NULL
  `;
  const params: unknown[] = [chatId];

  if (before) {
    query += ` AND tm.created_at < (SELECT created_at FROM team_messages WHERE id = $2)`;
    params.push(before);
  }

  query += ` ORDER BY tm.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const r = await pool.query<TeamMessage & { sender_email: string; sender_display_name: string | null; sender_avatar_url: string | null }>(query, params);

  const messages: TeamMessageWithSender[] = [];
  for (const row of r.rows) {
    const reactions = await getMessageReactions(row.id, userId);
    messages.push({
      id: row.id,
      chat_id: row.chat_id,
      sender_id: row.sender_id,
      content: row.content,
      content_type: row.content_type,
      reply_to_id: row.reply_to_id,
      attachments: row.attachments,
      mentions: row.mentions,
      edited_at: row.edited_at,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      sender: row.sender_id ? {
        email: row.sender_email,
        display_name: row.sender_display_name,
        avatar_url: row.sender_avatar_url,
      } : null,
      reactions,
    });
  }

  return messages.reverse(); // Chronologisch
}

/** Nachricht senden */
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  contentType: 'text' | 'image' | 'file' = 'text',
  replyToId?: string,
  attachments?: { name: string; url: string; size: number; mime_type: string }[]
): Promise<TeamMessageWithSender> {
  // Mitgliedschaft prüfen
  const memberCheck = await pool.query(
    'SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, senderId]
  );
  if (memberCheck.rows.length === 0) {
    const err: AppError = new Error('Kein Zugriff auf diesen Chat');
    err.statusCode = 403;
    throw err;
  }

  // Mentions extrahieren (@user_id)
  const mentionRegex = /@([a-f0-9-]{36})/gi;
  const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);

  const r = await pool.query<TeamMessage>(
    `INSERT INTO team_messages (chat_id, sender_id, content, content_type, reply_to_id, attachments, mentions)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [chatId, senderId, content, contentType, replyToId || null, attachments ? JSON.stringify(attachments) : null, mentions.length > 0 ? JSON.stringify(mentions) : null]
  );

  // Chat updated_at aktualisieren
  await pool.query('UPDATE team_chats SET updated_at = now() WHERE id = $1', [chatId]);

  // Sender-Info holen
  const senderInfo = await pool.query<{ email: string; display_name: string | null; avatar_url: string | null }>(
    `SELECT u.email, p.display_name, p.avatar_url 
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id 
     WHERE u.id = $1`,
    [senderId]
  );

  const msg = r.rows[0];
  return {
    ...msg,
    sender: senderInfo.rows[0] || null,
    reactions: [],
  };
}

/** System-Nachricht (z.B. "User hat die Gruppe verlassen") */
async function addSystemMessage(chatId: string, content: string): Promise<void> {
  await pool.query(
    `INSERT INTO team_messages (chat_id, sender_id, content, content_type) VALUES ($1, NULL, $2, 'system')`,
    [chatId, content]
  );
  await pool.query('UPDATE team_chats SET updated_at = now() WHERE id = $1', [chatId]);
}

/** Nachricht bearbeiten */
export async function editMessage(messageId: string, userId: string, newContent: string): Promise<TeamMessage | null> {
  const r = await pool.query<TeamMessage>(
    `UPDATE team_messages 
     SET content = $1, edited_at = now() 
     WHERE id = $2 AND sender_id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [newContent, messageId, userId]
  );
  return r.rows[0] || null;
}

/** Nachricht löschen (Soft Delete) */
export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    `UPDATE team_messages SET deleted_at = now(), content = '[Nachricht gelöscht]' 
     WHERE id = $1 AND sender_id = $2 AND deleted_at IS NULL`,
    [messageId, userId]
  );
  return (r.rowCount ?? 0) > 0;
}

// ═══════════════════════════════════════════════════════════════
// REAKTIONEN 🎯🚀💰
// ═══════════════════════════════════════════════════════════════

/** Reaktionen einer Nachricht */
async function getMessageReactions(messageId: string, currentUserId: string): Promise<MessageReactionGroup[]> {
  const r = await pool.query<{ emoji: string; user_ids: string[] }>(
    `SELECT emoji, ARRAY_AGG(user_id) as user_ids
     FROM team_message_reactions
     WHERE message_id = $1
     GROUP BY emoji`,
    [messageId]
  );

  return r.rows.map(row => ({
    emoji: row.emoji,
    count: row.user_ids.length,
    users: row.user_ids,
    reacted_by_me: row.user_ids.includes(currentUserId),
  }));
}

/** Reaktion hinzufügen */
export async function addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReactionGroup[]> {
  await pool.query(
    `INSERT INTO team_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)
     ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
    [messageId, userId, emoji]
  );
  return getMessageReactions(messageId, userId);
}

/** Reaktion entfernen */
export async function removeReaction(messageId: string, userId: string, emoji: string): Promise<MessageReactionGroup[]> {
  await pool.query(
    `DELETE FROM team_message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
    [messageId, userId, emoji]
  );
  return getMessageReactions(messageId, userId);
}

/** Reaktions-Katalog laden */
export async function getReactionCatalog(): Promise<ReactionCatalogItem[]> {
  const r = await pool.query<ReactionCatalogItem>(
    `SELECT * FROM reaction_catalog ORDER BY sort_order, name`
  );
  return r.rows;
}

// ═══════════════════════════════════════════════════════════════
// LESEN & UNGELESEN
// ═══════════════════════════════════════════════════════════════

/** Als gelesen markieren */
export async function markAsRead(chatId: string, userId: string, messageId?: string): Promise<void> {
  if (messageId) {
    await pool.query(
      `UPDATE team_chat_members SET last_read_at = now(), last_read_message_id = $1
       WHERE chat_id = $2 AND user_id = $3`,
      [messageId, chatId, userId]
    );
    // Einzelne Nachricht als gelesen
    await pool.query(
      `INSERT INTO team_message_reads (message_id, user_id) VALUES ($1, $2)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [messageId, userId]
    );
  } else {
    // Alle Nachrichten als gelesen
    const lastMsg = await pool.query<{ id: string }>(
      `SELECT id FROM team_messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [chatId]
    );
    if (lastMsg.rows.length > 0) {
      await pool.query(
        `UPDATE team_chat_members SET last_read_at = now(), last_read_message_id = $1
         WHERE chat_id = $2 AND user_id = $3`,
        [lastMsg.rows[0].id, chatId, userId]
      );
    }
  }
}

/** Ungelesene Anzahl */
async function getUnreadCount(chatId: string, userId: string): Promise<number> {
  const r = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM team_messages tm
     WHERE tm.chat_id = $1 
     AND tm.deleted_at IS NULL
     AND tm.sender_id != $2
     AND tm.created_at > COALESCE(
       (SELECT last_read_at FROM team_chat_members WHERE chat_id = $1 AND user_id = $2),
       '1970-01-01'
     )`,
    [chatId, userId]
  );
  return parseInt(r.rows[0]?.count || '0', 10);
}

/** Letzte Nachricht eines Chats */
async function getLastMessage(chatId: string): Promise<TeamMessagePreview | null> {
  const r = await pool.query<{ id: string; content: string; content_type: string; created_at: Date; sender_name: string | null }>(
    `SELECT tm.id, tm.content, tm.content_type, tm.created_at, 
            COALESCE(p.display_name, u.email) as sender_name
     FROM team_messages tm
     LEFT JOIN users u ON u.id = tm.sender_id
     LEFT JOIN profiles p ON p.user_id = tm.sender_id
     WHERE tm.chat_id = $1 AND tm.deleted_at IS NULL
     ORDER BY tm.created_at DESC LIMIT 1`,
    [chatId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    id: row.id,
    content: row.content,
    content_type: row.content_type as any,
    sender_name: row.sender_name || 'Unbekannt',
    created_at: row.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════════

async function getUserDisplayName(userId: string): Promise<string> {
  const r = await pool.query<{ display_name: string | null; email: string }>(
    `SELECT p.display_name, u.email FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
    [userId]
  );
  return r.rows[0]?.display_name || r.rows[0]?.email || 'Unbekannt';
}

/** User suchen */
export async function searchUsers(query: string, currentUserId: string, limit = 20): Promise<UserSearchResult[]> {
  const r = await pool.query<UserSearchResult & { status?: string }>(
    `SELECT u.id, u.email, p.display_name, p.avatar_url, COALESCE(up.status, 'offline') as status
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     LEFT JOIN user_presence up ON up.user_id = u.id
     WHERE u.id != $1
     AND (LOWER(u.email) LIKE $2 OR LOWER(p.display_name) LIKE $2)
     ORDER BY p.display_name, u.email
     LIMIT $3`,
    [currentUserId, `%${query.toLowerCase()}%`, limit]
  );
  return r.rows.map(row => ({
    ...row,
    presence: row.status as any,
  }));
}

/** Prüfen ob User Mitglied ist */
export async function isMember(chatId: string, userId: string): Promise<boolean> {
  const r = await pool.query(
    'SELECT 1 FROM team_chat_members WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId]
  );
  return r.rows.length > 0;
}
