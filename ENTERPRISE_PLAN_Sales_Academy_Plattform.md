# Enterprise-Plan: Sales Academy Plattform  
## Von Stichworten zum durchgängigen System (Enterprise C‑Qualität)

**Version:** 1.0  
**Stand:** Basierend auf Ist-Analyse der aktuellen index.html (7.684 Zeilen, SPA, n8n-Chat)  
**Ziel:** Multi-User-Plattform mit Anmeldung, Datenbank, Lead-Generierung, Chat-Persistenz und Dokumenten-Management.

---

## Teil A: Ist-Analyse & Bewertung

### A.1 Aktueller Zustand (Kurz)

| Aspekt | Ist | Bewertung |
|--------|-----|-----------|
| **Architektur** | Eine statische HTML-Datei, alles im Frontend, kein Backend | Kein User-Konzept, keine Persistenz außer localStorage |
| **Nutzer** | Anonym, Gerät-basiert (localStorage) | Kein Login, kein eigener Bereich pro User |
| **Daten** | Stats, Streak, Track, Theme, Chat-Session-ID nur lokal | Kein zentraler Speicher, kein Profil, keine Leads |
| **Chat** | n8n-Webhook, Session-ID im localStorage, Nachrichten nur im DOM | Keine Speicherung pro User, keine Threads, keine Outlook-Features |
| **Lead-Generierung** | Nicht vorhanden | Muss neu gebaut werden – mit Qualitätsschleifen und klaren Datenfeldern |
| **Dokumente** | Nicht vorhanden | Muss neu gebaut werden – Upload, Bearbeitung, Austausch |

### A.2 Lücken zu deinen Zielen

1. **Anmeldung & eigener Bereich** → Heute: kein Auth, kein Server-seitiges User-Modell.
2. **Datenbank & Profil** → Heute: nur Client-Storage; keine strukturierte DB für Profil, Leads, Chat, Dokumente.
3. **Lead-Generierung** → Heute: fehlt; Ziel: strukturierte Auswahl, keine Halluzination, Qualitätsschleifen.
4. **Chat speichern & Outlook-Niveau** → Heute: Chat nur in n8n/Session; keine Threads, keine Historie pro User, keine typischen Messenger-Features.
5. **Dokumente** → Heute: fehlt; Ziel: Upload, Bearbeitung, Austausch mit intelligenter Nutzung.

### A.3 Stärken der bestehenden App (behalten)

- Klares Design-System (Refined Glass, Dark/Light).
- Zwei Tracks (Amy/Leti) und klare Inhaltsstruktur.
- Chat-Integration (n8n) als Basis für erweiterten Chat.
- Mobile-first, responsiv, Accessibility-Grundlagen.
- Copy-Funktionen, Ritual, Stats, FAB – gute UX-Bausteine.

**Fazit:** Frontend als „Academy-UI“ weiterverwenden; Backend, Auth, DB, Lead-Logik, Chat-Persistenz und Dokumenten-Service neu aufsetzen und die SPA daran anbinden.

---

## Teil B: Zielarchitektur (Überblick)

### B.1 Prinzipien

- **User-zentriert:** Jede Datenmenge gehört einem User (Tenant); strikte Trennung.
- **Datenbank als Single Source of Truth:** Profil, Leads, Chat-Verlauf, Dokumente-Metadaten und -Speicherorte in der DB.
- **Lead-Generierung:** Keine freie KI-Halluzination; nur definierte Felder, Validierung und Qualitätsschleifen.
- **Chat:** Vollständige Speicherung, Threads, Outlook-ähnliche Features wo sinnvoll.
- **Dokumente:** Zentrale Ablage, Versionierung, Berechtigungen, optional intelligente Auswertung.

