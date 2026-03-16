/**
 * Asset Loading with Caching and Retry Logic
 */

/**
 * @typedef {Object} LoadOptions
 * @property {number} [retries=3] - Number of retry attempts
 * @property {number} [timeout=10000] - Timeout in milliseconds
 * @property {'anonymous' | 'use-credentials'} [crossOrigin='anonymous']
 */

const DEFAULT_OPTIONS = {
  retries: 3,
  timeout: 10000,
  crossOrigin: 'anonymous'
};

const MAX_CACHE_SIZE = 80;

/**
 * Asset Loader with LRU cache
 */
export class AssetLoader {
  constructor() {
    /** @type {Map<string, HTMLImageElement>} */
    this._cache = new Map();
    /** @type {Set<string>} */
    this._failed = new Set();
    /** @type {Map<string, Promise<HTMLImageElement>>} */
    this._loading = new Map();
    /** @type {Array<string>} */
    this._accessOrder = [];
  }

  /**
   * Load an image with caching
   * @param {string} url
   * @param {LoadOptions} [options]
   * @returns {Promise<HTMLImageElement>}
   */
  async load(url, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Check cache
    const cached = this._getFromCache(url);
    if (cached) return cached;

    // Check if previously failed
    if (this._failed.has(url)) {
      throw new AssetLoadError(`Previously failed: ${url}`, url, 'PREVIOUSLY_FAILED');
    }

    // Check if already loading (deduplication)
    const inflight = this._loading.get(url);
    if (inflight) return inflight;

    // Start loading
    const promise = this._loadWithRetry(url, opts);
    this._loading.set(url, promise);

    try {
      const image = await promise;
      this._addToCache(url, image);
      return image;
    } finally {
      this._loading.delete(url);
    }
  }

  /**
   * Preload multiple images
   * @param {Array<string>} urls
   * @param {LoadOptions} [options]
   * @returns {Promise<Array<{ url: string, success: boolean, image?: HTMLImageElement, error?: Error }>>}
   */
  async preload(urls, options = {}) {
    const results = await Promise.allSettled(
      urls.map(url => this.load(url, options))
    );

    return results.map((result, index) => ({
      url: urls[index],
      success: result.status === 'fulfilled',
      image: result.status === 'fulfilled' ? result.value : undefined,
      error: result.status === 'rejected' ? result.reason : undefined
    }));
  }

  /**
   * Get cached image without loading
   * @param {string} url
   * @returns {HTMLImageElement | null}
   */
  getCached(url) {
    return this._getFromCache(url);
  }

  /**
   * Check if image is cached
   * @param {string} url
   * @returns {boolean}
   */
  isCached(url) {
    return this._cache.has(url);
  }

  /**
   * Check if image failed to load
   * @param {string} url
   * @returns {boolean}
   */
  isFailed(url) {
    return this._failed.has(url);
  }

  /**
   * Clear cache
   * @param {string} [url] - Specific URL to clear, or all if omitted
   */
  clearCache(url) {
    if (url) {
      this._cache.delete(url);
      this._accessOrder = this._accessOrder.filter(u => u !== url);
    } else {
      this._cache.clear();
      this._accessOrder = [];
    }
  }

  /**
   * Retry a previously failed URL
   * @param {string} url
   * @param {LoadOptions} [options]
   * @returns {Promise<HTMLImageElement>}
   */
  async retry(url, options = {}) {
    this._failed.delete(url);
    return this.load(url, options);
  }

  /**
   * Get cache statistics
   * @returns {{ size: number, maxSize: number, failed: number, loading: number }}
   */
  getStats() {
    return {
      size: this._cache.size,
      maxSize: MAX_CACHE_SIZE,
      failed: this._failed.size,
      loading: this._loading.size
    };
  }

  // Private methods

  async _loadWithRetry(url, options) {
    let lastError;
    
    for (let attempt = 0; attempt < options.retries; attempt++) {
      try {
        return await this._loadImage(url, options);
      } catch (error) {
        lastError = error;
        if (attempt < options.retries - 1) {
          await this._delay(1000 * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    this._failed.add(url);
    throw new AssetLoadError(
      `Failed after ${options.retries} attempts: ${lastError?.message}`,
      url,
      'LOAD_FAILED'
    );
  }

  _loadImage(url, options) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        reject(new AssetLoadError('Timeout', url, 'TIMEOUT'));
      }, options.timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new AssetLoadError('Image load error', url, 'LOAD_ERROR'));
      };

      img.crossOrigin = options.crossOrigin;
      img.src = url;
    });
  }

  _getFromCache(url) {
    const cached = this._cache.get(url);
    if (cached) {
      // Update access order (LRU)
      this._accessOrder = this._accessOrder.filter(u => u !== url);
      this._accessOrder.push(url);
    }
    return cached || null;
  }

  _addToCache(url, image) {
    // Evict oldest if at capacity
    if (this._cache.size >= MAX_CACHE_SIZE && !this._cache.has(url)) {
      const oldest = this._accessOrder.shift();
      if (oldest) {
        this._cache.delete(oldest);
      }
    }

    this._cache.set(url, image);
    this._accessOrder.push(url);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Custom error for asset loading
 */
export class AssetLoadError extends Error {
  constructor(message, url, code) {
    super(message);
    this.name = 'AssetLoadError';
    this.url = url;
    this.code = code;
  }
}

// Export singleton instance
export const assetLoader = new AssetLoader();
