# Plan: Schritte 3 & 4 (Ultrathink)

## Übersicht

- **Schritt 3 (Mittelfristig):** Echte Monsterteile – Platzhalter durch SVG/PNG-Assets ersetzen, Laden und Zeichnen auf Canvas, Fallbacks, Datenmodell.
- **Schritt 4 (Optional):** UX & Zusatzfeatures – Zufalls-Monster, Presets speichern/laden, Responsive/A11y-Verbesserungen, ggf. Tastaturbedienung.

---

# Schritt 3: Echte Monsterteile

## 3.1 Ziele

- Pro Teil eine **echte Grafik** (SVG oder PNG), süß/rund/dick, statt Farbblob.
- **Preview** und **Export** zeigen dieselben Assets in gleicher Layer-Reihenfolge.
- **Fallback:** Fehlt ein Asset oder schlägt das Laden fehl → Platzhalter (Blob/Farbe) oder leeren Slot zeichnen.
- **Erweiterbarkeit:** Neue Teile = neue Datei + Eintrag in Daten; kein Umbau der Logik.

## 3.2 Datenmodell

### Aktuell (parts.js)

- Teil = `{ id, label, color }` (nur Platzhalter-Farbe).
- Kategorien mit fester `count`; Teile werden zur Laufzeit aus Index + Farbe erzeugt.

### Ziel

- Teil = `{ id, label, assetUrl?, color? }`.
  - **assetUrl:** relativer Pfad zum Bild (z. B. `assets/parts/body/0.png` oder `body-0.svg`).
  - **color:** nur noch Fallback für Platzhalter, wenn kein Asset oder Laden fehlschlägt.
- **Zwei Modi im Code:**
  1. **Asset-Modus:** Teil hat `assetUrl` → Bild laden, auf Canvas zeichnen.
  2. **Platzhalter-Modus:** kein `assetUrl` oder Bild nicht geladen → wie bisher Blob mit `color` zeichnen.

### Konkrete Struktur

- **Option A – In Code (parts.js):** Pro Kategorie ein Array von Teilen; jedes Teil mit `id`, `label`, `assetUrl` (optional), `color` (Fallback). Asset-URLs z. B. `/assets/parts/<categoryId>/<id>.<ext>`.
- **Option B – JSON (data/parts.json):** Gleiche Struktur in JSON; App lädt einmal beim Start. Vorteil: Teile ergänzen ohne JS-Änderung; Nachteil: ein zusätzlicher Fetch, Fehlerbehandlung.
- **Empfehlung für MVP:** Option A (in Code), feste Namenskonvention z. B. `assets/parts/<categoryId>/<id>.png`. Später auf JSON umstellbar.

### Asset-Namenskonvention

- Ordner: `public/assets/parts/<categoryId>/` (z. B. `body`, `head`, `eyes`, …).
- Dateinamen: `<partId>.png` oder `<partId>.svg` (z. B. `0.png`, `1.png`).
- URL im Projekt: `/assets/parts/<categoryId>/<partId>.png` (von Vite/Server ausgeliefert).

## 3.3 Asset-Anforderungen (Design/Export)

- **Format:** PNG mit Transparenz oder SVG (beide von Canvas `drawImage` nutzbar; SVG muss für drawImage gerendert werden, s. u.).
- **Größe/Registration:** Einheitliche „Registration“ pro Kategorie: z. B. alle Body-Teile 256×256, Mittelpunkt des Monsters = Mitte der Datei; alle Head-Teile 200×200, zentriert. So kann der Composer mit fester Position/Größe (wie bisher LAYER_LAYOUT) zeichnen ohne pro Teil andere Offsets.
- **Styleguide:** Süß, rund, „dick“, pastellig – konsistent mit der Website. Keine harten Kanten.

## 3.4 Laden der Assets

- **Strategie:** Lazy Load pro Teil beim ersten Anzeigen (Preview oder Picker-Thumbnail) oder Preload aller Teile der sichtbaren Kategorie beim Tab-Wechsel.
- **Implementierung:**
  - Kleine Hilfsfunktion `loadImage(url): Promise<HTMLImageElement>` (resolve wenn `onload`, reject wenn `onerror`; ggf. Timeout).
  - Optional: einfacher **Image-Cache** (Map `url → HTMLImageElement`), um jedes Asset nur einmal zu laden.
- **Fehlerbehandlung:** Bei Fehler (404, CORS, Timeout) → Fallback auf Platzhalter (Blob mit `part.color`); kein Abbruch der App.

## 3.5 Composer (composer.js)

- **Eingabe:** Unverändert `selectionByCategory` (pro Kategorie ein Teil mit `id`, `label`, `color`; künftig optional `assetUrl`).
- **Ablauf pro Layer:**
  1. Teil hat `assetUrl`?  
     - Ja: Bild aus Cache laden (oder bereits geladen). Wenn geladen: `ctx.drawImage(img, …)` an Position/Größe aus `LAYER_LAYOUT`.  
     - Nein oder Laden fehlgeschlagen: wie bisher `drawPlaceholderBlob(…, part.color)`.
  2. Position/Größe: weiter aus `LAYER_LAYOUT` (cx, cy, r oder feste width/height in Pixel). `drawImage` mit Ziel-Rechteck (x, y, width, height) zentriert um (cx, cy).
