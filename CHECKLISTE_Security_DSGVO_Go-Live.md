# Checkliste Security, DSGVO & Go-Live – Sales Academy Plattform

**Vor Staging-Freigabe und Go-Live abhaken.**  
Stand: Phase 7 (Hardening).

---

## 1. Sicherheit

| # | Punkt | Status | Anmerkung |
|---|--------|--------|-----------|
| 1.1 | **HTTPS** in Produktion (kein HTTP für Login/API) | ☐ | SSL/TLS; Redirect HTTP → HTTPS |
| 1.2 | **CORS** konfiguriert (nur erlaubte Origins) | ✅ | `CORS_ORIGIN` in .env |
| 1.3 | **Rate-Limiting** aktiv (allgemein + Auth verschärft) | ✅ | express-rate-limit |
| 1.4 | **Security-Headers** (Helmet) | ✅ | Helmet mit crossOriginResourcePolicy |
| 1.5 | **Keine Passwörter/Token in Logs** | ✅ | Siehe Abschnitt „Logging“ unten |
| 1.6 | **JWT** Access kurzlebig, Refresh in HttpOnly-Cookie | ✅ | Access 15m, Refresh 7d Cookie |
| 1.7 | **Passwörter** nur gehashed (bcrypt) in DB | ✅ | Kein Klartext |
| 1.8 | **Penetrationstest** (manuell oder Tool) | ☐ | Optional vor Go-Live |

---

## 2. DSGVO

| # | Punkt | Status | Anmerkung |
|---|--------|--------|-----------|
| 2.1 | **Datenspeicherung & Löschkonzept** dokumentiert | ✅ | `DSGVO_Datenspeicherung_und_Loeschkonzept.md` |
| 2.2 | **Kontolöschung** (Recht auf Löschung) umgesetzt | ✅ | DELETE /api/users/me, Kaskade, Frontend „Konto löschen“ |
| 2.3 | **Datenschutzerklärung** auf Webseite/App verlinkt | ☐ | Verantwortlicher, Zweck, Betroffenenrechte, Löschung |
| 2.4 | **Auftragsverarbeitung (AVV)** mit Hosting/n8n falls personenbezogene Daten verarbeitet | ☐ | AV-Verträge prüfen |
| 2.5 | **Verzeichnis der Verarbeitungstätigkeiten (VVT)** bei Bedarf ergänzen | ☐ | Aus DSGVO-Dokument ableitbar |

---

## 3. Logging (keine sensiblen Daten)

**Regel:** In Logs dürfen **niemals** stehen: Passwörter, Access-/Refresh-Token, `Authorization`-Header, Cookie-Inhalte, Request-Body von Login/Register.

| # | Punkt | Status | Anmerkung |
|---|--------|--------|-----------|
| 3.1 | Kein `console.log` von `req.body` / `req.headers` / `req.cookies` | ✅ | Codebase geprüft |
| 3.2 | Error-Handler gibt in Produktion keine Stacktraces/Interna an Client | ✅ | Nur „Internal Server Error“ bei 5xx |
| 3.3 | DB-Pool-Fehler: nur `err.message` (keine Query-Parameter mit Passwort) | ✅ | pool.ts loggt nur message |
| 3.4 | Optional: Request-Logger nur Method, Pfad, StatusCode, Dauer (kein Auth, kein Body) | ✅ | `middleware/requestLogger.ts` |

---

## 4. Betrieb & Go-Live

| # | Punkt | Status | Anmerkung |
|---|--------|--------|-----------|
| 4.1 | **.env** in Produktion gesetzt (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN, ggf. N8N_WEBHOOK_URL, UPLOAD_DIR) | ☐ | Keine Defaults aus Repo in Prod |
| 4.2 | **Secrets** (JWT, DB-URL) nicht im Repo, nicht in Frontend | ✅ | Backend-only |
| 4.3 | **Health-Check** erreichbar (GET /health) | ✅ | Monitoring/Alerting optional |
| 4.4 | **Migrationen** vor Start ausgeführt (npm run migrate:up) | ☐ | Auf Staging/Prod anwenden |
| 4.5 | **Upload-Verzeichnis** (Dokumente) existiert und ist beschreibbar | ☐ | UPLOAD_DIR auf Server |
| 4.6 | **Staging-Freigabe** (Test mit echten Datenfluss: Auth, Leads, Chat, Dokumente, Konto löschen) | ☐ | |
| 4.7 | **Go-Live:** Domain, SSL, Backup-Strategie, Rollback-Plan | ☐ | |

---

## 5. Kurz: Was im Code bereits umgesetzt ist

- CORS, Helmet, Rate-Limit, JWT, HttpOnly-Cookie, bcrypt, kaskadierte User-Löschung, DSGVO-Dokument, keine Logs von Passwort/Token.
- Offen: HTTPS/SSL (Betrieb), Datenschutzerklärung (Seite), AVV/VVT (organisatorisch), Penetrationstest, Staging/Go-Live (Deployment).

---

*Checkliste vor jedem Go-Live erneut durchgehen und Status aktualisieren.*