### B.2 High-Level-Architektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Sales Academy SPA (erweiterte index / React/Vue/Next optional)     │  │
│  │  · Auth (Login/Logout, Session)   · Academy-UI (bestehend)          │  │
│  │  · Mein Bereich (Dashboard)       · Lead-Modul (neu)              │  │
│  │  · Chat (mit Persistenz)          · Dokumente (neu)               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                    │ HTTPS │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (API)                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │ Auth API    │ │ User/Profil │ │ Lead API    │ │ Chat API            ││
│  │ (Login,     │ │ (CRUD,      │ │ (CRUD,      │ │ (Threads, Msg,      ││
│  │  Token,     │ │  Einstell.) │ │  Import,    │ │  Persistenz,       ││
│  │  Refresh)   │ │             │ │  Validierung)│ │  Integration n8n)   ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│
│  ┌─────────────┐ ┌─────────────┐                                         │
│  │ Document API│ │ AI/Lead     │  ← Optional: eigener Service für        │
│  │ (Upload,    │ │ Service    │    Lead-Anreicherung (kein Halluzin.)   │
│  │  Version,   │ │ (struktur.  │                                         │
│  │  Share)     │ │  Daten nur) │                                         │
│  └─────────────┘ └─────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Datenbank (z. B. PostgreSQL)  │  Objekt-Speicher (z. B. S3-kompatibel)  │
│  · users, profiles             │  · Dokumente (Blobs)                    │
│  · leads, lead_sources         │  · Chat-Anhänge (optional)             │
│  · chat_threads, chat_messages │                                         │
│  · documents (Metadaten)       │                                         │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Externe Dienste (wie heute)                                            │
│  · n8n Webhook (Chat-Bot-Antworten) – erweitert um userId/threadId      │
│  · Optional: E-Mail-Versand, Kalender, CRM-Anbindung                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### B.3 Technologie-Empfehlung (Enterprise-tauglich)

| Schicht | Empfehlung | Alternative |
|---------|------------|-------------|
| **Frontend** | Weiterentwicklung der bestehenden SPA (HTML/JS) oder schrittweise React/Next.js | Vue, Svelte |
| **API** | Node.js (Express/Fastify) oder .NET Core | Python (FastAPI), Go |
| **Auth** | JWT (Access + Refresh), HttpOnly Cookies für Refresh, OAuth2/OpenID optional | Auth0, Supabase Auth, Keycloak |
| **Datenbank** | PostgreSQL (User, Profil, Leads, Chat, Doc-Metadaten) | MySQL/MariaDB |
| **Dateispeicher** | S3-kompatibel (MinIO, AWS S3, Cloudflare R2) für Dokumente | Lokal NFS nur für kleine Deployments |
| **Lead-Anreicherung** | Eigener Service mit festen Feldern + Validierung; optional strukturierte APIs (z. B. Handelsregister, Clearbit) | Keine „freie“ LLM-Halluzination für Lead-Daten |
| **Chat-Backend** | Eigene Chat-API speichert alle Nachrichten; n8n nur für Bot-Antworten | Direkt LLM-API mit striktem Prompting |

---

## Teil C: Detaillierte Ziele & Architektur

### C.1 Ziel 1: Anmeldung & eigener Bereich

**Anforderungen (präzisiert):**

- Registrierung (E-Mail + Passwort oder Magic Link / OAuth).
- Login / Logout; Session über JWT (kurzlebig) + Refresh-Token (länger, HttpOnly Cookie).
- „Eigener Bereich“ = nach Login: Dashboard mit allen datenbezogenen Modulen (Profil, Leads, Chat-Verlauf, Dokumente); strikte Trennung nach `userId`.

**Backend:**