- **Asynchrones Zeichnen:** Bilder sind asynchron geladen → beim ersten Laden nach dem Load Preview neu zeichnen (Callback oder Event). Sonst: beim nächsten `drawToCanvas` (z. B. nach Tab-Wechsel oder Auswahl) sind Bilder ggf. schon da.
- **SVG:** Canvas `drawImage` akzeptiert `HTMLImageElement`. SVG als `<img src="…">` laden funktioniert; alternativ SVG als Blob/Data-URL fetchen und dann in Image laden. Kein spezieller SVG-Pfad nötig, wenn SVGs wie PNGs per URL geladen werden.

## 3.6 Picker-Grid (Thumbnails)

- **Option A:** Kacheln zeigen weiter Platzhalter (Farbkreis + Nummer) – wenig Aufwand, konsistent mit „variable Teile“.
- **Option B:** Jede Kachel zeigt Miniatur des echten Teils (Thumbnail). Dazu entweder kleine Versionen der Assets (z. B. `…/thumb/<id>.png`) oder dasselbe Bild skaliert in einer kleinen `<img>` oder in einem Mini-Canvas. Erfordert Laden aller sichtbaren Teile beim Tab-Wechsel.
- **Empfehlung für Schritt 3:** Option A (weiter Platzhalter im Grid); Thumbnails als optionaler Feinschliff später.

## 3.7 Dateistruktur (Vorschlag)

```
public/
  assets/
    parts/
      body/    0.png, 1.png, …
      head/    0.png, 1.png, …
      eyes/    0.png, …
      mouth/   0.png, …
      horns/   0.png, …
      arms/    0.png, …
      legs/    0.png, …
      accessories/  0.png, …
```

- `parts.js`: Pro Kategorie Teile mit `assetUrl: \`/assets/parts/${categoryId}/${id}.png\`` und `color` als Fallback.
- Keine Änderung an Vite nötig (public/ wird 1:1 ausgeliefert).

## 3.8 Reihenfolge der Implementierung (Schritt 3)

1. **Asset-Ordner anlegen** – `public/assets/parts/<categoryId>/` für alle 8 Kategorien; Platzhalter-PNGs (z. B. einfarbige 256×256 mit Transparenz) oder echte erste Assets einfügen.
2. **parts.js erweitern** – Pro Teil `assetUrl` (und weiter `color`) setzen; Namenskonvention wie oben.
3. **Image-Loader + Cache** – z. B. `assetLoader.js`: `loadImage(url)`, Cache `Map<url, HTMLImageElement>`, bei Fehler reject.
4. **composer.js erweitern** – Pro Layer: wenn `part.assetUrl`, Bild laden (oder aus Cache), dann `drawImage`; sonst oder bei Fehler `drawPlaceholderBlob`. Preview nach asynchronem Laden erneut aufrufen (Callback/Event an main.js).
5. **main.js** – Nach Aufruf von `drawToCanvas` nichts weiter nötig, außer Composer informiert über „Bild geladen“ → dann `renderPreview()` erneut aufrufen.
6. **Thumbnails (optional)** – Kacheln mit `<img src="…">` für Asset, Fallback auf Farbkreis; oder in Schritt 4.

## 3.9 Edge Cases

- **Kein Asset unter URL:** 404 → Fallback Blob, kein Dialog.
- **CORS/Netzwerkfehler:** wie 404.
- **Sehr viele Teile:** Lazy Load nur für aktuell sichtbare Kategorie; Cache begrenzen (z. B. max 50 Bilder) oder nur zuletzt verwendete behalten.
- **Export bevor alle Bilder geladen:** Export nutzt dieselbe `drawToCanvas`-Logik; was bis dahin geladen ist, wird gezeichnet, Rest Platzhalter. Optional: Export-Button kurz deaktivieren oder Hinweis „Bilder werden geladen“.

---

# Schritt 4: Optional – UX & Zusatzfeatures

## 4.1 Zufalls-Monster

- **Funktion:** Ein Button „Zufall“ (oder „Zufalls-Monster“); bei Klick wird pro Kategorie ein zufälliges Teil aus `getPartsForCategory(categoryId)` gewählt und in `selectionByCategory` gesetzt.
- **UI:** Button neben „Als PNG herunterladen“ oder im Picker-Bereich.
- **Details:** `Math.random()` pro Kategorie; Teil mit `id` in `[0, parts.length - 1]` wählen. Danach `saveSelection()`, `renderGrid()`, `renderPreview()` aufrufen.
- **A11y:** Button-Label z. B. „Zufälliges Monster erstellen“.

## 4.2 Presets speichern / laden

- **Speichern:** Aktuelle Auswahl (`selectionByCategory` → pro Kategorie part.id) unter einem Namen speichern. Optionen:  
  - **Nur localStorage:** z. B. `monster-presets` = JSON-Array von `{ name, selection: { body: 0, head: 1, … } }`; max. 5–10 Presets.  
  - **Export als JSON-Datei:** User speichert eine .json-Datei; keine Serverspeicherung.
