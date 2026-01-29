# So kannst du die Sales Academy testen

**Stand:** Nach Umsetzung des Enterprise-Plans (Phasen 0–7 + Erweiterungen).  
Du kannst die App **lokal** testen, sobald Backend und Datenbank laufen und das Frontend die API erreicht.

---

## Was du brauchst

1. **Node.js** (z. B. 18 oder 20)
2. **PostgreSQL** (z. B. 14+), eine leere Datenbank `sales_academy` (oder anderer Name → in `.env`)
3. **Browser** (Chrome, Firefox, Edge)

---

## Schritte zum Testen

### 1. Datenbank anlegen

```bash
# In PostgreSQL (psql oder GUI):
CREATE DATABASE sales_academy;
```

(Oder einen anderen Namen – dann in Schritt 2 in `DATABASE_URL` eintragen.)

### 2. Backend einrichten und starten

```bash
cd backend
cp env.example .env
```

**.env anpassen** (mindestens):

- `DATABASE_URL=postgresql://BENUTZER:PASSWORT@localhost:5432/sales_academy`
- `JWT_SECRET=...` (langer Zufallsstring)
- `JWT_REFRESH_SECRET=...` (anderer langer Zufallsstring)
- `CORS_ORIGIN=http://localhost:3000` oder die URL, unter der du das Frontend öffnest (z. B. `http://127.0.0.1:5500` wenn du mit Live-Server arbeitest)

```bash
npm install
npm run migrate:up
npm run dev
```

Backend läuft dann z. B. unter **http://localhost:4000**.  
Im Terminal solltest du sehen: `[Sales Academy API] listening on port 4000 (development)`.

### 3. Frontend öffnen

- **Option A:** `index.html` direkt im Browser öffnen (z. B. `file:///C:/Users/.../index.html`).  
  Dann muss die API unter einer URL erreichbar sein. Setze im Frontend die API-URL (siehe unten).

- **Option B:** Einen lokalen Webserver nutzen (z. B. VS Code „Live Server“, oder `npx serve .` im Projektordner).  
  Dann z. B. **http://localhost:3000** oder **http://127.0.0.1:5500** – diese URL muss mit `CORS_ORIGIN` in der Backend-.env übereinstimmen.

**API-URL im Frontend:**  
- **Per URL-Parameter (empfohlen):** `index.html?api=http://localhost:4000` bzw. `login.html?api=http://localhost:4000` – die API-URL wird so gesetzt; nach Login bleibt `?api=...` beim Weiterleiten zu index erhalten.  
- Standard ohne Parameter: `http://localhost:4000`.  
- Alternativ: in `index.html` die Zeile `var API_BASE = ...` anpassen.

### 4. Durchklicken – was du testen kannst

1. **Login/Register**  
   Auf „Anmelden“ klicken → zu `login.html`. Registrieren (E-Mail + Passwort) oder Anmelden. Danach Redirect zu `index.html`.

2. **Mein Bereich**  
   Profil anzeigen, Abmelden, ggf. „Konto löschen“ (mit Bestätigung).

3. **Leads**  
   Liste, „+ Neu“, Bearbeiten (Zeile oder Button), Löschen (mit Bestätigung), CSV-Import.

4. **Dokumente**  
   Liste, „+ Hochladen“, Download, „Versionen“ (Modal + neue Version), „Teilen“ (E-Mail + Berechtigung, Freigaben anzeigen/entziehen), „Löschen“.

5. **Chat**  
   Assistant öffnen → Thread-Liste (Dropdown), „Neuer Chat“, Nachrichten schreiben (bei n8n-Webhook erreichbar kommt Bot-Antwort).

6. **Stats & Ritual**  
   FAB klicken (Kontakt), Doppeltap (Termin). Ritual-Checkliste (4 Punkte) abhaken – wird bei Login in der DB gespeichert.

7. **Health**  
   Im Browser: **http://localhost:4000/health** → `{ "status": "ok", "db": "ok", "ts": "…" }`.

---

## Häufige Probleme

| Problem | Mögliche Lösung |
|--------|------------------|
| **CORS-Fehler** im Browser | `CORS_ORIGIN` in Backend-.env muss exakt die Origin des Frontends sein (z. B. `http://localhost:3000` ohne Schrägstrich am Ende). |
| **401 Unauthorized** | Token abgelaufen oder nicht gesendet. Nochmal einloggen. |
| **Datenbankfehler** beim Start | `DATABASE_URL` prüfen; Migrationen mit `npm run migrate:up` ausführen. |
| **Login/Register 400** | E-Mail-Format prüfen; Passwort mind. 8 Zeichen. |
| **Chat antwortet nicht** | n8n-Webhook-URL in Backend-.env (`N8N_WEBHOOK_URL`); wenn nicht erreichbar, speichert die App trotzdem Nachrichten, Bot-Antwort kann „technisches Problem“ sein. |

---

## Wie viel fehlt noch?

**Für lokales Testen:** Nichts.  
Sobald Backend (mit DB und Migrationen) und Frontend wie oben laufen, kannst du alle beschriebenen Funktionen testen.

**Für echten Go-Live (Produktion):**

- Server/Hosting mit Node.js + PostgreSQL
- Domain + **HTTPS** (SSL)
- `.env` in Produktion setzen (keine Beispielwerte)
- Optional: Staging-Test mit Checkliste (`CHECKLISTE_Security_DSGVO_Go-Live.md`)
- Datenschutzerklärung auf der Webseite verlinken

---

*Kurz: Backend mit DB starten, Frontend mit passender API-URL und CORS öffnen – dann kannst du alles testen.*
