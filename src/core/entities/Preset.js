/**
 * @typedef {Object} Preset
 * @property {string} name - Eindeutiger Name
 * @property {Array<import('./PlacedItem').PlacedItem>} items - Gespeicherte Items
 * @property {number} createdAt - Timestamp
 * @property {number} [updatedAt] - Timestamp der letzten Änderung
 */

import { serializePlacedItem, deserializePlacedItem } from './PlacedItem.js';

const MAX_NAME_LENGTH = 30;
const VALID_NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

/**
 * Creates a new Preset
 * @param {Object} data
 * @param {string} data.name
 * @param {Array<import('./PlacedItem').PlacedItem>} data.items
 * @param {number} [data.createdAt]
 * @returns {Preset}
 */
export function createPreset({ name, items, createdAt = Date.now() }) {
  const validatedName = validateName(name);
  
  return Object.freeze({
    name: validatedName,
    items: Array.isArray(items) ? items.map(serializePlacedItem) : [],
    createdAt,
    updatedAt: createdAt
  });
}

/**
 * Validates and sanitizes preset name
 * @param {string} name
 * @returns {string}
 * @throws {Error} If name is invalid
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Preset name is required');
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    throw new Error('Preset name cannot be empty');
  }
  
  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new Error(`Preset name too long (max ${MAX_NAME_LENGTH} characters)`);
  }
  
  // Allow letters, numbers, spaces, hyphens, underscores
  if (!VALID_NAME_REGEX.test(trimmed)) {
    throw new Error('Preset name contains invalid characters');
  }
  
  return trimmed;
}

/**
 * Updates an existing preset with new items
 * @param {Preset} preset
 * @param {Array<import('./PlacedItem').PlacedItem>} items
 * @returns {Preset}
 */
export function updatePreset(preset, items) {
  return createPreset({
    name: preset.name,
    items,
    createdAt: preset.createdAt
  });
}

/**
 * Renames a preset
 * @param {Preset} preset
 * @param {string} newName
 * @returns {Preset}
 */
export function renamePreset(preset, newName) {
  return createPreset({
    name: newName,
    items: preset.items,
    createdAt: preset.createdAt
  });
}

/**
 * Serializes preset for storage
 * @param {Preset} preset
 * @returns {Object}
 */
export function serializePreset(preset) {
  return {
    name: preset.name,
    items: preset.items,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt
  };
}

/**
 * Deserializes preset from storage
 * @param {Object} data
 * @returns {Preset}
 */
export function deserializePreset(data) {
  return createPreset({
    name: data.name,
    items: Array.isArray(data.items) 
      ? data.items.map(deserializePlacedItem)
      : [],
    createdAt: data.createdAt || Date.now()
  });
}

/**
 * Checks if two presets have the same content
 * @param {Preset} a
 * @param {Preset} b
 * @returns {boolean}
 */
export function isEqualPreset(a, b) {
  if (a.name !== b.name) return false;
  if (a.items.length !== b.items.length) return false;
  
  return JSON.stringify(a.items) === JSON.stringify(b.items);
}

/**
 * Get preset display info
 * @param {Preset} preset
 * @returns {{ name: string, itemCount: number, createdAt: string }}
 */
export function getPresetInfo(preset) {
  return {
    name: preset.name,
    itemCount: preset.items.length,
    createdAt: new Date(preset.createdAt).toLocaleString()
  };
}
