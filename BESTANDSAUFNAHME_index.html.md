# 100% Bestandsaufnahme: index.html (LEVERAGE Sales Academy)

**Datei:** `index.html` · **Zeilen:** 7.684 · **Stand:** Analyse vollständig

---

## 1. Übersicht & Architektur

| Aspekt | Beschreibung |
|--------|--------------|
| **Typ** | Single-Page Application (SPA), eine HTML-Datei |
| **Zweck** | Sales Academy – zwei Tracks: **Amy (LS · Hotelmarketing)** und **Leti (CF · Graduierung)** |
| **Design-System** | „Refined Glass Edition“ – Dark/Light Theme, Maybach Champagne + Porsche Akzente |
| **Responsive** | Mobile-first, max-width 480px zentriert, Desktop-Nav ab 769px |
| **Externe Abhängigkeiten** | Google Fonts (Inter, Cormorant Garamond, Playfair Display), **n8n Webhook** (Chat) |

---

## 2. HEAD & Meta

| Element | Inhalt / Zweck |
|---------|----------------|
| `charset` | UTF-8 |
| `viewport` | width=device-width, initial-scale=1.0, viewport-fit=cover |
| **Cache-Kontrolle** | no-cache, no-store, must-revalidate; Pragma no-cache; Expires 0 |
| `theme-color` | #08090C |
| `apple-mobile-web-app-capable` | yes |
| `apple-mobile-web-app-status-bar-style` | black-translucent |
| **Preconnect** | fonts.googleapis.com, fonts.gstatic.com |
| **Fonts** | Inter (300–700), Cormorant Garamond (400–700), Playfair Display (400, 500, 600) |

---

## 3. CSS-Architektur (inline in `<style>`)

### 3.1 CSS-Variablen (`:root`)

- **Hintergründe:** `--bg-deep`, `--bg-primary`, `--bg-secondary`, `--bg-elevated`, `--bg-card`, `--bg-glass`
- **Rahmen:** `--border`, `--border-subtle`, `--border-accent`
- **Text:** `--text-primary`, `--text-secondary`, `--text-muted`, `--text-micro`
- **Maybach Champagne:** `--champagne`, `--champagne-light`, `--champagne-pale`, `--champagne-glow`, `--champagne-subtle` (Legacy: `--gold`, `--gold-light`, `--gold-glow`)
- **Porsche Akzente:** `--accent`, `--accent-light`, `--accent-glow`
- **Purple (Leti):** `--purple`, `--purple-light`, `--purple-glow`
- **Titanium:** `--titanium`, `--titanium-light`
- **Success:** `--success`
- **Geometrie:** `--radius`, `--radius-lg`, `--radius-xl`
- **Motion:** `--ease-out`, `--ease-spring`, `--ease-luxury`, `--duration-fast/normal/slow`

### 3.2 Light Theme (`[data-theme="light"]`)

- Vollständige Überschreibung aller oben genannten Variablen (helle Hintergründe, dunkle Texte, angepasste Champagne/Purple).
- Zusätzliche Glas-Variablen: `--glass-light`, `--glass-medium`, `--glass-strong`, `--glass-border`, `--glass-highlight`.

### 3.3 Keyframes (Animationen)

| Name | Zweck |
|------|--------|
| `goldFlow` | Hintergrund-Position-Animation |
| `subtleGlow` | Opacity-Puls |
| `lightSweep` | Shimmer (translateX + skewX) |
| `iconGlow` | drop-shadow Puls |
| `gradientShift` | Background-Position |
| `shimmer` | Left/Opacity für Buttons |
| `ambientBreath` | Ambient-Hintergrund |
| `viewFadeIn` | View-Wechsel (opacity + translateY) |
| `welcomeFadeIn` | Welcome-Screen Einblendung |
| `confettiFall` | Konfetti-Animation |
| `statusPulse` | Chat-Status-Punkt |
| `msgFadeIn` | Chat-Nachricht |
| `fabFloat` | FAB schwebt |
| `fabPulseRing` | FAB-Puls-Ring |
| `fabGlow` | FAB-Glow |
| `goldShimmer`, `glowPulse`, `borderGlow` | Premium-Buttons |

