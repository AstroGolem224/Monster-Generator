# Plan: Drag-and-Drop Assets, Trash, Scaler/Turner

**Status: umgesetzt** (placedItems, Thumbnails im Selector, Drag-and-Drop, Trash, Scaler/Turner, Presets, README + Manual aktualisiert)

## Ziel

- **Selector:** Zeigt verfügbare Assets als Thumbnails (wenn geladen), sonst Platzhalter. Alle Kacheln sind **draggable**.
- **Monster Display:** Nimmt **mehrere** per Drag-and-Drop platzierte Teile auf (beliebige Kategorie). Teile können **verschoben**, **skaliert** und **gedreht** werden. Kein Entfernen beim Wechsel der Kategorie oder Auswahl.
- **Trashcan:** Icon; Drag eines **platzierten** Teils vom Canvas auf den Trash **entfernt** nur dieses Teil.
- **Scaler/Turner:** Pro platziertes Teil (nach Auswahl auf dem Canvas): Größe und Rotation einstellbar.
- **Dokumentation:** README und Manual anpassen.

---

## 1. Datenmodell

### Neu: Placed Items (ersetzen „ein Teil pro Kategorie“ für die Anzeige)

- **Hauptzustand für den Monster-Bereich:** Liste `placedItems` statt `selectionByCategory`.
- Ein Eintrag:  
  `{ id, categoryId, partId, assetUrl, x, y, scale, rotation }`
  - `id`: eindeutig (z. B. `crypto.randomUUID()` oder Zähler).
  - `categoryId`, `partId`: Referenz auf das Teil (für Asset-URL und Fallback).
  - `assetUrl`: wie in `parts.js` (z. B. `/assets/parts/<categoryId>/<partId>.png`).
  - `x`, `y`: Position **normalisiert 0–1** (Mitte des Teils), unabhängig von Canvas-Größe.
  - `scale`: Faktor (z. B. 0.5–2), Standard 1.
  - `rotation`: Grad (0–360), Standard 0.

- **Reihenfolge in `placedItems`** = Zeichenreihenfolge (vorne = letzter Eintrag). Neue Teile werden **angehängt** (oben gezeichnet).

- **Kein Entfernen bei Klick im Selector:** Klick im Grid wählt nur für spätere Aktionen (z. B. „Ausgewähltes Teil hinzufügen“ optional); platzierte Teile auf dem Canvas bleiben unverändert.

### Selector: „Verfügbare“ Assets anzeigen

- **Ohne Backend** kann der Client nicht wissen, welche Dateien im Ordner liegen.
- **Vorgehen:** Pro Teil-URL einmal laden (z. B. beim ersten Anzeigen der Kategorie oder beim App-Start).  
  - **Erfolg:** Bild im Cache, in der Kachel **Thumbnail** (`<img src="…">` oder kleines Canvas/Img) anzeigen.  
  - **Fehler (404):** Kachel wie bisher (Platzhalter: Farbe + Nummer).  
- So „zeigt der Selector verfügbare Assets“, sobald sie geladen sind; nicht verfügbare bleiben Platzhalter.

### Beibehalten

- **Kategorien + Teile** aus `parts.js` unverändert (Tabs, 3×3-Grid, `getPartsForCategory`).
- **Presets:** Speichern/Laden bezieht sich auf **placedItems** (inkl. x, y, scale, rotation). Altes Format (selectionByCategory) kann beim Laden ignoriert oder einmalig migriert werden.
- **localStorage:** Ein Schlüssel für „aktuelle Szene“ = `placedItems` (und ggf. Viewport-Infos). Presets = weiter Array von `{ name, placedItems }`.

---

## 2. Selector-UI

- **Tabs** wie bisher (8 Kategorien).
- **Grid** 3×3 pro Kategorie:
  - Jede Kachel = **dragbar** (`draggable="true"`).
  - Beim **dragstart:** `dataTransfer` setzen mit z. B. `application/json` → `{ categoryId, partId, assetUrl, label }` (und `text/plain` Fallback).
  - **Inhalt der Kachel:**
    - Wenn Asset für diese Teil-URL **bereits geladen** (Cache): **Thumbnail** (kleines `<img>` mit dieser URL, ggf. aus Cache).
    - Sonst: **Platzhalter** (Farbe + Nummer wie bisher). Optional: beim Anzeigen der Kategorie alle Teil-URLs der Kategorie laden; nach Laden Thumbnail in Kachel rendern.
- **Klick** in der Kachel kann optional „dieses Teil in der Mitte des Canvas hinzufügen“ auslösen (zusätzlich zu Drag). Nicht zwingend für erste Version.

---

## 3. Monster Display (Canvas)

### Drag-and-Drop: Selector → Canvas

