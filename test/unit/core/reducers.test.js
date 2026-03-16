import { describe, it, expect } from 'vitest';
import { rootReducer, initialState } from '../../../src/core/state/reducers.js';
import { ActionTypes } from '../../../src/core/state/actions.js';
import { produce } from 'immer';

describe('Reducers', () => {
  const runReducer = (state, action) => {
    return produce(state, draft => {
      rootReducer(draft, action);
    });
  };

  describe('Scene Reducer', () => {
    it('should handle SCENE_ITEM_ADD', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: {
          categoryId: 'body',
          partId: 1,
          assetUrl: '/test.png',
          color: '#fff',
          x: 0.5,
          y: 0.5
        }
      });

      expect(state.scene.placedItems).toHaveLength(1);
      expect(state.scene.selectedItemId).toBeDefined();
    });

    it('should handle SCENE_ITEM_REMOVE', () => {
      // First add an item
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      // Then remove it
      state = runReducer(state, {
        type: ActionTypes.SCENE_ITEM_REMOVE,
        payload: { id: itemId }
      });

      expect(state.scene.placedItems).toHaveLength(0);
    });

    it('should handle SCENE_ITEM_SELECT', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_SELECT,
        payload: { id: 'test-id' }
      });

      expect(state.scene.selectedItemId).toBe('test-id');
      expect(state.ui.panels.scaler).toBe(true);
    });

    it('should handle SCENE_CLEAR', () => {
      // Add items first
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      // Clear scene
      state = runReducer(state, {
        type: ActionTypes.SCENE_CLEAR
      });

      expect(state.scene.placedItems).toHaveLength(0);
      expect(state.scene.selectedItemId).toBeNull();
    });

    it('should handle TRANSFORM_SCALE', () => {
      // Add item first
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      // Scale it
      state = runReducer(state, {
        type: ActionTypes.TRANSFORM_SCALE,
        payload: { id: itemId, scale: 2.5 }
      });

      expect(state.scene.placedItems[0].scale).toBe(2.5);
    });

    it('should clamp scale to max 4.0', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      state = runReducer(state, {
        type: ActionTypes.TRANSFORM_SCALE,
        payload: { id: itemId, scale: 10 }
      });

      expect(state.scene.placedItems[0].scale).toBe(4.0);
    });

    it('should handle TRANSFORM_ROTATE', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      state = runReducer(state, {
        type: ActionTypes.TRANSFORM_ROTATE,
        payload: { id: itemId, rotation: 180 }
      });

      expect(state.scene.placedItems[0].rotation).toBe(180);
    });

    it('should normalize rotation', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      state = runReducer(state, {
        type: ActionTypes.TRANSFORM_ROTATE,
        payload: { id: itemId, rotation: 400 }
      });

      expect(state.scene.placedItems[0].rotation).toBe(40);
    });

    it('should handle TRANSFORM_FLIP_H', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.SCENE_ITEM_ADD,
        payload: { categoryId: 'body', partId: 1, assetUrl: '/test.png', color: '#fff', x: 0.5, y: 0.5 }
      });
      
      const itemId = state.scene.placedItems[0].id;
      
      state = runReducer(state, {
        type: ActionTypes.TRANSFORM_FLIP_H,
        payload: { id: itemId }
      });

      expect(state.scene.placedItems[0].flipH).toBe(true);
    });
  });

  describe('UI Reducer', () => {
    it('should handle UI_CATEGORY_SELECT', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.UI_CATEGORY_SELECT,
        payload: { categoryId: 'head' }
      });

      expect(state.ui.activeCategoryId).toBe('head');
    });

    it('should handle UI_ANNOUNCE', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.UI_ANNOUNCE,
        payload: { message: 'Test message', timestamp: 12345 }
      });

      expect(state.ui.announcement).toBe('Test message');
      expect(state.ui.announcementTimestamp).toBe(12345);
    });

    it('should handle UI_PANEL_TOGGLE', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.UI_PANEL_TOGGLE,
        payload: { panelId: 'testPanel', isOpen: true }
      });

      expect(state.ui.panels.testPanel).toBe(true);
    });
  });

  describe('Presets Reducer', () => {
    it('should handle PRESET_SAVE', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.PRESET_SAVE,
        payload: { name: 'MyPreset', items: [], createdAt: Date.now() }
      });

      expect(state.presets.items).toHaveLength(1);
      expect(state.presets.items[0].name).toBe('MyPreset');
    });

    it('should update existing preset', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.PRESET_SAVE,
        payload: { name: 'MyPreset', items: [], createdAt: 1000 }
      });
      
      state = runReducer(state, {
        type: ActionTypes.PRESET_SAVE,
        payload: { name: 'MyPreset', items: [{ id: 1 }], createdAt: 2000 }
      });

      expect(state.presets.items).toHaveLength(1);
      expect(state.presets.items[0].items).toHaveLength(1);
    });

    it('should limit to 10 presets', () => {
      let state = initialState;
      for (let i = 0; i < 12; i++) {
        state = runReducer(state, {
          type: ActionTypes.PRESET_SAVE,
          payload: { name: `Preset${i}`, items: [], createdAt: Date.now() }
        });
      }

      expect(state.presets.items).toHaveLength(10);
    });

    it('should handle PRESET_DELETE', () => {
      let state = runReducer(initialState, {
        type: ActionTypes.PRESET_SAVE,
        payload: { name: 'ToDelete', items: [], createdAt: Date.now() }
      });
      
      state = runReducer(state, {
        type: ActionTypes.PRESET_DELETE,
        payload: { name: 'ToDelete' }
      });

      expect(state.presets.items).toHaveLength(0);
    });
  });

  describe('Assets Reducer', () => {
    it('should handle ASSET_LOAD_START', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.ASSET_LOAD_START,
        payload: { url: '/test.png' }
      });

      expect(state.assets.status['/test.png']).toBe('loading');
    });

    it('should handle ASSET_LOAD_SUCCESS', () => {
      const mockImage = { src: '/test.png' };
      const state = runReducer(initialState, {
        type: ActionTypes.ASSET_LOAD_SUCCESS,
        payload: { url: '/test.png', image: mockImage }
      });

      expect(state.assets.status['/test.png']).toBe('loaded');
      expect(state.assets.cache['/test.png']).toBe(mockImage);
    });

    it('should handle ASSET_LOAD_ERROR', () => {
      const state = runReducer(initialState, {
        type: ActionTypes.ASSET_LOAD_ERROR,
        payload: { url: '/test.png' }
      });

      expect(state.assets.status['/test.png']).toBe('error');
    });
  });
});
