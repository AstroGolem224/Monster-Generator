# Monster Generator — Architektur-Analyse & Entwicklungs-Roadmap

**Datum:** 2026-03-16  
**Version:** 2.1.0  
**Autor:** Kimi Code Analysis  
**Status:** Production Ready with Improvement Potential

---

## 📊 EXECUTIVE SUMMARY

### Aktueller Zustand
| Kategorie | Bewertung | Status |
|-----------|-----------|--------|
| **Architektur** | Modular, Layered | ✅ Gut |
| **Code Quality** | Clean, getrennte Verantwortlichkeiten | ✅ Gut |
| **Performance** | Optimierungsbedarf identifiziert | ⚠️ Mittel |
| **Accessibility** | Grundlegend vorhanden, ausbaufähig | ⚠️ Mittel |
| **Testing** | Keine Tests implementiert | ❌ Kritisch |
| **Type Safety** | JSDoc, keine Runtime-Validierung | ⚠️ Mittel |
| **Error Handling** | Basic, nicht konsistent | ⚠️ Mittel |

### Kritische Bugs (Sofortmaßnahmen erforderlich)
1. **Memory Leak in Store** — `_notify` bei Undo/Redo fehlt `prevState`
2. **Circular Dependency** — `Actions` importiert `reducers` via `require()`
3. **Race Condition** — `_loadThumbnails` nicht cancellable
4. **Event Listener Leak** — `window.addEventListener` ohne Cleanup

---

## 🔍 DETAILLIERTE ANALYSE

### 1. Architektur-Review

#### 1.1 Positive Aspekte
```
✅ Klare Layer-Trennung (Core → Domain → Infrastructure → Presentation)
✅ Unidirectional Data Flow (Flux-ähnliches Pattern)
✅ Dependency Injection in Services
✅ Immutable State Management
✅ Consistent Naming Conventions
✅ JSDoc Typisierung
```

#### 1.2 Architektonische Schuld
```
⚠️  Store-Pattern ist selbstgebaut (nicht Redux/Zustand)
⚠️  Keine Middleware für Side Effects
⚠️  Controller sind zu dick (violieren SRP)
⚠️  Keine klare Grenze zwischen UI und Business Logic in Controllern
```

### 2. Performance-Analyse

#### 2.1 Identifizierte Probleme

| Problem | Auswirkung | Priorität |
|---------|------------|-----------|
| JSON.stringify für Equality-Checks | O(n) Vergleiche, langsam bei großen States | 🔴 Hoch |
| Keine Virtualisierung im Grid | 56+ DOM-Elemente immer gerendert | 🟡 Mittel |
| Canvas re-rendert bei jedem State-Change | Unnötige Render-Zyklen | 🔴 Hoch |
| Particles laufen auch im Hintergrund | Battery Drain | 🟡 Mittel |
| Kein Code Splitting | Ganze App wird geladen | 🟢 Niedrig |

#### 2.2 Benchmarks (geschätzt)
```
State Comparison:     O(n) — JSON.stringify auf 100+ Items
Grid Rendering:       O(1) — Konstant 56 DOM-Nodes
Canvas Rendering:     O(n) — Pro Item ein drawImage
Memory Footprint:     ~15MB (Assets) + ~5MB (State)
```

### 3. Code Quality Issues

#### 3.1 Bug: Memory Leak in Store.js
```javascript
// ZEILE 113-114: Undo/Redo notify ohne prevState
undo() {
  this._historyPosition--;
  const historyEntry = this._history[this._historyPosition];
  this._state = Object.freeze(this._deepClone(historyEntry.state));
  this._notify(this._state); // ❌ Sollte prevState übergeben
}
```

**Fix:**
```javascript
undo() {
  const prevState = this._state; // ✅ PrevState speichern
  this._historyPosition--;
  const historyEntry = this._history[this._historyPosition];
  this._state = Object.freeze(this._deepClone(historyEntry.state));
  this._notify(prevState); // ✅ Korrekt übergeben
}
```

#### 3.2 Bug: Circular Dependency Pattern
```javascript
// IN: PickerController.js (Zeile 176)
this.store.dispatch(
  Actions.selectCategory(categoryId),
  require('../../core/state/reducers.js').rootReducer // ❌ Runtime require
);
```

