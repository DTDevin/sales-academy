# Sales Academy Plattform

Sales Academy – Single-Page-App (SPA) mit Enterprise-Backend: Auth, Leads, Chat, Dokumente, Stats, Ritual. Zwei Tracks (Amy = Hotel/LS, Leti = CF/Graduierung).

---

## Projektstruktur

| Ordner/Datei | Inhalt |
|--------------|--------|
| **index.html** | Haupt-SPA (Academy-UI, Home, Leads, Dokumente, Chat, Stats, Ritual) |
| **login.html** | Anmelden / Registrieren |
| **backend/** | Node.js/Express-API, PostgreSQL, siehe **backend/README.md** |
| **SO_TESTEN_Anleitung.md** | Schritt-für-Schritt: So startest du Backend + Frontend und testest alles |
| **STATUS_Enterprise_Plan_Umsetzung.md** | Was umgesetzt ist, was noch offen ist |
| **ENTERPRISE_PLAN_Sales_Academy_Plattform.md** | Phasierter Plan (0–7) |
| **CHECKLISTE_Security_DSGVO_Go-Live.md** | Abhaken vor Go-Live |
| **DSGVO_Datenspeicherung_und_Loeschkonzept.md** | Datenspeicherung, Löschkonzept |

---

## Schnellstart (lokal testen)

1. **PostgreSQL:** Datenbank `sales_academy` anlegen.
2. **Backend:**  
   `cd backend` → `.env` aus `env.example` anlegen (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN) → `npm install` → `npm run migrate:up` → `npm run dev`
3. **Frontend:**  
   `index.html` im Browser öffnen (per Webserver oder direkt).  
   Wenn die API woanders läuft: **`index.html?api=http://localhost:4000`** (oder deine API-URL).  
   Login/Register: **`login.html?api=http://localhost:4000`** – der Parameter wird beim Weiterleiten zu index beibehalten.

Ausführlich: **SO_TESTEN_Anleitung.md**.

---

## API-URL setzen

- **Standard:** Backend unter `http://localhost:4000`.
- **Per URL:** `index.html?api=http://DEINE_API_URL` bzw. `login.html?api=http://DEINE_API_URL`.
- **CORS:** In der Backend-.env muss `CORS_ORIGIN` genau die Adresse sein, unter der du das Frontend im Browser öffnest (z. B. `http://localhost:5500` bei Live Server).

---

## Technik

- **Frontend:** HTML/CSS/JS (SPA), keine Build-Step nötig.
- **Backend:** TypeScript, Express, JWT (Access + Refresh-Cookie), Helmet, CORS, Rate-Limit.
- **Datenbank:** PostgreSQL (users, profiles, leads, chat, documents, stats, ritual).
- **Chat-Bot:** n8n-Webhook (konfigurierbar in Backend-.env).

---

*Vollständige API-Doku und Setup: **backend/README.md**. Test-Anleitung: **SO_TESTEN_Anleitung.md**.*
