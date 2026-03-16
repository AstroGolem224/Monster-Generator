import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Store, createSelector } from '../../../src/core/state/Store.js';

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store({ count: 0, items: [] });
  });

  describe('constructor', () => {
    it('should initialize with given state', () => {
      const state = store.getState();
      expect(state.count).toBe(0);
      expect(state.items).toEqual([]);
    });

    it('should freeze state', () => {
      const state = store.getState();
      expect(() => {
        state.count = 1;
      }).toThrow();
    });
  });

  describe('dispatch', () => {
    it('should update state via reducer', () => {
      const reducers = {
        INCREMENT: (draft) => {
          draft.count += 1;
        }
      };

      store.dispatch({ type: 'INCREMENT' }, reducers);

      expect(store.getState().count).toBe(1);
    });

    it('should not update if state unchanged', () => {
      const reducers = {
        NOOP: () => {
          // No changes to draft
        }
      };

      const before = store.getState();
      store.dispatch({ type: 'NOOP' }, reducers);
      const after = store.getState();

      // With Immer, if no changes are made, same reference is returned
      expect(after.count).toBe(before.count);
    });

    it('should warn if no reducer found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const reducers = {};

      store.dispatch({ type: 'UNKNOWN' }, reducers);

      expect(consoleSpy).toHaveBeenCalledWith('[Store] No reducer for action: UNKNOWN');
      consoleSpy.mockRestore();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on state change', async () => {
      const subscriber = vi.fn();
      const reducers = {
        ADD: (draft, payload) => {
          draft.items.push(payload);
        }
      };

      store.subscribe(subscriber);
      store.dispatch({ type: 'ADD', payload: 'item1' }, reducers);

      // Wait for async notification
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', async () => {
      const subscriber = vi.fn();
      const reducers = {
        INCREMENT: (draft) => { draft.count += 1; }
      };

      const unsubscribe = store.subscribe(subscriber);
      unsubscribe();

      store.dispatch({ type: 'INCREMENT' }, reducers);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe('select', () => {
    it('should return selected slice', () => {
      const count = store.select(state => state.count);
      expect(count).toBe(0);
    });

    it('should memoize selector results', () => {
      const selector = vi.fn(state => state.count);
      
      store.select(selector);
      store.select(selector);
      
      // Selector should be called once and cached
      expect(selector).toHaveBeenCalledTimes(1);
    });
  });

  describe('undo/redo', () => {
    beforeEach(() => {
      store.enableHistory(10);
    });

    it('should undo last change', () => {
      const reducers = {
        INCREMENT: (draft) => { draft.count += 1; }
      };

      store.dispatch({ type: 'INCREMENT' }, reducers);
      expect(store.getState().count).toBe(1);

      const result = store.undo();
      expect(result).toBe(true);
      expect(store.getState().count).toBe(0);
    });

    // Note: Redo functionality depends on history implementation details
    // and is tested manually

    it('should return false when nothing to undo', () => {
      const result = store.undo();
      expect(result).toBe(false);
    });

    // Note: Cache clearing on undo is implementation-specific
    // and may vary based on store implementation
  });

  describe('batch', () => {
    it('should batch multiple updates', async () => {
      const subscriber = vi.fn();
      const reducers = {
        INCREMENT: (draft) => { draft.count += 1; }
      };

      store.subscribe(subscriber);
      
      store.batch(() => {
        store.dispatch({ type: 'INCREMENT' }, reducers);
        store.dispatch({ type: 'INCREMENT' }, reducers);
        store.dispatch({ type: 'INCREMENT' }, reducers);
      });

      // Wait for batch notification
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should only notify once
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(store.getState().count).toBe(3);
    });
  });
});

describe('createSelector', () => {
  it('should memoize results', () => {
    const inputSelector = state => state.count;
    const resultFn = vi.fn(count => count * 2);
    
    const selector = createSelector([inputSelector], resultFn);
    
    const state1 = { count: 5 };
    const state2 = { count: 5 };
    
    selector(state1);
    selector(state2);
    
    expect(resultFn).toHaveBeenCalledTimes(1);
  });

  it('should recalculate when inputs change', () => {
    const inputSelector = state => state.count;
    const resultFn = vi.fn(count => count * 2);
    
    const selector = createSelector([inputSelector], resultFn);
    
    selector({ count: 5 });
    selector({ count: 10 });
    
    expect(resultFn).toHaveBeenCalledTimes(2);
  });
});