**Problem:**
- Bundler kann nicht optimieren
- Potenzielle Circular Dependencies
- Keine Tree-Shaking Unterstützung

**Fix:** Reducers beim Controller-Init injecten
```javascript
constructor(store, sceneService, reducers) {
  this.reducers = reducers; // ✅ Dependency Injection
}
```

#### 3.3 Bug: Event Listener Leak
```javascript
// IN: CanvasController.js (Zeilen 70, 79)
window.addEventListener('mousemove', ...); // ❌ Nie entfernt
window.addEventListener('mouseup', ...);   // ❌ Nie entfernt
```

**Fix:** Cleanup-Method implementieren
```javascript
destroy() {
  window.removeEventListener('mousemove', this._boundMouseMove);
  window.removeEventListener('mouseup', this._boundMouseUp);
}
```

### 4. Accessibility-Gap-Analyse

| WCAG 2.1 Kriterium | Status | Maßnahme |
|-------------------|--------|----------|
| 1.1.1 Non-text Content | ⚠️ | Alt-Texte für alle Bilder |
| 1.3.1 Info and Relationships | ✅ | Semantische Struktur |
| 2.1.1 Keyboard | ⚠️ | Tab-Navigation im Canvas |
| 2.4.3 Focus Order | ⚠️ | Fokus-Management |
| 2.4.7 Focus Visible | ✅ | CSS :focus Styles |
| 4.1.2 Name, Role, Value | ⚠️ | ARIA-Labels vervollständigen |

---

## 🎯 VERBESSERUNGSVORSCHLÄGE

### Phase 1: Critical Bugs (Sofort — Woche 1)

#### Modul: Core Stability
**Tasks:**
- [ ] **BUG-001:** Store Undo/Redo prevState fix
- [ ] **BUG-002:** Event Listener Cleanup in allen Controllern
- [ ] **BUG-003:** Race Condition in _loadThumbnails fixen (AbortController)
- [ ] **BUG-004:** Circular Dependency via DI lösen

**Estimation:** 1-2 Tage  
**Impact:** Stabilität, Memory Usage

---

### Phase 2: Performance-Optimierung (Woche 2-3)

#### Modul: State Performance
**Tasks:**
- [ ] **PERF-001:** Structural Sharing für State-Updates
  ```javascript
  // Statt deepClone überall
  import { produce } from 'immer';
  const newState = produce(state, draft => {
    draft.scene.placedItems.push(item);
  });
  ```
- [ ] **PERF-002:** Memoized Selectors (Reselect/Reselectors)
  ```javascript
  const selectPlacedItems = createSelector(
    [state => state.scene.placedItems],
    (items) => items // Cached
  );
  ```
- [ ] **PERF-003:** JSON.stringify ersetzen durch shallowEqual
  ```javascript
  _isEqual(a, b) {
    if (a === b) return true;
    // Shallow comparison für Arrays/Objects
    return shallowEqual(a, b);
  }
  ```

#### Modul: Rendering Performance
**Tasks:**
- [ ] **PERF-004:** Canvas Double Buffering
  ```javascript
  // Offscreen Canvas für Rendering
  this.offscreenCanvas = document.createElement('canvas');
  // Nur changed regions re-rendern
  ```
- [ ] **PERF-005:** requestIdleCallback für Thumbnails
  ```javascript
  requestIdleCallback(() => {
    this._loadThumbnails(parts);
  }, { timeout: 2000 });
  ```
- [ ] **PERF-006:** Particles pausieren bei Inaktivität
  ```javascript
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) this.stop();
  });
  ```

**Estimation:** 3-4 Tage  
**Impact:** 40-60% Performance-Steigerung

---

### Phase 3: Testing-Infrastruktur (Woche 4-5)

#### Modul: Unit Testing
**Tasks:**
- [ ] **TEST-001:** Vitest Setup
  ```bash
  npm install -D vitest @vitest/ui jsdom
  ```
- [ ] **TEST-002:** Store Tests
  ```javascript
  describe('Store', () => {
    it('should notify subscribers on state change', () => {
      const store = new Store({ count: 0 });
      const subscriber = vi.fn();
      store.subscribe(subscriber);
      // ... test
    });
  });
  ```
