/**
 * Part Catalog - Manages available monster parts
 */

import { CATEGORIES, PASTEL_COLORS, MAX_TILES, ASSET_BASE } from '../../config/constants.js';
import { createPart } from '../../core/entities/Part.js';

export class PartCatalog {
  constructor() {
    this._categories = new Map();
    this._initializeCategories();
  }

  /**
   * Initialize categories from config
   * @private
   */
  _initializeCategories() {
    for (const cat of CATEGORIES) {
      const parts = [];
      for (let i = 0; i < cat.count; i++) {
        const colorIndex = (CATEGORIES.indexOf(cat) * 3 + i) % PASTEL_COLORS.length;
        parts.push(createPart({
          id: i,
          categoryId: cat.id,
          categoryLabel: cat.label,
          color: PASTEL_COLORS[colorIndex]
        }));
      }
      this._categories.set(cat.id, {
        ...cat,
        parts
      });
    }
  }

  /**
   * Get all categories
   * @returns {Array<{ id: string, label: string }>}
   */
  getCategories() {
    return CATEGORIES.map(c => ({ id: c.id, label: c.label }));
  }

  /**
   * Get category by ID
   * @param {string} categoryId
   * @returns {{ id: string, label: string, count: number } | undefined}
   */
  getCategory(categoryId) {
    const cat = this._categories.get(categoryId);
    if (!cat) return undefined;
    return { id: cat.id, label: cat.label, count: cat.count };
  }

  /**
   * Get parts for a category
   * @param {string} categoryId
   * @returns {Array<import('../../core/entities/Part').Part>}
   */
  getParts(categoryId) {
    const cat = this._categories.get(categoryId);
    return cat ? cat.parts : [];
  }

  /**
   * Get a specific part
   * @param {string} categoryId
   * @param {number} partId
   * @returns {import('../../core/entities/Part').Part | undefined}
   */
  getPart(categoryId, partId) {
    const cat = this._categories.get(categoryId);
    if (!cat) return undefined;
    return cat.parts.find(p => p.id === partId);
  }

  /**
   * Get parts limited to grid size (fills with null if less than MAX_TILES)
   * @param {string} categoryId
   * @returns {Array<import('../../core/entities/Part').Part | null>}
   */
  getGridParts(categoryId) {
    const parts = this.getParts(categoryId);
    const result = [];
    
    for (let i = 0; i < MAX_TILES; i++) {
      result.push(parts[i] ?? null);
    }
    
    return result;
  }

  /**
   * Check if category exists
   * @param {string} categoryId
   * @returns {boolean}
   */
  hasCategory(categoryId) {
    return this._categories.has(categoryId);
  }

  /**
   * Get total part count across all categories
   * @returns {number}
   */
  getTotalPartCount() {
    let total = 0;
    for (const cat of this._categories.values()) {
      total += cat.parts.length;
    }
    return total;
  }

  /**
   * Get random part from random category
   * @returns {{ categoryId: string, part: import('../../core/entities/Part').Part } | null}
   */
  getRandomPart() {
    const categories = this.getCategories();
    if (categories.length === 0) return null;

    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const parts = this.getParts(randomCat.id);
    
    if (parts.length === 0) return null;
    
    const randomPart = parts[Math.floor(Math.random() * parts.length)];
    return { categoryId: randomCat.id, part: randomPart };
  }

  /**
   * Get asset URL for a part
   * @param {string} categoryId
   * @param {number} partId
   * @returns {string}
   */
  getAssetUrl(categoryId, partId) {
    return `${ASSET_BASE}/${categoryId}/${partId}.png`;
  }

  /**
   * Find part by asset URL
   * @param {string} assetUrl
   * @returns {{ categoryId: string, part: import('../../core/entities/Part').Part } | null}
   */
  findByAssetUrl(assetUrl) {
    for (const [categoryId, cat] of this._categories) {
      const part = cat.parts.find(p => p.assetUrl === assetUrl);
      if (part) {
        return { categoryId, part };
      }
    }
    return null;
  }
}

// Export singleton
export const partCatalog = new PartCatalog();
