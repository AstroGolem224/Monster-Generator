/**
 * Scene Service - Business logic for scene management
 */

import { Actions, ActionTypes } from '../state/actions.js';
import { createPlacedItem, updatePlacedItem, clonePlacedItem } from '../entities/PlacedItem.js';
import { STORAGE_KEYS } from '../../config/constants.js';

export class SceneService {
  /**
   * @param {import('../state/Store').Store} store
   * @param {import('../../infrastructure/storage/StorageAdapter').StorageAdapter} storage
   */
  constructor(store, storage) {
    this._store = store;
    this._storage = storage;
    this._reducers = null; // Set by registerReducers
  }

  /**
   * Register reducers with the store
   * @param {Object} reducers
   */
  registerReducers(reducers) {
    this._reducers = reducers;
  }

  /**
   * Add a new item to the scene
   * @param {Object} partData
   * @param {{ x: number, y: number }} [position]
   * @returns {import('../entities/PlacedItem').PlacedItem}
   */
  addItem(partData, position) {
    const item = createPlacedItem({
      ...partData,
      x: position?.x ?? 0.5,
      y: position?.y ?? 0.5
    });

    this._dispatch(Actions.addItem(item));
    this._persist();
    
    return item;
  }

  /**
   * Remove an item from the scene
   * @param {string} itemId
   */
  removeItem(itemId) {
    this._dispatch(Actions.removeItem(itemId));
    this._persist();
  }

  /**
   * Move an item to a new position
   * @param {string} itemId
   * @param {{ x: number, y: number }} position
   */
  moveItem(itemId, position) {
    this._dispatch(Actions.moveItem(itemId, position));
    this._persist();
  }

  /**
   * Select an item
   * @param {string | null} itemId
   */
  selectItem(itemId) {
    this._dispatch(Actions.selectItem(itemId));
  }

  /**
   * Update item transforms
   * @param {string} itemId
   * @param {Object} transforms
   * @param {number} [transforms.scale]
   * @param {number} [transforms.rotation]
   * @param {boolean} [transforms.flipH]
   * @param {boolean} [transforms.flipV]
   */
  updateTransforms(itemId, transforms) {
    if (transforms.scale !== undefined) {
      this._dispatch(Actions.setScale(itemId, transforms.scale));
    }
    if (transforms.rotation !== undefined) {
      this._dispatch(Actions.setRotation(itemId, transforms.rotation));
    }
    if (transforms.flipH !== undefined) {
      if (transforms.flipH !== this._getItem(itemId)?.flipH) {
        this._dispatch(Actions.toggleFlipH(itemId));
      }
    }
    if (transforms.flipV !== undefined) {
      if (transforms.flipV !== this._getItem(itemId)?.flipV) {
        this._dispatch(Actions.toggleFlipV(itemId));
      }
    }
    this._persist();
  }

  /**
   * Toggle horizontal flip
   * @param {string} itemId
   */
  toggleFlipH(itemId) {
    this._dispatch(Actions.toggleFlipH(itemId));
    this._persist();
  }

  /**
   * Toggle vertical flip
   * @param {string} itemId
   */
  toggleFlipV(itemId) {
    this._dispatch(Actions.toggleFlipV(itemId));
    this._persist();
  }

  /**
   * Clear the entire scene
   */
  clear() {
    this._dispatch(Actions.clearScene());
    this._persist();
  }

  /**
   * Load scene from storage
   * @returns {Promise<boolean>}
   */
  async loadFromStorage() {
    try {
      const data = await this._storage.get(STORAGE_KEYS.SCENE);
      if (data && Array.isArray(data.items)) {
        this._dispatch(Actions.loadScene(data.items));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SceneService] Failed to load:', error);
      return false;
    }
  }

  /**
   * Save scene to storage
   * @returns {Promise<void>}
   */
  async saveToStorage() {
    return this._persist();
  }

  /**
   * Get currently selected item
   * @returns {import('../entities/PlacedItem').PlacedItem | null}
   */
  getSelectedItem() {
    const selectedId = this._store.select(state => state.scene.selectedItemId);
    if (!selectedId) return null;
    return this._getItem(selectedId);
  }

  /**
   * Get all placed items
   * @returns {Array<import('../entities/PlacedItem').PlacedItem>}
   */
  getAllItems() {
    return this._store.select(state => state.scene.placedItems);
  }

  /**
   * Check if item exists
   * @param {string} itemId
   * @returns {boolean}
   */
  hasItem(itemId) {
    return this._getItem(itemId) !== undefined;
  }

  /**
   * Clone an existing item
   * @param {string} itemId
   * @param {{ x?: number, y?: number }} [offset]
   * @returns {import('../entities/PlacedItem').PlacedItem | null}
   */
  cloneItem(itemId, offset = { x: 0.05, y: 0.05 }) {
    const item = this._getItem(itemId);
    if (!item) return null;

    const cloned = clonePlacedItem(item, {
      x: Math.min(1, item.x + offset.x),
      y: Math.min(1, item.y + offset.y)
    });

    this._dispatch(Actions.addItem(cloned));
    this._persist();
    
    return cloned;
  }

  // Private methods

  _dispatch(action) {
    if (!this._reducers) {
      throw new Error('[SceneService] Reducers not registered');
    }
    this._store.dispatch(action, this._reducers);
  }

  _getItem(itemId) {
    return this._store.select(state => 
      state.scene.placedItems.find(item => item.id === itemId)
    );
  }

  async _persist() {
    try {
      const items = this._store.select(state => state.scene.placedItems);
      await this._storage.set(STORAGE_KEYS.SCENE, { items });
    } catch (error) {
      console.error('[SceneService] Failed to persist:', error);
    }
  }
}
