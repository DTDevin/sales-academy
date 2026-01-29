-- Sales Academy Platform – Team-Chat (Enterprise C-Level)
-- Outlook Messenger Style: 1:1 Chats, Gruppen, Echtzeit, Reaktionen

-- ═══════════════════════════════════════════════════════════════
-- TEAM CHATS (Direct Messages & Groups)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
  name VARCHAR(255),                    -- Nur für Gruppen
  description TEXT,                     -- Gruppenbeschreibung
  avatar_url VARCHAR(2048),             -- Gruppenbild
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_chats_created ON team_chats(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- CHAT-MITGLIEDER (Wer ist in welchem Chat)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES team_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,             -- Für Gelesen-Status
  last_read_message_id UUID,            -- Letzte gelesene Nachricht
  muted_until TIMESTAMPTZ,              -- Stummschaltung
  UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_chat_members_user ON team_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_members_chat ON team_chat_members(chat_id);

-- ═══════════════════════════════════════════════════════════════
-- NACHRICHTEN
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES team_chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'system')),
  reply_to_id UUID REFERENCES team_messages(id) ON DELETE SET NULL,
  attachments JSONB,                    -- [{name, url, size, mime_type}]
  mentions JSONB,                       -- [user_id, user_id, ...]
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,               -- Soft Delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_messages_chat ON team_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created ON team_messages(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- REAKTIONEN (Coole Sales & Teamführung Emojis!)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(20) NOT NULL,           -- Emoji oder Shortcode
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_team_message_reactions_msg ON team_message_reactions(message_id);

-- ═══════════════════════════════════════════════════════════════
-- ONLINE-STATUS / PRESENCE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  status_text VARCHAR(255),             -- "In einem Meeting", "Auf Kundentermin"
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- LESEBESTÄTIGUNGEN (Wer hat was gelesen)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS team_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES team_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_message_reads_msg ON team_message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_team_message_reads_user ON team_message_reads(user_id);

-- ═══════════════════════════════════════════════════════════════
-- VERFÜGBARE REAKTIONEN (Vordefinierte coole Reaktionen)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reaction_catalog (
  id VARCHAR(50) PRIMARY KEY,
  emoji VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0
);

-- Coole Reaktionen für Sales & Teamführung! 🎯
INSERT INTO reaction_catalog (id, emoji, name, category, sort_order) VALUES
  -- STANDARD
  ('like', '👍', 'Gefällt mir', 'standard', 1),
  ('love', '❤️', 'Liebe', 'standard', 2),
  ('laugh', '😂', 'Haha', 'standard', 3),
  ('wow', '😮', 'Wow', 'standard', 4),
  ('sad', '😢', 'Traurig', 'standard', 5),
  ('angry', '😡', 'Ärgerlich', 'standard', 6),
  
  -- SALES POWER 💪
  ('deal', '🤝', 'Deal!', 'sales', 10),
  ('money', '💰', 'Cha-Ching!', 'sales', 11),
  ('target', '🎯', 'Ziel erreicht!', 'sales', 12),
  ('rocket', '🚀', 'To the Moon!', 'sales', 13),
  ('fire', '🔥', 'On Fire!', 'sales', 14),
  ('trophy', '🏆', 'Champion!', 'sales', 15),
  ('star', '⭐', 'Superstar!', 'sales', 16),
  ('diamond', '💎', 'Premium!', 'sales', 17),
  ('phone', '📞', 'Call it!', 'sales', 18),
  ('chart', '📈', 'Wachstum!', 'sales', 19),
  
  -- TEAMFÜHRUNG 👔
  ('clap', '👏', 'Applaus!', 'leadership', 20),
  ('muscle', '💪', 'Stark!', 'leadership', 21),
  ('brain', '🧠', 'Clever!', 'leadership', 22),
  ('lightbulb', '💡', 'Gute Idee!', 'leadership', 23),
  ('crown', '👑', 'King/Queen!', 'leadership', 24),
  ('medal', '🥇', 'Erster Platz!', 'leadership', 25),
  ('handshake', '🫱🏼‍🫲🏽', 'Teamwork!', 'leadership', 26),
  ('salute', '🫡', 'Jawoll!', 'leadership', 27),
  ('hundred', '💯', '100%!', 'leadership', 28),
  ('checkmark', '✅', 'Erledigt!', 'leadership', 29),
  
  -- FUN & MOTIVATION 🎉
  ('party', '🎉', 'Party!', 'fun', 30),
  ('champagne', '🍾', 'Champagner!', 'fun', 31),
  ('coffee', '☕', 'Erstmal Kaffee', 'fun', 32),
  ('eyes', '👀', 'Interessant...', 'fun', 33),
  ('thinking', '🤔', 'Hmm...', 'fun', 34),
  ('mindblown', '🤯', 'Mind Blown!', 'fun', 35),
  ('hot', '🌶️', 'Heißes Thema!', 'fun', 36),
  ('cool', '😎', 'Cool!', 'fun', 37),
  ('ninja', '🥷', 'Ninja-Move!', 'fun', 38),
  ('unicorn', '🦄', 'Magisch!', 'fun', 39)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGER: updated_at automatisch setzen
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS team_chats_updated_at ON team_chats;
CREATE TRIGGER team_chats_updated_at
  BEFORE UPDATE ON team_chats
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS user_presence_updated_at ON user_presence;
CREATE TRIGGER user_presence_updated_at
  BEFORE UPDATE ON user_presence
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
