/**
 * Preset Service - Business logic for preset management
 */

import { Actions } from '../state/actions.js';
import { deserializePreset, serializePreset } from '../entities/Preset.js';
import { STORAGE_KEYS } from '../../config/constants.js';

export class PresetService {
  /**
   * @param {import('../state/Store').Store} store
   * @param {import('../../infrastructure/storage/StorageAdapter').StorageAdapter} storage
   */
  constructor(store, storage) {
    this._store = store;
    this._storage = storage;
    this._reducers = null;
  }

  registerReducers(reducers) {
    this._reducers = reducers;
  }

  savePreset(name) {
    try {
      const items = this._store.select(state => state.scene.placedItems);
      if (items.length === 0) {
        return { success: false, error: 'Scene is empty' };
      }

      const trimmed = this._validateName(name);
      this._dispatch(Actions.savePreset(trimmed, items));
      this._persist();
      return { success: true, name: trimmed };
    } catch (error) {
      console.error('[PresetService] Save failed:', error);
      return { success: false, error: error.message };
    }
  }

  loadPreset(name) {
    try {
      const preset = this._getPreset(name);
      if (!preset) {
        return { success: false, error: `Preset "${name}" not found` };
      }

      this._dispatch(Actions.loadPreset(preset.name, preset.items));
      this._persistScene();
      return { success: true };
    } catch (error) {
      console.error('[PresetService] Load failed:', error);
      return { success: false, error: error.message };
    }
  }

  deletePreset(name) {
    try {
      const preset = this._getPreset(name);
      if (!preset) {
        return { success: false, error: `Preset "${name}" not found` };
      }

      this._dispatch(Actions.deletePreset(name));
      this._persist();
      return { success: true };
    } catch (error) {
      console.error('[PresetService] Delete failed:', error);
      return { success: false, error: error.message };
    }
  }

  renamePreset(oldName, newName) {
    try {
      const preset = this._getPreset(oldName);
      if (!preset) {
        return { success: false, error: `Preset "${oldName}" not found` };
      }

      const trimmed = this._validateName(newName);
      if (oldName !== trimmed && this.hasPreset(trimmed)) {
        return { success: false, error: `Preset "${trimmed}" existiert bereits` };
      }

      this._dispatch(Actions.renamePreset(oldName, trimmed));
      this._persist();
      return { success: true, name: trimmed };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  duplicatePreset(name, explicitName = '') {
    try {
      const preset = this._getPreset(name);
      if (!preset) {
        return { success: false, error: `Preset "${name}" not found` };
      }

      let nextName = explicitName?.trim() || `${name} Copy`;
      nextName = this._createUniqueName(nextName);

      this._dispatch(Actions.savePreset(nextName, preset.items));
      this._persist();
      return { success: true, name: nextName };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getPresetNames() {
    return this._store.select(state => state.presets.items.map(p => p.name));
  }

  getPresets() {
    return this._store.select(state => state.presets.items);
  }

  getPresetsInfo() {
    return this._store.select(state =>
      state.presets.items.map(p => ({
        name: p.name,
        itemCount: p.items.length,
        createdAt: new Date(p.createdAt).toLocaleString(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleString() : null
      }))
    );
  }

  hasPreset(name) {
    return this._getPreset(name) !== undefined;
  }

  getCount() {
    return this._store.select(state => state.presets.items.length);
  }

  async loadFromStorage() {
    try {
      const data = await this._storage.get(STORAGE_KEYS.PRESETS);
      if (data && Array.isArray(data.presets)) {
        for (const presetData of data.presets) {
          try {
            const preset = deserializePreset(presetData);
            this._dispatch(Actions.savePreset(preset.name, preset.items));
          } catch (error) {
            console.warn('[PresetService] Failed to load preset:', error);
          }
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PresetService] Failed to load from storage:', error);
      return false;
    }
  }

  exportPreset(name) {
    const preset = this._getPreset(name);
    if (!preset) return null;
    return JSON.stringify(serializePreset(preset), null, 2);
  }

  importPreset(json) {
    try {
      const data = JSON.parse(json);
      const preset = deserializePreset(data);
      const name = this._createUniqueName(preset.name);
      this._dispatch(Actions.savePreset(name, preset.items));
      this._persist();
      return { success: true, name };
    } catch (error) {
      return { success: false, error: 'Invalid preset format' };
    }
  }

  _dispatch(action) {
    if (!this._reducers) {
      throw new Error('[PresetService] Reducers not registered');
    }
    this._store.dispatch(action, this._reducers);
  }

  _getPreset(name) {
    return this._store.select(state => state.presets.items.find(p => p.name === name));
  }

  _validateName(name) {
    const trimmed = `${name ?? ''}`.trim();
    if (!trimmed) {
      throw new Error('Name is required');
    }
    if (trimmed.length > 30) {
      throw new Error('Name too long (max 30 chars)');
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
      throw new Error('Invalid characters in name');
    }
    return trimmed;
  }

  _createUniqueName(baseName) {
    let name = this._validateName(baseName);
    let counter = 1;
    while (this.hasPreset(name)) {
      const suffix = ` (${counter})`;
      name = `${baseName}`.slice(0, Math.max(1, 30 - suffix.length)) + suffix;
      counter += 1;
    }
    return name;
  }

  async _persist() {
    try {
      const presets = this._store.select(state => state.presets.items);
      await this._storage.set(STORAGE_KEYS.PRESETS, { presets });
    } catch (error) {
      console.error('[PresetService] Failed to persist:', error);
    }
  }

  async _persistScene() {
    try {
      const items = this._store.select(state => state.scene.placedItems);
      await this._storage.set(STORAGE_KEYS.SCENE, { items });
    } catch (error) {
      console.error('[PresetService] Failed to persist scene:', error);
    }
  }
}
