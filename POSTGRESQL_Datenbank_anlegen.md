# PostgreSQL: Datenbank „sales_academy“ anlegen – Schritt für Schritt

Du hast noch nie eine PostgreSQL-Datenbank angelegt? Kein Problem. Hier kommt alles von vorne.

---

## Teil 1: Ist PostgreSQL auf deinem PC installiert?

### Prüfen

1. **Windows-Taste** drücken, **„pgAdmin“** tippen.
   - Wenn **pgAdmin** in der Liste erscheint → PostgreSQL ist sehr wahrscheinlich installiert. **Weiter mit Teil 2.**
   - Wenn **nichts** erscheint: **„Dienste“** oder **„Services“** öffnen (Windows-Taste, „Dienste“ tippen) und nach **„postgresql“** suchen.
     - Wenn ein Dienst **„PostgreSQL …“** existiert → installiert. **Weiter mit Teil 2.**
     - Wenn nichts gefunden wird → **PostgreSQL ist nicht installiert.** **Weiter mit Teil 1b (Installation).**

### Teil 1b: PostgreSQL installieren (nur wenn nötig)

1. Im Browser öffnen: **https://www.postgresql.org/download/windows/**
2. Auf **„Download the installer“** (von EDB) klicken.
3. **Neueste Version** wählen (z. B. PostgreSQL 16 oder 17).
4. Installer herunterladen und starten.
5. Im Installer:
   - **Installationspfad** kannst du lassen (z. B. `C:\Program Files\PostgreSQL\16`).
   - **Komponenten:** „PostgreSQL Server“, „pgAdmin 4“, „Command Line Tools“ angehakt lassen → **Next**.
   - **Datenverzeichnis** lassen → **Next**.
   - **Passwort für den Benutzer „postgres“** festlegen.  
     Dieses Passwort brauchst du später für **DATABASE_URL** in der `.env`.  
     Merken oder aufschreiben (z. B. `postgres123`) → **Next**.
   - **Port:** `5432` lassen → **Next**.
   - **Locale** lassen → **Next** → Installation starten.
6. Am Ende **Finish**. PostgreSQL und pgAdmin sind installiert.

---

## Teil 2: pgAdmin starten

1. **Windows-Taste** drücken, **„pgAdmin“** tippen.
2. **pgAdmin 4** starten (evtl. kurz warten, bis das Fenster erscheint).
3. Beim ersten Start kann ein **Master-Passwort** für pgAdmin abgefragt werden. Du kannst eines setzen (z. B. dasselbe wie für postgres) oder leer lassen und bestätigen – je nach Version.

---

## Teil 3: Mit dem PostgreSQL-Server verbinden

1. **Links** im Fenster siehst du einen Baum: **„Servers“** → darunter z. B. **„PostgreSQL 16“** (oder deine Version).
2. Auf **„PostgreSQL 16“** (oder den Eintrag mit deiner Version) **klicken**.
3. Es wird ein **Passwort** abgefragt:
   - Das ist das **PostgreSQL-Benutzerpasswort**, das du bei der Installation für den Benutzer **postgres** gesetzt hast.
   - Eintippen und **„OK“** (oder „Save password“ anhaken, dann musst du es nicht jedes Mal eingeben).
4. Der Eintrag klappt aus. Darunter siehst du z. B.:
   - **Databases**
   - **Login/Group Roles**
   - …

---

## Teil 4: Neue Datenbank „sales_academy“ anlegen

1. **Rechtsklick** auf **„Databases“** (nicht auf den Server, sondern auf das Wort „Databases“).
2. Im Menü **„Create“** → **„Database…“** wählen.
3. Es öffnet sich ein Dialog **„Create - Database“**.
4. Im Tab **„General“**:
   - **Database:** hier eintragen: **`sales_academy`**  
     (alles klein, Unterstrich, kein Leerzeichen.)
   - **Owner:** kann auf **postgres** stehen bleiben.
5. **„Save“** (unten) klicken.
6. Links unter **„Databases“** erscheint jetzt der Eintrag **„sales_academy“**.

**Fertig.** Die Datenbank ist angelegt.

---

## Teil 5: Kurz prüfen

1. Links auf **„sales_academy“** klicken (einmal auswählen).
2. Oben in pgAdmin solltest du sehen, dass die Datenbank ausgewählt ist.
3. Du musst **nichts** darin einrichten – die Tabellen legt später das Backend mit `npm run migrate:up` an.

---

## Was du für die .env brauchst

Für die Backend-Datei **`.env`** (Schritt 4 in SCHRITT_FUER_SCHRITT.md) brauchst du die **Verbindungs-URL** zur Datenbank. Sie sieht so aus:

```
postgres://BENUTZER:PASSWORT@localhost:5432/sales_academy
```

- **BENUTZER:** meist **`postgres`** (der Standard-Benutzer bei der Installation).
- **PASSWORT:** das Passwort, das du bei der Installation für „postgres“ gesetzt hast.
- **localhost:** der Rechner selbst.
- **5432:** der Standard-Port von PostgreSQL.
- **sales_academy:** der Name der Datenbank, die du gerade angelegt hast.

**Beispiel:**  
Wenn dein Passwort `postgres123` ist:

```
DATABASE_URL=postgres://postgres:postgres123@localhost:5432/sales_academy
```

(Das trägst du in der `.env` in die Zeile **DATABASE_URL** ein.)

---

## Wenn etwas nicht klappt

| Problem | Lösung |
|--------|--------|
| pgAdmin startet nicht / Fehlermeldung | PostgreSQL-Dienst prüfen: Windows-Taste → „Dienste“ → nach „PostgreSQL“ suchen → Rechtsklick → „Starten“. Danach pgAdmin erneut starten. |
| Passwort vergessen (postgres) | Unter Windows: Passwort zurücksetzen ist umständlich. Oft einfacher: PostgreSQL deinstallieren und neu installieren (dann neues Passwort setzen). Oder in der Dokumentation „PostgreSQL Windows password reset“ suchen. |
| Unter „Databases“ steht schon „sales_academy“ | Dann ist die Datenbank schon da. Du kannst direkt mit **Schritt 2** in SCHRITT_FUER_SCHRITT.md weitermachen (in den Backend-Ordner wechseln). |
| „Create - Database“ hat kein Feld „Database“ | Oben im Dialog den Tab **„General“** auswählen. Das erste Feld heißt dort „Database“ – dort `sales_academy` eintragen. |

Wenn du bei einem bestimmten Schritt hängenbleibst, schreib einfach: welcher Teil (1, 2, 3, 4 oder 5) und was genau du siehst oder welche Meldung erscheint. Dann können wir den nächsten Schritt genau für dich formulieren.
