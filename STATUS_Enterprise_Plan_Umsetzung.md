# Status: Enterprise-Plan Umsetzung – Sales Academy Plattform

**Stand:** Basierend auf aktuellem Code und ENTERPRISE_PLAN_Sales_Academy_Plattform.md

---

## Übersicht: Phasen-Status

| Phase | Inhalt | Status | Anmerkung |
|-------|--------|--------|-----------|
| **0** | Vorbereitung (Stack, Repo, DB, Migrations) | ✅ Erledigt | Backend TS/Express, PostgreSQL, Migrations-Runner |
| **1** | Auth & eigener Bereich | ✅ Erledigt | JWT, Login/Register, „Mein Bereich“, geschützte Views |
| **2** | Profil & Datenbank-Grundlage | ✅ Erledigt | GET/PATCH users/me, users/me/profile, Frontend Profil |
| **3** | Lead-Generierung | ✅ Erledigt | CRUD, Import CSV, Validierung, Bearbeiten/Löschen im Frontend |
| **4** | Chat-Persistenz & Outlook-Features | ✅ Erledigt | Threads, Nachrichten, n8n, Thread-Liste; **optional** Suche fehlt |
| **5** | Dokumente | ✅ Erledigt | Upload (lokal), Versionen, Teilen (inkl. E-Mail), Download, Löschen |
| **6** | Integration & Academy-Stats | ✅ Erledigt | user_daily_stats, Streak, FAB/log-call/log-termin an API |
| **7** | Hardening & Go-Live | 🔶 Teilweise | User-Löschung + DSGVO-Doku ✅; Rest siehe „Was fehlt“ |

---

## Was ist umgesetzt (Kurz)

### Backend
- **Auth:** Register, Login, Refresh, Logout; JWT Access + Refresh (Cookie); requireAuth-Middleware
- **User/Profil:** GET/PATCH /api/users/me, /api/users/me/profile
- **Stats:** GET /api/users/me/stats, POST log-call, log-termin (Streak-Berechnung)
- **Leads:** CRUD, GET/POST /api/leads, PATCH/DELETE /api/leads/:id, Import CSV, Branchen/Abteilungen
- **Chat:** GET/POST /api/chat/threads, GET/POST /api/chat/threads/:id/messages, n8n-Webhook
- **Dokumente:** GET/POST upload, GET download, GET/POST version, GET versions, POST share (inkl. shared_with_email), DELETE share/:userId, DELETE /api/documents/:id
- **Infrastruktur:** Helmet, CORS, Rate-Limit, Cookie-Parser, zentrale Config, Error-Handler, Health /health
- **DB:** Migrations 001–005 (users, profiles, leads, chat_threads/messages, documents/versions/shares, user_daily_stats)

### Frontend (index.html + login.html)
- **Auth:** Login/Register, Token, Redirect „Mein Bereich“, Abmelden
- **Geschützte Views:** Mein Bereich (Profil), Leads, Dokumente – ohne Token Redirect zu login.html
- **Leads:** Liste, + Neu, Bearbeiten (Formular + PATCH), Löschen (Bestätigung + DELETE), CSV-Import
- **Dokumente:** Liste, + Hochladen, Download, **Versionen** (Modal + neue Version hochladen), **Teilen** (Modal mit E-Mail + Berechtigung), **Löschen** (Bestätigung + DELETE)
- **Chat:** Bei Token: Thread-Liste (Dropdown), Neuer Chat, Nachrichten aus API, Senden über API
- **Stats:** Bei Token: Stats + Streak von API; Init lädt GET /api/users/me/stats; logCall/log-termin per API; Gäste weiterhin localStorage

---

## Was fehlt bzw. ist noch offen

### Phase 7: Hardening & Go-Live (noch nicht umgesetzt)

1. **Sicherheit**
   - **Penetrationstest** – manuell/automatisiert noch nicht durchgeführt
   - **Rate-Limiting** – ✅ bereits vorhanden (allgemein + Auth verschärft)
   - **CORS** – ✅ konfiguriert (env)
   - **Security-Headers** – ✅ Helmet aktiv
   - **Logs ohne Passwörter/Token** – prüfen: Keine Klartext-Passwörter oder Tokens in Logs schreiben

