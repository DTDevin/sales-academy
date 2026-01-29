/**
 * Chat service – Threads, Nachrichten persistieren; Bot-Antwort via n8n.
 */
import { pool } from '../db/pool';
import { config } from '../config';
import { ChatThread, ChatMessage } from '../types';
import { AppError } from '../middleware/errorHandler';

export async function listThreads(userId: string): Promise<ChatThread[]> {
  const r = await pool.query<ChatThread>(
    'SELECT id, user_id, track, title, last_message_at, created_at FROM chat_threads WHERE user_id = $1 ORDER BY last_message_at DESC NULLS LAST, created_at DESC',
    [userId]
  );
  return r.rows;
}

export async function getOrCreateThread(userId: string, track: string): Promise<ChatThread> {
  const existing = await pool.query<ChatThread>(
    'SELECT id, user_id, track, title, last_message_at, created_at FROM chat_threads WHERE user_id = $1 AND track = $2 ORDER BY last_message_at DESC NULLS LAST LIMIT 1',
    [userId, track]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const insert = await pool.query<ChatThread>(
    'INSERT INTO chat_threads (user_id, track) VALUES ($1, $2) RETURNING id, user_id, track, title, last_message_at, created_at',
    [userId, track]
  );
  return insert.rows[0];
}

export async function getThreadById(threadId: string, userId: string): Promise<ChatThread | null> {
  const r = await pool.query<ChatThread>(
    'SELECT id, user_id, track, title, last_message_at, created_at FROM chat_threads WHERE id = $1 AND user_id = $2',
    [threadId, userId]
  );
  return r.rows[0] ?? null;
}

export async function listMessages(threadId: string, userId: string, limit = 100): Promise<ChatMessage[]> {
  const r = await pool.query<ChatMessage>(
    `SELECT m.id, m.thread_id, m.role, m.content, m.attachments, m.source, m.created_at
     FROM chat_messages m
     JOIN chat_threads t ON t.id = m.thread_id AND t.user_id = $1
     WHERE m.thread_id = $2
     ORDER BY m.created_at ASC
     LIMIT $3`,
    [userId, threadId, limit]
  );
  return r.rows;
}

export async function addMessage(
  threadId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  source: string | null = null
): Promise<ChatMessage> {
  const thread = await getThreadById(threadId, userId);
  if (!thread) {
    const err: AppError = new Error('Thread nicht gefunden');
    err.statusCode = 404;
    throw err;
  }
  const r = await pool.query<ChatMessage>(
    'INSERT INTO chat_messages (thread_id, role, content, source) VALUES ($1, $2, $3, $4) RETURNING id, thread_id, role, content, attachments, source, created_at',
    [threadId, role, content, source]
  );
  const msg = r.rows[0];
  await pool.query(
    'UPDATE chat_threads SET last_message_at = now() WHERE id = $1',
    [threadId]
  );
  return msg;
}

function extractBotResponse(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const text = (obj.answer ?? obj.text ?? obj.message ?? obj.response ?? obj.output ?? '') as string;
    if (text) return text;
    if (Array.isArray(obj) && obj.length > 0) {
      const first = obj[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object')
        return (first as Record<string, unknown>).answer as string ||
          (first as Record<string, unknown>).text as string ||
          (first as Record<string, unknown>).message as string ||
          '';
    }
  }
  return 'Vielen Dank für deine Nachricht! Wie kann ich dir weiterhelfen?';
}

export async function sendUserMessageAndGetBotReply(
  threadId: string,
  userId: string,
  content: string,
  track: string
): Promise<{ userMessage: ChatMessage; botMessage: ChatMessage }> {
  const userMessage = await addMessage(threadId, userId, 'user', content, null);
  const webhookUrl = config.n8n.webhookUrl;
  const payload = {
    chatInput: content,
    message: content,
    userId,
    threadId,
    track,
    source: 'sales-academy',
    timestamp: new Date().toISOString(),
  };
  let botText: string;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let data: unknown = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      // keep as string
    }
    botText = extractBotResponse(data);
  } catch (e) {
    botText = 'Es gab ein technisches Problem. Bitte versuche es später erneut.';
  }
  const botMessage = await addMessage(threadId, userId, 'assistant', botText, 'n8n');
  return { userMessage, botMessage };
}
