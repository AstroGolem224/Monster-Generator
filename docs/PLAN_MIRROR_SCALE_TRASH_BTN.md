# Plan: Spiegeln, Scaler 50–400 %, Trash als Button

**Status: umgesetzt.** (composer flipH/flipV, Scaler 50–400 %, Spiegel-Buttons, Trash-Button, Manual + README aktualisiert)

## Ziele

1. **Spiegeln:** Horizontal und vertikal für das **ausgewählte** Teil (jeweils umschaltbar).
2. **Scaler:** Bereich von **50 % bis 400 %** (bisher 50–200 %).  
   *(Hinweis: „-50 %“ wurde als untere Grenze 50 % gelesen. Falls gewünscht: negativer Maßstab z. B. -50 % bis +400 % für Spiegelung über Skalierung – dann Rücksprache.)*
3. **Trash:** Drag-Zone **entfällt**. Stattdessen ein **Trash-Button**, der das **aktuell ausgewählte** Teil vom Canvas entfernt (ohne Auswahl: Button deaktiviert oder ohne Wirkung).

---

## 1. Spiegeln (horizontal / vertikal)

- **Datenmodell:** Pro `placedItem` zwei optionale Felder: `flipH` (boolean), `flipV` (boolean). Standard `false` (kein Spiegeln). Beim Anlegen neuer Teile: `flipH: false`, `flipV: false`.
- **UI:** Im Panel „Ausgewähltes Teil“ zwei Buttons oder Schalter:
  - **Horizontal spiegeln** – setzt `flipH` des ausgewählten Teils auf `!flipH`.
  - **Vertikal spiegeln** – setzt `flipV` des ausgewählten Teils auf `!flipV`.
- **Composer:** Beim Zeichnen eines Teils nach `translate(-half, -half)` und vor dem Zeichnen des Bildes/Blobs:  
  `ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)` und danach um den neuen „Ursprung“ (Mitte des Rechtecks) zeichnen, damit die Spiegelung um die Teilmitte erfolgt.  
  Konkret: Nach Rotation bereits in lokalen Koordinaten; Spiegelung um (half, half) = `translate(half, half)` → `scale(flipH ? -1 : 1, flipV ? -1 : 1)` → `translate(-half, -half)` → zeichnen.
- **Hit-Test:** Unverändert (rechteckige Bounding-Box); flipH/flipV ändern die Trefferfläche nicht.
- **Export:** Gleiche Logik wie Preview (flipH/flipV berücksichtigen).
- **Presets / localStorage:** `flipH` und `flipV` in `placedItems` speichern und laden.

---

## 2. Scaler 50 %–400 %

- **Aktuell:** Slider z. B. min 50, max 200 (Prozent), Schritt 5.
- **Neu:** min **50**, max **400** (Prozent), Schritt z. B. 5 oder 10.  
  Intern: `item.scale = value / 100` (0.5 bis 4.0).
- **UI:** Slider und Anzeige (z. B. „Größe 100 %“) anpassen; max-Attribut und ggf. Label „50 %–400 %“.

---

## 3. Trash als Button (statt Drag-Zone)

- **Entfernen:**  
  - Drag-Zone („Teil hierher ziehen zum Löschen“) und zugehörige Logik (Drag vom Canvas auf Trash, `isPointInTrash`, Hover-Klasse) **entfernen**.  
  - Neuer **Button** (Icon Trash + Label „Teil löschen“ o. ä.):
    - **Klick:** Entfernt das **aktuell ausgewählte** Teil aus `placedItems` (falls `selectedItemId` gesetzt).
    - **Zustand:** Wenn kein Teil ausgewählt (`selectedItemId === null`): Button **deaktiviert** (`disabled`) und/oder `aria-disabled="true"`.
  - Nach dem Löschen: `selectedItemId = null`, Panel „Ausgewähltes Teil“ ausblenden, Szene speichern, Preview neu zeichnen, ggf. Live-Meldung „Teil entfernt“.
- **Kein Drag-to-Trash:** Verschieben auf dem Canvas bleibt unverändert (nur Position ändern); Löschen nur über Auswahl + Button.

---

## 4. Technische Änderungen (Kurz)

| Datei | Änderung |
|-------|----------|
| **composer.js** | `drawPlacedItem`: flipH/flipV unterstützen (scale um Teilmitte). Typ/Struktur von `item` um optionale Felder `flipH`, `flipV` ergänzen. |
| **main.js** | Beim Anlegen neuer Teile `flipH: false`, `flipV: false`. Scaler-Panel: Slider min 50, max 400. Zwei Handler für „Horizontal spiegeln“ / „Vertikal spiegeln“. Trash-Zone und Drag-to-Trash-Logik entfernen; neuer Handler für Trash-Button (nur bei selectedItemId), Button disabled wenn nichts ausgewählt. `updateScalerPanel` prüft Trash-Button disabled. Beim Laden alter Presets/Items ohne flipH/flipV: Default false. |
| **index.html** | Trash-Zone (div mit Icon) entfernen. Stattdessen Button „Teil löschen“ (mit Trash-Icon) im oder unter dem Scaler-Panel bzw. neben der Anzeige. Scaler: input range min 50, max 400. Zwei Buttons „Horizontal spiegeln“ und „Vertikal spiegeln“. |
| **style.css** | Styles für Trash-Zone (Drag-Bereich) entfernen oder umwidmen. Button „Teil löschen“ stylen (z. B. sekundär/rot). |
| **Manual / README** | Spiegeln (horizontal/vertikal), Scaler 50–400 %, Löschen nur noch per Button (ausgewähltes Teil löschen). |

---

## 5. Offene Punkte (Rücksprache)

- **Scaler „-50 % bis +400 %“:** Hier umgesetzt als **50 % bis 400 %** (0.5–4.0). Wenn du stattdessen echten negativen Maßstab (z. B. -50 % = gespiegelt und halbe Größe) möchtest, kann das separat eingebaut werden.
- **Position der Spiegel-Buttons:** Direkt im Scaler-Panel unter „Ausgewähltes Teil“ (unter Drehung) oder als eigene Zeile – geplant: im gleichen Panel unter den Slidern.

Wenn das so passt, erfolgt die Implementierung wie oben; bei abweichenden Wünschen (z. B. negativer Scale) bitte kurz sagen.