2. **DSGVO**
   - **Datenspeicherung dokumentieren** – Verzeichnis der Verarbeitungstätigkeiten (VVT) / Datenschutzdokumentation
   - **Löschkonzept:** User löschen = Profil, Leads, Chat, Dokumente, Stats kaskadiert löschen  
     → **Backend:** Endpoint „User löschen“ (z. B. DELETE /api/users/me oder Admin) mit kaskadierter Löschung **noch nicht implementiert**
   - **Auftragsverarbeitung** – falls externe Dienste (n8n, Hosting): AV-Verträge prüfen

3. **Monitoring & Betrieb**
   - **Health-Check** – ✅ GET /health vorhanden
   - **Logging** – strukturiertes Logging (z. B. Request-Id, Fehler) ggf. erweitern
   - **Fehlerbehandlung** – ✅ zentraler Error-Handler
   - **Optional: Alerting** – nicht umgesetzt

4. **Abnahme**
   - **Checkliste Security/DSGVO** – ✅ `CHECKLISTE_Security_DSGVO_Go-Live.md` (vor Go-Live abhaken)
   - **Logging:** Keine Passwörter/Token in Logs – ✅ geprüft; Request-Logger nur Method/Pfad/Status/Dauer (`requestLogger.ts`)
   - Staging-Freigabe und Go-Live (Deployment, Domain, SSL)

---

### Optionale Punkte aus dem Plan (nicht kritisch für MVP)

| Thema | Plan | Aktuell |
|-------|------|--------|
| **Chat-Suche** | Optional: Volltext-Suche in Nachrichten | Nicht umgesetzt |
| **Chat-Anhänge** | Optional: kleine Anhänge | Nicht umgesetzt |
| **Dokumente-Speicher** | Optional: S3-kompatibel statt nur lokal | Aktuell lokaler Ordner (uploads/) |
| **Dokumente Volltext/KI** | Optional: Volltext-Index, KI-Zusammenfassung | Nicht umgesetzt |
| **Lead-Anreicherung** | Optional: konfigurierte APIs (z. B. Handelsregister) | Nicht umgesetzt |
| **Ritual** | Phase 6: „Ritual dem User zugeordnet“ | ✅ Ritual in DB (user_ritual), GET/PATCH /api/users/me/ritual, Frontend lädt/speichert bei Login |

---

### Sonstiges (Nice-to-have)

- **Dokumente: Freigaben anzeigen** – ✅ GET /api/documents/:id/shares (Backend), Teilen-Modal zeigt Liste + „Freigabe entziehen“
- **User-Verwaltung (Admin)** – z. B. GET /api/users für Admins; im Plan nicht explizit, für Mehr-Mandanten optional

---

## Nächste sinnvolle Schritte (Priorität)

1. **Phase 7 (teilweise erledigt)**
   - **Löschkonzept** – ✅ DELETE /api/users/me, Kaskade, Frontend „Konto löschen“.
   - **DSGVO-Doku** – ✅ `DSGVO_Datenspeicherung_und_Loeschkonzept.md`.
   - **Logging prüfen:** Sicherstellen, dass weder Passwörter noch Tokens in Logs landen.

2. **Checkliste Security/DSGVO**  
   ✅ `CHECKLISTE_Security_DSGVO_Go-Live.md` erstellt (Security, DSGVO, Logging, Go-Live). Vor Go-Live abhaken.

3. **Deployment & Go-Live**  
   Staging/Produktion (Server, Domain, SSL, env), dann Freigabe.

---

## Kurzfassung

- **Phasen 0–6** sind inklusive der besprochenen Erweiterungen (Leads Bearbeiten/Löschen, Chat-Thread-Liste, Dokumente Versionen/Teilen/Löschen, Stats an API) **umgesetzt**.
- **Phase 7 (Hardening & Go-Live)** – **teilweise umgesetzt:** User-Löschung (DELETE /api/users/me) mit Kaskade, Frontend „Konto löschen“, DSGVO-Dokument „Datenspeicherung & Löschkonzept“. Offen: Penetrationstest, Logging-Prüfung (keine Passwörter/Token in Logs), Checkliste Security/DSGVO, Staging-Freigabe, Go-Live (Deployment, Domain, SSL).
