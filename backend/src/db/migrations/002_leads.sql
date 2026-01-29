-- Sales Academy Platform – Leads (Phase 3)
-- Definierte Felder, keine Halluzination; Qualitätsschleifen via quelle + verifizierungsstatus.

CREATE TABLE IF NOT EXISTS branchen (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS abteilungen (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0
);

INSERT INTO branchen (id, name, sort_order) VALUES
  ('hotel', 'Hotel / Beherbergung', 10),
  ('gastronomie', 'Gastronomie', 20),
  ('handel', 'Handel', 30),
  ('dienstleistung', 'Dienstleistung', 40),
  ('industrie', 'Industrie', 50),
  ('sonstige', 'Sonstige', 99)
ON CONFLICT (id) DO NOTHING;

INSERT INTO abteilungen (id, name, sort_order) VALUES
  ('geschaeftsfuehrung', 'Geschäftsführung', 10),
  ('einkauf', 'Einkauf', 20),
  ('vertrieb', 'Vertrieb', 30),
  ('marketing', 'Marketing', 40),
  ('it', 'IT', 50),
  ('sonstige', 'Sonstige', 99)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  typ VARCHAR(50) NOT NULL DEFAULT 'manuell',
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_user ON lead_sources(user_id);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  firma VARCHAR(255),
  strasse VARCHAR(255),
  plz VARCHAR(20),
  ort VARCHAR(255),
  land VARCHAR(2) DEFAULT 'DE',
  website VARCHAR(2048),
  branche_id VARCHAR(50) REFERENCES branchen(id),
  ansprechpartner_name VARCHAR(255),
  abteilung_id VARCHAR(50) REFERENCES abteilungen(id),
  email_primary VARCHAR(255),
  email_alternativ VARCHAR(255),
  telefon VARCHAR(64),
  mobil VARCHAR(64),
  quelle VARCHAR(100) NOT NULL DEFAULT 'manuell',
  verifizierungsstatus VARCHAR(50) NOT NULL DEFAULT 'ungeprüft',
  notizen TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_verifizierung ON leads(user_id, verifizierungsstatus);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(user_id, created_at DESC);

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
