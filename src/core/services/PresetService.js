/**
 * Preset Service - Business logic for preset management
 */

import { Actions, ActionTypes } from '../state/actions.js';
import { createPreset, serializePreset, deserializePreset } from '../entities/Preset.js';
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

  /**
   * Register reducers with the store
   * @param {Object} reducers
   */
  registerReducers(reducers) {
    this._reducers = reducers;
  }

  /**
   * Save current scene as preset
   * @param {string} name
   * @returns {{ success: boolean, error?: string }}
   */
  savePreset(name) {
    try {
      const items = this._store.select(state => state.scene.placedItems);
      
      if (items.length === 0) {
        return { success: false, error: 'Scene is empty' };
      }

      // Validate name
      const trimmed = name.trim();
      if (!trimmed) {
        return { success: false, error: 'Name is required' };
      }

      if (trimmed.length > 30) {
        return { success: false, error: 'Name too long (max 30 chars)' };
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        return { success: false, error: 'Invalid characters in name' };
      }

      this._dispatch(Actions.savePreset(trimmed, items));
      this._persist();

      return { success: true };
    } catch (error) {
      console.error('[PresetService] Save failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load a preset into the scene
   * @param {string} name
   * @returns {{ success: boolean, error?: string }}
   */
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

  /**
   * Delete a preset
   * @param {string} name
   * @returns {{ success: boolean, error?: string }}
   */
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

  /**
   * Get all preset names
   * @returns {Array<string>}
   */
  getPresetNames() {
    return this._store.select(state => 
      state.presets.items.map(p => p.name)
    );
  }

  /**
   * Get all presets with info
   * @returns {Array<{ name: string, itemCount: number, createdAt: string }>}
   */
  getPresetsInfo() {
    return this._store.select(state => 
      state.presets.items.map(p => ({
        name: p.name,
        itemCount: p.items.length,
        createdAt: new Date(p.createdAt).toLocaleString()
      }))
    );
  }

  /**
   * Check if preset exists
   * @param {string} name
   * @returns {boolean}
   */
  hasPreset(name) {
    return this._getPreset(name) !== undefined;
  }

  /**
   * Get count of saved presets
   * @returns {number}
   */
  getCount() {
    return this._store.select(state => state.presets.items.length);
  }

  /**
   * Load presets from storage
   * @returns {Promise<boolean>}
   */
  async loadFromStorage() {
    try {
      const data = await this._storage.get(STORAGE_KEYS.PRESETS);
      if (data && Array.isArray(data.presets)) {
        // Load presets into state
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

  /**
   * Export preset as JSON
   * @param {string} name
   * @returns {string | null}
   */
  exportPreset(name) {
    const preset = this._getPreset(name);
    if (!preset) return null;
    return JSON.stringify(serializePreset(preset), null, 2);
  }

  /**
   * Import preset from JSON
   * @param {string} json
   * @returns {{ success: boolean, error?: string }}
   */
  importPreset(json) {
    try {
      const data = JSON.parse(json);
      const preset = deserializePreset(data);
      
      // Check for duplicate name
      let name = preset.name;
      let counter = 1;
      while (this.hasPreset(name)) {
        name = `${preset.name} (${counter})`;
        counter++;
      }

      this._dispatch(Actions.savePreset(name, preset.items));
      this._persist();

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Invalid preset format' };
    }
  }

  // Private methods

  _dispatch(action) {
    if (!this._reducers) {
      throw new Error('[PresetService] Reducers not registered');
    }
    this._store.dispatch(action, this._reducers);
  }

  _getPreset(name) {
    return this._store.select(state => 
      state.presets.items.find(p => p.name === name)
    );
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
    // Also persist the loaded scene
    try {
      const items = this._store.select(state => state.scene.placedItems);
      await this._storage.set(STORAGE_KEYS.SCENE, { items });
    } catch (error) {
      console.error('[PresetService] Failed to persist scene:', error);
    }
  }
}
