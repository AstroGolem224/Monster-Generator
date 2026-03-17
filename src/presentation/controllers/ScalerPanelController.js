/**
 * Scaler Panel Controller - Manages scale, rotation and flip controls
 */

import { Actions } from '../../core/state/actions.js';

export class ScalerPanelController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.panel = document.getElementById('scalerPanel');
    this.scaleSlider = document.getElementById('scaleSlider');
    this.scaleValue = document.getElementById('scaleValue');
    this.rotationSlider = document.getElementById('rotationSlider');
    this.rotationValue = document.getElementById('rotationValue');
    this.mirrorHBtn = document.getElementById('mirrorHBtn');
    this.mirrorVBtn = document.getElementById('mirrorVBtn');
    this.alignCenterXBtn = document.getElementById('alignCenterXBtn');
    this.alignCenterYBtn = document.getElementById('alignCenterYBtn');
    this.snapToggleBtn = document.getElementById('snapToggleBtn');
    this.guidesToggleBtn = document.getElementById('guidesToggleBtn');
    this.trashBtn = document.getElementById('trashBtn');

    this.snapEnabled = false;
    this.guidesEnabled = false;
  }

  async init() {
    if (!this.panel) {
      console.warn('[ScalerPanelController] Panel not found');
      return;
    }

    this._setupEventListeners();
    this._subscribeToState();
    this._syncPrecisionButtons();
  }

  _setupEventListeners() {
    if (this.scaleSlider) {
      this.scaleSlider.addEventListener('input', () => {
        const scale = parseInt(this.scaleSlider.value, 10) / 100;
        this.scaleValue.textContent = this.scaleSlider.value;
        const selectedId = this._getSelectedId();
        if (selectedId) this.sceneService.updateTransforms(selectedId, { scale });
      });
    }

    if (this.rotationSlider) {
      this.rotationSlider.addEventListener('input', () => {
        const rotation = parseInt(this.rotationSlider.value, 10);
        this.rotationValue.textContent = rotation;
        const selectedId = this._getSelectedId();
        if (selectedId) this.sceneService.updateTransforms(selectedId, { rotation });
      });
    }

    this.mirrorHBtn?.addEventListener('click', () => {
      const selectedId = this._getSelectedId();
      if (selectedId) {
        this.sceneService.toggleFlipH(selectedId);
        this._updateFlipButtons();
      }
    });

    this.mirrorVBtn?.addEventListener('click', () => {
      const selectedId = this._getSelectedId();
      if (selectedId) {
        this.sceneService.toggleFlipV(selectedId);
        this._updateFlipButtons();
      }
    });

    this.alignCenterXBtn?.addEventListener('click', () => this._alignSelected({ x: 0.5 }));
    this.alignCenterYBtn?.addEventListener('click', () => this._alignSelected({ y: 0.5 }));

    this.snapToggleBtn?.addEventListener('click', () => {
      this.snapEnabled = !this.snapEnabled;
      document.dispatchEvent(new CustomEvent('monster:precision-change', {
        detail: { snapEnabled: this.snapEnabled, guidesEnabled: this.guidesEnabled }
      }));
      this._syncPrecisionButtons();
      this._announce(this.snapEnabled ? 'Snap-to-Grid aktiviert' : 'Snap-to-Grid deaktiviert');
    });

    this.guidesToggleBtn?.addEventListener('click', () => {
      this.guidesEnabled = !this.guidesEnabled;
      document.dispatchEvent(new CustomEvent('monster:precision-change', {
        detail: { snapEnabled: this.snapEnabled, guidesEnabled: this.guidesEnabled }
      }));
      this._syncPrecisionButtons();
      this._announce(this.guidesEnabled ? 'Symmetry Guides aktiviert' : 'Symmetry Guides deaktiviert');
    });

    this.trashBtn?.addEventListener('click', () => {
      const selectedId = this._getSelectedId();
      if (selectedId) {
        this.sceneService.removeItem(selectedId);
        this._announce('Teil entfernt');
      }
    });
  }

  _subscribeToState() {
    this.store.subscribe((state) => {
      const selectedId = state.scene.selectedItemId;
      const hasSelection = selectedId !== null;
      this.panel.hidden = !hasSelection;
      if (this.trashBtn) this.trashBtn.disabled = !hasSelection;

      if (hasSelection) {
        const item = state.scene.placedItems.find(i => i.id === selectedId);
        if (item) this._updateControls(item);
      }
    });
  }

  _updateControls(item) {
    if (this.scaleSlider) {
      this.scaleSlider.value = Math.round(item.scale * 100);
      this.scaleValue.textContent = Math.round(item.scale * 100);
    }

    if (this.rotationSlider) {
      this.rotationSlider.value = Math.round(item.rotation);
      this.rotationValue.textContent = Math.round(item.rotation);
    }

    this._updateFlipButtons(item);
    this._syncPrecisionButtons();
  }

  _updateFlipButtons(item) {
    if (!item) {
      const selectedId = this._getSelectedId();
      const items = this.store.select(state => state.scene.placedItems);
      item = items.find(i => i.id === selectedId);
    }

    if (this.mirrorHBtn) this.mirrorHBtn.setAttribute('aria-pressed', item?.flipH ? 'true' : 'false');
    if (this.mirrorVBtn) this.mirrorVBtn.setAttribute('aria-pressed', item?.flipV ? 'true' : 'false');
  }

  _syncPrecisionButtons() {
    if (this.snapToggleBtn) this.snapToggleBtn.setAttribute('aria-pressed', this.snapEnabled ? 'true' : 'false');
    if (this.guidesToggleBtn) this.guidesToggleBtn.setAttribute('aria-pressed', this.guidesEnabled ? 'true' : 'false');
  }

  _alignSelected(position) {
    const selectedId = this._getSelectedId();
    const item = this.sceneService.getSelectedItem();
    if (!selectedId || !item) return;

    this.store.dispatch(Actions.updateItem(selectedId, {
      x: position.x ?? item.x,
      y: position.y ?? item.y
    }), this.reducers);
    this._announce('Ausrichtung aktualisiert');
  }

  _getSelectedId() {
    return this.store.select(state => state.scene.selectedItemId);
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }
}
