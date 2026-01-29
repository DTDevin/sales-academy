# DSGVO: Datenspeicherung & Löschkonzept – Sales Academy Plattform

**Stand:** Phase 7 (Hardening & Go-Live)  
**Zweck:** Dokumentation der Verarbeitung personenbezogener Daten und des Löschkonzepts gemäß DSGVO (Art. 5, 13, 17, 30).

---

## 1. Verarbeitete Daten (Übersicht)

| Daten / Tabelle | Zweck | Speicherort | Personenbezug |
|-----------------|--------|-------------|----------------|
| **users** | Konto (E-Mail, Passwort-Hash, Rolle) | PostgreSQL | E-Mail, Konto-Zuordnung |
| **profiles** | Anzeigename, Track, Zeitzone, Präferenzen | PostgreSQL | Anzeigename, Einstellungen |
| **leads** | Lead-Daten (Firma, Ansprechpartner, E-Mail, PLZ, Ort, …) | PostgreSQL | Kontaktdaten (Lead-Empfänger) |
| **chat_threads / chat_messages** | Chat-Verlauf (Threads, Nachrichten) | PostgreSQL | Inhalt der Konversation |
| **documents / document_versions** | Hochgeladene Dokumente (Metadaten + Dateien) | PostgreSQL + Dateisystem (uploads/) | Dateinamen, Inhalt |
| **document_shares** | Freigaben (wer hat Zugriff auf welches Dokument) | PostgreSQL | Zuordnung Nutzer ↔ Dokument |
| **user_daily_stats** | Tagesstatistik (Anrufe, Abschlüsse, Streak) | PostgreSQL | Nutzungsdaten pro User |

**Technische Logs:** Keine personenbezogenen Daten (Passwörter, Tokens) in Logs speichern. Zugriff auf API wird ggf. protokolliert (IP, Zeit) – je nach Hosting; hier nicht im Scope der App selbst.

---

## 2. Rechtsgrundlagen & Zweck

- **Vertragserfüllung / Nutzung der Plattform:** Registrierung, Login, Profil, Leads, Chat, Dokumente, Stats dienen der Bereitstellung der Sales Academy (Art. 6 Abs. 1 lit. b DSGVO).
- **Berechtigte Interessen:** Technische Logs, Sicherheit (Rate-Limiting, CORS) – Art. 6 Abs. 1 lit. f DSGVO, sofern umgesetzt.
- **Einwilligung:** Wo explizit abgefragt (z. B. Newsletter), separat dokumentieren.

---

## 3. Löschkonzept (Recht auf Löschung, Art. 17 DSGVO)

### 3.1 Nutzerinitiierte Kontolöschung

- **Endpoint:** `DELETE /api/users/me` (nur für eingeloggten Nutzer).
- **Frontend:** „Mein Bereich“ → „Konto löschen“ mit doppelter Bestätigung (Hinweis auf Unwiderruflichkeit).

### 3.2 Ablauf der Löschung (kaskadiert)

1. **Dokumente:** Alle vom Nutzer hochgeladenen **Dateien** werden vom Dateisystem gelöscht (Hauptdatei + alle Versionen).
2. **Datenbank:** Anschließend wird der **User** gelöscht (`DELETE FROM users WHERE id = ?`). Durch **ON DELETE CASCADE** werden automatisch gelöscht:
   - **profiles**
   - **leads** (inkl. zugehörige Einträge in lead_sources, sofern vorhanden)
   - **chat_threads** (und **chat_messages** über CASCADE von chat_threads)
   - **documents** (und **document_versions**, **document_shares** für diese Dokumente)
   - **user_daily_stats**
   - Freigaben, bei denen der Nutzer **shared_with_user_id** ist (document_shares), werden durch Löschung des Users mitgelöscht (FK auf users).

3. **Session:** Refresh-Cookie wird vom Server gelöscht; der Client löscht den Access-Token und leitet zur Login-Seite weiter.

### 3.3 Keine Aufbewahrung nach Löschung

Nach erfolgreicher Ausführung von `DELETE /api/users/me` existieren keine personenbezogenen Daten des Nutzers mehr in der Anwendung (PostgreSQL + Upload-Verzeichnis). Backups können noch temporär Kopien enthalten – Aufbewahrungsfristen der Backups sind betrieblich zu definieren (z. B. 30 Tage).

---

## 4. Weitere Betroffenenrechte (Kurz)

- **Auskunft (Art. 15):** Nutzer kann über „Mein Bereich“ und ggf. Export-Funktionen (optional) seine Daten einsehen; bei Bedarf ergänzend manuell über Support/Betreiber.
- **Berichtigung (Art. 16):** Profil und Leads sind über die Oberfläche bearbeitbar.
- **Einschränkung (Art. 18) / Datenübertragbarkeit (Art. 20):** Bei Bedarf prozessual umsetzbar (z. B. Export der eigenen Leads/Dokumente als Feature oder manuell).
- **Widerspruch (Art. 21):** Bei Verarbeitung auf Basis von Art. 6 Abs. 1 lit. f; Nutzer kann sich an den Verantwortlichen wenden.

---

## 5. Technische und organisatorische Maßnahmen (Kurz)

- **Zugriffskontrolle:** Authentifizierung (JWT), alle Ressourcen nach `user_id` gefiltert.
- **Vertraulichkeit:** HTTPS, keine Klartext-Passwörter (nur Hash in DB), keine Tokens/Passwörter in Logs.
- **Integrität:** Validierung der Eingaben, definierte Felder (keine „Halluzination“ bei Lead-Daten).
- **Verfügbarkeit:** Rate-Limiting, zentrale Fehlerbehandlung, Health-Check.

---

## 6. Auftragsverarbeitung (AVV)

Sofern externe Dienste personenbezogene Daten im Auftrag verarbeiten (z. B. Hosting, n8n-Webhook für Chat-Bot), sind AVV mit den Auftragsverarbeitern abzuschließen und in einem Verzeichnis der Verarbeitungstätigkeiten (VVT) zu erfassen. Die Sales Academy App speichert Chat-Inhalte und Nutzerdaten in der eigenen DB bzw. im eigenen Upload-Verzeichnis; der n8n-Webhook erhält nur die für die Bot-Antwort nötigen Daten (Nachricht, Kontext) – Umfang und Speicherdauer bei n8n sind separat zu prüfen.

---

## 7. Änderungen

- **Erstfassung:** Phase 7 – User-Lösch-Endpoint, Kaskade, Frontend „Konto löschen“, dieses Dokument.
- Bei Änderungen der Verarbeitung oder des Löschablaufs dieses Dokument aktualisieren.

---

*Ende des Dokuments. Bei Go-Live: Verantwortlichen benennen, Datenschutzerklärung auf der Webseite anpassen, VVT/AVV ergänzen.*