### 3.4 Wichtige Komponenten-Klassen (Auswahl)

- **Layout:** `.app`, `.main`, `.ambient`, `.grain`, `.header`, `.header-inner`, `.bottom-nav`, `.nav-inner`, `.desktop-nav`
- **Views:** `.view`, `.view.active`
- **Tracks:** `.track`, `.track.active`, `.learn-track`, `.tools-track`, `.track-tabs`, `.track-tab`
- **Navigation:** `.nav-item`, `.nav-item.active`, `.desktop-nav-item`, `.track-toggle`
- **Content:** `.hero`, `.hero-eyebrow`, `.hero-title`, `.hero-sub`, `.card`, `.card-header`, `.card-body`, `.section`, `.section-header`, `.section-title`, `.section-action`
- **Stats:** `.stats-row`, `.stat-item`, `.stat-value`, `.stat-label`, `.progress-bar-container`, `.progress-bar`, `.progress-labels`, `.progress-goal`
- **Ritual:** `.ritual-item`, `.ritual-check`, `.ritual-text`, `.ritual-item.done`
- **Quick Actions:** `.quick-actions`, `.quick-action`, `.quick-icon`, `.quick-label`
- **Beginner:** `.beginner-card`, `.beginner-step`, `.beginner-num`, `.beginner-content`, `.beginner-title`, `.beginner-desc`
- **Fehler/Tipps:** `.mistake-item`, `.mistake-dont`, `.mistake-do`, `.mistake-text`
- **Skripte/Flow:** `.flow-step`, `.step-header`, `.step-num`, `.step-meta`, `.step-title`, `.step-sub`, `.script-text`, `.tip`, `.branch`, `.branch-row`, `.branch-label`, `.response-card`, `.gatekeeper-*`
- **Angebot/Email:** `.angebot-card`, `.angebot-header`, `.angebot-body`, `.angebot-text`, `.email-card`, `.email-header`, `.email-body`, `.voicemail`
- **Produkt/Preis:** `.product-grid`, `.product-item`, `.price-grid`, `.price-item`, `.price-table`, `.funding-options`, `.roi-example`, `.facts-list`, `.persona-card`
- **Follow-up/Mental:** `.followup-script`, `.followup-cadence`, `.cadence-*`, `.mental-card`, `.mental-tips`, `.mental-tip-card`, `.power-phrase`, `.emergency-list`
- **Welcome:** `.welcome-overlay`, `.welcome-overlay.hidden`, `.welcome-content`, `.welcome-track`, `.welcome-track.selected`, `.welcome-start`, `.welcome-footer`
- **Chat:** `.chat-overlay`, `.chat-overlay.open`, `.chat-panel`, `.chat-header`, `.chat-messages`, `.chat-message.bot/user`, `.chat-msg-bubble`, `.chat-typing`, `.chat-input`, `.chat-send`, `.chat-cat-pill`
- **UI Global:** `.theme-toggle`, `.logo`, `.logo-dark`, `.logo-light`, `.streak`, `.global-track-switch`, `.fab`, `.ai-btn`, `.toast`, `.toast.show`, `.confetti-container`, `.confetti`
- **Zitat:** `.quote`, `.quote-text`, `.quote-author`
- **Timing:** `.timing-grid`, `.time-slot`, `.time-slot.best`

### 3.5 Media Queries (Breakpoints)

- `min-width: 769px` – Desktop (Theme-Toggle Position, Desktop-Nav sichtbar)
- `max-width: 480px` – Welcome/Price/ROI/Mental/Follow-up/Gatekeeper responsive
- `max-width: 360px` – Welcome-Tracks Spalte, kleinere Typo
- `max-height: 700px` / `580px` – Welcome kompakter / Features ausblenden
- `max-width: 340px` – Extra small (Hero, Stats, Quick Actions, Track-Tabs, Nav, Welcome)
- `max-width: 320px` – Ultra small (Header, Main, FAB, AI-Button)
- `prefers-reduced-motion: reduce` – Animationen auf 0.01ms reduziert

