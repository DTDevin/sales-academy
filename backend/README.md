# Sales Academy API (Backend)

Enterprise C-Level Backend für die Sales Academy Plattform: Auth, User, Profil. Erweiterbar um Leads, Chat, Dokumente.

## Voraussetzungen

- Node.js >= 18
- PostgreSQL >= 14

## Setup

```bash
cd backend
cp .env.example .env
# .env anpassen: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
npm install
```

## Datenbank

```bash
# PostgreSQL: Datenbank anlegen
createdb sales_academy

# Migrationen ausführen
npm run migrate:up
```

## Start

```bash
# Entwicklung (Hot-Reload)
npm run dev

# Produktion
npm run build
npm start
```

## API (Phase 1)

### Auth (ohne Token)

| Method | Pfad | Body | Beschreibung |
|--------|------|------|--------------|
| POST | /api/auth/register | `{ "email", "password" }` | Registrierung; setzt Refresh-Cookie |
| POST | /api/auth/login | `{ "email", "password" }` | Login; setzt Refresh-Cookie |
| POST | /api/auth/refresh | (Cookie oder Body `refreshToken`) | Neues Access-Token |
| POST | /api/auth/logout | – | Cookie löschen |

### User & Profil (Header: `Authorization: Bearer <accessToken>`)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| GET | /api/users/me | Aktueller User (id, email, role, created_at) |
| GET | /api/users/me/profile | Profil (display_name, track_default, preferences, …) |
| PATCH | /api/users/me/profile | Profil aktualisieren (display_name, track_default, timezone, preferences) |
| GET | /api/users/me/ritual | Ritual-Checkliste für heute (checked: [4 Booleans]) |
| PATCH | /api/users/me/ritual | Ritual speichern (Body: checked: [4 Booleans]) |
| DELETE | /api/users/me | Konto unwiderruflich löschen (DSGVO): alle Nutzerdaten inkl. Dokumentdateien; DB-CASCADE löscht Profil, Leads, Chat, Dokumente, Stats. Antwort 204; Client soll Token löschen und zu Login weiterleiten. |

### User-Stats (Academy: Kontakte, Abschlüsse, Streak) (Header: `Authorization: Bearer <accessToken>`)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| GET | /api/users/me/stats | Tagesstatistik (calls, connects, termine, streak, stats_date) |
| POST | /api/users/me/stats/log-call | Ein Anruf/Kontakt verbuchen; liefert aktualisierte Stats |
| POST | /api/users/me/stats/log-termin | Ein Abschluss verbuchen (connects + termine); liefert aktualisierte Stats |

Streak = aufeinanderfolgende Tage mit Aktivität (calls > 0 oder termine > 0) rückwärts ab heute.

### Leads (Header: `Authorization: Bearer <accessToken>`)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| GET | /api/leads | Liste (Query: limit, offset, verifizierungsstatus) |
| GET | /api/leads/branchen | Referenz Branchen |
| GET | /api/leads/abteilungen | Referenz Abteilungen |
| GET | /api/leads/:id | Ein Lead |
| POST | /api/leads | Neuer Lead (Body: firma, ansprechpartner_name, email_primary, plz, ort, website, notizen, …) |
| PATCH | /api/leads/:id | Lead aktualisieren (inkl. verifizierungsstatus) |
| DELETE | /api/leads/:id | Lead löschen |
| POST | /api/leads/import | CSV-Import (Body: rows, columnMap, quelle) |

Validierung: E-Mail-Format, URL-Format, PLZ 5 Ziffern; verifizierungsstatus: ungeprüft | geprüft | abgelehnt. Keine Halluzination – nur definierte Felder.

### Chat (Header: `Authorization: Bearer <accessToken>`)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| GET | /api/chat/threads | Liste Threads des Users |
| POST | /api/chat/threads | Thread anlegen/abrufen (Body: track) |
| GET | /api/chat/threads/:id/messages | Nachrichten eines Threads (Query: limit) |
| POST | /api/chat/threads/:id/messages | Nachricht senden (Body: content, track) → User + Bot in DB, Bot via n8n |

n8n-URL konfigurierbar über `N8N_WEBHOOK_URL` (env).

### Dokumente (Header: `Authorization: Bearer <accessToken>`)

| Method | Pfad | Beschreibung |
|--------|------|--------------|
| GET | /api/documents | Liste (Query: folder_id optional) |
| GET | /api/documents/:id | Metadaten |
| GET | /api/documents/:id/download | Datei herunterladen |
| POST | /api/documents/upload | Multipart (field: file), optional name, folder_id |
| GET | /api/documents/:id/versions | Versionsverlauf |
| GET | /api/documents/:id/shares | Liste der Freigaben (E-Mail, Berechtigung) – nur Eigentümer |
| POST | /api/documents/:id/version | Neue Version (Multipart: file) |
| POST | /api/documents/:id/share | Body: shared_with_user_id **oder** shared_with_email, permission (read/write) |
| DELETE | /api/documents/:id/share/:userId | Freigabe entziehen |
| DELETE | /api/documents/:id | Dokument löschen (nur Eigentümer) |

Speicher: lokal unter `UPLOAD_DIR` (env, Default: uploads). Erlaubte Mime-Types und max. Größe in config.

### Health

- GET /health → `{ "status": "ok", "db": "ok", "ts": "…" }` (bei DB-Fehler: 503, `db`: "unavailable")

## Projektstruktur

```
src/
  config/       Konfiguration (env)
  db/           Pool, Migrationen
  middleware/   errorHandler, validate, auth (JWT)
  routes/       auth, users
  services/     auth.service, user.service
  types/        User, Profile, JwtPayload
  index.ts      Einstieg, Helmet, CORS, Rate-Limit
```

## Nächste Phasen (Plan)

- Phase 2: Leads (CRUD, Import, Qualitätsschleifen)
- Phase 3: Chat (Threads, Nachrichten persistiert)
- Phase 4: Dokumente (Upload, Version, Teilen)