- Tabelle `users`: id, email, password_hash, role, created_at, updated_at.
- Tabelle `profiles`: user_id (FK), display_name, avatar_url, preferences (JSON), track_default, timezone, etc.
- Auth-API: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`; Middleware prüft JWT bei geschützten Routen.

**Frontend:**

- Login-/Registrierungsseite (oder Modal); nach Login Redirect in „Mein Bereich“ / Dashboard.
- Alle API-Calls mit `Authorization: Bearer <access_token>`.
- Bestehende Academy-UI bleibt nutzbar; Kontext „eingeloggt als User X“ (z. B. Header mit Avatar/Name, Logout).

**Sicherheit:**

- Passwort nur gehashed (bcrypt/Argon2); keine Klartext-Logs.
- Rate-Limiting auf Login/Register; optional 2FA später.

---

### C.2 Ziel 2: Datenbank & Profil / alle Aspekte speichern

**Anforderungen:**

- Ein zentrales Profil pro User (Name, Kontakt, Einstellungen, Track, Lead-Präferenzen, etc.).
- Alle relevanten Aspekte in der DB: Profil, Leads, Chat-Verlauf, Dokumente-Metadaten, Stats (optional aus heutiger SPA übernommen).

**Datenmodell (Kern):**

- `users` – siehe oben.
- `profiles` – erweiterbar (z. B. firma, telefon, lead_felder_gewuenscht, benachrichtigungen).
- `leads` – siehe C.3.
- `chat_threads`, `chat_messages` – siehe C.4.
- `documents` – siehe C.5.
- Optional: `user_stats` (calls, connects, termine, streak) für Academy-KPI.

**API:**

- `GET/PATCH /api/users/me` – aktueller User (aus Token).
- `GET/PATCH /api/users/me/profile` – Profil lesen/aktualisieren.

Alle anderen Ressourcen (Leads, Chat, Dokumente) sind per `user_id` gefiltert (row-level security oder App-Logik).

---

### C.3 Ziel 3: Lead-Generierung ohne Halluzination, mit Qualitätsschleifen

**Prinzip:**

- Keine freie Erfindung von Daten durch KI.
- Nur **definierte, auswählbare Felder**; Werte kommen aus Validierung, strukturierten Quellen oder expliziter Nutzereingabe.
- **Qualitätsschleifen:** Prüfung (Plausibilität, Format), Freigabe/Abgleich, Herkunft dokumentieren.

**Konkretisierung „sinnvolle Auswahl von Lead-Daten“:**

- **Unternehmen:** Firmenname, Adresse (Straße, PLZ, Ort, Land), Website, Branche (aus vordefinierter Liste).
- **Ansprechpartner:** Name, Rolle/Funktion, Abteilung (z. B. aus Liste: Einkauf, Vertrieb, Geschäftsführung, …).
- **Kontakt:** E-Mail (primär), E-Mail-Alternative, Telefon, Mobil.
- **Status:** Quelle (z. B. „Handelsregister“, „Website“, „Import“), Verifizierungsstatus (ungeprüft / geprüft / abgelehnt), letzte Aktualisierung.
- **Notizen:** Freitext nur vom User, nie von der KI „erfunden“.

**Qualitätsschleifen:**

1. **Eingabequelle klar:** Jeder Eintrag hat `source` (Import, API, manuell, welcher Dienst).
2. **Validierung:** E-Mail-Format, URL-Format, PLZ/Land-Konsistenz; ungültige Werte werden markiert, nicht erfunden.
3. **Anreicherung nur aus definierten Quellen:** z. B. Handelsregister-API, Unternehmensdaten-API – nur Felder übernehmen, die die API liefert; Lücken als „leer“ oder „nicht verfügbar“ kennzeichnen.
4. **Kein LLM für Rohdaten:** LLM nur für Kategorisierung/Klassifikation aus festen Listen oder für Zusammenfassungen aus vorhandenen Texten – nie für Erfindung von Adressen/E-Mails/Telefonnummern.
5. **Review-Flag:** Optional „noch nicht freigegeben“ bis User bestätigt.

**Datenmodell (Lead):**

- `leads`: id, user_id, external_id, firma, strasse, plz, ort, land, website, branche_id, ansprechpartner_name, abteilung_id, email_primär, email_alternativ, telefon, mobil, quelle, verifizierungsstatus, notizen (user-only), created_at, updated_at, meta (JSON für erweiterte Felder).
- `lead_sources`: id, user_id, name, typ (api/import/manuell), config (JSON).
- `branchen`, `abteilungen`: kleine Referenztabellen (fest oder vom Admin pflegbar).

**API:**

- `GET /api/leads` – Liste (gefiltert, paginiert).
- `POST /api/leads` – manuell anlegen.
- `PATCH /api/leads/:id` – aktualisieren (z. B. nach Prüfung).
- `POST /api/leads/import` – CSV/Excel-Import (Mapping auf definierte Felder).
- `POST /api/leads/enrich` – Anreicherung nur über konfigurierte, strukturierte Quellen (kein freies LLM für Rohdaten).

**Frontend:**

- Konfiguration „Welche Lead-Felder möchte ich?“ (Checkboxen/Selects aus Katalog).
- Lead-Liste, Detail, Bearbeitung, Import-Dialog, Status-Badges (ungeprüft/geprüft).

---

### C.4 Ziel 4: Chat funktioniert & speichert; Outlook-Messenger-Niveau (sinnvoll)

**Anforderungen:**

- Alle Unterhaltungen werden im User-Profil (in der DB) gespeichert.
- Mindestens die auf der Plattform sinnvollen Fähigkeiten eines Outlook-Messengers: Threads, Verlauf, Suche, optional Anhänge, Lesestatus.

**Konkretisierung „Outlook-Features, sinnvoll auf der Plattform“:**

- **Threads/Konversationen:** Pro User mehrere Threads (z. B. nach Thema oder Track); jede Nachricht gehört zu einem Thread.
- **Persistenz:** Jede Nachricht (User + Bot) wird in der DB gespeichert; beim Öffnen wird Verlauf geladen.
- **Chronologische Anzeige:** Wie heute, aber aus DB.
- **Suche:** Suche in eigenen Nachrichten (Backend: Volltext in `chat_messages.content`).
- **Lesestatus:** Optional „gelesen“ (bei Bot-Nachrichten); „Zuletzt gelesen“ pro Thread.
- **Anhänge:** Optional: kleine Dateien an Nachricht hängen (Speicher in Objekt-Speicher, Referenz in DB).
- **Keine Echtzeit-Push nötig für MVP:** Polling oder später WebSocket für „neue Nachricht“.

**Datenmodell (Chat):**

- `chat_threads`: id, user_id, track, title (optional), last_message_at, created_at.
- `chat_messages`: id, thread_id, role (user|assistant), content, attachments (JSON oder separate Tabelle), created_at; optional source (n8n), raw_response (JSON für Debug).

**Ablauf:**

1. Client wählt Thread (oder erstellt neuen) → `GET /api/chat/threads`, `GET /api/chat/threads/:id/messages`.
2. User schreibt Nachricht → `POST /api/chat/threads/:id/messages` (speichern User-Nachricht), Backend ruft n8n auf (mit user_id, thread_id, message_id), Bot-Antwort kommt zurück → Backend speichert Bot-Nachricht, gibt sie an Client zurück.
3. n8n erhält: user_id, thread_id, message_id, message; liefert Antwort; Backend persistiert und antwortet dem Client.

**API:**

- `GET /api/chat/threads` – Liste der Threads des Users.
- `POST /api/chat/threads` – neuer Thread.
- `GET /api/chat/threads/:id/messages` – Verlauf (paginiert).
- `POST /api/chat/threads/:id/messages` – Nachricht senden (speichern + n8n + Bot speichern + zurückgeben).

**Frontend:**

- Thread-Liste (Sidebar oder Dropdown); Nachrichtenbereich lädt Verlauf aus API; Senden = API-Call statt nur DOM; optional Suche, Lesestatus, Anhänge.

---

### C.5 Ziel 5: Dokumente – Upload, Bearbeiten, Austausch (intelligent & state-of-the-art)

**Anforderungen:**

- User können Dokumente hochladen, bearbeiten und austauschen.
- „Intelligent“: Metadaten, Volltext-Indexierung, optional KI-Unterstützung für Zusammenfassung/Kategorisierung (auf Basis des echten Dokuments, keine Halluzination).
- „State of the art“: Versionierung, Berechtigungen, klare Ordner/Struktur, evtl. kollaborative Bearbeitung später.

**Funktionen (MVP → erweitert):**

- **Upload:** Dateitypen begrenzen (PDF, Office, Bilder); Speicher im Objekt-Speicher; Metadaten in DB (user_id, name, size, mime_type, version, created_at).
- **Versionierung:** Jede neue Version = neuer Blob + neuer Eintrag oder version_id; Verlauf anzeigbar, alte Version wiederherstellbar.
- **Bearbeiten:** Für Office/Text: entweder Integration mit OnlyOffice/Collabora oder „Download → Bearbeiten → Neu hochladen“ als neue Version; für PDF: Annotations-API oder externer Viewer.
- **Austausch:** „Teilen“ mit anderem User der Plattform (Berechtigung: lesen/schreiben); Eintrag in `document_shares` (document_id, shared_with_user_id, permission).
- **Intelligente Aspekte:** Volltext-Index (z. B. Elasticsearch oder PostgreSQL tsvector) für Suche; optional KI: nur Zusammenfassung/Tags aus Dokumentinhalt (keine Erfindung von Inhalten).
- **Ordner/Struktur:** Optional `folder_id` oder Tags; einfache Baumstruktur oder flache Liste mit Tags.

**Datenmodell (Dokumente):**

- `documents`: id, user_id, folder_id (optional), name, file_path (Objekt-Speicher-Key), mime_type, size, version, checksum, created_at, updated_at, meta (JSON).
- `document_versions`: id, document_id, version, file_path, size, created_at.
- `document_shares`: id, document_id, shared_with_user_id, permission (read/write), created_at.

**API:**

- `GET /api/documents` – Liste (Filter: Ordner, Tag).
- `POST /api/documents/upload` – Multipart-Upload; Backend speichert Blob, schreibt Metadaten.
- `GET /api/documents/:id` – Metadaten + Download-URL (signiert, zeitlich begrenzt).
- `POST /api/documents/:id/version` – neue Version hochladen.
- `GET /api/documents/:id/versions` – Versionsverlauf.
- `POST /api/documents/:id/share` – mit User teilen.
- `DELETE /api/documents/:id/share/:userId` – Freigabe entziehen.

**Frontend:**

- Bereich „Dokumente“: Liste, Upload-Button, Detail (Metadaten, Versionen, Teilen), Download, optional In-App-Viewer oder Link zu Editor.

---

## Teil D: Phasierter Implementierungsplan (Enterprise C)

### Phase 0: Vorbereitung (Wochen 1–2)

- **Entscheidungen:** Stack bestätigen (API-Sprache, DB, Objekt-Speicher, Hosting).
- **Repo & Umgebung:** Backend-Repo, DB (z. B. PostgreSQL) anlegen; Dev/Staging-Umgebung; CI (Build, Lint, optional Tests).
- **Datenbankschema v1:** Tabellen `users`, `profiles`; Migrations-Tool (z. B. node-pg-migrate, Flyway, Entity Framework).

### Phase 1: Auth & eigener Bereich (Wochen 3–5)

- **Backend:** Auth-API (Register, Login, Refresh, Logout); JWT + Refresh in HttpOnly Cookie; Middleware „requireAuth“.
- **DB:** `users`, `profiles` befüllen; erste Migration.
- **Frontend:** Login-/Register-Seite; nach Login Token speichern; alle Aufrufe mit Token; Header „Eingeloggt als …“ + Logout; Redirect „Mein Bereich“ (Dashboard-Platzhalter).
- **Abnahme:** Registrierung, Login, Logout, geschützte Route nur mit Token.

### Phase 2: Profil & Datenbank-Grundlage (Wochen 5–6)

- **Backend:** `GET/PATCH /api/users/me`, `GET/PATCH /api/users/me/profile`; Profilfelder erweiterbar (JSON oder Spalten).
- **Frontend:** „Mein Profil“-Seite (Name, E-Mail, Track, Einstellungen); Speichern gegen API.
- **Abnahme:** Profil lesen/schreiben, Persistenz in DB.

### Phase 3: Lead-Generierung (Wochen 7–11)

- **DB:** Tabellen `leads`, `lead_sources`, `branchen`, `abteilungen`; Indizes (user_id, status, created_at).
- **Backend:** CRUD Lead-API; Import (CSV/Excel) mit Mapping auf definierte Felder; Validierung (E-Mail, URL, PLZ); kein freies LLM für Rohdaten; optional Anreicherung über konfigurierte APIs.
- **Frontend:** Lead-Konfiguration (gewünschte Felder); Lead-Liste, Detail, Bearbeitung, Import-Dialog; Status-Badges.
- **Qualität:** Klare Dokumentation „Keine Halluzination“; Code-Review für alle Stellen, die Lead-Daten setzen.
- **Abnahme:** Leads anlegen, importieren, validieren, Liste/Filter; keine erfundenen Werte.

### Phase 4: Chat-Persistenz & Outlook-Features (Wochen 12–15)

- **DB:** `chat_threads`, `chat_messages`; Indizes (user_id, thread_id, created_at).
- **Backend:** Chat-API (Threads, Nachrichten); bei jeder User-Nachricht: speichern → n8n aufrufen (user_id, thread_id, message) → Bot-Antwort speichern → zurückgeben; optional Suche (Volltext).
- **n8n:** Webhook erweitern um user_id, thread_id; Antwort wie bisher; keine Persistenz in n8n nötig (Backend speichert).
- **Frontend:** Thread-Liste; Nachrichten aus API laden; Senden über API; optional Suche, Lesestatus, Anhänge (klein).
- **Abnahme:** Neue Konversation; Reload zeigt Verlauf; Suche funktioniert.

### Phase 5: Dokumente (Wochen 16–20)

- **Infrastruktur:** Objekt-Speicher (S3-kompatibel) anbinden; Bucket, CORS, Zugriff nur über Backend.
- **DB:** `documents`, `document_versions`, `document_shares`; Migration.
- **Backend:** Upload (Multipart), Download (signierte URL), Versionierung, Teilen; optional Volltext-Index (PDF/Office extrahieren, in DB oder Elasticsearch).
- **Frontend:** Dokumente-View; Upload; Liste; Detail (Versionen, Teilen); Download.
- **Optional:** KI nur für Zusammenfassung/Tags aus extrahiertem Text (fester Prompt, keine Erfindung).
- **Abnahme:** Upload, Version, Download, Teilen mit anderem User.

### Phase 6: Integration & Academy-Stats (Wochen 21–22)

- **Backend:** Optional `user_stats` (calls, connects, termine, streak) aus heutiger SPA übernehmen; API `GET/PATCH /api/users/me/stats` oder in Profil integriert.
- **Frontend:** Bestehende Academy-UI (Home, Ritual, FAB, Stats) anmeldeabhängig machen; Stats aus API lesen/schreiben.
- **Abnahme:** Nach Login sind Stats und Ritual dem User zugeordnet und persistent.

### Phase 7: Hardening & Go-Live (Wochen 23–24)

- **Sicherheit:** Penetrationstest, Rate-Limiting, CORS, Security-Headers; Logs ohne Passwörter/Token.
- **DSGVO:** Datenspeicherung dokumentieren; Löschkonzept (User löschen = Profil, Leads, Chat, Dokumente); Auftragsverarbeitung falls nötig.
- **Monitoring:** Health-Check, Logging, Fehlerbehandlung; optional Alerting.
- **Abnahme:** Checkliste Security/DSGVO; Staging-Freigabe; Go-Live.

---

## Teil E: Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| Lead-Daten „erfunden“ durch KI | Kein LLM für Rohdaten; nur definierte Felder und Quellen; Code-Review; Tests mit festen Eingaben. |
| Chat-Verlust / Inkonsistenz | Jede Nachricht zuerst in DB, dann n8n; Retry bei n8n-Fehler; idempotente Message-IDs. |
| Dokumente-Speicher teuer/unsicher | Objekt-Speicher mit Lifecycle (optional Archiv); Zugriff nur über Backend; keine öffentlichen URLs ohne Signatur. |
| Scope-Creep („noch Outlook-Feature X“) | Klare Priorisierung: Persistenz + Threads + Suche zuerst; Rest als Backlog mit Akzeptanzkriterien. |
| Performance bei vielen Leads/Chats | Paginierung, Indizes, optional Archivierung alter Threads; Volltext-Index nur für aktive Daten. |

---

## Teil F: Kurz-Checkliste Zielerreichung

- [ ] **Ziel 1:** Jeder Benutzer kann sich anmelden und hat einen eigenen Bereich → Auth-API, Login/Register, Dashboard/Profil, alle Ressourcen `user_id`-gefiltert.
- [ ] **Ziel 2:** Datenbank mit Profil und allen Aspekten (Leads, Chat, Dokumente) → PostgreSQL-Schema, CRUD-APIs, kein kritischer Daten nur im Frontend.
- [ ] **Ziel 3:** Lead-Generierung ohne Halluzination, Qualitätsschleifen, sinnvolle Feldauswahl → Definierte Felder, Validierung, Quellen-Tracking, kein LLM für Rohdaten.
- [ ] **Ziel 4:** Chat funktioniert und speichert; Outlook-Niveau (sinnvoll) → Threads, Persistenz, Verlauf, Suche, optional Lesestatus/Anhänge.
- [ ] **Ziel 5:** Dokumente hochladen, bearbeiten, austauschen, intelligent → Upload, Versionierung, Teilen, optional Volltext/KI-Zusammenfassung.
- [ ] **Ziel 6:** System analysiert und bewertet → Ist-Analyse und Lücken in diesem Plan dokumentiert.
- [ ] **Ziel 7:** Perfekter Plan in Enterprise-C-Qualität → Dieser Plan als lebendes Dokument; bei Änderungen Version und Changelog pflegen.

---

## Anhang: Mögliche DB-Schema-Übersicht (für Implementierung)

```text
users           id, email, password_hash, role, created_at, updated_at
profiles        user_id (FK), display_name, avatar_url, preferences (JSON), track_default, ...
leads           id, user_id (FK), firma, strasse, plz, ort, land, website, branche_id, 
                ansprechpartner_name, abteilung_id, email_primär, email_alternativ, telefon, mobil,
                quelle, verifizierungsstatus, notizen, created_at, updated_at, meta (JSON)
lead_sources    id, user_id (FK), name, typ, config (JSON)
chat_threads    id, user_id (FK), track, title, last_message_at, created_at
chat_messages   id, thread_id (FK), role, content, attachments (JSON), created_at, source
documents       id, user_id (FK), folder_id, name, file_path, mime_type, size, version, created_at, updated_at, meta (JSON)
document_versions id, document_id (FK), version, file_path, size, created_at
document_shares id, document_id (FK), shared_with_user_id (FK), permission, created_at
```

---

*Ende des Enterprise-Plans. Bei Umsetzung: pro Phase Meilenstein und Abnahme definieren; Plan bei Scope-Änderungen aktualisieren.*
