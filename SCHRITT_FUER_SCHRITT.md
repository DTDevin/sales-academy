# Sales Academy – Schritt für Schritt zum Laufen

Folge diese Schritte **der Reihe nach**. Wenn etwas nicht klappt, bei dem Schritt stoppen und prüfen.

---

## Schritt 1: PostgreSQL-Datenbank anlegen

**Du brauchst:** PostgreSQL installiert (z. B. von https://www.postgresql.org/download/windows/).

**Option A – pgAdmin (mit Oberfläche):**
1. pgAdmin öffnen.
2. Links unter „Servers“ deinen PostgreSQL-Server anklicken (z. B. „PostgreSQL 15“).
3. Rechtsklick auf **„Databases“** → **„Create“** → **„Database…“**.
4. Bei **„Database“** eintragen: `sales_academy`.
5. **„Save“** klicken.

**Option B – PowerShell/CMD (wenn `psql` im PATH ist):**
```powershell
psql -U postgres -c "CREATE DATABASE sales_academy;"
```
(Falls Passwort abgefragt wird: dein PostgreSQL-Passwort eingeben.)

**Prüfen:** In pgAdmin solltest du unter „Databases“ die Datenbank `sales_academy` sehen.

---

## Schritt 2: In den Backend-Ordner wechseln

**PowerShell öffnen** (Windows-Taste, „PowerShell“ tippen, Enter).

Dann eingeben (Pfad in Anführungszeichen wegen des Leerzeichens):

```powershell
cd "C:\Users\Oberloher\Documents\SALES ACADEMY\backend"
```

Enter. Die Zeile danach sollte so aussehen:
`PS C:\Users\Oberloher\Documents\SALES ACADEMY\backend>`

---

## Schritt 3: .env-Datei anlegen

Im **gleichen** PowerShell-Fenster (du bist noch in `backend`):

```powershell
Copy-Item env.example .env
```

Enter. Damit liegt jetzt eine Datei `.env` im Ordner `backend`.

---

## Schritt 4: .env anpassen

1. In **Cursor** im linken Explorer den Ordner **backend** öffnen.
2. Die Datei **`.env`** öffnen (falls du sie nicht siehst: Ansicht „Versteckte Dateien“ oder direkt über Datei → Öffnen).
3. Diese Zeilen anpassen:

| Zeile | Was eintragen |
|-------|----------------|
| **DATABASE_URL** | Deine PostgreSQL-Verbindung. Beispiel: `postgres://postgres:DEIN_PASSWORT@localhost:5432/sales_academy` – ersetze `DEIN_PASSWORT` durch dein PostgreSQL-Passwort. Wenn du keinen Benutzer angelegt hast: oft `postgres` als User. |
| **JWT_SECRET** | Irgendein langer Zufallsstring, mind. 32 Zeichen, z. B. `mein-geheimer-key-12345-zum-testen-abc` |
| **JWT_REFRESH_SECRET** | Ein **anderer** langer Zufallsstring, z. B. `noch-ein-geheimer-key-67890-refresh-xyz` |
| **CORS_ORIGIN** | Die Adresse, unter der du später die App im Browser öffnest. Wenn du **Live Server** in Cursor nutzt: oft `http://127.0.0.1:5500` oder `http://localhost:5500`. Wenn du die Datei direkt öffnest: probiere `http://localhost:5500` oder `null` (ohne Anführungszeichen nicht möglich – dann `http://localhost:5500` lassen). |

4. Datei **speichern** (Strg+S).

---

## Schritt 5: Abhängigkeiten installieren

PowerShell – du solltest noch in `backend` sein. Falls nicht, nochmal:

```powershell
cd "C:\Users\Oberloher\Documents\SALES ACADEMY\backend"
```

Dann:

```powershell
npm install
```

Enter. Warten, bis es durchgelaufen ist (kann etwas dauern).

---

## Schritt 6: Datenbank-Migrationen ausführen

Im **gleichen** Ordner:

```powershell
npm run migrate:up
```

Enter. Es sollten Zeilen erscheinen wie:
`[migrate] applied: 001_initial`
`[migrate] applied: 002_leads`
… bis `006_user_ritual`.

Wenn hier ein Fehler kommt (z. B. „connection refused“): **DATABASE_URL** in der `.env` prüfen (Passwort, Port 5432, Datenbankname `sales_academy`).

---

## Schritt 7: Backend starten

Weiter in der gleichen PowerShell:

```powershell
npm run dev
```

Enter. Wenn alles stimmt, erscheint etwas wie:
`[Sales Academy API] listening on port 4000 (development)`

**Backend läuft.** Dieses Fenster **nicht schließen**; der Server läuft darin weiter.

---

## Schritt 8: Prüfen, ob die API antwortet

**Neues** Browser-Tab öffnen und in die Adresszeile tippen:

```
http://localhost:4000/health
```

Enter. Du solltest etwas sehen wie:
`{"status":"ok","db":"ok","ts":"2026-01-29T..."}`

- Wenn **„db“: „ok“** dabei ist: API und Datenbank sind in Ordnung.
- Wenn **„db“: „unavailable“** oder Fehlermeldung: DATABASE_URL in `.env` nochmal prüfen, PostgreSQL muss laufen.

---

## Schritt 9: Frontend im Browser öffnen

**Option A – Mit Live Server in Cursor:**
1. In Cursor rechtsklick auf **index.html** (im Projektroot „SALES ACADEMY“, nicht im backend).
2. **„Open with Live Server“** wählen.
3. Es öffnet sich ein Tab, z. B. `http://127.0.0.1:5500/index.html`.
4. In der Adresszeile **hinten** an die URL anfügen: `?api=http://localhost:4000`  
   Also z. B.: `http://127.0.0.1:5500/index.html?api=http://localhost:4000`  
   Enter.

**Option B – Ohne Live Server:**
1. Im Explorer zum Ordner **SALES ACADEMY** (der mit index.html) gehen.
2. **index.html** doppelklicken (öffnet im Standardbrowser).
3. In die Adresszeile oben **hinten** anhängen: `?api=http://localhost:4000`  
   Also z. B.: `file:///C:/Users/Oberloher/Documents/SALES%20ACADEMY/index.html?api=http://localhost:4000`  
   Enter.

**Wichtig:** Wenn du eine andere Adresse fürs Frontend nutzt (z. B. anderen Port), muss **CORS_ORIGIN** in der `.env` genau diese Adresse sein (z. B. `http://127.0.0.1:5500`).

---

## Schritt 10: Registrieren und kurz testen

1. Auf der Startseite auf **„Anmelden“** (oder den Link zur Anmeldung) klicken.
2. Auf **„Registrieren“** wechseln.
3. E-Mail und Passwort (mind. 8 Zeichen) eintragen → **Registrieren**.
4. Du wirst zur Academy weitergeleitet.
5. Kurz durchklicken: **Mein Bereich**, **Leads** („+ Neu“), **Dokumente**, **Chat** (Assistant öffnen), **FAB** (Kontakt zählen). Wenn das ohne Fehlermeldung geht, läuft die App.

---

## Wenn etwas schiefgeht

| Problem | Wo nachschauen |
|--------|-----------------|
| „Missing required env“ | Schritt 3 + 4: `.env` existiert und enthält NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET. |
| „connection refused“ / „db unavailable“ | Schritt 1: DB `sales_academy` angelegt? Schritt 4: DATABASE_URL mit richtigem Passwort und Port 5432? PostgreSQL-Dienst läuft? |
| CORS-Fehler im Browser | Schritt 4: CORS_ORIGIN = exakt die Adresse, die in der Browserzeile steht (z. B. http://127.0.0.1:5500), dann Backend mit Strg+C beenden und `npm run dev` neu starten. |
| „cd“ findet backend nicht | Schritt 2: Pfad in Anführungszeichen: `cd "C:\Users\Oberloher\Documents\SALES ACADEMY\backend"`. |

Wenn du bei einem bestimmten Schritt hängenbleibst: Schritt-Nummer und genaue Fehlermeldung notieren, dann können wir gezielt daran weiterarbeiten.