### 3.6 Accessibility

- `:focus-visible` für Buttons/Nav/Track/Quick-Action/Welcome mit `outline: 2px solid var(--champagne)`.
- `button:focus-visible` etc. mit `outline-offset: 2px`.
- Touch: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, Mindesthöhe 44px für nav/quick-action.

---

## 4. HTML-Struktur & IDs

### 4.1 Wurzel & Overlays

| Element | ID / Klasse | Beschreibung |
|---------|-------------|--------------|
| Theme Toggle | `id="themeToggle"` | Light/Dark umschalten |
| Welcome Overlay | `id="welcomeOverlay"` | Erster Besuch: Track wählen, dann „Start“ |
| Welcome Start Button | `id="welcomeStart"` | Beendet Welcome, setzt Track, speichert `hasVisited_v2` |
| Global Track Switch | `id="globalTrackSwitch"` | Amy/Leti im Header |
| Streak | `id="streak"`, `id="streak-count"` | Anzeige Streak-Tage |
| Desktop Nav | `id="desktopNav"` | Nur Desktop sichtbar |

### 4.2 Views (Hauptbereiche)

| View | ID | Inhalt |
|------|-----|--------|
| Home | `id="view-home"` | Hero, Quick Actions, Stats, Performance, Ritual, Einstieg, Motivation, Stolpersteine, Einwandbehandlung |
| Learn | `id="view-learn"` | Wissen: zwei Tracks `learn-amy`, `learn-leti` |
| Script | `id="view-script"` | Skripte: zwei Tracks `track-amy`, `track-leti` (Cards `amy-script`, `leti-script`) |
| Tools | `id="view-tools"` | Angebote/E-Mails: `tools-amy`, `tools-leti` (Angebot/E-Mail-Cards mit Copy) |

### 4.3 Home-View – wichtige IDs

| ID | Element | Funktion |
|----|---------|----------|
| `greeting` | h1 | Tageszeit-Gruß (init/updateGreeting) |
| `stat-calls` | Stat | Anzahl Kontakte |
| `stat-connects` | Stat | Dialoge |
| `stat-termine` | Stat | Abschlüsse |
| `success-rate` | section-action | Erfolgsquote in % |
| `progress-bar` | div | Fortschritt (Ziel 10 Calls) |
| `ritual-status` | section-action | 0/4 → 4/4 Ritual |
| `quote-text` | div | Zufälliges Zitat (init) |

### 4.4 Datenattribute (Navigation & Aktionen)

| Attribut | Verwendung |
|----------|------------|
| `data-view` | `home` \| `learn` \| `script` \| `tools` – Nav-Items und Desktop-Nav-Items |
| `data-track` | `amy` \| `leti` – Track-Toggle, Track-Tabs, Welcome-Track-Auswahl |
| `data-goto` | `script` \| `learn` \| `tools` – Quick-Actions auf Home (wechseln View) |
| `data-copy` | ID des Elements, dessen Text kopiert wird (Copy-Buttons) |
| `data-query` | Chat-Kategorie-Pills – Text wird als Nachricht gesendet |

### 4.5 Copy-Ziele (data-copy)

- `amy-script` – Call-Flow Skript Amy
- `leti-script` – Call-Flow Skript Leti
- `angebot-hotel` – Angebots-E-Mail Hotels (Tools Amy)
- `email-termin-hotel` – Termin-Bestätigung Hotels
- `angebot-template` – Angebots-E-Mail Graduierung (Tools Leti)
- `email-termin` – Termin-Bestätigung Graduierung

### 4.6 Chat-Panel

