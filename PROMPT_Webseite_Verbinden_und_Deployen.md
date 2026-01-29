# PROMPT: Webseite/Plattform mit Cursor verbinden, bearbeiten und deployen

**Kopiere den folgenden Abschnitt und füge ihn ein, wenn du mit einer KI (Cursor) eine bestehende Webseite oder Plattform verbinden, bearbeiten und deployen willst.**

---

## PROMPT ZUM EINFÜGEN (Copy & Paste)

```
AUFGABE: Webseite/Plattform mit diesem Workspace verbinden, Code bearbeiten und deployen.

ZIEL:
- Verbindung zu der genannten URL/ zum Server herstellen (so weit wie möglich automatisch).
- Projekt lokal oder im Workspace zum Bearbeiten verfügbar machen.
- Änderungen auf dem schnellsten sinnvollen Weg deployen.

VORGEHEN – bitte strikt einhalten:

1. ANALYSE (selbstständig durchführen)
   - Erkenne anhand der gelieferten Infos: Welche Art Hosting? (z.B. Vercel, Netlify, eigener Server, cPanel, FTP, SSH, Managed WordPress, Shop-System, etc.)
   - Prüfe, ob bereits ein Projekt/Repo in diesem Workspace existiert.
   - Leite daraus ab: Welche Schritte sind nötig? (Clone, FTP-Sync, SSH-Mount, Git Pull, Vercel/Netlify CLI, etc.)

2. VERBINDUNG HERSTELLEN
   - Nutze alle von mir bereitgestellten Zugangsdaten (FTP, SFTP, SSH, Git-URL, API-Keys, cPanel, Vercel/Netlify Token, etc.).
   - Führe Verbindungsschritte aus: z.B. Repo klonen, FTP/SFTP-Verbindung einrichten, SSH-Befehl vorbereiten, oder „Connect to …“-Anleitung geben.
   - Wenn etwas nicht automatisch geht: Gib mir exakt die nächste Aktion (z.B. „Führe in Terminal aus: …“ oder „Trage in Cursor ein: …“).

3. BEARBEITUNG
   - Code/Inhalte in diesem Workspace bearbeiten (nach meinen konkreten Wünschen).
   - Keine unnötigen Abweichungen; nur das Nötige ändern.

4. DEPLOYMENT
   - Deploy auf dem schnellsten geeigneten Weg:
     - Bei Git-basiertem Hosting (z.B. Vercel, Netlify): Push → Auto-Deploy oder expliziter Deploy-Befehl.
     - Bei FTP/SSH: Upload der geänderten Dateien oder Sync-Befehl.
     - Bei cPanel/Managed: Entweder Git-Deploy oder Upload – je nachdem, was der Host unterstützt.
   - Nach dem Deploy: Kurz bestätigen („Deploy ausgelöst“ / „Upload abgeschlossen“) und ob die URL erreichbar ist.

WICHTIG:
- Unmissverständlich: Es geht um ECHTE Verbindung zum LIVE-Server/ zur LIVE-URL, nicht nur um lokale Übungsprojekte.
- Ich stelle alle nötigen Zugänge (Host, FTP, SSH, API, etc.) bereit – du nutze sie und fordere konkret an, was noch fehlt.
- So viel wie möglich automatisch (Befehle ausführen, Konfiguration vorschlagen); wo es nicht geht, klare Einzelschritte für mich.
- Gilt für JEDE Art Deployment (Vercel, Netlify, eigener Server, FTP, cPanel, WordPress, Shops, etc.) – nicht nur Vercel.
```

---

## Was du zusätzlich angeben solltest

Damit die KI schnell und eindeutig handeln kann, liefere wenn möglich:

| Was | Beispiel |
|-----|----------|
| **URL der Webseite/Plattform** | `https://meine-firma.de` |
| **Art des Hostings** (wenn bekannt) | Vercel, Netlify, Strato, IONOS, cPanel, eigener Server, … |
| **Zugangsart** | Git-Repo-URL, FTP (Host, User, Passwort, Port), SSH (Host, User, Key/Passwort), cPanel-Login, Vercel/Netlify Token |
| **Projekttyp** | Statische Seite, React/Next.js, WordPress, Shop (z.B. WooCommerce, Shopify), andere CMS/Plattform |
| **Konkrete Aufgabe** | „Seite verbinden und Impressum ändern“, „Neues Design deployen“, „Blog anbinden“ |

---

## Beispiel-Nutzung

Du schreibst z.B.:

> „Bitte nutze den PROMPT aus PROMPT_Webseite_Verbinden_und_Deployen.md.  
> URL: https://meine-seite.de  
> Hosting: Strato, FTP-Zugang habe ich (sag mir, wo ich Host/User/Passwort eintrage).  
> Aufgabe: Impressumstext auf der Live-Seite aktualisieren und deployen.“

Dann soll die KI: analysieren → Verbindung (FTP) einrichten → relevante Datei finden/ändern → Upload/Deploy durchführen (oder dir die genauen Schritte nennen).

---

**Hinweis:** Dieser Prompt gilt ausdrücklich für alle Deployment-Arten (Vercel, Netlify, FTP, SSH, cPanel, etc.), nicht nur für Vercel.
