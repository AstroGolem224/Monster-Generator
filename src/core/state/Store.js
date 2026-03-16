/**
 * Central State Store with Observable Pattern
 * Implements unidirectional data flow with Immer for structural sharing
 * @template T
 */

import { produce, current, isDraft } from 'immer';

/**
 * Shallow equality check for objects/arrays
 * Much faster than JSON.stringify for simple comparisons
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) {
      return false;
    }
  }
  
  return true;
}

export class Store {
  /**
   * @param {T} initialState
   */
  constructor(initialState = {}) {
    /** @type {T} */
    this._state = Object.freeze(initialState);
    /** @type {Set<(state: T, prevState: T) => void>} */
    this._subscribers = new Set();
    /** @type {Array<{ state: T, timestamp: number }>} */
    this._history = [];
    /** @type {number} */
    this._historyPosition = -1;
    /** @type {boolean} */
    this._isBatching = false;
    /** @type {Array<() => void>} */
    this._batchQueue = [];
    /** @type {Map<string, *>} */
    this._selectorCache = new Map();
    /** @type {Map<string, number>} */
    this._selectorCacheHits = new Map();
  }

  /**
   * Get current state (immutable)
   * @returns {T}
   */
  getState() {
    return this._state;
  }

  /**
   * Subscribe to state changes
   * @param {(state: T, prevState: T) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  subscribe(callback) {
    this._subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }

  /**
   * Dispatch action to update state using Immer for structural sharing
   * @param {Object} action
   * @param {string} action.type
   * @param {*} [action.payload]
   * @param {Object.<string, (draft: T, payload: *) => void>} reducers
   */
  dispatch(action, reducers) {
    const prevState = this._state;
    const reducer = reducers[action.type];
    
    if (!reducer) {
      console.warn(`[Store] No reducer for action: ${action.type}`);
      return;
    }

    // Use Immer for immutable updates with structural sharing
    const newState = produce(prevState, (draft) => {
      reducer(draft, action.payload);
    });
    
    // Only update if state actually changed (shallow check first)
    if (!this._isEqual(prevState, newState)) {
      this._state = Object.freeze(newState);
      this._notify(prevState);
      this._addToHistory(prevState);
      
      // Clear selector cache on state change
      this._selectorCache.clear();
    }
  }

  /**
   * Batch multiple state updates into single notification
   * @param {() => void} callback
   */
  batch(callback) {
    this._isBatching = true;
    try {
      callback();
    } finally {
      this._isBatching = false;
      this._notify(this._state);
    }
  }

  /**
   * Select a slice of state with memoization
   * @template K
   * @param {(state: T) => K} selector
   * @returns {K}
   */
  select(selector) {
    // Create cache key from selector function string
    const cacheKey = selector.toString();
    
    // Check cache first
    if (this._selectorCache.has(cacheKey)) {
      this._selectorCacheHits.set(cacheKey, (this._selectorCacheHits.get(cacheKey) || 0) + 1);
      return this._selectorCache.get(cacheKey);
    }
    
    // Compute and cache result
    const result = selector(this._state);
    this._selectorCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get selector cache statistics
   * @returns {{ size: number, hits: Object.<string, number> }}
   */
  getSelectorStats() {
    const hits = {};
    this._selectorCacheHits.forEach((count, key) => {
      // Truncate key for readability
      const shortKey = key.substring(0, 50) + '...';
      hits[shortKey] = count;
    });
    return {
      size: this._selectorCache.size,
      hits
    };
  }

  /**
   * Enable history tracking for undo/redo
   * @param {number} maxHistory - Maximum history entries (default: 50)
   */
  enableHistory(maxHistory = 50) {
    this._maxHistory = maxHistory;
    this._addToHistory(this._state);
  }

  /**
   * Undo last state change
   * @returns {boolean} Success
   */
  undo() {
    if (this._historyPosition <= 0) return false;
    
    const prevState = this._state;
    this._historyPosition--;
    const historyEntry = this._history[this._historyPosition];
    this._state = Object.freeze(historyEntry.state);
    this._notify(prevState);
    this._selectorCache.clear();
    return true;
  }

  /**
   * Redo previously undone state change
   * @returns {boolean} Success
   */
  redo() {
    if (this._historyPosition >= this._history.length - 1) return false;
    
    const prevState = this._state;
    this._historyPosition++;
    const historyEntry = this._history[this._historyPosition];
    this._state = Object.freeze(historyEntry.state);
    this._notify(prevState);
    this._selectorCache.clear();
    return true;
  }

  /**
   * @private
   * @param {T} prevState
   */
  _notify(prevState) {
    if (this._isBatching) return;
    
    // Use setTimeout(0) to batch notifications and prevent stack overflow
    if (this._notificationScheduled) return;
    this._notificationScheduled = true;
    
    Promise.resolve().then(() => {
      this._notificationScheduled = false;
      this._subscribers.forEach(callback => {
        try {
          callback(this._state, prevState);
        } catch (error) {
          console.error('[Store] Subscriber error:', error);
        }
      });
    });
  }

  /**
   * @private
   * @param {T} state
   */
  _addToHistory(state) {
    if (!this._maxHistory) return;
    
    // Remove future history if we're not at the end
    if (this._historyPosition < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyPosition + 1);
    }
    
    // Store reference (state is already immutable)
    this._history.push({
      state: state,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._historyPosition++;
    }
  }

  /**
   * Fast equality check using shallow comparison first
   * @private
   * @param {*} a
   * @param {*} b
   * @returns {boolean}
   */
  _isEqual(a, b) {
    // Fast path: reference equality
    if (a === b) return true;
    
    // Shallow comparison for objects/arrays
    if (typeof a === 'object' && typeof b === 'object') {
      return shallowEqual(a, b);
    }
    
    return false;
  }
}

/**
 * Create a memoized selector
 * Usage: const selectItems = createSelector(
 *   [state => state.scene.placedItems],
 *   (items) => items
 * );
 * 
 * @template T, R
 * @param {Array<(state: T) => *>} inputSelectors
 * @param {(...args: Array<*>) => R} resultFn
 * @returns {(state: T) => R}
 */
export function createSelector(inputSelectors, resultFn) {
  let lastArgs = [];
  let lastResult;
  let hasCache = false;
  
  return (state) => {
    const args = inputSelectors.map(selector => selector(state));
    
    // Check if inputs changed (shallow comparison)
    const inputsChanged = !hasCache || args.length !== lastArgs.length || 
      args.some((arg, index) => arg !== lastArgs[index]);
    
    if (inputsChanged) {
      lastArgs = args;
      lastResult = resultFn(...args);
      hasCache = true;
    }
    
    return lastResult;
  };
}

/**
 * Create a derived store that selects a slice of parent state
 * @template T, K
 * @param {Store<T>} parentStore
 * @param {(state: T) => K} selector
 * @returns {Store<K>}
 */
export function createDerivedStore(parentStore, selector) {
  const initialSlice = selector(parentStore.getState());
  const derivedStore = new Store(initialSlice);
  
  let lastSelectedState = initialSlice;
  
  parentStore.subscribe((newState) => {
    const newSlice = selector(newState);
    
    // Only update if selected slice actually changed
    if (newSlice !== lastSelectedState) {
      lastSelectedState = newSlice;
      derivedStore._state = Object.freeze(newSlice);
      derivedStore._notify(derivedStore._state);
    }
  });
  
  return derivedStore;
}
