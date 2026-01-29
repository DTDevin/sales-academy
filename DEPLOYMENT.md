# Sales Academy - Deployment Guide

## Architektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │     Backend     │     │    Database     │
│    (Vercel)     │────▶│    (Railway)    │────▶│   (PostgreSQL)  │
│                 │     │                 │     │                 │
│  index.html     │     │  Express API    │     │  Railway DB     │
│  login.html     │     │  WebSocket      │     │  oder Neon      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1. Datenbank einrichten (PostgreSQL)

### Option A: Railway PostgreSQL
1. Gehe zu [railway.app](https://railway.app)
2. Neues Projekt → Add PostgreSQL
3. Kopiere `DATABASE_URL` aus den Variablen

### Option B: Neon (Serverless PostgreSQL)
1. Gehe zu [neon.tech](https://neon.tech)
2. Erstelle eine neue Datenbank
3. Kopiere den Connection String

---

## 2. Backend auf Railway deployen

### Schritt 1: Neues Railway-Projekt
1. Gehe zu [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Wähle das Repository und `/backend` Ordner

### Schritt 2: Environment Variables setzen

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...  (von Schritt 1)
JWT_SECRET=<generiere mit: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generiere mit: openssl rand -hex 32>
CORS_ORIGIN=https://dein-frontend.vercel.app
N8N_WEBHOOK_URL=https://dein-n8n-webhook (optional)
```

### Schritt 3: Deploy
Railway deployed automatisch bei jedem Push.

### Schritt 4: Migrations ausführen
In Railway Terminal oder lokal mit DATABASE_URL:
```bash
npm run migrate:up
```

---

## 3. Frontend auf Vercel deployen

### Schritt 1: Vercel Projekt erstellen
1. Gehe zu [vercel.com](https://vercel.com)
2. New Project → Import Git Repository
3. Root Directory: `/` (nicht /backend!)

### Schritt 2: API URL konfigurieren

**Option A: Direkt im Code** (bereits eingerichtet)
Die API-URL wird automatisch erkannt basierend auf der Umgebung.
Für Produktion: Bearbeite `index.html` und `login.html`:
```javascript
window.SALES_ACADEMY_API = 'https://dein-backend.up.railway.app';
```

**Option B: Als Vercel Environment Variable**
1. In Vercel Project Settings → Environment Variables
2. Füge hinzu: `VITE_API_URL` = `https://dein-backend.up.railway.app`

### Schritt 3: Deploy
Vercel deployed automatisch bei jedem Push.

---

## 4. Nach dem Deployment

### API URL im Frontend aktualisieren
Bearbeite `index.html` und `login.html`, ersetze:
```javascript
window.SALES_ACADEMY_API || 'https://sales-academy-api.up.railway.app'
```
mit deiner echten Backend-URL.

### CORS im Backend aktualisieren
In Railway Environment Variables:
```
CORS_ORIGIN=https://dein-projekt.vercel.app
```

### Health Check
- Backend: `https://dein-backend.up.railway.app/health`
- Frontend: `https://dein-projekt.vercel.app`

---

## 5. Checkliste vor Go-Live

- [ ] PostgreSQL Datenbank läuft
- [ ] Migrations ausgeführt (`npm run migrate:up`)
- [ ] Backend deployed und `/health` gibt `{"status":"ok"}` zurück
- [ ] Frontend deployed
- [ ] CORS_ORIGIN korrekt konfiguriert
- [ ] JWT_SECRET und JWT_REFRESH_SECRET sind sichere, zufällige Strings
- [ ] Login/Registrierung funktioniert
- [ ] Team-Chat WebSocket verbindet

---

## 6. Troubleshooting

### "Network Error" im Frontend
- Prüfe CORS_ORIGIN im Backend
- Prüfe ob API_BASE URL korrekt ist

### "Database connection failed"
- Prüfe DATABASE_URL
- Stelle sicher dass SSL aktiviert ist: `?sslmode=require`

### WebSocket verbindet nicht
- Railway unterstützt WebSockets nativ
- Prüfe ob `wss://` statt `ws://` verwendet wird in Produktion

---

## 7. Umgebungsvariablen Referenz

### Backend (Railway)
| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| NODE_ENV | Umgebung | `production` |
| PORT | Server Port | `4000` |
| DATABASE_URL | PostgreSQL URL | `postgresql://...` |
| JWT_SECRET | Access Token Secret | `32+ Zeichen` |
| JWT_REFRESH_SECRET | Refresh Token Secret | `32+ Zeichen` |
| CORS_ORIGIN | Frontend URL(s) | `https://app.vercel.app` |
| N8N_WEBHOOK_URL | AI Chat Webhook | Optional |

---

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Logs in Railway/Vercel prüfen
