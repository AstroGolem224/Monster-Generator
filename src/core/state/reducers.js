import { ActionTypes } from './actions.js';
import { createPlacedItem } from '../entities/PlacedItem.js';

/**
 * @typedef {Object} MonsterGeneratorState
 * @property {Object} scene
 * @property {Array<import('../entities/PlacedItem').PlacedItem>} scene.placedItems
 * @property {string | null} scene.selectedItemId
 * @property {Object} ui
 * @property {string} ui.activeCategoryId
 * @property {Object.<string, boolean>} ui.panels
 * @property {string | null} ui.announcement
 * @property {number | null} ui.announcementTimestamp
 * @property {Object} presets
 * @property {Array<{ name: string, items: Array, createdAt: number, updatedAt?: number }>} presets.items
 * @property {Object} assets
 * @property {Object.<string, 'loading' | 'loaded' | 'error'>} assets.status
 * @property {Object.<string, HTMLImageElement>} assets.cache
 */

/**
 * Initial application state
 * @type {MonsterGeneratorState}
 */
export const initialState = {
  scene: {
    placedItems: [],
    selectedItemId: null
  },
  ui: {
    activeCategoryId: 'body',
    panels: {
      scaler: false,
      layers: true,
      share: true
    },
    announcement: null,
    announcementTimestamp: null
  },
  presets: {
    items: []
  },
  assets: {
    status: {},
    cache: {}
  }
};

/**
 * Root reducer that works with Immer
 * Each domain reducer directly mutates the draft
 * @param {MonsterGeneratorState} draft
 * @param {Object} action
 */
export function rootReducer(draft, action) {
  sceneReducer(draft.scene, action);
  uiReducer(draft.ui, action);
  presetsReducer(draft.presets, action);
  assetsReducer(draft.assets, action);
}

function sceneReducer(draft, action) {
  switch (action.type) {
    case ActionTypes.SCENE_ITEM_ADD: {
      const newItem = createPlacedItem(action.payload);
      draft.placedItems.push(newItem);
      draft.selectedItemId = newItem.id;
      break;
    }

    case ActionTypes.SCENE_ITEM_REMOVE: {
      const { id } = action.payload;
      const index = draft.placedItems.findIndex(item => item.id === id);
      if (index !== -1) {
        draft.placedItems.splice(index, 1);
      }
      if (draft.selectedItemId === id) {
        draft.selectedItemId = null;
      }
      break;
    }

    case ActionTypes.SCENE_ITEM_UPDATE: {
      const { id, updates } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        Object.assign(item, updates);
      }
      break;
    }

    case ActionTypes.SCENE_ITEM_RENAME: {
      const { id, label } = action.payload;
      const item = draft.placedItems.find(entry => entry.id === id);
      if (item) {
        item.label = (label || '').trim() || item.label;
      }
      break;
    }

    case ActionTypes.SCENE_ITEMS_REORDER: {
      const { orderedIds } = action.payload;
      if (!Array.isArray(orderedIds) || orderedIds.length !== draft.placedItems.length) {
        break;
      }
      const byId = new Map(draft.placedItems.map(item => [item.id, item]));
      const reordered = orderedIds.map(id => byId.get(id)).filter(Boolean);
      if (reordered.length === draft.placedItems.length) {
        draft.placedItems = reordered;
      }
      break;
    }

    case ActionTypes.SCENE_ITEM_SELECT: {
      draft.selectedItemId = action.payload.id;
      break;
    }

    case ActionTypes.SCENE_ITEM_MOVE: {
      const { id, position } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        item.x = Math.max(0, Math.min(1, position.x));
        item.y = Math.max(0, Math.min(1, position.y));
      }
      break;
    }

    case ActionTypes.TRANSFORM_SCALE: {
      const { id, scale } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        item.scale = Math.max(0.5, Math.min(4.0, scale));
      }
      break;
    }

    case ActionTypes.TRANSFORM_ROTATE: {
      const { id, rotation } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        item.rotation = ((rotation % 360) + 360) % 360;
      }
      break;
    }

    case ActionTypes.TRANSFORM_FLIP_H: {
      const { id } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        item.flipH = !item.flipH;
      }
      break;
    }

    case ActionTypes.TRANSFORM_FLIP_V: {
      const { id } = action.payload;
      const item = draft.placedItems.find(item => item.id === id);
      if (item) {
        item.flipV = !item.flipV;
      }
      break;
    }

    case ActionTypes.SCENE_CLEAR:
      draft.placedItems = [];
      draft.selectedItemId = null;
      break;

    case ActionTypes.SCENE_LOAD:
    case ActionTypes.PRESET_LOAD: {
      const { items } = action.payload;
      draft.placedItems = Array.isArray(items)
        ? items.map(item => createPlacedItem(item))
        : [];
      draft.selectedItemId = null;
      break;
    }
  }
}

function uiReducer(draft, action) {
  switch (action.type) {
    case ActionTypes.UI_CATEGORY_SELECT:
      draft.activeCategoryId = action.payload.categoryId;
      break;

    case ActionTypes.UI_PANEL_TOGGLE: {
      const { panelId, isOpen } = action.payload;
      draft.panels[panelId] = isOpen;
      break;
    }

    case ActionTypes.UI_ANNOUNCE: {
      const { message, timestamp } = action.payload;
      draft.announcement = message;
      draft.announcementTimestamp = timestamp;
      break;
    }

    case ActionTypes.SCENE_ITEM_SELECT:
      draft.panels.scaler = action.payload.id !== null;
      break;
  }
}

function presetsReducer(draft, action) {
  const MAX_PRESETS = 10;

  switch (action.type) {
    case ActionTypes.PRESET_SAVE: {
      const { name, items, createdAt } = action.payload;
      const existingIndex = draft.items.findIndex(p => p.name === name);
      const nextPreset = {
        name,
        items,
        createdAt,
        updatedAt: Date.now()
      };

      if (existingIndex >= 0) {
        draft.items[existingIndex] = {
          ...draft.items[existingIndex],
          ...nextPreset,
          createdAt: draft.items[existingIndex].createdAt ?? createdAt
        };
      } else {
        draft.items.push(nextPreset);
        if (draft.items.length > MAX_PRESETS) {
          draft.items.shift();
        }
      }
      break;
    }

    case ActionTypes.PRESET_RENAME: {
      const { oldName, newName } = action.payload;
      const preset = draft.items.find(item => item.name === oldName);
      if (preset) {
        preset.name = newName;
        preset.updatedAt = Date.now();
      }
      break;
    }

    case ActionTypes.PRESET_DELETE: {
      const { name } = action.payload;
      const index = draft.items.findIndex(p => p.name === name);
      if (index !== -1) {
        draft.items.splice(index, 1);
      }
      break;
    }
  }
}

function assetsReducer(draft, action) {
  switch (action.type) {
    case ActionTypes.ASSET_LOAD_START:
      draft.status[action.payload.url] = 'loading';
      break;

    case ActionTypes.ASSET_LOAD_SUCCESS: {
      const { url: successUrl, image } = action.payload;
      draft.status[successUrl] = 'loaded';
      draft.cache[successUrl] = image;
      break;
    }

    case ActionTypes.ASSET_LOAD_ERROR: {
      const { url: errorUrl } = action.payload;
      draft.status[errorUrl] = 'error';
      break;
    }
  }
}
