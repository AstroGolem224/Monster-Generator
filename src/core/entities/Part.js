/**
 * @typedef {Object} Part
 * @property {number} id - Teil-Index
 * @property {string} label - Anzeigename
 * @property {string} color - Fallback-Farbe (Hex)
 * @property {string} assetUrl - URL zum Bild-Asset
 * @property {string} categoryId - Zugehörige Kategorie
 */

/**
 * Creates a Part definition
 * @param {Object} data
 * @param {number} data.id
 * @param {string} data.categoryId
 * @param {string} data.categoryLabel
 * @param {string} data.color
 * @param {string} [data.assetBase]
 * @returns {Part}
 */
export function createPart({
  id,
  categoryId,
  categoryLabel,
  color,
  assetBase = '/assets/parts'
}) {
  return Object.freeze({
    id,
    label: `${categoryLabel} ${id + 1}`,
    color,
    assetUrl: `${assetBase}/${categoryId}/${id}.png`,
    categoryId
  });
}

/**
 * Creates multiple parts for a category
 * @param {Object} config
 * @param {string} config.categoryId
 * @param {string} config.categoryLabel
 * @param {number} config.count
 * @param {string} config.color
 * @returns {Array<Part>}
 */
export function createPartsForCategory({
  categoryId,
  categoryLabel,
  count,
  color
}) {
  return Array.from({ length: count }, (_, i) =>
    createPart({
      id: i,
      categoryId,
      categoryLabel,
      color
    })
  );
}

/**
 * Serialize Part for storage/network
 * @param {Part} part
 * @returns {Object}
 */
export function serializePart(part) {
  return { ...part };
}

/**
 * Check if asset URL is valid format
 * @param {string} url
 * @returns {boolean}
 */
export function isValidAssetUrl(url) {
  return typeof url === 'string' && 
    (url.startsWith('/assets/') || url.startsWith('http'));
}
