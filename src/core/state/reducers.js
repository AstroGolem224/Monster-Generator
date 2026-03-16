import { ActionTypes } from './actions.js';
import { createPlacedItem, updatePlacedItem } from '../entities/PlacedItem.js';

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
 * @property {Array<{ name: string, items: Array, createdAt: number }>} presets.items
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
      scaler: false
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
 * Root reducer combining all domain reducers
 * @param {MonsterGeneratorState} state
 * @param {Object} action
 * @returns {MonsterGeneratorState}
 */
export function rootReducer(state = initialState, action) {
  return {
    scene: sceneReducer(state.scene, action),
    ui: uiReducer(state.ui, action),
    presets: presetsReducer(state.presets, action),
    assets: assetsReducer(state.assets, action)
  };
}

/**
 * Scene domain reducer
 * @param {MonsterGeneratorState['scene']} state
 * @param {Object} action
 * @returns {MonsterGeneratorState['scene']}
 */
function sceneReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SCENE_ITEM_ADD: {
      const newItem = createPlacedItem(action.payload);
      return {
        ...state,
        placedItems: [...state.placedItems, newItem],
        selectedItemId: newItem.id
      };
    }

    case ActionTypes.SCENE_ITEM_REMOVE: {
      const { id } = action.payload;
      return {
        ...state,
        placedItems: state.placedItems.filter(item => item.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId
      };
    }

    case ActionTypes.SCENE_ITEM_UPDATE: {
      const { id, updates } = action.payload;
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id ? updatePlacedItem(item, updates) : item
        )
      };
    }

    case ActionTypes.SCENE_ITEM_SELECT: {
      return {
        ...state,
        selectedItemId: action.payload.id
      };
    }

    case ActionTypes.SCENE_ITEM_MOVE: {
      const { id, position } = action.payload;
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id 
            ? updatePlacedItem(item, { 
                x: Math.max(0, Math.min(1, position.x)),
                y: Math.max(0, Math.min(1, position.y))
              })
            : item
        )
      };
    }

    case ActionTypes.TRANSFORM_SCALE: {
      const { id, scale } = action.payload;
      const clampedScale = Math.max(0.5, Math.min(4.0, scale));
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id ? updatePlacedItem(item, { scale: clampedScale }) : item
        )
      };
    }

    case ActionTypes.TRANSFORM_ROTATE: {
      const { id, rotation } = action.payload;
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id ? updatePlacedItem(item, { rotation: normalizedRotation }) : item
        )
      };
    }

    case ActionTypes.TRANSFORM_FLIP_H: {
      const { id } = action.payload;
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id ? updatePlacedItem(item, { flipH: !item.flipH }) : item
        )
      };
    }

    case ActionTypes.TRANSFORM_FLIP_V: {
      const { id } = action.payload;
      return {
        ...state,
        placedItems: state.placedItems.map(item =>
          item.id === id ? updatePlacedItem(item, { flipV: !item.flipV }) : item
        )
      };
    }

    case ActionTypes.SCENE_CLEAR:
      return {
        ...state,
        placedItems: [],
        selectedItemId: null
      };

    case ActionTypes.SCENE_LOAD:
    case ActionTypes.PRESET_LOAD:
      const { items } = action.payload;
      return {
        ...state,
        placedItems: Array.isArray(items) ? items.map(item => createPlacedItem(item)) : [],
        selectedItemId: null
      };

    default:
      return state;
  }
}

/**
 * UI domain reducer
 * @param {MonsterGeneratorState['ui']} state
 * @param {Object} action
 * @returns {MonsterGeneratorState['ui']}
 */
function uiReducer(state, action) {
  switch (action.type) {
    case ActionTypes.UI_CATEGORY_SELECT:
      return {
        ...state,
        activeCategoryId: action.payload.categoryId
      };

    case ActionTypes.UI_PANEL_TOGGLE:
      const { panelId, isOpen } = action.payload;
      return {
        ...state,
        panels: {
          ...state.panels,
          [panelId]: isOpen
        }
      };

    case ActionTypes.UI_ANNOUNCE:
      const { message, timestamp } = action.payload;
      return {
        ...state,
        announcement: message,
        announcementTimestamp: timestamp
      };

    case ActionTypes.SCENE_ITEM_SELECT:
      return {
        ...state,
        panels: {
          ...state.panels,
          scaler: action.payload.id !== null
        }
      };

    default:
      return state;
  }
}

/**
 * Presets domain reducer
 * @param {MonsterGeneratorState['presets']} state
 * @param {Object} action
 * @returns {MonsterGeneratorState['presets']}
 */
function presetsReducer(state, action) {
  const MAX_PRESETS = 10;

  switch (action.type) {
    case ActionTypes.PRESET_SAVE: {
      const { name, items, createdAt } = action.payload;
      const existingIndex = state.items.findIndex(p => p.name === name);
      
      let newItems;
      if (existingIndex >= 0) {
        // Update existing
        newItems = state.items.map((p, i) => 
          i === existingIndex ? { name, items, createdAt } : p
        );
      } else {
        // Add new, limit to MAX_PRESETS
        newItems = [...state.items, { name, items, createdAt }];
        if (newItems.length > MAX_PRESETS) {
          newItems = newItems.slice(newItems.length - MAX_PRESETS);
        }
      }
      
      return {
        ...state,
        items: newItems
      };
    }

    case ActionTypes.PRESET_DELETE: {
      const { name } = action.payload;
      return {
        ...state,
        items: state.items.filter(p => p.name !== name)
      };
    }

    default:
      return state;
  }
}

/**
 * Assets domain reducer
 * @param {MonsterGeneratorState['assets']} state
 * @param {Object} action
 * @returns {MonsterGeneratorState['assets']}
 */
function assetsReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ASSET_LOAD_START:
      return {
        ...state,
        status: {
          ...state.status,
          [action.payload.url]: 'loading'
        }
      };

    case ActionTypes.ASSET_LOAD_SUCCESS:
      const { url: successUrl, image } = action.payload;
      return {
        ...state,
        status: {
          ...state.status,
          [successUrl]: 'loaded'
        },
        cache: {
          ...state.cache,
          [successUrl]: image
        }
      };

    case ActionTypes.ASSET_LOAD_ERROR:
      const { url: errorUrl } = action.payload;
      return {
        ...state,
        status: {
          ...state.status,
          [errorUrl]: 'error'
        }
      };

    default:
      return state;
  }
}