- Canvas als **Drop-Zone** (`dragover` → `preventDefault()`; `drop` → `preventDefault()`).
- **Drop:**
  - Payload aus `dataTransfer` lesen (categoryId, partId, assetUrl).
  - **Drop-Position:** Mausposition relativ zum Canvas in **normalisierte Koordinaten (0–1)** umrechnen (Mitte des neuen Teils).
  - Neues Objekt: `{ id, categoryId, partId, assetUrl, x, y, scale: 1, rotation: 0 }` zu `placedItems` hinzufügen.
  - Zeichnen aktualisieren, State speichern (localStorage).

### Bewegen auf dem Canvas

- **Maus:**  
  - **Mousedown** auf Canvas: **Hit-Test** (siehe unten) → getroffenes Teil = `draggedItemId`, Flag `isDragging = true`.  
  - **Mousemove:** Wenn `isDragging`, Position des getroffenen Teils auf aktuelle Mausposition (in 0–1) setzen, neu zeichnen.  
  - **Mouseup:** `isDragging = false`.
- **Touch:** Entsprechend `touchstart` / `touchmove` / `touchend` (ein Finger), gleiche Logik mit Hit-Test und Positionsupdate.

### Hit-Test (welches Teil liegt unter (px, py)?)

- Koordinaten (px, py) in Canvas-Pixel.
- **Von oben nach unten** (letzte Einträge in `placedItems` zuerst) durchgehen:
  - Pro Teil: Zeichenposition in Pixel berechnen:  
    `cx = x * w`, `cy = y * h`, plus Basisgröße (z. B. `baseSize * scale * min(w,h)`), Rotation berücksichtigen.
  - Vereinfachung: **Axis-Aligned Bounding Box** des gedrehten Rechtecks (oder vereinfacht: Kreis um Mittelpunkt mit Radius ≈ halbe Diagonale des skalierten Rechtecks). Oder: Punkt in lokales Koordinatensystem des Teils transformieren (Translation + inverse Rotation) und prüfen, ob im Rechteck `[-halfW, halfW] x [-halfH, halfH]`.
- Erstes getroffenes Teil (höchster Index in `placedItems`) zurückgeben = „vorderstes“ Teil.

### Zeichnen der placedItems

- Für jedes Element in `placedItems`:
  - Bild aus Cache laden (oder Platzhalter zeichnen).
  - `ctx.save()` → `translate(cx, cy)` → `rotate(rotation)` → `scale(scale)` → Zeichnen zentriert um (0,0) mit fester Basisgröße (z. B. Anteil von min(w,h)) → `ctx.restore()`.
- Basisgröße pro Teil: z. B. `0.15 * min(w, h)` (einheitlich), dann mit `scale` multiplizieren.

---

## 4. Trashcan

- **Position:** Fester Bereich auf der Seite (z. B. unten rechts neben oder unter dem Canvas), klar als „Löschen“ erkennbar.
- **Icon:** Trashcan (SVG oder Unicode/Emoji), in einem klickbaren/droppbaren Element (z. B. `<div id="trash">...</div>`).
- **Zwei Wege zum Entfernen:**
  1. **Drag from Canvas to Trash:**  
     - Beim **Mousedown** auf Canvas wird (wie oben) `draggedItemId` gesetzt.  
     - Beim **Mouseup** prüfen: Liegt der Cursor über der Trash-Zone? (getBoundingClientRect der Trash-Node vs. Event-ClientX/Y).  
     - Wenn ja: Eintrag mit `draggedItemId` aus `placedItems` entfernen, neu zeichnen, State speichern.
  2. Optional: **Drop** auf Trash (HTML5 DnD): Dafür müsste ein „Drag“ vom Canvas als HTML-DnD-Source ausgelöst werden (z. B. unsichtbares Drag-Image); aufwändiger. Empfehlung: erst Variante 1 (Maus/Touch-basiert).
- **Feedback:** Trash beim Darüberziehen (während Drag) visuell hervorheben (z. B. Hintergrundfarbe), beim Drop/Loslassen Meldung (z. B. Live-Region: „Teil entfernt“).

---

## 5. Scaler und Turner (Größe & Rotation)

- **Auswahl eines platzierten Teils:** Klick auf Canvas (ohne Drag) → Hit-Test → `selectedItemId` setzen. Wenn Klick auf „leeren“ Bereich: `selectedItemId = null`.
- **UI für Skalierung und Drehung:**
  - Nur sichtbar, wenn `selectedItemId !== null`.
  - Zwei Steuerungen (Slider oder Nummernfelder):
    - **Größe (Scale):** z. B. 50 %–200 % (0.5–2.0), Schritt 0.1. Wert = `placedItem.scale`.
    - **Rotation:** 0°–360° (oder -180–180), Wert = `placedItem.rotation`.
  - Bei Änderung: entsprechenden Eintrag in `placedItems` aktualisieren, Canvas neu zeichnen, State speichern.