| ID | Zweck |
|----|--------|
| `chatOverlay` | Overlay öffnen/schließen |
| `chatPanel` | Panel (Klick nicht schließen) |
| `chatIcon` | Emoji je Track (🏨/🎓) |
| `chatTitle` | Titel („Digital Assistant“) |
| `chatClose` | Schließen-Button |
| `chatMessages` | Container für Nachrichten |
| `chatTyping` | Typing-Indicator (visible-Klasse) |
| `chatInput` | Textarea Eingabe |
| `chatSend` | Senden-Button |

### 4.7 Weitere globale IDs

- `aiBtn` – Öffnet Chat (links unten)
- `fab` – FAB rechts: Klick = logCall, Doppeltap = Termin + Confetti
- `toast` – Toast-Container (Text + .show)
- `confetti` – Container für Konfetti-Elemente

---

## 5. JavaScript – State & Speicher

### 5.1 Storage-Modul (Bulletproof)

- **API:** `Storage.get(key)`, `Storage.set(key, value)`, `Storage.remove(key)`.
- **Fallback:** Wenn `localStorage` fehlschlägt oder nicht verfügbar → In-Memory-Objekt.
- **Version:** `APP_VERSION = '3.0'`. Bei Versionswechsel werden alle `APP_KEYS` gelöscht.
- **APP_KEYS:** `hasVisited`, `selectedTrack`, `todayStats`, `statsDate`, `streak`, `lastActiveDate`, `cfChatSessionId`, `appVersion`.
- Zusätzlich verwendet: `hasVisited_v2` (Welcome einmal gesehen), `theme` (light/dark).

### 5.2 Globale Variablen

| Variable | Typ | Bedeutung |
|----------|-----|-----------|
| `stats` | Object | `{ calls, connects, termine }` – Tagesstatistik |
| `streak` | number | Aufeinanderfolgende Tage mit Aktivität |
| `currentTrack` | string | `'amy'` \| `'leti'` – aktueller Produkt-Track |
| `currentChatTrack` | string | Track für Chat-Konfiguration (Icon, Titel, Kategorien) |
| `chatSessionId` | string | Für n8n-Session (localStorage `cfChatSessionId` oder neu erzeugt) |
| `selectedWelcomeTrack` | string | Beim ersten Besuch gewählter Track |

### 5.3 Konstanten

- **quotes** – Array von 5 Motivationssprüchen (ein Zufallszitat pro Load).
- **chatConfig** – Objekt mit `amy` und `leti`: je `icon`, `title`, `btnText`, `welcomeMsg`, `categories` (Array mit emoji, text, query).
- **N8N_WEBHOOK_URL** – `https://dt-devin.app.n8n.cloud/webhook/cf-chatbot`.

---

## 6. JavaScript – Funktionen (vollständig)

