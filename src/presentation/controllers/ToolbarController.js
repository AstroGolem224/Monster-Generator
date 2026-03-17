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
    
    // Buttons
    this.exportBtn = document.getElementById('exportBtn');
    this.randomBtn = document.getElementById('randomBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.undoBtn = document.getElementById('undoBtn');
    this.redoBtn = document.getElementById('redoBtn');
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
    // Export
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this._handleExport());
    }

    // Random
    if (this.randomBtn) {
      this.randomBtn.addEventListener('click', () => this._handleRandom());
    }

    // Reset
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this._handleReset());
    }

    // Undo / Redo
    if (this.undoBtn) {
      this.undoBtn.addEventListener('click', () => this._handleUndo());
    }

    if (this.redoBtn) {
      this.redoBtn.addEventListener('click', () => this._handleRedo());
    }

    // Keyboard shortcuts
    this._boundKeyDown = (e) => {
      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + S = Export
      if (isModifier && e.key === 's') {
        e.preventDefault();
        this._handleExport();
      }

      // Ctrl/Cmd + Z = Undo
      if (isModifier && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this._handleUndo();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
      if (isModifier && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        this._handleRedo();
      }
      
      // Delete = Remove selected
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
    if (undone) {
      this._announce('Aktion rückgängig gemacht');
    }
  }

  _handleRedo() {
    const redone = this.store.redo();
    if (redone) {
      this._announce('Aktion wiederhergestellt');
    }
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

  _handleReset() {
    const confirmed = confirm('Möchtest du wirklich alle Teile löschen?');
    if (!confirmed) return;

    this.sceneService.clear();
    this._announce('Szene zurückgesetzt');
  }

  _announce(message) {
    this.store.dispatch(
      Actions.announce(message),
      this.reducers
    );
  }

  destroy() {
    if (this._boundKeyDown) {
      document.removeEventListener('keydown', this._boundKeyDown);
    }

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}