- [ ] **TEST-003:** Entity Tests (PlacedItem, Part, Preset)
- [ ] **TEST-004:** Service Tests (SceneService, PresetService)
- [ ] **TEST-005:** Reducer Tests (actions → state)

#### Modul: E2E Testing
**Tasks:**
- [ ] **TEST-006:** Playwright Setup
  ```bash
  npm install -D @playwright/test
  npx playwright install
  ```
- [ ] **TEST-007:** Critical User Flows
  - Add item → Move → Scale → Export
  - Save preset → Load preset → Delete preset
  - Drag & Drop workflows

**Estimation:** 4-5 Tage  
**Impact:** Code Confidence, Regression Prevention

---

### Phase 4: Accessibility & UX (Woche 6)

#### Modul: A11y Compliance
**Tasks:**
- [ ] **A11Y-001:** Keyboard Navigation im Canvas
  ```javascript
  // Arrow keys für Item-Movement
  // Tab für Item-Selection
  // Delete für Item-Removal
  ```
- [ ] **A11Y-002:** Screen Reader Support
  ```javascript
  // aria-live für Announcements
  // aria-describedby für komplexe Controls
  ```
- [ ] **A11Y-003:** Focus Trap in Modals
- [ ] **A11Y-004:** High Contrast Mode Support
  ```css
  @media (prefers-contrast: high) {
    /* Stärkere Kontraste */
  }
  ```

#### Modul: UX Improvements
**Tasks:**
- [ ] **UX-001:** Undo/Redo UI Buttons (Ctrl+Z / Ctrl+Y)
- [ ] **UX-002:** Toast Notification System
- [ ] **UX-003:** Loading States für Async Operations
- [ ] **UX-004:** Error Boundaries für Graceful Degradation

**Estimation:** 3-4 Tage  
**Impact:** WCAG 2.1 AA Compliance, User Satisfaction

---

### Phase 5: Features & Erweiterungen (Woche 7-8)

#### Modul: Layer Management
**Tasks:**
- [ ] **FEAT-001:** Z-Index / Layer Order Controls
  ```javascript
  // Items vor/hinter verschieben
  bringToFront(itemId)
  sendToBack(itemId)
  ```
- [ ] **FEAT-002:** Layer Panel (wie Photoshop)

#### Modul: Advanced Transforms
**Tasks:**
- [ ] **FEAT-003:** Skew/SkewX/SkewY
- [ ] **FEAT-004:** Opacity/Blend Modes
- [ ] **FEAT-005:** Masking/Clipping

#### Modul: Import/Export
**Tasks:**
- [ ] **FEAT-006:** JSON Import/Export (Scene Sharing)
  ```javascript
  // Shareable URLs
  const shareable = btoa(JSON.stringify(scene));
  ```
- [ ] **FEAT-007:** SVG Export
- [ ] **FEAT-008:** Sprite Sheet Export

#### Modul: Cloud Features
**Tasks:**
- [ ] **FEAT-009:** Firebase Integration (Auth + DB)
- [ ] **FEAT-010:** Real-time Collaboration
- [ ] **FEAT-011:** Cloud Presets

**Estimation:** 8-10 Tage  
**Impact:** Feature Completeness, User Retention

---

## 📋 IMPLEMENTIERUNGS-PLAN

### Sprint-Planung (Agile)

```
Sprint 1 (Woche 1): Critical Stability
├── BUG-001 bis BUG-004
├── Code Review
└── Hotfix Release v2.1.1

Sprint 2 (Woche 2-3): Performance
├── PERF-001 bis PERF-006
├── Performance Benchmarks
└── Release v2.2.0

Sprint 3 (Woche 4-5): Testing
├── TEST-001 bis TEST-007
├── CI/CD Pipeline Setup
└── Release v2.3.0

Sprint 4 (Woche 6): A11y & UX
├── A11Y-001 bis A11Y-004
├── UX-001 bis UX-004
└── Release v2.4.0

Sprint 5 (Woche 7-8): Features
├── FEAT-001 bis FEAT-011 (Priorisiert)
└── Release v3.0.0
```

### Priorisierungs-Matrix