| Funktion | Zweck |
|---------|--------|
| **Storage (IIFE)** | testLocalStorage(), init(), get(), set(), remove() – siehe 5.1 |
| **safeGet(key)** | Wrapper: Storage.get(key) |
| **safeSet(key, value)** | Wrapper: Storage.set(key, value) |
| **init()** | Streak berechnen/speichern, Stats aus Storage laden, updateGreeting(), Zitat setzen, Streak-Anzeige updaten |
| **updateGreeting()** | Setzt `#greeting` nach Tageszeit (Guten Morgen/Tag/Abend) |
| **switchToView(viewId)** | Mobile + Desktop Nav aktiv setzen, alle `.view` ausblenden, `#view-{viewId}` aktiv, Main nach oben scrollen |
| **switchGlobalTrack(trackId)** | currentTrack setzen; Header-Toggle, Track-Tabs, .track, .learn-track, .tools-track aktivieren; updateChatConfig(); selectedTrack speichern; Toast |
| **updateChatConfig(track)** | currentChatTrack setzen; AI-Button-Text, Chat-Header (Icon, Titel), Welcome-Nachricht, Kategorie-Pills neu rendern; Chat-Nachrichten-Container zurücksetzen (Welcome + erste Bot-Nachricht) |
| **updateStats()** | stat-calls/connects/termine, progress-bar (Ziel 10), success-rate (termine/calls in %) ins DOM schreiben |
| **saveStats()** | todayStats (JSON), statsDate in Storage |
| **logCall()** | stats.calls++, updateStats(), saveStats(), FAB-Animation, Toast; bei 5/10 Calls zusätzlich Toast + Confetti |
| **padZero(num)** | Zweistellige Zeitdarstellung |
| **addChatMessage(text, type)** | Neue Nachricht (user/bot) mit Avatar, Bubble, Zeit in #chatMessages einfügen, nach unten scrollen |
| **escapeHtml(str)** | Text für HTML escapen (div.textContent → innerHTML) |
| **sendChatMessage(text)** | Optional text aus Input; User-Nachricht anzeigen; Typing an; POST an N8N_WEBHOOK_URL mit chatInput, message, sessionId, track, source, timestamp; Antwort parsen → extractBotResponse → Bot-Nachricht; bei Fehler Fallback-Text |
| **extractBotResponse(data)** | Antwort aus String oder Objekt (answer/text/message/response/output) oder erstes Array-Element; Fallback: „Vielen Dank…“ |
| **openChat()** | chatOverlay.open, body overflow hidden, Input fokussieren (setTimeout 300) |
| **closeChat()** | chatOverlay.open entfernen, body overflow zurücksetzen |
| **showToast(text)** | #toast Text setzen, .show, nach 2500ms .show entfernen |
| **triggerConfetti()** | 15 Konfetti-Divs in #confetti (Gold-Töne), nach 2500ms entfernen |

### 6.1 Event-Listener (Zusammenfassung)

- **window.onerror** – Stille Fehlerbehandlung (nur bei `?debug` console.error).
- **unhandledrejection** – preventDefault, bei debug loggen.
- **.nav-item click** → switchToView(data-view).
- **.desktop-nav-item click** → switchToView(data-view).
- **.track-toggle click** → switchGlobalTrack(data-track).
- **.track-tab click** → switchGlobalTrack(data-track).
- **.quick-action click** → switchToView(data-goto).
- **.ritual-item click** → toggle .done, ritual-status updaten, bei 4/4 Toast + Confetti.
- **#fab click** → logCall().
- **#fab touchend** → Doppeltap (300ms): termine++, connects++, updateStats, saveStats, Toast „Abschluss verbucht“, Confetti.
- **.copy-btn click** → Text aus Element mit id=data-copy holen, clipboard.writeText (Fallback execCommand), Button kurz „✓“, showToast(„Kopiert!“).
- **#aiBtn click** → openChat().
- **#chatClose click** → closeChat().
- **#chatOverlay click** (target === currentTarget) → closeChat().
- **#chatPanel click** → stopPropagation.
- **#chatInput** – input: Auto-Resize; keydown Enter ohne Shift → sendChatMessage().
- **#chatSend click** → sendChatMessage().
- **.chat-cat-pill click** → sendChatMessage(pill.dataset.query).
- **keydown Escape** → closeChat().
- **.welcome-track click** → selected setzen, selectedWelcomeTrack = data-track.
- **#welcomeStart click** → hasVisited_v2 speichern, switchGlobalTrack(selectedWelcomeTrack), Welcome verstecken, body overflow '', Toast „Willkommen! Modul: …“.
- **#themeToggle click** → data-theme umschalten (light/''), theme in Storage speichern.

### 6.2 Initialisierung beim Load

1. Storage init (IIFE).
2. Gespeicherten Track laden: wenn `selectedTrack` → switchGlobalTrack(savedTrack).
3. Wenn kein selectedTrack → updateChatConfig('leti') (damit Chat auf Leti steht, falls Nutzer Leti wählt).
4. Welcome: wenn `hasVisited_v2` → welcomeOverlay.hidden; sonst body overflow hidden.
5. themeToggle: savedTheme aus Storage, ggf. data-theme="light" setzen.
6. init() – Streak, Stats, Greeting, Quote.

