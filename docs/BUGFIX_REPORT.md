# Bug-Report & Fix-Dokumentation

**Datum:** 2026-02-23  
**Status:** gefixt

---

## Symptome

1. **Drag & Drop** von Assets aus dem Selektor auf den Canvas funktionierte nicht (kein sichtbares Ergebnis)
2. **Fast alle Buttons** funktionieren nicht (Random, Preset laden, Mirror, Scale/Rotation, Trash)
3. **Reset** funktioniert (einziger Button der ohne Crash durchläuft)

---

## Ursache: Infinite Recursion in `composer.js`

### Der Bug

In `drawPlacedItems()` (composer.js, Zeilen 96-98 alt) wurde `onImageLoaded()` **synchron** aufgerufen, sobald ein Bild nicht im Cache war:

```javascript
// ALT (Zeilen 81-98) – BUGGY
let needsRedraw = false;
for (const item of placedItems) {
  const img = getCachedImage(item.assetUrl);
  if (!img) {
    needsRedraw = true;
    loadImage(item.assetUrl).then(() => onImageLoaded()).catch(() => {});
  }
}
if (needsRedraw && onImageLoaded) {
  onImageLoaded(); // ← SYNCHRONE REKURSION!
}
```

### Warum das alles kaputt macht

`onImageLoaded` ist `() => renderPreview()`, also:

1. `renderPreview()` → `drawPlacedItems(canvas, items, callback)`
2. Bilder nicht im Cache (keine Assets vorhanden, alle 404) → `needsRedraw = true`
3. `onImageLoaded()` wird **synchron** aufgerufen → `renderPreview()` 
4. → `drawPlacedItems()` → Bilder immer noch nicht im Cache → `onImageLoaded()` → ...
5. **Stack Overflow** nach ~10.000 Rekursionen

**Jede Aktion die `renderPreview()` aufruft crashte**, wenn `placedItems` nicht leer war. Da keine Asset-PNGs existieren (nur README in `/public/assets/parts/`), waren Bilder *nie* im Cache.

### Warum Reset funktionierte

`handleReset()` setzt `placedItems = []` *vor* dem Aufruf von `renderPreview()`. Mit 0 Items returned `drawPlacedItems` sofort (zeichnet nur den Platzhalter-Kreis) → keine Rekursion.

---

## Fixes

### 1. composer.js – Synchrone Rekursion entfernt (CRITICAL)

Entfernt: die Variablen `needsRedraw` und den synchronen `onImageLoaded()`-Aufruf.  
Die **asynchronen** `.then(() => onImageLoaded())` Callbacks bleiben erhalten – diese feuern korrekt wenn/falls ein Bild tatsächlich geladen wird.

### 2. assetLoader.js – Negative Cache + In-Flight-Deduplizierung

- **`FAILED` Set**: URLs die 404 zurückgeben werden gespeichert, damit nicht bei jedem Render ein neuer HTTP-Request gefeuert wird
- **`LOADING` Map**: Laufende Requests werden dedupliziert – mehrere Aufrufe für die gleiche URL teilen sich das selbe Promise

### 3. main.js – rAF-Throttle + weitere Fixes

- **`scheduleRender()`**: Image-Load-Callbacks nutzen jetzt `requestAnimationFrame` statt synchronem Re-Render. Mehrere Bilder die im selben Frame laden triggern nur einen Re-Render
- **`saveScene()` nach Canvas-Drag**: Position-Änderungen durch Verschieben auf dem Canvas werden jetzt in localStorage gespeichert
- **`img.draggable = false`** auf Thumbnails: Verhindert dass der Browser das `<img>`-Element statt des Tiles draggt (relevant sobald echte Assets existieren)

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/composer.js` | Zeilen 81, 91, 96-98 entfernt (synchrone Rekursion) |
| `src/assetLoader.js` | `FAILED` Set + `LOADING` Map hinzugefügt |
| `src/main.js` | `scheduleRender()` mit rAF, `saveScene()` im mouseup-Handler, `img.draggable = false` |

---

## Button-Status nach Fix

| Button | Vorher | Nachher |
|--------|--------|---------|
| Drag & Drop → Canvas | Crash (Stack Overflow) | Funktioniert (Platzhalter-Blobs) |
| Zufall (Random) | Crash | Funktioniert |
| Preset speichern | OK (kein renderPreview) | OK |
| Preset laden | Crash | Funktioniert |
| Preset löschen | OK (kein renderPreview) | OK |
| Zurücksetzen | OK (leere Items) | OK |
| Teil löschen (Trash) | Crash (wenn Items bleiben) | Funktioniert |
| Spiegeln H/V | Crash | Funktioniert |
| Größe/Rotation Slider | Crash | Funktioniert |
| Export (PNG) | Crash | Funktioniert |
| Kategorie-Tabs | OK (kein renderPreview) | OK |

---

## Hinweise

- **Keine Assets vorhanden**: Alle Teile werden als farbige Platzhalter-Blobs dargestellt. Sobald PNGs in `public/assets/parts/<categoryId>/<id>.png` abgelegt werden, erscheinen echte Bilder.
- **Touch-Support auf Canvas**: Aktuell nur Maus-Events implementiert. Touch-Events (`touchstart`/`touchmove`/`touchend`) fehlen für Canvas-Interaktion (Drag auf Canvas).
