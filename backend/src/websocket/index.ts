/**
 * WebSocket Server – Socket.io für Echtzeit-Chat
 * Enterprise C-Level: Auth, Rooms, Typing, Presence
 */
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload, WsMessageEvent, WsTypingEvent, WsPresenceEvent, WsReadEvent, PresenceStatus } from '../types';
import * as teamchatService from '../services/teamchat.service';
import * as presenceService from '../services/presence.service';

let io: Server | null = null;

// Connected Users: Map<userId, Set<socketId>>
const connectedUsers = new Map<string, Set<string>>();
// Socket to User: Map<socketId, userId>
const socketToUser = new Map<string, string>();

export function initWebSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
      if (decoded.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      socket.data.userId = decoded.sub;
      socket.data.email = decoded.email;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', handleConnection);

  // Cleanup stale presence every minute
  setInterval(() => {
    presenceService.cleanupStalePresence().catch(console.error);
  }, 60000);

  console.log('[WebSocket] Server initialized');
  return io;
}

async function handleConnection(socket: Socket): Promise<void> {
  const userId = socket.data.userId as string;
  console.log(`[WebSocket] User connected: ${userId} (${socket.id})`);

  // Track connection
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId)!.add(socket.id);
  socketToUser.set(socket.id, userId);

  // Set online
  await presenceService.goOnline(userId);
  broadcastPresence(userId, 'online');

  // Join user's chat rooms
  const chats = await teamchatService.listChats(userId);
  for (const chat of chats) {
    socket.join(`chat:${chat.id}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // Join specific chat room
  socket.on('join', async (data: { chatId: string }) => {
    const isMember = await teamchatService.isMember(data.chatId, userId);
    if (isMember) {
      socket.join(`chat:${data.chatId}`);
      console.log(`[WebSocket] ${userId} joined chat:${data.chatId}`);
    }
  });

  // Leave chat room
  socket.on('leave', (data: { chatId: string }) => {
    socket.leave(`chat:${data.chatId}`);
  });

  // Send message
  socket.on('message', async (data: { chatId: string; content: string; replyToId?: string }) => {
    try {
      const message = await teamchatService.sendMessage(
        data.chatId,
        userId,
        data.content,
        'text',
        data.replyToId
      );

      const chat = await teamchatService.getChatById(data.chatId, userId);
      if (!chat) return;

      const event: WsMessageEvent = {
        message,
        chat: { id: chat.id, type: chat.type },
      };

      io?.to(`chat:${data.chatId}`).emit('message', event);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', async (data: { chatId: string; isTyping: boolean }) => {
    const userName = await getUserDisplayName(userId);
    const event: WsTypingEvent = {
      chat_id: data.chatId,
      user_id: userId,
      user_name: userName,
      is_typing: data.isTyping,
    };
    socket.to(`chat:${data.chatId}`).emit('typing', event);
  });

  // Mark as read
  socket.on('read', async (data: { chatId: string; messageId?: string }) => {
    await teamchatService.markAsRead(data.chatId, userId, data.messageId);
    const event: WsReadEvent = {
      chat_id: data.chatId,
      user_id: userId,
      message_id: data.messageId || '',
    };
    io?.to(`chat:${data.chatId}`).emit('read', event);
  });

  // Update presence
  socket.on('presence', async (data: { status: PresenceStatus; statusText?: string }) => {
    await presenceService.setPresence(userId, data.status, data.statusText);
    broadcastPresence(userId, data.status, data.statusText);
  });

  // Heartbeat
  socket.on('heartbeat', async () => {
    await presenceService.heartbeat(userId);
  });

  // Add reaction
  socket.on('reaction:add', async (data: { messageId: string; emoji: string; chatId: string }) => {
    const reactions = await teamchatService.addReaction(data.messageId, userId, data.emoji);
    io?.to(`chat:${data.chatId}`).emit('message:reaction', {
      messageId: data.messageId,
      reactions,
    });
  });

  // Remove reaction
  socket.on('reaction:remove', async (data: { messageId: string; emoji: string; chatId: string }) => {
    const reactions = await teamchatService.removeReaction(data.messageId, userId, data.emoji);
    io?.to(`chat:${data.chatId}`).emit('message:reaction', {
      messageId: data.messageId,
      reactions,
    });
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log(`[WebSocket] User disconnected: ${userId} (${socket.id})`);
    
    // Remove from tracking
    const userSockets = connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        connectedUsers.delete(userId);
        // All connections closed -> offline
        await presenceService.goOffline(userId);
        broadcastPresence(userId, 'offline');
      }
    }
    socketToUser.delete(socket.id);
  });
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function broadcastPresence(userId: string, status: PresenceStatus, statusText?: string): void {
  if (!io) return;
  const event: WsPresenceEvent = {
    user_id: userId,
    status,
    status_text: statusText,
  };
  io.emit('presence', event);
}

async function getUserDisplayName(userId: string): Promise<string> {
  const users = await teamchatService.searchUsers('', userId, 1);
  // Fallback
  return 'User';
}

// Emit to specific user (all their sockets)
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    for (const socketId of userSockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

// Emit to chat room
export function emitToChat(chatId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`chat:${chatId}`).emit(event, data);
}

// Check if user is online
export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

export function getIO(): Server | null {
  return io;
}
