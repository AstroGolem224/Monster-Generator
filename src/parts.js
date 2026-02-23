/**
 * Teile-Daten und Kategorien für den Monster-Generator.
 * 8 Kategorien, variable Anzahl Teile pro Kategorie; 3×3-Grid pro Tab.
 */

const GRID_COLS = 3;
const GRID_ROWS = 3;
const MAX_TILES = GRID_COLS * GRID_ROWS;

/** Zeichenreihenfolge (hinten → vorne) */
export const CATEGORY_ORDER = [
  'body', 'legs', 'arms', 'head', 'eyes', 'mouth', 'horns', 'accessories',
];

/** Pastell-Farben für Platzhalter */
const COLORS = [
  '#81c784', '#a5d6a7', '#c8e6c9', '#fff59d', '#ffcc80',
  '#b39ddb', '#ce93d8', '#80deea', '#90caf9', '#ef9a9a',
];

const CATEGORIES = [
  { id: 'body',     label: 'Körper',      count: 6 },
  { id: 'head',     label: 'Kopf',        count: 6 },
  { id: 'eyes',     label: 'Augen',       count: 5 },
  { id: 'mouth',    label: 'Mund',        count: 5 },
  { id: 'horns',    label: 'Hörner',      count: 4 },
  { id: 'arms',     label: 'Arme',        count: 5 },
  { id: 'legs',     label: 'Beine',       count: 5 },
  { id: 'accessories', label: 'Accessoires', count: 6 },
];

/**
 * @returns {Array<{ id: string, label: string }>}
 */
export function getCategories() {
  return CATEGORIES.map((c) => ({ id: c.id, label: c.label }));
}

/** Basis-URL für Teil-Assets (public/assets/parts/) */
const ASSET_BASE = '/assets/parts';

/**
 * Teile für eine Kategorie (variable Anzahl, max 9 im 3×3-Grid).
 * Jedes Teil hat assetUrl für echtes Bild; color dient als Fallback bei Fehler/404.
 * @param {string} categoryId
 * @returns {Array<{ id: number, label: string, color: string, assetUrl: string }>}
 */
export function getPartsForCategory(categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return [];
  const list = [];
  for (let i = 0; i < cat.count; i++) {
    const colorIndex = (CATEGORIES.findIndex((c) => c.id === categoryId) * 3 + i) % COLORS.length;
    list.push({
      id: i,
      label: `${cat.label} ${i + 1}`,
      color: COLORS[colorIndex],
      assetUrl: `${ASSET_BASE}/${categoryId}/${i}.png`,
    });
  }
  return list;
}

export { GRID_COLS, GRID_ROWS, MAX_TILES };
