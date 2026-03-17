# Monster Generator

Web-basierter Avatar- und Profilbild-Generator mit süßen Monsterteilen.

- **8 Kategorien** (Tabs): Körper, Kopf, Augen, Mund, Hörner, Arme, Beine, Accessoires
- **3×3 Teile-Grid** pro Kategorie: **Thumbnails**, wenn Assets vorhanden, sonst Platzhalter; **Drag-and-Drop** auf die Anzeige
- **Mehrere Teile** beliebig auf der **Monster-Anzeige** platzieren, **verschieben**, **Größe und Drehung** pro Teil einstellen
- **Teil löschen:** Ausgewähltes Teil per **Trash-Button** im Panel entfernen
- **Spiegeln:** Horizontal und vertikal für das ausgewählte Teil; **Größe** 50–400 %
- **Preview** (quadratisch mit abgerundeten Ecken) + **Export** als PNG (512×512 px)
- **Presets** speichern/laden (gesamte Szene), **Zurücksetzen**
- **Undo/Redo** direkt in der UI plus Tastatur-Shortcuts für schnelleres Iterieren
- Design: Pastell-Grün-Verlauf, Titel „MONSTER GENERATOR“

Ausführliche Anleitung: [docs/Monster_Generator_Manual.md](docs/Monster_Generator_Manual.md)

## Start (mit Node.js)

```bash
npm install
npm run dev
```

**PowerShell:** Wenn „Ausführung von Skripts ist deaktiviert“ erscheint: entweder **Eingabeaufforderung (cmd)** nutzen, oder einmalig `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell ausführen (dann bestätigen).

Build: `npm run build` → Ausgabe in `dist/`.

Shortcuts:
- `Ctrl/Cmd + S` → PNG exportieren
- `Ctrl/Cmd + Z` → Undo
- `Shift + Ctrl/Cmd + Z` oder `Ctrl/Cmd + Y` → Redo

## Ohne Node.js / npm

Wenn `npm` nicht verfügbar ist (z. B. nicht installiert):

1. **Node.js installieren** (empfohlen): [nodejs.org](https://nodejs.org/) – LTS herunterladen, installieren, danach neues Terminal öffnen.
2. **Oder** lokalen Webserver nutzen (z. B. Python):
   ```bash
   cd "Monster Generator"
   python -m http.server 8080
   ```
   Dann im Browser: **http://localhost:8080** öffnen (nicht die HTML-Datei direkt per Doppelklick – ES-Module brauchen einen Server).
