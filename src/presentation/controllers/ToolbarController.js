/**
 * Toolbar Controller - Manages action buttons
 */

import { canvasExporter } from '../../infrastructure/export/CanvasExporter.js';
import { Actions } from '../../core/state/actions.js';
import { partCatalog } from '../../domain/catalog/PartCatalog.js';

export class ToolbarController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.exportBtn = document.getElementById('exportBtn');
    this.randomBtn = document.getElementById('randomBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');
    this.mutateBtn = document.getElementById('mutateBtn');
    this.evolveBtn = document.getElementById('evolveBtn');
    this.corruptBtn = document.getElementById('corruptBtn');
    this.bossBtn = document.getElementById('bossBtn');
    this.historyStatus = document.getElementById('historyStatus');

    this._boundKeyDown = null;
    this._unsubscribe = null;
  }

  async init() {
    this._setupEventListeners();
    this._subscribeToState();
    this._updateHistoryControls();
  }

  _setupEventListeners() {
    this.exportBtn?.addEventListener('click', () => this._handleExport());
    this.randomBtn?.addEventListener('click', () => this._handleRandom());
    this.resetBtn?.addEventListener('click', () => this._handleReset());
    this.undoBtn?.addEventListener('click', () => this._handleUndo());
    this.redoBtn?.addEventListener('click', () => this._handleRedo());
    this.mutateBtn?.addEventListener('click', () => this._handleVariant('mutate'));
    this.evolveBtn?.addEventListener('click', () => this._handleVariant('evolve'));
    this.corruptBtn?.addEventListener('click', () => this._handleVariant('corrupt'));
    this.bossBtn?.addEventListener('click', () => this._handleVariant('boss'));

    this._boundKeyDown = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.key === 's') {
        e.preventDefault();
        this._handleExport();
      }
      if (isModifier && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this._handleUndo();
      }
      if (isModifier && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        this._handleRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedId = this.store.select(state => state.scene.selectedItemId);
        if (selectedId) {
          this.sceneService.removeItem(selectedId);
          this._announce('Teil entfernt');
        }
      }
    };

    document.addEventListener('keydown', this._boundKeyDown);
  }

  _subscribeToState() {
    this._unsubscribe = this.store.subscribe(() => {
      this._updateHistoryControls();
    });
  }

  _updateHistoryControls() {
    const history = this.store.getHistoryState();
    if (this.undoBtn) {
      this.undoBtn.disabled = !history.canUndo;
      this.undoBtn.setAttribute('aria-disabled', String(!history.canUndo));
      this.undoBtn.title = history.canUndo ? 'Rückgängig (Ctrl/Cmd+Z)' : 'Nichts zum Rückgängigmachen';
    }
    if (this.redoBtn) {
      this.redoBtn.disabled = !history.canRedo;
      this.redoBtn.setAttribute('aria-disabled', String(!history.canRedo));
      this.redoBtn.title = history.canRedo ? 'Wiederholen (Shift+Ctrl/Cmd+Z)' : 'Nichts zum Wiederholen';
    }
    if (this.historyStatus) {
      this.historyStatus.textContent = `History ${Math.max(history.position + 1, 1)}/${Math.max(history.total, 1)}`;
    }
  }

  _handleUndo() {
    const undone = this.store.undo();
    if (undone) this._announce('Aktion rückgängig gemacht');
  }

  _handleRedo() {
    const redone = this.store.redo();
    if (redone) this._announce('Aktion wiederhergestellt');
  }

  async _handleExport() {
    try {
      const items = this.store.select(state => state.scene.placedItems);
      if (items.length === 0) {
        this._announce('Nichts zu exportieren');
        return;
      }
      const decorations = this.store.select(state => state.ui.decorations);
      const filename = `monster-${Date.now()}.png`;
      await canvasExporter.download(items, filename, { decorations });
      this._announce('Bild heruntergeladen');
    } catch (error) {
      console.error('[ToolbarController] Export failed:', error);
      this._announce('Export fehlgeschlagen');
    }
  }

  _handleRandom() {
    const random = partCatalog.getRandomPart();
    if (!random) return;
    this.sceneService.addItem(random.part, {
      x: 0.4 + Math.random() * 0.2,
      y: 0.4 + Math.random() * 0.2
    });
    this._announce('Zufälliges Teil hinzugefügt');
  }

  _handleVariant(mode) {
    const items = [...this.sceneService.getAllItems()];
    if (!items.length) {
      this._announce('Erst ein Monster bauen, dann kann Mira es mutieren');
      return;
    }

    const decorations = this.store.select(state => state.ui.decorations);

    items.forEach((item, index) => {
      const sameCategory = partCatalog.getParts(item.categoryId);
      const alternatives = sameCategory.filter(part => part.id !== item.partId);
      const shouldSwap = mode === 'corrupt' ? Math.random() < 0.8 : Math.random() < 0.45;
      const swapped = shouldSwap && alternatives.length ? alternatives[Math.floor(Math.random() * alternatives.length)] : null;

      const updates = {
        x: clamp01(item.x + jitter(mode, 'x')),
        y: clamp01(item.y + jitter(mode, 'y')),
        scale: clamp(item.scale + scaleShift(mode), 0.5, 4),
        rotation: (item.rotation + rotationShift(mode)) % 360,
        label: variantLabel(item.label || item.categoryId, mode)
      };

      if (swapped) {
        updates.partId = swapped.id;
        updates.assetUrl = swapped.assetUrl;
        updates.color = swapped.color;
        updates.label = variantLabel(swapped.label || item.label || item.categoryId, mode);
      }

      if (mode === 'corrupt' && Math.random() < 0.5) updates.flipH = !item.flipH;
      if (mode === 'corrupt' && Math.random() < 0.3) updates.flipV = !item.flipV;
      if (mode === 'boss') updates.scale = clamp(item.scale + 0.35, 0.5, 4);

      this.sceneService.updateItem(item.id, updates);
    });

    if (mode === 'evolve' || mode === 'boss') {
      const extraCount = mode === 'boss' ? 2 : 1;
      for (let i = 0; i < extraCount; i++) {
        const categoryPool = mode === 'boss' ? ['horns', 'accessories', 'eyes'] : ['accessories', 'mouth', 'horns'];
        const category = categoryPool[Math.floor(Math.random() * categoryPool.length)];
        const parts = partCatalog.getParts(category);
        const part = parts[Math.floor(Math.random() * parts.length)] || partCatalog.getRandomPart()?.part;
        if (part) {
          this.sceneService.addItem(part, {
            x: 0.25 + Math.random() * 0.5,
            y: 0.2 + Math.random() * 0.55
          });
        }
      }
    }

    if (mode === 'corrupt') {
      this.store.dispatch(Actions.updateDecorations({ background: 'midnight', frame: 'arcade', sticker: 'danger', title: 'Corrupted' }), this.reducers);
    } else if (mode === 'boss') {
      this.store.dispatch(Actions.updateDecorations({ frame: 'ember-frame', sticker: 'stars', title: 'Boss Form' }), this.reducers);
    } else if (mode === 'evolve') {
      this.store.dispatch(Actions.updateDecorations({ sticker: 'spark', title: 'Evolved' }), this.reducers);
    } else {
      this.store.dispatch(Actions.updateDecorations({ ...decorations, title: 'Mutated' }), this.reducers);
    }

    this._announce(announceText(mode));
  }

  _handleReset() {
    const confirmed = confirm('Möchtest du wirklich alle Teile löschen?');
    if (!confirmed) return;
    this.sceneService.clear();
    this._announce('Szene zurückgesetzt');
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }

  destroy() {
    if (this._boundKeyDown) document.removeEventListener('keydown', this._boundKeyDown);
    if (this._unsubscribe) this._unsubscribe();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function clamp01(value) { return clamp(value, 0, 1); }
function jitter(mode, axis) {
  const base = mode === 'boss' ? 0.03 : mode === 'corrupt' ? 0.08 : mode === 'evolve' ? 0.05 : 0.06;
  return (Math.random() - 0.5) * base * 2;
}
function scaleShift(mode) {
  switch (mode) {
    case 'boss': return 0.25 + Math.random() * 0.2;
    case 'evolve': return 0.08 + Math.random() * 0.15;
    case 'corrupt': return (Math.random() - 0.3) * 0.45;
    default: return (Math.random() - 0.5) * 0.3;
  }
}
function rotationShift(mode) {
  switch (mode) {
    case 'corrupt': return (Math.floor(Math.random() * 8) - 4) * 18;
    case 'boss': return (Math.floor(Math.random() * 6) - 3) * 10;
    default: return (Math.floor(Math.random() * 6) - 3) * 12;
  }
}
function variantLabel(label, mode) {
  const clean = `${label}`.replace(/\s+(Mutated|Evolved|Corrupted|Boss)$/i, '');
  switch (mode) {
    case 'evolve': return `${clean} Evolved`;
    case 'corrupt': return `${clean} Corrupted`;
    case 'boss': return `${clean} Boss`;
    default: return `${clean} Mutated`;
  }
}
function announceText(mode) {
  switch (mode) {
    case 'evolve': return 'Monster weiterentwickelt';
    case 'corrupt': return 'Monster korrumpiert';
    case 'boss': return 'Monster in Boss-Form verwandelt';
    default: return 'Monster mutiert';
  }
}
