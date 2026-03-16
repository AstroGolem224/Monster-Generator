/**
 * State Serialization / Deserialization
 */

import { serializePlacedItem, deserializePlacedItem } from '../../core/entities/PlacedItem.js';
import { serializePreset, deserializePreset } from '../../core/entities/Preset.js';

/**
 * @typedef {Object} SerializedState
 * @property {string} version - Schema version
 * @property {number} timestamp
 * @property {Array<Object>} items
 * @property {Array<Object>} [presets]
 */

const CURRENT_VERSION = '1.0.0';

export class Serializer {
  /**
   * Serialize scene state
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @returns {string}
   */
  static serializeScene(items) {
    const data = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      items: items.map(serializePlacedItem)
    };
    return JSON.stringify(data);
  }

  /**
   * Deserialize scene state
   * @param {string} json
   * @returns {Array<import('../../core/entities/PlacedItem').PlacedItem>}
   */
  static deserializeScene(json) {
    try {
      const data = JSON.parse(json);
      
      // Version check
      if (!this._isCompatibleVersion(data.version)) {
        console.warn(`[Serializer] Version mismatch: ${data.version} vs ${CURRENT_VERSION}`);
        // Attempt migration or return empty
        return this._migrateScene(data);
      }

      if (!Array.isArray(data.items)) {
        return [];
      }

      return data.items.map(item => {
        try {
          return deserializePlacedItem(item);
        } catch (error) {
          console.warn('[Serializer] Failed to deserialize item:', error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('[Serializer] Failed to deserialize:', error);
      return [];
    }
  }

  /**
   * Serialize presets
   * @param {Array<import('../../core/entities/Preset').Preset>} presets
   * @returns {string}
   */
  static serializePresets(presets) {
    const data = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      presets: presets.map(serializePreset)
    };
    return JSON.stringify(data);
  }

  /**
   * Deserialize presets
   * @param {string} json
   * @returns {Array<import('../../core/entities/Preset').Preset>}
   */
  static deserializePresets(json) {
    try {
      const data = JSON.parse(json);
      
      if (!this._isCompatibleVersion(data.version)) {
        console.warn(`[Serializer] Version mismatch: ${data.version}`);
        return this._migratePresets(data);
      }

      if (!Array.isArray(data.presets)) {
        return [];
      }

      return data.presets.map(preset => {
        try {
          return deserializePreset(preset);
        } catch (error) {
          console.warn('[Serializer] Failed to deserialize preset:', error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('[Serializer] Failed to deserialize presets:', error);
      return [];
    }
  }

  /**
   * Export to shareable format (compressed)
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @returns {string} Base64 encoded
   */
  static toShareable(items) {
    const data = this.serializeScene(items);
    // Simple base64 encoding (could use compression library for larger data)
    return btoa(unescape(encodeURIComponent(data)));
  }

  /**
   * Import from shareable format
   * @param {string} base64
   * @returns {Array<import('../../core/entities/PlacedItem').PlacedItem>}
   */
  static fromShareable(base64) {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      return this.deserializeScene(json);
    } catch (error) {
      console.error('[Serializer] Failed to decode shareable:', error);
      return [];
    }
  }

  // Private methods

  static _isCompatibleVersion(version) {
    if (!version) return false;
    const [major] = version.split('.');
    const [currentMajor] = CURRENT_VERSION.split('.');
    return major === currentMajor;
  }

  static _migrateScene(data) {
    // Migration logic for old versions
    if (!data.items) return [];
    
    // Handle old format where items were flat array
    if (Array.isArray(data.items)) {
      return data.items.map(item => ({
        ...item,
        // Ensure new properties have defaults
        flipH: item.flipH ?? false,
        flipV: item.flipV ?? false
      })).filter(item => item.id && item.categoryId);
    }
    
    return [];
  }

  static _migratePresets(data) {
    if (!data.presets) return [];
    return data.presets.map(preset => ({
      ...preset,
      items: preset.items?.map(item => ({
        ...item,
        flipH: item.flipH ?? false,
        flipV: item.flipV ?? false
      })) || []
    }));
  }
}
