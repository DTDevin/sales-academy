-- Sales Academy Platform – Ritual (tägliche Checkliste pro User)
-- checked = JSON-Array [bool,bool,bool,bool] für die 4 Ritual-Punkte

CREATE TABLE IF NOT EXISTS user_ritual (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ritual_date DATE NOT NULL,
  checked JSONB NOT NULL DEFAULT '[false,false,false,false]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ritual_date)
);

CREATE INDEX IF NOT EXISTS idx_user_ritual_user_date ON user_ritual(user_id, ritual_date DESC);

DROP TRIGGER IF EXISTS user_ritual_updated_at ON user_ritual;
CREATE TRIGGER user_ritual_updated_at
  BEFORE UPDATE ON user_ritual
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