- **Platzierung:** Panel unter oder neben dem Canvas (z. B. „Ausgewähltes Teil: Größe / Rotation“).

---

## 6. Technische Umsetzung (Kurz)

| Bereich | Änderung |
|--------|----------|
| **parts.js** | Unverändert (evtl. Export einer Hilfsfunktion „getPartByCategoryAndId“ für Lookup). |
| **assetLoader.js** | Unverändert; Selector nutzt gleichen Cache für Thumbnails. |
| **composer.js** | Neu: `drawPlacedItems(canvas, placedItems, onImageLoaded)` mit Transform (translate/rotate/scale) pro Teil. Hit-Test-Funktion: `getPlacedItemAt(placedItems, canvas, pixelX, pixelY)` (nutzt gleiche Basisgröße/Transform-Logik). Export: `exportToDataURL(placedItems)` zeichnet nur placedItems. |
| **main.js** | State: `placedItems`, `selectedItemId`, `draggedItemId`, `isDragging`. Selector: Grid mit Thumbnails (nach Load) oder Platzhalter, dragstart mit categoryId/partId/assetUrl. Canvas: drop (neues Teil), mousedown/mousemove/mouseup (Hit-Test, Drag zum Verschieben, Mouseup über Trash = entfernen). Scaler/Turner-Panel bei selectedItemId. Presets/localStorage speichern/laden placedItems. |
| **index.html** | Trash-Bereich (div + Icon), Container für Scaler/Turner (z. B. zwei Slider + Labels). |
| **style.css** | Styles für Trash, Scaler-Panel, ggf. Hover für Trash beim Drag. |

---

## 7. Randfälle

- **Kein Teil getroffen:** Mousedown auf leerer Fläche → `selectedItemId = null`, Scaler-Panel ausblenden.
- **Drag außerhalb des Canvas (Mouseup):** Kein Drop auf Trash → Position trotzdem setzen (auf letzter Mausposition innerhalb Canvas), oder Position unverändert lassen, wenn Mouseup außerhalb. Einfachste Variante: Position immer auf letzte gültige Canvas-Position setzen.
- **Mehrere Teile überlappend:** Hit-Test von oben (letztes in Liste) nach unten; erstes Treffer = ausgewählt/gezogen.
- **Export:** Nur placedItems zeichnen, keine „alten“ festen Layer mehr. Leeres Canvas = leeres Bild oder dezenter Hinweis.

---

## 8. Dokumentation

- **README.md:** Kurz beschreiben: Drag-and-Drop aus dem Selector auf die Anzeige, mehrere Teile, Verschieben auf der Fläche, Trash zum Entfernen, Scaler/Turner für ausgewähltes Teil. Hinweis auf Manual.
- **docs/Monster_Generator_Manual.md:** Abschnitte ergänzen/umbauen:
  - „Monster bauen“: Teile aus dem Selector (beliebige Kategorie) auf die Anzeige ziehen; mehrere Teile möglich.
  - „Verschieben“: Teil auf der Anzeige greifen und ziehen.
  - „Größe und Drehung“: Teil anklicken, dann Größen- und Rotationsregler nutzen.
  - „Entfernen“: Teil auf das Trash-Icon ziehen und loslassen.
  - „Verfügbare Assets“: Erklärung, dass Kacheln mit Thumbnail = vorhandene Datei, ohne = Platzhalter (Datei fehlt oder noch nicht geladen).

---

## 9. Reihenfolge der Implementierung (Vorschlag)

1. **Datenmodell & State:** `placedItems` einführen, `selectionByCategory` für die Canvas-Anzeige durch `placedItems` ersetzen; Zeichnen in composer auf `drawPlacedItems` umstellen.
2. **Selector:** Thumbnails (nach Load) in den Kacheln, Drag-Source (dataTransfer mit categoryId, partId, assetUrl).
3. **Canvas Drop:** Drop-Zone, neues Teil zu placedItems hinzufügen, Zeichnen + Persistenz.
4. **Verschieben:** Hit-Test, Mousedown/Move/Up zum Verschieben eines platzierten Teils.
5. **Trash:** Trash-Element, Mouseup-Erkennung „über Trash“ → Teil entfernen, Feedback.
6. **Scaler/Turner:** Auswahl per Klick (Hit-Test), Panel mit Slidern, Anbindung an scale/rotation des ausgewählten Teils.
7. **Presets & localStorage:** placedItems speichern/laden, Presets-Format auf placedItems umstellen.
8. **Dokumentation:** README und Manual wie oben anpassen.

---

## 10. Bestätigung

Bitte bestätigen Sie, ob dieser Plan Ihre Vorstellungen trifft (insbesondere: nur Maus/Touch für „Teil auf Trash ziehen“, keine HTML5-Drop-Zone für Canvas→Trash; Thumbnails nur bei erfolgreichem Load als „verfügbar“). Danach kann die Implementierung schrittweise erfolgen.
