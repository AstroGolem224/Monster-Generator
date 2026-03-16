/**
 * Action Types for Monster Generator
 * Naming convention: DOMAIN:ENTITY:ACTION
 */
export const ActionTypes = {
  // Scene Actions
  SCENE_ITEM_ADD: 'scene:item:add',
  SCENE_ITEM_REMOVE: 'scene:item:remove',
  SCENE_ITEM_UPDATE: 'scene:item:update',
  SCENE_ITEM_SELECT: 'scene:item:select',
  SCENE_ITEM_MOVE: 'scene:item:move',
  SCENE_CLEAR: 'scene:clear',
  SCENE_LOAD: 'scene:load',
  
  // Transform Actions
  TRANSFORM_SCALE: 'transform:scale',
  TRANSFORM_ROTATE: 'transform:rotate',
  TRANSFORM_FLIP_H: 'transform:flip:h',
  TRANSFORM_FLIP_V: 'transform:flip:v',
  
  // UI Actions
  UI_CATEGORY_SELECT: 'ui:category:select',
  UI_PANEL_TOGGLE: 'ui:panel:toggle',
  UI_ANNOUNCE: 'ui:announce',
  
  // Preset Actions
  PRESET_SAVE: 'preset:save',
  PRESET_LOAD: 'preset:load',
  PRESET_DELETE: 'preset:delete',
  
  // Asset Actions
  ASSET_LOAD_START: 'asset:load:start',
  ASSET_LOAD_SUCCESS: 'asset:load:success',
  ASSET_LOAD_ERROR: 'asset:load:error',
};

/**
 * Action Creators
 */
export const Actions = {
  // Scene Actions
  /** @param {import('../entities/PlacedItem').PlacedItem} item */
  addItem: (item) => ({
    type: ActionTypes.SCENE_ITEM_ADD,
    payload: item
  }),

  /** @param {string} itemId */
  removeItem: (itemId) => ({
    type: ActionTypes.SCENE_ITEM_REMOVE,
    payload: { id: itemId }
  }),

  /** 
   * @param {string} itemId 
   * @param {Partial<import('../entities/PlacedItem').PlacedItem>} updates 
   */
  updateItem: (itemId, updates) => ({
    type: ActionTypes.SCENE_ITEM_UPDATE,
    payload: { id: itemId, updates }
  }),

  /** @param {string | null} itemId */
  selectItem: (itemId) => ({
    type: ActionTypes.SCENE_ITEM_SELECT,
    payload: { id: itemId }
  }),

  /** 
   * @param {string} itemId 
   * @param {{ x: number, y: number }} position 
   */
  moveItem: (itemId, position) => ({
    type: ActionTypes.SCENE_ITEM_MOVE,
    payload: { id: itemId, position }
  }),

  clearScene: () => ({
    type: ActionTypes.SCENE_CLEAR
  }),

  /** @param {Array<import('../entities/PlacedItem').PlacedItem>} items */
  loadScene: (items) => ({
    type: ActionTypes.SCENE_LOAD,
    payload: { items }
  }),

  // Transform Actions
  /**
   * @param {string} itemId
   * @param {number} scale - 0.5 to 4.0
   */
  setScale: (itemId, scale) => ({
    type: ActionTypes.TRANSFORM_SCALE,
    payload: { id: itemId, scale }
  }),

  /**
   * @param {string} itemId
   * @param {number} rotation - 0 to 360 degrees
   */
  setRotation: (itemId, rotation) => ({
    type: ActionTypes.TRANSFORM_ROTATE,
    payload: { id: itemId, rotation }
  }),

  /** @param {string} itemId */
  toggleFlipH: (itemId) => ({
    type: ActionTypes.TRANSFORM_FLIP_H,
    payload: { id: itemId }
  }),

  /** @param {string} itemId */
  toggleFlipV: (itemId) => ({
    type: ActionTypes.TRANSFORM_FLIP_V,
    payload: { id: itemId }
  }),

  // UI Actions
  /** @param {string} categoryId */
  selectCategory: (categoryId) => ({
    type: ActionTypes.UI_CATEGORY_SELECT,
    payload: { categoryId }
  }),

  /**
   * @param {string} panelId
   * @param {boolean} isOpen
   */
  togglePanel: (panelId, isOpen) => ({
    type: ActionTypes.UI_PANEL_TOGGLE,
    payload: { panelId, isOpen }
  }),

  /** @param {string} message */
  announce: (message) => ({
    type: ActionTypes.UI_ANNOUNCE,
    payload: { message, timestamp: Date.now() }
  }),

  // Preset Actions
  /**
   * @param {string} name
   * @param {Array<import('../entities/PlacedItem').PlacedItem>} items
   */
  savePreset: (name, items) => ({
    type: ActionTypes.PRESET_SAVE,
    payload: { name, items, createdAt: Date.now() }
  }),

  /**
   * @param {string} name
   * @param {Array<import('../entities/PlacedItem').PlacedItem>} items
   */
  loadPreset: (name, items) => ({
    type: ActionTypes.PRESET_LOAD,
    payload: { name, items }
  }),

  /** @param {string} name */
  deletePreset: (name) => ({
    type: ActionTypes.PRESET_DELETE,
    payload: { name }
  }),

  // Asset Actions
  /** @param {string} url */
  assetLoadStart: (url) => ({
    type: ActionTypes.ASSET_LOAD_START,
    payload: { url, timestamp: Date.now() }
  }),

  /**
   * @param {string} url
   * @param {HTMLImageElement} image
   */
  assetLoadSuccess: (url, image) => ({
    type: ActionTypes.ASSET_LOAD_SUCCESS,
    payload: { url, image, timestamp: Date.now() }
  }),

  /**
   * @param {string} url
   * @param {Error} error
   */
  assetLoadError: (url, error) => ({
    type: ActionTypes.ASSET_LOAD_ERROR,
    payload: { url, error: error.message, timestamp: Date.now() }
  }),
};
