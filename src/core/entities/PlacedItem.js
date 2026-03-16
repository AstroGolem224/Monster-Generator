import { generateUUID } from '../../utils/id.js';

/**
 * @typedef {Object} PlacedItem
 * @property {string} id - Eindeutige ID
 * @property {string} categoryId - Kategorie-Referenz (body, head, eyes, etc.)
 * @property {number} partId - Teil-Index innerhalb der Kategorie
 * @property {string} assetUrl - URL zum Bild-Asset
 * @property {string} color - Fallback-Farbe (Hex)
 * @property {number} x - Normalisierte X-Position (0-1)
 * @property {number} y - Normalisierte Y-Position (0-1)
 * @property {number} scale - Skalierungsfaktor (0.5 - 4.0)
 * @property {number} rotation - Rotation in Grad (0-360)
 * @property {boolean} flipH - Horizontal gespiegelt
 * @property {boolean} flipV - Vertikal gespiegelt
 * @property {string} [label] - Anzeigename
 */

/**
 * Default values for PlacedItem
 * @type {Partial<PlacedItem>}
 */
const DEFAULTS = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  flipH: false,
  flipV: false
};

/**
 * Validators for PlacedItem properties
 */
const VALIDATORS = {
  x: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  y: (v) => typeof v === 'number' && v >= 0 && v <= 1,
  scale: (v) => typeof v === 'number' && v >= 0.5 && v <= 4.0,
  rotation: (v) => typeof v === 'number' && v >= 0 && v < 360,
  flipH: (v) => typeof v === 'boolean',
  flipV: (v) => typeof v === 'boolean'
};

/**
 * Creates a new PlacedItem with validation
 * @param {Partial<PlacedItem>} data
 * @returns {PlacedItem}
 */
export function createPlacedItem(data = {}) {
  const item = {
    id: data.id ?? generateUUID(),
    categoryId: data.categoryId ?? 'body',
    partId: data.partId ?? 0,
    assetUrl: data.assetUrl ?? '',
    color: data.color ?? '#c8e6c9',
    label: data.label ?? `${data.categoryId || 'item'} ${(data.partId ?? 0) + 1}`,
    x: clamp(data.x ?? DEFAULTS.x, 0, 1),
    y: clamp(data.y ?? DEFAULTS.y, 0, 1),
    scale: clamp(data.scale ?? DEFAULTS.scale, 0.5, 4.0),
    rotation: normalizeAngle(data.rotation ?? DEFAULTS.rotation),
    flipH: data.flipH ?? DEFAULTS.flipH,
    flipV: data.flipV ?? DEFAULTS.flipV
  };

  return Object.freeze(item);
}

/**
 * Updates a PlacedItem immutably
 * @param {PlacedItem} item
 * @param {Partial<PlacedItem>} updates
 * @returns {PlacedItem}
 */
export function updatePlacedItem(item, updates) {
  // Validate updates
  const validated = {};
  for (const [key, value] of Object.entries(updates)) {
    if (VALIDATORS[key] && !VALIDATORS[key](value)) {
      console.warn(`[PlacedItem] Invalid value for ${key}:`, value);
      continue;
    }
    validated[key] = value;
  }

  // Special handling for rotation (normalize)
  if (validated.rotation !== undefined) {
    validated.rotation = normalizeAngle(validated.rotation);
  }

  // Special handling for position (clamp)
  if (validated.x !== undefined) {
    validated.x = clamp(validated.x, 0, 1);
  }
  if (validated.y !== undefined) {
    validated.y = clamp(validated.y, 0, 1);
  }

  // Special handling for scale (clamp)
  if (validated.scale !== undefined) {
    validated.scale = clamp(validated.scale, 0.5, 4.0);
  }

  return createPlacedItem({ ...item, ...validated });
}

/**
 * Clone a PlacedItem with optional overrides
 * @param {PlacedItem} item
 * @param {Partial<PlacedItem>} overrides
 * @returns {PlacedItem}
 */
export function clonePlacedItem(item, overrides = {}) {
  return createPlacedItem({ ...item, id: generateUUID(), ...overrides });
}

/**
 * Serialize PlacedItem for storage
 * @param {PlacedItem} item
 * @returns {Object}
 */
export function serializePlacedItem(item) {
  return {
    id: item.id,
    categoryId: item.categoryId,
    partId: item.partId,
    assetUrl: item.assetUrl,
    color: item.color,
    x: item.x,
    y: item.y,
    scale: item.scale,
    rotation: item.rotation,
    flipH: item.flipH,
    flipV: item.flipV,
    label: item.label
  };
}

/**
 * Deserialize PlacedItem from storage
 * @param {Object} data
 * @returns {PlacedItem}
 */
export function deserializePlacedItem(data) {
  return createPlacedItem(data);
}

/**
 * Get transform state for rendering
 * @param {PlacedItem} item
 * @returns {{ scale: number, rotation: number, flipH: boolean, flipV: boolean }}
 */
export function getTransformState(item) {
  return {
    scale: item.scale,
    rotation: item.rotation,
    flipH: item.flipH,
    flipV: item.flipV
  };
}

/**
 * Check if point is within item bounds (simplified hit test)
 * @param {PlacedItem} item
 * @param {number} normX - Normalized X (0-1)
 * @param {number} normY - Normalized Y (0-1)
 * @param {number} hitRadius - Hit radius in normalized units (default: 0.1)
 * @returns {boolean}
 */
export function hitTest(item, normX, normY, hitRadius = 0.1) {
  const dx = normX - item.x;
  const dy = normY - item.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= (hitRadius * item.scale);
}

// Utility functions

/**
 * Clamp value between min and max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize angle to 0-360 range
 * @param {number} angle
 * @returns {number}
 */
function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}
