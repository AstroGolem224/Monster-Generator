/**
 * Abstract Storage Adapter Interface
 * Implementations: LocalStorageAdapter, SessionStorageAdapter, MemoryStorageAdapter
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {(key: string) => Promise<*|null>} get
 * @property {(key: string, value: *) => Promise<void>} set
 * @property {(key: string) => Promise<void>} remove
 * @property {() => Promise<void>} clear
 * @property {() => Promise<string[]>} keys
 */

/**
 * Creates an abstract storage adapter
 * @param {Object} backend - Storage backend (localStorage, sessionStorage, etc.)
 * @returns {StorageAdapter}
 */
export function createStorageAdapter(backend) {
  return {
    /**
     * Get item from storage
     * @param {string} key
     * @returns {Promise<*|null>}
     */
    async get(key) {
      try {
        const raw = backend.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (error) {
        console.error(`[Storage] Failed to get "${key}":`, error);
        return null;
      }
    },

    /**
     * Set item in storage
     * @param {string} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    async set(key, value) {
      try {
        const serialized = JSON.stringify(value);
        backend.setItem(key, serialized);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error(`[Storage] Quota exceeded for "${key}"`);
          throw new StorageQuotaError(`Storage quota exceeded`);
        }
        console.error(`[Storage] Failed to set "${key}":`, error);
        throw error;
      }
    },

    /**
     * Remove item from storage
     * @param {string} key
     * @returns {Promise<void>}
     */
    async remove(key) {
      try {
        backend.removeItem(key);
      } catch (error) {
        console.error(`[Storage] Failed to remove "${key}":`, error);
        throw error;
      }
    },

    /**
     * Clear all items from storage
     * @returns {Promise<void>}
     */
    async clear() {
      try {
        backend.clear();
      } catch (error) {
        console.error('[Storage] Failed to clear:', error);
        throw error;
      }
    },

    /**
     * Get all keys from storage
     * @returns {Promise<string[]>}
     */
    async keys() {
      try {
        return Object.keys(backend);
      } catch (error) {
        console.error('[Storage] Failed to get keys:', error);
        return [];
      }
    }
  };
}

/**
 * Custom error for quota exceeded
 */
export class StorageQuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

/**
 * Check if storage is available
 * @param {string} type - 'localStorage' or 'sessionStorage'
 * @returns {boolean}
 */
export function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
