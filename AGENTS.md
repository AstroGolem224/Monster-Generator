# gstack

gstack ist ein Satz von 8 Skills, die Claude Code in spezialisierte Workflows verwandeln. Diese Skills wurden von Garry Tan (YC CEO) entwickelt und ermöglichen strukturierte, professionelle Software-Entwicklungs-Workflows.

## Verfügbare Skills

| Skill | Modus | Beschreibung |
|-------|-------|--------------|
| `/plan-ceo-review` | Founder / CEO | Überdenke das Problem. Finde das 10-Sterne-Produkt in der Anfrage. |
| `/plan-eng-review` | Engineering Manager | Architektur, Datenfluss, Diagramme, Edge Cases, Tests. |
| `/review` | Paranoider Staff Engineer | Finde Bugs, die CI bestehen, aber in Produktion explodieren. |
| `/ship` | Release Engineer | Sync main, Tests laufen lassen, PR erstellen. |
| `/browse` | QA Engineer | Gib dem Agent Augen. Browser-Automatisierung mit Screenshots. |
| `/qa` | QA Lead | Systematisches QA-Testing. Diff-Analyse, Regression, Smoke-Tests. |
| `/setup-browser-cookies` | Session Manager | Importiere Cookies aus dem echten Browser für authentifizierte Tests. |
| `/retro` | Engineering Manager | Team-bewusste Retrospektive mit Metriken und Wachstumschancen. |

## Verwendung

```
/plan-ceo-review    # Produkt-Richtung prüfen
/plan-eng-review    # Technische Planung
/review             # Code-Review vor dem Merge
/ship               # Branch shippen
/browse URL         # Website besuchen und testen
/qa                 # Automatisches QA (Diff-basiert)
/qa --quick         # Schneller Smoke-Test
/setup-browser-cookies domain.com  # Cookies importieren
/retro              # Wochen-Retrospektive
```

## Installation im Projekt

gstack ist im `.claude/skills/gstack` Verzeichnis verfügbar. Falls Probleme auftreten:

```bash
cd .claude/skills/gstack
./setup
```

## Web Browsing

Der `/browse` Skill ersetzt alle `mcp__claude-in-chrome__*` Tools. Für Web-Browsing immer `/browse` verwenden.

Beispiele:
- `/browse https://example.com` - Seite besuchen
- `/browse https://example.com --screenshot` - Screenshot machen
- `/browse https://example.com --console` - Konsole prüfen

Weitere Details: Siehe `.claude/skills/gstack/README.md`
