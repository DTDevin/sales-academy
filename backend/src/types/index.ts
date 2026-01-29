/**
 * Shared types – User, Profile, JWT payload.
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  role: string;
  created_at: Date;
}

export interface Profile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: Record<string, unknown> | null;
  track_default: string | null;
  timezone: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  sub: string;   // user id
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  preferences?: Record<string, unknown>;
  track_default?: string;
  timezone?: string;
}

/** Lead – nur definierte Felder, keine Halluzination */
export interface Lead {
  id: string;
  user_id: string;
  external_id: string | null;
  firma: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  website: string | null;
  branche_id: string | null;
  ansprechpartner_name: string | null;
  abteilung_id: string | null;
  email_primary: string | null;
  email_alternativ: string | null;
  telefon: string | null;
  mobil: string | null;
  quelle: string;
  verifizierungsstatus: string;
  notizen: string | null;
  meta: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface LeadCreate {
  firma?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
  website?: string;
  branche_id?: string;
  ansprechpartner_name?: string;
  abteilung_id?: string;
  email_primary?: string;
  email_alternativ?: string;
  telefon?: string;
  mobil?: string;
  quelle?: string;
  notizen?: string;
}

export interface LeadUpdate extends Partial<LeadCreate> {
  verifizierungsstatus?: string;
}

/** Chat – Threads und Nachrichten */
export interface ChatThread {
  id: string;
  user_id: string;
  track: string;
  title: string | null;
  last_message_at: Date | null;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments: Record<string, unknown> | null;
  source: string | null;
  created_at: Date;
}

/** Dokumente */
export interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  file_path: string;
  mime_type: string | null;
  size: number;
  version: number;
  checksum: string | null;
  meta: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_path: string;
  size: number;
  created_at: Date;
}

// ═══════════════════════════════════════════════════════════════
// TEAM-CHAT TYPES (Enterprise C-Level)
// ═══════════════════════════════════════════════════════════════

export type TeamChatType = 'direct' | 'group';
export type ChatMemberRole = 'admin' | 'member';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type MessageContentType = 'text' | 'image' | 'file' | 'system';

/** Team-Chat (1:1 oder Gruppe) */
export interface TeamChat {
  id: string;
  type: TeamChatType;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Team-Chat mit Zusatzinfos für Listen */
export interface TeamChatWithDetails extends TeamChat {
  members: TeamChatMemberInfo[];
  last_message: TeamMessagePreview | null;
  unread_count: number;
}

/** Chat-Mitglied */
export interface TeamChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: ChatMemberRole;
  joined_at: Date;
  last_read_at: Date | null;
  last_read_message_id: string | null;
  muted_until: Date | null;
}

/** Mitglied-Info für Anzeige */
export interface TeamChatMemberInfo {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: ChatMemberRole;
  presence?: PresenceStatus;
}

/** Team-Nachricht */
export interface TeamMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  content: string;
  content_type: MessageContentType;
  reply_to_id: string | null;
  attachments: MessageAttachment[] | null;
  mentions: string[] | null;
  edited_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
}

/** Nachricht mit Sender-Info */
export interface TeamMessageWithSender extends TeamMessage {
  sender: {
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  reactions: MessageReactionGroup[];
  reply_to?: TeamMessagePreview | null;
  read_by?: string[];
}

/** Nachricht-Vorschau */
export interface TeamMessagePreview {
  id: string;
  content: string;
  content_type: MessageContentType;
  sender_name: string | null;
  created_at: Date;
}

/** Datei-Anhang */
export interface MessageAttachment {
  name: string;
  url: string;
  size: number;
  mime_type: string;
}

/** Reaktions-Gruppe (Emoji + wer) */
export interface MessageReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  reacted_by_me: boolean;
}

/** Reaktions-Katalog */
export interface ReactionCatalogItem {
  id: string;
  emoji: string;
  name: string;
  category: string;
  sort_order: number;
}

/** Online-Status */
export interface UserPresence {
  user_id: string;
  status: PresenceStatus;
  status_text: string | null;
  last_seen_at: Date;
}

/** User für Suche */
export interface UserSearchResult {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  presence?: PresenceStatus;
}

// WebSocket Events
export interface WsMessageEvent {
  message: TeamMessageWithSender;
  chat: { id: string; type: TeamChatType };
}

export interface WsTypingEvent {
  chat_id: string;
  user_id: string;
  user_name: string;
  is_typing: boolean;
}

export interface WsPresenceEvent {
  user_id: string;
  status: PresenceStatus;
  status_text?: string;
}

export interface WsReadEvent {
  chat_id: string;
  user_id: string;
  message_id: string;
}