| Feature | Impact | Effort | ROI | Priorität |
|---------|--------|--------|-----|-----------|
| Bug Fixes | 🔴 Hoch | 🟢 Niedrig | ⭐⭐⭐⭐⭐ | P0 |
| State Performance | 🔴 Hoch | 🟡 Mittel | ⭐⭐⭐⭐⭐ | P1 |
| Testing | 🟡 Mittel | 🔴 Hoch | ⭐⭐⭐⭐ | P2 |
| Accessibility | 🟡 Mittel | 🟡 Mittel | ⭐⭐⭐⭐ | P2 |
| Layer Management | 🟢 Niedrig | 🟡 Mittel | ⭐⭐⭐ | P3 |
| Cloud Features | 🟢 Niedrig | 🔴 Hoch | ⭐⭐ | P4 |

---

## 🏗️ TECHNISCHE EMPFEHLUNGEN

### 1. State Management Evolution

**Aktuell:** Custom Store  
**Empfohlung:** Zustand oder Redux Toolkit

```javascript
// Zustand Beispiel
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useSceneStore = create(immer((set, get) => ({
  placedItems: [],
  selectedItemId: null,
  addItem: (item) => set((state) => {
    state.placedItems.push(item);
  }),
  // ...
})));
```

**Vorteile:**
- Built-in Immer Support
- Selector Memoization
- DevTools Integration
- Kleinere Bundle Size als Redux

### 2. Component Architecture

**Aktuell:** Vanilla JS Controller  
**Empfohlung:** Web Components oder Framework

Option A: Web Components (Native)
```javascript
class MonsterCanvas extends HTMLElement {
  static observedAttributes = ['width', 'height'];
  // Lifecycle: connectedCallback, disconnectedCallback
}
customElements.define('monster-canvas', MonsterCanvas);
```

Option B: Svelte (Empfohlen für diesen Use Case)
```svelte
<!-- Canvas.svelte -->
<script>
  export let items = [];
  let canvas;
  
  $: if (canvas && items) {
    render(canvas, items);
  }
</script>
<canvas bind:this={canvas} />
```

### 3. Build & Deployment

**Empfohlene Pipeline:**
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run build
      - run: npm run lighthouse
```

---

## 📊 QUALITY GATES

### Definition of Done

- [ ] Code Review bestanden
- [ ] Unit Tests ≥ 80% Coverage
- [ ] E2E Tests für Critical Paths
- [ ] Lighthouse Score ≥ 90
- [ ] No Console Errors
- [ ] Accessibility Audit bestanden
- [ ] Performance Budget eingehalten
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Bundle Size < 200KB (gzipped)

---

## 🎓 LEARNINGS & BEST PRACTICES

### Was funktioniert gut
1. **Modulare Architektur** — Ermöglicht parallele Entwicklung
2. **Immutable State** — Vorhersehbar, debuggbar
3. **Service Layer** — Wiederverwendbare Business Logic
4. **JSDoc** — Gute IDE Unterstützung

### Was verbessert werden muss
1. **Keine Tests** — Hohes Regression-Risiko
2. **Keine Error Boundaries** — App kann crashen
3. **Zu viel Logik in Controllern** — SRP Verletzung
4. **Kein Loading State Management** — UX Lücken

---

## 📚 WEITERFÜHRENDE RESSOURCEN

### Empfohlene Bibliotheken
| Zweck | Bibliothek | Größe |
|-------|-----------|-------|
| State | Zustand | 1.1 KB |
| Immutability | Immer | 3 KB |
| Testing | Vitest | Dev Only |
| Selectors | reselect | 500 B |
| A11y | @axe-core/cli | Dev Only |

### Dokumentation
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Immer Docs](https://immerjs.github.io/immer/)
- [Vitest Docs](https://vitest.dev/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

---

## ✅ NEXT STEPS

1. **Heute:** Critical Bugs fixen (BUG-001 bis BUG-004)
2. **Diese Woche:** Performance-Optimierungen starten
3. **Nächste Woche:** Testing-Infrastruktur aufsetzen
4. **Sprint Planning:** Team abstimmen, Aufwand schätzen

---

*Dokument erstellt durch automatisierte Code-Analyse*  
*Für Fragen oder Klärungen: Siehe inline Kommentare im Code*
