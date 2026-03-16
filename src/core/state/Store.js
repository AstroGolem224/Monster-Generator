/**
 * Central State Store with Observable Pattern
 * Implements unidirectional data flow
 * @template T
 */
export class Store {
  /**
   * @param {T} initialState
   */
  constructor(initialState = {}) {
    /** @type {T} */
    this._state = Object.freeze(this._deepClone(initialState));
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
    return () => this._subscribers.delete(callback);
  }

  /**
   * Dispatch action to update state
   * @param {Object} action
   * @param {string} action.type
   * @param {*} [action.payload]
   * @param {Object.<string, (state: T, payload: *) => T>} reducers
   */
  dispatch(action, reducers) {
    const prevState = this._state;
    const reducer = reducers[action.type];
    
    if (!reducer) {
      console.warn(`[Store] No reducer for action: ${action.type}`);
      return;
    }

    const newState = reducer(prevState, action.payload);
    
    // Only update if state actually changed
    if (!this._isEqual(prevState, newState)) {
      this._state = Object.freeze(this._deepClone(newState));
      this._notify(prevState);
      this._addToHistory(prevState);
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
      // Notify subscribers once after batch
      this._notify(this._state);
    }
  }

  /**
   * Select a slice of state
   * @template K
   * @param {(state: T) => K} selector
   * @returns {K}
   */
  select(selector) {
    return selector(this._state);
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
    
    this._historyPosition--;
    const historyEntry = this._history[this._historyPosition];
    this._state = Object.freeze(this._deepClone(historyEntry.state));
    this._notify(this._state);
    return true;
  }

  /**
   * Redo previously undone state change
   * @returns {boolean} Success
   */
  redo() {
    if (this._historyPosition >= this._history.length - 1) return false;
    
    this._historyPosition++;
    const historyEntry = this._history[this._historyPosition];
    this._state = Object.freeze(this._deepClone(historyEntry.state));
    this._notify(this._state);
    return true;
  }

  /**
   * @private
   * @param {T} prevState
   */
  _notify(prevState) {
    if (this._isBatching) return;
    
    this._subscribers.forEach(callback => {
      try {
        callback(this._state, prevState);
      } catch (error) {
        console.error('[Store] Subscriber error:', error);
      }
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
    
    this._history.push({
      state: this._deepClone(state),
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
   * @private
   * @param {*} obj
   * @returns {*}
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
    
    const cloned = {};
    for (const key of Object.keys(obj)) {
      cloned[key] = this._deepClone(obj[key]);
    }
    return cloned;
  }

  /**
   * @private
   * @param {*} a
   * @param {*} b
   * @returns {boolean}
   */
  _isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
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
  
  parentStore.subscribe((newState) => {
    const newSlice = selector(newState);
    const prevSlice = derivedStore.getState();
    
    if (JSON.stringify(prevSlice) !== JSON.stringify(newSlice)) {
      derivedStore._state = Object.freeze(derivedStore._deepClone(newSlice));
      derivedStore._notify(prevSlice);
    }
  });
  
  return derivedStore;
}
