import { createStorageAdapter, isStorageAvailable } from './StorageAdapter.js';

/**
 * Storage keys used by the application
 */
export const StorageKeys = {
  SCENE: 'monster-generator:scene',
  PRESETS: 'monster-generator:presets',
  SETTINGS: 'monster-generator:settings',
  ASSET_CACHE: 'monster-generator:asset-cache'
};

/**
 * Create localStorage adapter
 * Falls back to memory storage if localStorage is not available
 * @returns {import('./StorageAdapter').StorageAdapter}
 */
export function createLocalStorageAdapter() {
  if (typeof window === 'undefined') {
    // Server-side: use memory storage
    return createMemoryStorageAdapter();
  }

  if (!isStorageAvailable('localStorage')) {
    console.warn('[LocalStorageAdapter] localStorage not available, using memory fallback');
    return createMemoryStorageAdapter();
  }

  return createStorageAdapter(window.localStorage);
}

/**
 * Create sessionStorage adapter
 * @returns {import('./StorageAdapter').StorageAdapter}
 */
export function createSessionStorageAdapter() {
  if (typeof window === 'undefined') {
    return createMemoryStorageAdapter();
  }

  if (!isStorageAvailable('sessionStorage')) {
    console.warn('[SessionStorageAdapter] sessionStorage not available, using memory fallback');
    return createMemoryStorageAdapter();
  }

  return createStorageAdapter(window.sessionStorage);
}

/**
 * Create in-memory storage adapter (fallback)
 * @returns {import('./StorageAdapter').StorageAdapter}
 */
export function createMemoryStorageAdapter() {
  const memory = new Map();

  return {
    async get(key) {
      const value = memory.get(key);
      return value !== undefined ? JSON.parse(JSON.stringify(value)) : null;
    },

    async set(key, value) {
      memory.set(key, JSON.parse(JSON.stringify(value)));
    },

    async remove(key) {
      memory.delete(key);
    },

    async clear() {
      memory.clear();
    },

    async keys() {
      return Array.from(memory.keys());
    }
  };
}

// Export singleton instance
export const localStorageAdapter = createLocalStorageAdapter();
export const sessionStorageAdapter = createSessionStorageAdapter();
