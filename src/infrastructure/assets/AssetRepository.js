/**
 * Asset Repository - Manages asset metadata and discovery
 */

import { ASSET_BASE } from '../../config/constants.js';

/**
 * @typedef {Object} AssetInfo
 * @property {string} url
 * @property {string} category
 * @property {number} id
 * @property {string} label
 */

export class AssetRepository {
  constructor(baseUrl = ASSET_BASE) {
    this._baseUrl = baseUrl;
    /** @type {Map<string, AssetInfo>} */
    this._registry = new Map();
  }

  /**
   * Register an asset
   * @param {string} category
   * @param {number} id
   * @param {string} [label]
   */
  register(category, id, label) {
    const url = `${this._baseUrl}/${category}/${id}.png`;
    this._registry.set(url, {
      url,
      category,
      id,
      label: label || `${category} ${id + 1}`
    });
    return url;
  }

  /**
   * Get asset info by URL
   * @param {string} url
   * @returns {AssetInfo | undefined}
   */
  getInfo(url) {
    return this._registry.get(url);
  }

  /**
   * Get all URLs for a category
   * @param {string} category
   * @returns {Array<string>}
   */
  getCategoryUrls(category) {
    return Array.from(this._registry.values())
      .filter(info => info.category === category)
      .map(info => info.url);
  }

  /**
   * Get all registered assets
   * @returns {Array<AssetInfo>}
   */
  getAll() {
    return Array.from(this._registry.values());
  }

  /**
   * Bulk register assets for a category
   * @param {string} category
   * @param {number} count
   */
  registerCategory(category, count) {
    const urls = [];
    for (let i = 0; i < count; i++) {
      urls.push(this.register(category, i));
    }
    return urls;
  }

  /**
   * Clear all registrations
   */
  clear() {
    this._registry.clear();
  }
}

// Export singleton
export const assetRepository = new AssetRepository();
