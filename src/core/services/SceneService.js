/**
 * Scene Service - Business logic for scene management
 */

import { Actions } from '../state/actions.js';
import { createPlacedItem, clonePlacedItem } from '../entities/PlacedItem.js';
import { STORAGE_KEYS } from '../../config/constants.js';

export class SceneService {
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

  removeItem(itemId) {
    this._dispatch(Actions.removeItem(itemId));
    this._persist();
  }

  moveItem(itemId, position) {
    this._dispatch(Actions.moveItem(itemId, position));
    this._persist();
  }

  selectItem(itemId) {
    this._dispatch(Actions.selectItem(itemId));
  }

  renameItem(itemId, label) {
    this._dispatch(Actions.renameItem(itemId, label));
    this._persist();
  }

  reorderItems(orderedIds) {
    this._dispatch(Actions.reorderItems(orderedIds));
    this._persist();
  }

  moveItemLayer(itemId, direction) {
    const items = [...this.getAllItems()];
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    let targetIndex = index;
    switch (direction) {
      case 'front':
        targetIndex = Math.min(items.length - 1, index + 1);
        break;
      case 'back':
        targetIndex = Math.max(0, index - 1);
        break;
      case 'top':
        targetIndex = items.length - 1;
        break;
      case 'bottom':
        targetIndex = 0;
        break;
      default:
        return false;
    }

    if (targetIndex === index) return false;

    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    this.reorderItems(items.map(item => item.id));
    return true;
  }

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

  toggleFlipH(itemId) {
    this._dispatch(Actions.toggleFlipH(itemId));
    this._persist();
  }

  toggleFlipV(itemId) {
    this._dispatch(Actions.toggleFlipV(itemId));
    this._persist();
  }

  clear() {
    this._dispatch(Actions.clearScene());
    this._persist();
  }

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

  async saveToStorage() {
    return this._persist();
  }

  getSelectedItem() {
    const selectedId = this._store.select(state => state.scene.selectedItemId);
    if (!selectedId) return null;
    return this._getItem(selectedId);
  }

  getAllItems() {
    return this._store.select(state => state.scene.placedItems);
  }

  hasItem(itemId) {
    return this._getItem(itemId) !== undefined;
  }

  cloneItem(itemId, offset = { x: 0.05, y: 0.05 }) {
    const item = this._getItem(itemId);
    if (!item) return null;

    const cloned = clonePlacedItem(item, {
      x: Math.min(1, item.x + offset.x),
      y: Math.min(1, item.y + offset.y),
      label: `${item.label || 'Teil'} Kopie`
    });

    this._dispatch(Actions.addItem(cloned));
    this._persist();
    return cloned;
  }

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
