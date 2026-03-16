# Monster Generator - Architekturdokument

## 📋 Übersicht

| Attribut | Wert |
|----------|------|
| **Projekt** | Monster Generator |
| **Typ** | Web-App (Vite + Vanilla JS) |
| **Architektur** | Modular Component-Based |
| **Zustand** | State Machine mit Event-Driven Updates |
| **Speicher** | LocalStorage (Client-seitig) |

---

## 🎯 Architektur-Prinzipien

### 1. **Single Responsibility Principle (SRP)**
Jedes Modul hat genau einen Grund zu existieren.

### 2. **Dependency Inversion**
Module kommunizieren über abstrakte Schnittstellen, nicht direkte Implementierungen.

### 3. **Unidirectional Data Flow**
State → View → Events → State Updates → View Re-render

### 4. **Explicit Dependencies**
Alle Abhängigkeiten werden via ES6-Imports deklariert.

---

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  UIRenderer │  │EventHandler │  │   CanvasController      │  │
│  │  (DOM API)  │  │(User Input) │  │   (Rendering/HitTest)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              CORE / APPLICATION LAYER                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │SceneManager │  │PresetManager│  │  StateMachine   │  │    │
│  │  │ (placedItems│  │(Save/Load)  │  │ (Validierung)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              DOMAIN / BUSINESS LAYER                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ PartCatalog │  │MonsterEntity│  │ TransformEngine │  │    │
│  │  │(Kategorien) │  │(Komposition)│  │(Scale/Rotate)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              INFRASTRUCTURE LAYER                        │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │AssetLoader  │  │StorageAdapter│  │ ExportEngine    │  │    │
│  │  │(Bild-Cache) │  │(localStorage)│  │ (PNG/DataURL)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Modul-Struktur (Vorgeschlagen)

```
src/
├── main.js                 # Entry Point - Initialisierung
├── config/
│   ├── constants.js        # App-Konstanten (EXPORT_SIZE, BASE_SIZE_RATIO)
│   └── theme.js            # Design-Tokens (CSS-Variablen in JS)
│
├── core/                   # Kern-Logik (Framework-agnostic)
│   ├── state/
│   │   ├── Store.js        # Zentraler State Store (Observable Pattern)
│   │   ├── actions.js      # State Actions (addItem, removeItem, etc.)
│   │   └── selectors.js    # State Selectors (getSelectedItem, etc.)
│   │
│   ├── entities/
│   │   ├── PlacedItem.js   # Domain-Entity für platzierte Teile
│   │   ├── Part.js         # Domain-Entity für verfügbare Teile
│   │   └── Preset.js       # Domain-Entity für Presets
│   │
│   └── services/
│       ├── SceneService.js      # Scene-Logik (add/move/delete)
│       ├── PresetService.js     # Preset-CRUD
│       └── TransformService.js  # Scale/Rotate/Flip Logik
│
├── infrastructure/         # Technische Details
│   ├── storage/
│   │   ├── StorageAdapter.js    # Abstract Interface
│   │   └── LocalStorageAdapter.js # konkrete Implementierung
│   │
│   ├── assets/
│   │   ├── ImageCache.js        # Bild-Caching-Strategie
│   │   ├── AssetLoader.js       # Lade-Logik mit Retry
│   │   └── AssetRepository.js   # Asset-Metadaten-Verwaltung
│   │
│   └── export/
│       ├── CanvasExporter.js    # PNG Export
│       └── Serializer.js        # JSON Serialisierung
│
├── domain/                 # Geschäftslogik
│   ├── catalog/
│   │   ├── CategoryRepository.js # Kategorie-Definitionen
│   │   ├── PartCatalog.js        # Teile-Verzeichnis
│   │   └── PartFactory.js        # Part-Instanziierung
│   │
│   └── composition/
│       ├── MonsterComposer.js    # Zusammenstellungs-Logik
│       ├── LayerManager.js       # Render-Reihenfolge (z-index)
│       └── HitTestEngine.js      # Punkt-in-Shape Detection
│
├── presentation/           # UI-Schicht
│   ├── components/         # Wiederverwendbare UI-Komponenten
│   │   ├── Picker/
│   │   │   ├── Picker.js       # Hauptkomponente
│   │   │   ├── CategoryTabs.js # Tab-Navigation
│   │   │   └── PartGrid.js     # 3x3 Grid
│   │   │
│   │   ├── Canvas/
│   │   │   ├── CanvasView.js   # Canvas Rendering
│   │   │   └── CanvasController.js # Interaktionen
│   │   │
│   │   ├── Controls/
│   │   │   ├── ScalerPanel.js  # Scale/Rotate UI
│   │   │   ├── PresetPanel.js  # Preset-Verwaltung
│   │   │   └── ActionBar.js    # Export/Random/Reset
│   │   │
│   │   └── common/
│   │       ├── Button.js
│   │       ├── Slider.js
│   │       └── Icon.js
│   │
│   ├── layouts/
│   │   └── MainLayout.js   # Layout-Struktur
│   │
│   └── accessibility/
│       ├── AriaAnnouncer.js    # Screen-Reader Support
│       ├── KeyboardNavigation.js # Tastatur-Steuerung
│       └── FocusManager.js     # Fokus-Management
│
├── utils/                  # Hilfsfunktionen
│   ├── id.js               # UUID-Generierung
│   ├── math.js             # Koordinaten-Transformationen
│   ├── dom.js              # DOM-Utilities
│   └── functional.js       # FP-Utilities (compose, pipe)
│
└── styles/
    ├── base.css            # Reset & Base
    ├── variables.css       # CSS Custom Properties
    ├── components/         # Component-Styles
    └── utilities.css       # Utility-Klassen
```

---

## 🔄 Datenfluss

### State Management Flow

```
User Action → Event Handler → Action Creator → Store (Reducer) 
     ↑                                                          │
     └──────────────── View Re-render ← State Change ←──────────┘
```

### Beispiel: "Teil hinzufügen"

```javascript
// 1. User droppt Teil auf Canvas
CanvasController.onDrop = (event) => {
  const data = parseDropData(event);
  
  // 2. Action dispatchen
  store.dispatch({
    type: 'ADD_ITEM',
    payload: {
      categoryId: data.categoryId,
      partId: data.partId,
      position: normalizedCoordinates
    }
  });
};

// 3. Reducer aktualisiert State
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        placedItems: [...state.placedItems, createPlacedItem(action.payload)]
      };
  }
}

// 4. Store benachrichtigt Subscriber
store.subscribe((newState) => {
  CanvasView.render(newState.placedItems);
  StorageAdapter.save(newState);
});
```

---

## 📐 Coding Standards

### 1. **ES6+ Module System**
```javascript
// ✅ Gut: Named exports
export function createPart(data) { }
export const PartTypes = { BODY: 'body' };

// ✅ Gut: Default export für Hauptklasse
export default class AssetLoader { }

// ❌ Schlecht: Gemischte Exports
module.exports = { ... }; // CommonJS vermeiden
```

### 2. **JSDoc Typisierung**
```javascript
/**
 * @typedef {Object} PlacedItem
 * @property {string} id - Eindeutige ID
 * @property {string} categoryId - Kategorie-Referenz
 * @property {number} partId - Teil-Index
 * @property {string} assetUrl - Bild-URL
 * @property {string} color - Fallback-Farbe
 * @property {number} x - Normalisierte X (0-1)
 * @property {number} y - Normalisierte Y (0-1)
 * @property {number} scale - Skalierungsfaktor
 * @property {number} rotation - Rotation in Grad
 * @property {boolean} flipH - Horizontal gespiegelt
 * @property {boolean} flipV - Vertikal gespiegelt
 */

/**
 * Erstellt ein neues PlacedItem
 * @param {Partial<PlacedItem>} data
 * @returns {PlacedItem}
 */
export function createPlacedItem(data = {}) {
  return {
    id: generateUUID(),
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
    ...data
  };
}
```

### 3. **Immutability Pattern**
```javascript
// ✅ Gut: Immutable Updates
const newState = {
  ...state,
  placedItems: state.placedItems.map(item =>
    item.id === targetId 
      ? { ...item, scale: newScale }
      : item
  )
};

// ❌ Schlecht: Mutation
const item = state.placedItems.find(i => i.id === targetId);
item.scale = newScale; // Direkte Mutation!
```

### 4. **Dependency Injection**
```javascript
// ✅ Gut: Dependencies als Parameter
class SceneService {
  constructor(storageAdapter, assetLoader) {
    this.storage = storageAdapter;
    this.loader = assetLoader;
  }
}

// ❌ Schlecht: Harte Kopplung
class SceneService {
  constructor() {
    this.storage = new LocalStorageAdapter(); // Nicht testbar!
  }
}
```

### 5. **Error Handling**
```javascript
// ✅ Gut: Result Type Pattern
export class Result {
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }
  
  static success(value) { return new Result(true, value, null); }
  static failure(error) { return new Result(false, null, error); }
}

// Verwendung
async function loadAsset(url) {
  try {
    const image = await assetLoader.load(url);
    return Result.success(image);
  } catch (error) {
    return Result.failure(error.message);
  }
}
```

### 6. **Event Naming Conventions**
```javascript
// Format: domain:action:target
const Events = {
  SCENE_ITEM_ADDED: 'scene:item:added',
  SCENE_ITEM_REMOVED: 'scene:item:removed',
  SCENE_ITEM_UPDATED: 'scene:item:updated',
  PRESET_SAVED: 'preset:saved',
  PRESET_LOADED: 'preset:loaded',
  CANVAS_RENDERED: 'canvas:rendered'
};
```

---

## 🔧 Refactoring-Roadmap

### Phase 1: State Management Extraktion
```javascript
// Aktuell: Globale Variablen in main.js
let placedItems = [];
let selectedItemId = null;

// Ziel: Zentraler Store
const store = createStore({
  scene: {
    placedItems: [],
    selectedItemId: null
  },
  ui: {
    activeCategoryId: 'body',
    scalerPanelOpen: false
  },
  presets: {
    items: [],
    selectedPreset: null
  }
});
```

### Phase 2: Service Layer
```javascript
// services/SceneService.js
export class SceneService {
  constructor(store, storage) {
    this.store = store;
    this.storage = storage;
  }

  addItem(part, position) {
    const item = createPlacedItem({ ...part, ...position });
    this.store.dispatch(sceneActions.addItem(item));
    this.persist();
    return item;
  }

  removeItem(id) {
    this.store.dispatch(sceneActions.removeItem(id));
    this.persist();
  }

  updateTransform(id, transforms) {
    this.store.dispatch(sceneActions.updateItem(id, transforms));
    this.persist();
  }

  persist() {
    const state = this.store.getState().scene;
    this.storage.save(STORAGE_KEY, state.placedItems);
  }
}
```

### Phase 3: Komponenten-Architektur
```javascript
// components/BaseComponent.js
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this.state = {};
    this.refs = {};
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  queryRefs(selectors) {
    Object.entries(selectors).forEach(([key, selector]) => {
      this.refs[key] = this.querySelector(selector);
    });
  }

  // Lifecycle Hooks
  connectedCallback() { }
  disconnectedCallback() { }
  render() { }
}

// components/Picker/CategoryTabs.js
export class CategoryTabs extends BaseComponent {
  static observedAttributes = ['active-category'];

  render() {
    const categories = this.state.categories || [];
    this.innerHTML = categories.map(cat => `
      <button 
        class="picker__tab" 
        data-category="${cat.id}"
        aria-selected="${cat.id === this.state.activeCategory}"
      >${cat.label}</button>
    `).join('');
  }
}

customElements.define('category-tabs', CategoryTabs);
```

---

## 🧪 Teststrategie

### Unit Tests (Jest/Vitest)
```javascript
// services/__tests__/TransformService.test.js
import { TransformService } from '../TransformService';

describe('TransformService', () => {
  let service;
  
  beforeEach(() => {
    service = new TransformService();
  });

  test('applyScale sollte Skalierung limitieren', () => {
    const item = { scale: 1 };
    const result = service.applyScale(item, 5.0); // Max ist 4.0
    expect(result.scale).toBe(4.0);
  });

  test('applyRotation sollte Winkel normalisieren', () => {
    const item = { rotation: 0 };
    const result = service.applyRotation(item, 370);
    expect(result.rotation).toBe(10); // 370 % 360
  });
});
```

### Integration Tests
```javascript
// tests/integration/scene.workflow.test.js
describe('Scene Workflow', () => {
  test('vollständiger Workflow: Add → Transform → Export', async () => {
    const store = createTestStore();
    const sceneService = new SceneService(store, mockStorage);
    
    // Add item
    const item = sceneService.addItem(mockPart, { x: 0.5, y: 0.5 });
    expect(store.getState().scene.placedItems).toHaveLength(1);
    
    // Transform
    sceneService.updateTransform(item.id, { scale: 1.5, rotation: 45 });
    const updated = store.getState().scene.placedItems[0];
    expect(updated.scale).toBe(1.5);
    expect(updated.rotation).toBe(45);
    
    // Export
    const exporter = new CanvasExporter();
    const dataUrl = await exporter.export(store.getState().scene.placedItems);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
```

---

## 🚀 Performance-Optimierungen

### 1. **Canvas Rendering**
```javascript
// Double Buffering
class CanvasView {
  constructor() {
    this.offscreen = document.createElement('canvas');
    this.visible = document.getElementById('previewCanvas');
  }

  render(items) {
    // Auf Offscreen-Canvas rendern
    this.drawOnCanvas(this.offscreen, items);
    // Dann auf sichtbaren Canvas kopieren
    const ctx = this.visible.getContext('2d');
    ctx.drawImage(this.offscreen, 0, 0);
  }
}
```

### 2. **Lazy Loading**
```javascript
// Nur sichtbare Kategorien laden
class PartCatalog {
  async loadCategory(categoryId) {
    if (this.cache.has(categoryId)) {
      return this.cache.get(categoryId);
    }
    
    const parts = await this.fetchCategory(categoryId);
    this.cache.set(categoryId, parts);
    return parts;
  }
}
```

### 3. **Debounced Updates**
```javascript
import { debounce } from '../utils/functional';

class ScalerPanel {
  constructor() {
    // Nur alle 16ms (60fps) rendern
    this.updateScale = debounce(this._updateScale.bind(this), 16);
  }
}
```

---

## 📚 Erweiterungsmöglichkeiten

### 1. **Plugin-System**
```javascript
// plugins/PluginManager.js
export class PluginManager {
  constructor(store) {
    this.store = store;
    this.plugins = [];
  }

  register(plugin) {
    plugin.init(this.store);
    this.plugins.push(plugin);
  }
}

// Beispiel-Plugin
const GridSnapPlugin = {
  name: 'grid-snap',
  init(store) {
    store.subscribe((state) => {
      // Items an Gitter ausrichten
    });
  }
};
```

### 2. **Undo/Redo**
```javascript
// core/state/HistoryManager.js
export class HistoryManager {
  constructor(store, maxHistory = 50) {
    this.history = [];
    this.position = -1;
    store.subscribe(state => this.push(state));
  }

  push(state) {
    if (this.position < this.history.length - 1) {
      this.history = this.history.slice(0, this.position + 1);
    }
    this.history.push(deepClone(state));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.position++;
  }

  undo() { /* ... */ }
  redo() { /* ... */ }
}
```

### 3. **Cloud-Sync**
```javascript
// infrastructure/storage/CloudStorageAdapter.js
export class CloudStorageAdapter {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async save(key, data) {
    await this.api.post('/scenes', { key, data });
  }

  async load(key) {
    return await this.api.get(`/scenes/${key}`);
  }
}
```

---

## 📝 Zusammenfassung

| Bereich | Aktueller Stand | Ziel |
|---------|----------------|------|
| **State** | Globale Variablen | Zentraler Store |
| **Module** | Flat (4 Dateien) | Hierarchisch (Layered) |
| **Testing** | Keine | Unit + Integration |
| **Type Safety** | JSDoc | JSDoc + Runtime Checks |
| **Components** | Vanilla DOM | Web Components |
| **Styling** | Ein CSS-File | CSS Modules + Variables |

---

**Letzte Aktualisierung:** 2026-03-16  
**Version:** 1.0.0  
**Autor:** Kimi Code CLI
