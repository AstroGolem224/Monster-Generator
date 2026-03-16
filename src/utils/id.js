/**
 * UUID Generation Utilities
 */

/**
 * Generates a UUID v4
 * Falls back to timestamp-based ID if crypto.randomUUID is not available
 * @returns {string}
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a short ID (8 characters)
 * Not cryptographically secure, good for UI elements
 * @returns {string}
 */
export function generateShortId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generates a timestamp-based ID
 * @returns {string}
 */
export function generateTimestampId() {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Validates if string is valid UUID format
 * @param {string} str
 * @returns {boolean}
 */
export function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
