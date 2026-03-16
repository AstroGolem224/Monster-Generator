# Monster Generator – Projektanalyse

**Stand:** 2026-02-24

---

## 1. Überblick

| Aspekt | Beschreibung |
|--------|--------------|
| **Typ** | Web-App (Vanilla JS, ES-Module) |
| **Zweck** | Avatar-/Profilbild-Generator aus Monsterteilen (Drag & Drop, Skalierung, Drehung, Export) |
| **Stack** | HTML5, CSS3, JavaScript (ESM), Vite 5.x |
| **Zielgruppe** | Nutzer ohne Anmeldung, rein clientseitig |

---

## 2. Projektstruktur

```
Monster Generator/
├── index.html              # Einstieg, semantisches Markup, ARIA
├── package.json            # Vite, keine Runtime-Deps
├── vite.config.js          # root + publicDir
├── src/
│   ├── main.js             # App-Logik: State, UI, Events, Presets, localStorage
│   ├── composer.js         # Canvas: Zeichnen, Hit-Test, Export, Koordinaten
│   ├── parts.js            # Kategorien + Teile-Daten (8 Kategorien, 3×3-Grid)
│   ├── assetLoader.js      # Bild-Laden, Cache, FAILED/LOADING
│   └── style.css           # BEM, CSS-Variablen, Pastell-Grün
├── public/
│   └── assets/parts/       # Ordner pro Kategorie, PNGs 0.png, 1.png, …
└── docs/
    ├── Monster_Generator_Manual.md
    ├── BUGFIX_REPORT.md
    ├── PLAN_*.md
    └── PROJEKT_ANALYSE.md (dieser)
```

**Keine** Tests, kein Linter/Formatter in package.json, keine TypeScript-Typen.

---

## 3. Architektur

### 3.1 Modulaufteilung

| Modul | Verantwortung |
|-------|----------------|
| **parts.js** | Statische Daten: `CATEGORIES`, `getCategories()`, `getPartsForCategory()`, Asset-URLs |
| **assetLoader.js** | `loadImage()`, `getCachedImage()`, Cache/FAILED/LOADING |
| **composer.js** | Canvas: `drawPlacedItems()`, `getPlacedItemAt()`, `getCanvasPoint()`, `pixelToNormalized()`, `exportToDataURL()` |
| **main.js** | State (`placedItems`, `selectedItemId`, …), DOM, Events, Presets, localStorage, `renderPreview()` |

Abhängigkeiten: `main.js` → parts, composer, assetLoader; `composer.js` → assetLoader.

### 3.2 State (main.js)

- **placedItems**: Array von Objekten `{ id, categoryId, partId, assetUrl, color, x, y, scale, rotation, flipH?, flipV? }`
- **selectedItemId** / **draggedItemId**: Auswahl und Drag
- **activeCategoryId**: aktueller Tab
- Persistenz: `localStorage` (Szene + Presets, max 10)

### 3.3 Datenfluss

1. **Drag aus Grid** → JSON in `dataTransfer` → Drop auf Canvas → `addItemAt()` / normierte Koordinaten
2. **Klick auf Canvas** → `getPlacedItemAt()` → Hit-Test (von hinten nach vorne) → Auswahl + Scaler-Panel
3. **Änderungen** (Scale, Rotation, Mirror, Trash) → Item mutieren → `saveScene()` + `renderPreview()`
4. **renderPreview()** → `drawPlacedItems()` mit optionalem `scheduleRender` (rAF-Throttle bei Image-Load)

---

## 4. Stärken

- Klare Trennung: Daten (parts) ↔ Rendering (composer) ↔ App (main) ↔ Assets (assetLoader)
- Barrierefreiheit: ARIA (tabs, live-region, labels), Tastatur (Enter/Space für Teile)
- Keine Frameworks: geringes Bundle, einfacher Einstieg
- BUGFIX_REPORT.md dokumentiert Rekursions-Bug und Fixes nachvollziehbar
- Manual + README für Nutzer und Devs vorhanden

---

## 5. Schwächen / Risiken

| Thema | Beschreibung |
|-------|--------------|
| **Keine Tests** | Regressionsrisiko bei Änderungen (z. B. Hit-Test, Koordinaten) |
| **Kein Lint/Format** | Kein einheitlicher Stil; JSDoc vorhanden, aber keine Typ-Checks |
| **Monolith main.js** | ~375 Zeilen, viele DOM-Referenzen und Handler; schwer unit-testbar |
| **Touch fehlt** | Canvas-Interaktion nur Maus; `getCanvasPoint` unterstützt Touch, aber main.js nutzt nur mousedown/move/up |
| **Keine echten Assets** | `public/assets/parts/` nur README; alle Teile = Platzhalter-Blobs |
| **State nur in main.js** | Kein zentraler Store; Erweiterungen (z. B. Undo) erfordern Refactor |

---

## 6. Technische Details

- **Canvas**: 400×400 Preview, Export 512×512; Basisgröße pro Teil `BASE_SIZE_RATIO = 0.2` (Anteil an min(w,h))
- **Hit-Test**: Rotations-invariante Rechteckprüfung in lokalen Koordinaten (von hinten nach vorne)
- **Spiegelung**: `flipH`/`flipV` in `drawPlacedItem` via `scale(-1, …)` nach Rotation
- **Presets**: Namen + `placedItems`-Kopie in localStorage, max 10 Einträge

---

## 7. Empfehlungen (kurz)

1. **Assets**: PNGs in `public/assets/parts/<categoryId>/<id>.png` ablegen, dann sofort echte Vorschau.
2. **Touch**: In main.js `touchstart`/`touchmove`/`touchend` auf dem Canvas abfangen und gleiche Logik wie Maus (evtl. `getCanvasPoint` nutzen).
3. **Code-Qualität**: ESLint + Prettier; optional JSDoc + `checkJs` oder schrittweise TypeScript.
4. **Tests**: Mindestens ein paar Unit-Tests für `getPlacedItemAt`, `pixelToNormalized`, `getPartsForCategory`.
5. **main.js**: Bei weiteren Features (z. B. Undo, Ebenen) State und UI-Handler trennen (kleine Module oder einfacher State-Container).

---

## 8. Quick-Start (Dev)

```bash
npm install
npm run dev
```

Build: `npm run build` → `dist/`.
