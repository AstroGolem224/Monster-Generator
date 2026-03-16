/**
 * Scaler Panel Controller - Manages scale, rotation and flip controls
 */

import { Actions } from '../../core/state/actions.js';

export class ScalerPanelController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    // Elements
    this.panel = document.getElementById('scalerPanel');
    this.scaleSlider = document.getElementById('scaleSlider');
    this.scaleValue = document.getElementById('scaleValue');
    this.rotationSlider = document.getElementById('rotationSlider');
    this.rotationValue = document.getElementById('rotationValue');
    this.mirrorHBtn = document.getElementById('mirrorHBtn');
    this.mirrorVBtn = document.getElementById('mirrorVBtn');
    this.trashBtn = document.getElementById('trashBtn');
  }

  async init() {
    if (!this.panel) {
      console.warn('[ScalerPanelController] Panel not found');
      return;
    }

    this._setupEventListeners();
    this._subscribeToState();
  }

  _setupEventListeners() {
    // Scale
    if (this.scaleSlider) {
      this.scaleSlider.addEventListener('input', () => {
        const scale = parseInt(this.scaleSlider.value) / 100;
        this.scaleValue.textContent = this.scaleSlider.value;
        
        const selectedId = this._getSelectedId();
        if (selectedId) {
          this.sceneService.updateTransforms(selectedId, { scale });
        }
      });
    }

    // Rotation
    if (this.rotationSlider) {
      this.rotationSlider.addEventListener('input', () => {
        const rotation = parseInt(this.rotationSlider.value);
        this.rotationValue.textContent = rotation;
        
        const selectedId = this._getSelectedId();
        if (selectedId) {
          this.sceneService.updateTransforms(selectedId, { rotation });
        }
      });
    }

    // Flip Horizontal
    if (this.mirrorHBtn) {
      this.mirrorHBtn.addEventListener('click', () => {
        const selectedId = this._getSelectedId();
        if (selectedId) {
          this.sceneService.toggleFlipH(selectedId);
          this._updateFlipButtons();
        }
      });
    }

    // Flip Vertical
    if (this.mirrorVBtn) {
      this.mirrorVBtn.addEventListener('click', () => {
        const selectedId = this._getSelectedId();
        if (selectedId) {
          this.sceneService.toggleFlipV(selectedId);
          this._updateFlipButtons();
        }
      });
    }

    // Trash
    if (this.trashBtn) {
      this.trashBtn.addEventListener('click', () => {
        const selectedId = this._getSelectedId();
        if (selectedId) {
          this.sceneService.removeItem(selectedId);
          this._announce('Teil entfernt');
        }
      });
    }
  }

  _subscribeToState() {
    this.store.subscribe((state) => {
      const selectedId = state.scene.selectedItemId;
      const hasSelection = selectedId !== null;
      
      // Toggle panel visibility
      this.panel.hidden = !hasSelection;
      
      if (this.trashBtn) {
        this.trashBtn.disabled = !hasSelection;
      }

      if (hasSelection) {
        const item = state.scene.placedItems.find(i => i.id === selectedId);
        if (item) {
          this._updateControls(item);
        }
      }
    });
  }

  _updateControls(item) {
    // Scale
    if (this.scaleSlider) {
      this.scaleSlider.value = Math.round(item.scale * 100);
      this.scaleValue.textContent = Math.round(item.scale * 100);
    }

    // Rotation
    if (this.rotationSlider) {
      this.rotationSlider.value = Math.round(item.rotation);
      this.rotationValue.textContent = Math.round(item.rotation);
    }

    // Flip buttons
    this._updateFlipButtons(item);
  }

  _updateFlipButtons(item) {
    if (!item) {
      const selectedId = this._getSelectedId();
      const items = this.store.select(state => state.scene.placedItems);
      item = items.find(i => i.id === selectedId);
    }

    if (this.mirrorHBtn) {
      this.mirrorHBtn.setAttribute('aria-pressed', item?.flipH ? 'true' : 'false');
    }
    if (this.mirrorVBtn) {
      this.mirrorVBtn.setAttribute('aria-pressed', item?.flipV ? 'true' : 'false');
    }
  }

  _getSelectedId() {
    return this.store.select(state => state.scene.selectedItemId);
  }

  _announce(message) {
    this.store.dispatch(
      Actions.announce(message),
      this.reducers
    );
  }
}
