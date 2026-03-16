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
  }

  async init() {
    this._setupEventListeners();
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

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + S = Export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._handleExport();
      }
      
      // Delete = Remove selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedId = this.store.select(state => state.scene.selectedItemId);
        if (selectedId) {
          this.sceneService.removeItem(selectedId);
          this._announce('Teil entfernt');
        }
      }
    });
  }

  async _handleExport() {
    try {
      const items = this.store.select(state => state.scene.placedItems);
      if (items.length === 0) {
        this._announce('Nichts zu exportieren');
        return;
      }

      const filename = `monster-${Date.now()}.png`;
      await canvasExporter.download(items, filename);
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
}
