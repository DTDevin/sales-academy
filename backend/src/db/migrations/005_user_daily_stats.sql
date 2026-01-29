-- Sales Academy Platform – Tagesstatistik & Streak (Phase 6)
-- Ein Eintrag pro User pro Tag; Streak aus aufeinanderfolgenden Tagen mit Aktivität.

CREATE TABLE IF NOT EXISTS user_daily_stats (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stats_date DATE NOT NULL,
  calls INT NOT NULL DEFAULT 0,
  connects INT NOT NULL DEFAULT 0,
  termine INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stats_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date ON user_daily_stats(user_id, stats_date DESC);

DROP TRIGGER IF EXISTS user_daily_stats_updated_at ON user_daily_stats;
CREATE TRIGGER user_daily_stats_updated_at
  BEFORE UPDATE ON user_daily_stats
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
