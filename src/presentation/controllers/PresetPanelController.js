/**
 * Preset Panel Controller - Manages preset save/load
 */

import { Actions } from '../../core/state/actions.js';

export class PresetPanelController {
  constructor(store, presetService, sceneService) {
    this.store = store;
    this.presetService = presetService;
    this.sceneService = sceneService;
    
    // Elements
    this.nameInput = document.getElementById('presetName');
    this.selectEl = document.getElementById('presetSelect');
    this.saveBtn = document.getElementById('savePresetBtn');
    this.loadBtn = document.getElementById('loadPresetBtn');
    this.deleteBtn = document.getElementById('deletePresetBtn');
  }

  async init() {
    this._setupEventListeners();
    this._subscribeToState();
    this._renderPresets();
  }

  _setupEventListeners() {
    // Save
    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this._handleSave());
    }

    // Load
    if (this.loadBtn) {
      this.loadBtn.addEventListener('click', () => this._handleLoad());
    }

    // Delete
    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', () => this._handleDelete());
    }

    // Enter key on input
    if (this.nameInput) {
      this.nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this._handleSave();
        }
      });
    }
  }

  _subscribeToState() {
    this.store.subscribe((state, prevState) => {
      const presetsChanged = JSON.stringify(state.presets.items) !==
                            JSON.stringify(prevState?.presets?.items);
      
      if (presetsChanged) {
        this._renderPresets();
      }
    });
  }

  _renderPresets() {
    if (!this.selectEl) return;

    const presets = this.store.select(state => state.presets.items);
    const selectedValue = this.selectEl.value;

    this.selectEl.innerHTML = '<option value="">– auswählen –</option>' +
      presets.map(p => `
        <option value="${p.name}" ${p.name === selectedValue ? 'selected' : ''}>
          ${p.name}
        </option>
      `).join('');
  }

  _handleSave() {
    if (!this.nameInput) return;

    const name = this.nameInput.value.trim();
    if (!name) {
      this._announce('Bitte einen Namen eingeben');
      return;
    }

    const result = this.presetService.savePreset(name);
    
    if (result.success) {
      this.nameInput.value = '';
      this._announce(`Preset "${name}" gespeichert`);
    } else {
      this._announce(result.error || 'Speichern fehlgeschlagen');
    }
  }

  _handleLoad() {
    if (!this.selectEl) return;

    const name = this.selectEl.value;
    if (!name) {
      this._announce('Bitte ein Preset auswählen');
      return;
    }

    const result = this.presetService.loadPreset(name);
    
    if (result.success) {
      this._announce(`Preset "${name}" geladen`);
    } else {
      this._announce(result.error || 'Laden fehlgeschlagen');
    }
  }

  _handleDelete() {
    if (!this.selectEl) return;

    const name = this.selectEl.value;
    if (!name) {
      this._announce('Bitte ein Preset zum Löschen auswählen');
      return;
    }

    const confirmed = confirm(`Möchtest du das Preset "${name}" wirklich löschen?`);
    if (!confirmed) return;

    const result = this.presetService.deletePreset(name);
    
    if (result.success) {
      this.selectEl.value = '';
      this._announce(`Preset "${name}" gelöscht`);
    } else {
      this._announce(result.error || 'Löschen fehlgeschlagen');
    }
  }

  _announce(message) {
    this.store.dispatch(
      Actions.announce(message),
      require('../../core/state/reducers.js').rootReducer
    );
  }
}