- **Laden:** Liste der Presets anzeigen (z. B. Dropdown oder kleine Karten); bei Auswahl `selectionByCategory` aus Preset füllen, `saveSelection()`, Grid + Preview aktualisieren.
- **UI:** „Preset speichern“ (Name eingeben, dann Speichern), „Preset laden“ (Liste/Dropdown). Optional: „Preset löschen“.

## 4.3 Responsive

- Bereits angelegt: Picker wird auf schmalen Viewports schmaler/kleiner, Preview bleibt zentral.
- **Ergänzungen:**  
  - Tabs bei wenig Platz umbrechen (flex-wrap bereits da) oder horizontal scrollbar.  
  - Touch-Ziele: Buttons/Tabs mind. 44×44 px für bessere Bedienung auf Mobilgeräten.  
  - Preview-Frame: `min-width`/`min-height` prüfen, damit Kreis nicht zu klein wird.

## 4.4 Accessibility (A11y)

- **Bereits:** Header mit h1 (visuell versteckt), `aria-label` auf Picker/Preview, Tabs mit `role="tab"`, `aria-selected`, `aria-controls`; Buttons mit `aria-pressed` für Grid.
- **Ergänzungen:**  
  - **Fokus-Reihenfolge:** Logisch (Tabs → Grid → Preview → Export).  
  - **Tastatur:** Tab durch alle Bedienelemente; Enter/Space aktiviert Buttons/Tabs. Optional: Pfeiltasten in Tab-Liste (links/rechts wechseln).  
  - **Fokus sichtbar:** `:focus-visible` mit deutlich sichtbarem Ring (bereits `box-shadow` für Focus).  
  - **Export-Button:** Wenn kein Teil gewählt: optional deaktiviert oder `aria-disabled="true"` mit Hinweis „Wähle mindestens ein Teil“ (optional).  
  - **Live-Region:** Optional `aria-live="polite"` für kurze Meldungen (z. B. „Preset geladen“, „Zufalls-Monster erstellt“).

## 4.5 Weitere optionale Features

- **Zurücksetzen:** Button „Alles zurücksetzen“ – alle Kategorien auf null, Preview leer, localStorage leeren.
- **Kategorie „kein Teil“:** Pro Kategorie explizit „Keins“ wählbar (leerer Slot), damit User z. B. keine Hörner darstellen können.
- **Farben pro Teil:** Später evtl. einstellbare Farbe pro Teil (Tint/Overlay), sofern Assets das hergeben (einfarbig oder Maske).

## 4.6 Reihenfolge der Implementierung (Schritt 4)

1. **Zufalls-Monster** – Button, Logik, A11y-Label.  
2. **Presets (localStorage)** – Speichern/Laden/Liste; UI Buttons + Namensfeld bzw. Dropdown.  
3. **Responsive-Touch & Tabs** – Touch-Ziele, Tabs-Scroll wenn nötig.  
4. **A11y** – Fokus-Reihenfolge prüfen, `:focus-visible`, ggf. Pfeiltasten für Tabs.  
5. **Zurücksetzen / „Keins“** – nach Bedarf.

---

# Abhängigkeiten zwischen Schritt 3 und 4

- **Schritt 3** ist unabhängig von Schritt 4: Echte Monsterteile können zuerst umgesetzt werden.
- **Schritt 4** baut auf dem bestehenden State (`selectionByCategory`) und der bestehenden UI auf; Zufall und Presets funktionieren mit Platzhaltern und mit echten Teilen gleichermaßen.
- Empfohlene Reihenfolge: **Zuerst Schritt 3** (Assets + Composer), **dann Schritt 4** (Zufall, Presets, UX/A11y).

---

# Kurz-Checkliste

**Schritt 3 – Echte Monsterteile** (umgesetzt)  
- [x] Ordner `public/assets/parts/<categoryId>/`, erste Assets (oder Platzhalter-PNGs).  
- [x] parts.js: `assetUrl` (+ `color`) pro Teil.  
- [x] assetLoader.js: `loadImage`, Cache, Fehler → Fallback.  
- [x] composer.js: pro Layer Asset zeichnen oder Blob; asynchron Preview-Neuz zeichnen.  
- [x] main.js: ggf. Callback für „Bild geladen“ → `renderPreview()`.  

**Schritt 4 – UX & Zusatzfeatures** (umgesetzt)  
- [x] Button „Zufall“ (Picker + Preview), Logik + A11y.  
- [x] Presets: Speichern (Name + selection), Laden (Liste), Löschen, localStorage (max 10).  
- [x] Responsive: Touch-Ziele (min 44px) für Tabs/Buttons.  
- [x] A11y: Fokus, Live-Region für Meldungen (Preset geladen, Zufall, Zurücksetzen).  
- [x] Zurücksetzen (alle Kategorien leeren, aktuelle Auswahl aus localStorage entfernen).  
- [ ] Optional offen: „Keins“ pro Kategorie, Pfeiltasten für Tabs.