---

## 7. Externe Integrationen

| Integration | URL / Technik | Verwendung |
|-------------|--------------|------------|
| **Google Fonts** | preconnect + link CSS | Inter, Cormorant Garamond, Playfair Display |
| **n8n Webhook** | POST JSON | Chat: chatInput, message, sessionId, track, source, timestamp → Antwort als Bot-Nachricht |

---

## 8. Inhalte (logische Struktur)

### 8.1 Track Amy (LS · Hotelmarketing)

- **Learn:** LEVERAGE Services, Warum LEVERAGE?, Investment & Rendite, Zielgruppe, Referenz.
- **Script:** Beste Zeiten, Call-Flow (Skript), Entscheider erreichen (Gatekeeper), Einwandbehandlung, Nachfass-Strategien.
- **Tools:** Angebots-E-Mail (Hotels), Termin-Bestätigung (Hotel), Voicemail-Skript.

### 8.2 Track Leti (CF · Graduierung)

- **Learn:** Unsere Produkte, Warum Schärpen?, Preismodelle, Zielgruppe, Referenz.
- **Script:** Beste Zeiten, Call-Flow (Skript), Entscheider erreichen, Einwandbehandlung, Nachfass-Strategien.
- **Tools:** Angebots-E-Mail (Graduierung), Termin-Bestätigung, Voicemail-Skript.

### 8.3 Gemeinsam (beide Tracks)

- Home: Performance, Ritual (4 Punkte), Einstieg (3 Schritte), Motivation (Quote), Stolpersteine, Einwandbehandlung (93 %, Mental Tipps, Power-Phrase, Mental Reset), Follow-Up Cadence (Tools-Bereich).

---

## 9. Vorbereitungen / Konfiguration für Erweiterungen

| Thema | Aktueller Stand | Hinweis |
|-------|-----------------|--------|
| **API-Chat** | n8n Webhook fest eingetragen | URL ändern oder env-ähnlich machen, wenn anderer Endpoint |
| **Neue Views** | View-Wechsel nur über data-view + switchToView | Neue View = neues div.view#view-xyz + Nav-Item mit data-view="xyz" |
| **Neuer Track** | Tracks hardcoded (amy, leti) | chatConfig + alle .track/.learn-track/.tools-track + Track-Toggle/Tabs erweitern |
| **Stats persistiert** | todayStats + statsDate, pro Tag | Reset bei neuem Tag (init prüft savedDate === today) |
| **Ritual** | Kein Persistieren der 4 Checkboxen | Optional: Ritual-Status in Storage pro Tag speichern |
| **Theme** | In Storage unter `theme` | Bereits persistent |
| **Copy-Targets** | data-copy = ID | Neue Copy-Buttons: data-copy auf passende Element-ID setzen |

---

## 10. Kurz-Checkliste (Schnellüberblick)

- [x] Single HTML mit inline CSS + JS
- [x] Zwei Tracks: Amy (Hotel), Leti (Graduierung)
- [x] Vier Views: Home, Learn, Script, Tools
- [x] Navigation: Mobile Bottom-Nav + Desktop-Nav, Track-Switcher im Header
- [x] Welcome-Screen beim ersten Besuch (Track-Auswahl)
- [x] Stats: Kontakte, Dialoge, Abschlüsse (lokal + FAB Doppeltap für Termin)
- [x] Ritual: 4 Punkte, 4/4 → Toast + Confetti
- [x] Chat: n8n Webhook, Session-ID, Kategorien je Track
- [x] Copy-to-Clipboard für Skripte und E-Mails
- [x] Theme: Dark/Light, in Storage gespeichert
- [x] Error-/Promise-Handler, Storage-Fallback
- [x] Responsive + Reduced-Motion + Focus-Visible

---

*Ende der Bestandsaufnahme.*
