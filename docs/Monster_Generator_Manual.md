# Monster Generator – Anleitung

## Was ist der Monster Generator?

Der Monster Generator ist eine Web-App, mit der du aus vorgegebenen Monsterteilen ein Avatar-Monster zusammenbaust und als PNG (z. B. Profilbild) herunterladen kannst. Du ziehst **beliebige Teile** aus dem Selector auf die Anzeige, kannst sie **verschieben**, **vergrößern/verkleinern** und **drehen** und nicht mehr benötigte Teile per **Teil-löschen-Button** entfernen. Alles läuft im Browser, ohne Anmeldung.

---

## Starten

1. **Mit Node.js (empfohlen)**  
   Im Projektordner im Terminal:
   ```bash
   npm install
   npm run dev
   ```
   Im Browser die angezeigte Adresse öffnen (z. B. http://localhost:5173).

2. **Ohne Node.js**  
   Einen lokalen Webserver nutzen (z. B. Python):
   ```bash
   python -m http.server 8080
   ```
   Dann im Browser: http://localhost:8080 öffnen.  
   Die `index.html` nicht per Doppelklick öffnen – die App braucht einen Server.

---

## Benutzung

### Oberfläche

- **Oben:** Titel „MONSTER GENERATOR“.
- **Links:**  
  - **Tabs** für die 8 Kategorien: Körper, Kopf, Augen, Mund, Hörner, Arme, Beine, Accessoires.  
  - **3×3-Grid** mit den Teilen der gewählten Kategorie. Kacheln zeigen ein **Thumbnail**, wenn die Datei vorhanden und geladen ist; sonst eine **Nummer** (Platzhalter).  
  - **Zufall** – fügt ein zufälliges Teil in der Mitte der Anzeige hinzu.
- **Mitte:**  
  - **Monster-Anzeige** (quadratisch, abgerundete Ecken): Hier platzierst du Teile per Drag-and-Drop. Du kannst Teile **verschieben** (ziehen). Zum Löschen wählst du ein Teil aus und klickst auf **Teil löschen**.  
  - **Ausgewähltes Teil:** Wenn du ein Teil auf der Anzeige **anklickst**, erscheint darunter das Panel mit **Größe** (50–400 %), **Drehung** (0–360°), **Horizontal/Vertikal spiegeln** und dem Button **Teil löschen**.  
  - **Teil löschen:** Button (Trash-Icon + „Teil löschen“) – entfernt nur das **aktuell ausgewählte** Teil. Ohne Auswahl ist der Button deaktiviert.  
  - **Zufälliges Monster** – fügt ein zufälliges Teil hinzu.  
  - **Als PNG herunterladen** – speichert die aktuelle Szene als 512×512-PNG.
- **Presets:** Aktuelle Szene (alle platzieren Teile mit Position, Größe, Drehung) unter einem Namen speichern, laden oder ein Preset löschen.
- **Zurücksetzen** – entfernt alle Teile von der Anzeige und leert die gespeicherte Szene.

### Monster bauen

1. **Tab** wählen (z. B. „Kopf“ oder „Augen“).
2. Ein **Teil** aus dem Grid **auf die Monster-Anzeige ziehen** (Drag-and-Drop) – es erscheint an der Drop-Position. Du kannst **beliebig viele** Teile aus **beliebigen** Kategorien platzieren; ein neues Teil ersetzt die anderen nicht.
3. **Verschieben:** Ein bereits platziertes Teil auf der Anzeige **anklicken und ziehen** – es folgt der Maus bis du loslässt.
4. **Größe, Drehung und Spiegeln:** Ein Teil **anklicken**. Im Panel **Ausgewähltes Teil**: **Größe** (50–400 %), **Drehung** (0–360°), Buttons **↔ Horizontal** und **↕ Vertikal** zum Umschalten der Spiegelung. Änderungen wirken sofort.
5. **Entfernen:** Teil **anklicken** (auswählen), dann auf **Teil löschen** (Trash-Button im Panel) klicken – nur das ausgewählte Teil wird vom Canvas entfernt.

### Verfügbare Assets im Selector

- Kacheln mit **Bild** (Thumbnail) = die Datei liegt im Ordner und wurde geladen („verfügbar“).
- Kacheln mit **Nummer** (und Farbe) = Platzhalter, weil die Datei fehlt oder noch nicht geladen ist.
- Du kannst alle Kacheln ziehen; fehlende Assets erscheinen auf der Anzeige als farbiger Platzhalter.

### Zufalls-Monster

- **Zufall** / **Zufälliges Monster:** Fügt **ein** zufälliges Teil (aus einer zufälligen Kategorie) in der **Mitte** der Anzeige hinzu. Du kannst danach weiter Teile hinzufügen, verschieben und anpassen.

### Presets

- **Preset speichern:** Namen eingeben und **Speichern** klicken. Die **gesamte Szene** (alle platzieren Teile inkl. Position, Größe, Drehung) wird unter diesem Namen gespeichert.
- **Preset laden:** Ein Preset in der Liste wählen und **Laden** klicken – die Anzeige wird durch diese Szene ersetzt.
- **Preset löschen:** Preset auswählen und **Löschen** klicken.

### Zurücksetzen

- **Zurücksetzen:** Entfernt **alle** Teile von der Anzeige und löscht die zuletzt gespeicherte Szene. Gespeicherte Presets bleiben erhalten.

### PNG herunterladen

- **Als PNG herunterladen:** Speichert die **aktuelle Anzeige** (alle platzieren Teile mit ihren Einstellungen) als PNG (512×512 Pixel). Noch nicht geladene Bilder erscheinen als Platzhalter.

---

## Eigene Monsterteile (Assets)

- Unter **public/assets/parts/** gibt es pro Kategorie einen Ordner (`body`, `head`, `eyes`, …).
- Darin legst du Bilder ab: **0.png**, **1.png**, **2.png**, … (PNG mit Transparenz).
- Sobald eine Datei vorhanden ist und geladen werden kann, zeigt die zugehörige Kachel im Selector ein **Thumbnail**. Fehlende oder nicht ladbare Dateien bleiben Platzhalter (Nummer).
- Details: **public/assets/parts/README.md**.

---

## Tastatur & Bedienung

- **Tab:** Wechsel zwischen Tabs, Grid und Buttons.
- **Eingabe / Leertaste** auf einer Kachel: Fügt dieses Teil in der **Mitte** der Anzeige hinzu (Alternative zum Ziehen).
- Meldungen (z. B. „Teil hinzugefügt“, „Preset geladen“) erscheinen unter den Buttons und werden für Screenreader in einer Live-Region ausgegeben.

---

## Häufige Fragen

- **Szene geht verloren?** Die aktuelle Szene wird automatisch gespeichert und beim nächsten Besuch wiederhergestellt (gleicher Browser). Presets bleiben, bis du sie löschst.
- **Keine Thumbnails im Selector?** Ohne PNGs in **public/assets/parts/…** oder bei Fehlern (404) siehst du nur Platzhalter. PNGs in die richtigen Ordner legen und Seite neu laden.
- **Export zeigt Platzhalter?** Noch nicht geladene Bilder werden im Export als Platzhalter gezeichnet. Einmal alle gewünschten Teile platzieren, kurz warten (Laden), dann exportieren.
