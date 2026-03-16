/**
 * Application Constants
 */

// Canvas & Export
export const EXPORT_SIZE = 512;
export const PREVIEW_SIZE = 400;
export const BASE_SIZE_RATIO = 0.2;

// Asset Paths
export const ASSET_BASE = '/assets/parts';

// Grid Configuration
export const GRID_COLS = 3;
export const GRID_ROWS = 3;
export const MAX_TILES = GRID_COLS * GRID_ROWS;

// Limits
export const MAX_PRESETS = 10;
export const MAX_CACHE_SIZE = 80;

// Transform Limits
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 4.0;
export const SCALE_STEP = 0.05;
export const ROTATION_MIN = 0;
export const ROTATION_MAX = 360;
export const ROTATION_STEP = 5;

// Storage Keys
export const STORAGE_KEYS = {
  SCENE: 'monster-generator:scene',
  PRESETS: 'monster-generator:presets',
  SETTINGS: 'monster-generator:settings'
};

// Category Order (render order, back to front)
export const CATEGORY_ORDER = [
  'body',
  'legs',
  'arms',
  'head',
  'eyes',
  'mouth',
  'horns',
  'accessories'
];

// Category Configuration
export const CATEGORIES = [
  { id: 'body', label: 'Körper', count: 17 },
  { id: 'head', label: 'Kopf', count: 4 },
  { id: 'eyes', label: 'Augen', count: 9 },
  { id: 'mouth', label: 'Mund', count: 9 },
  { id: 'horns', label: 'Hörner', count: 9 },
  { id: 'arms', label: 'Arme', count: 4 },
  { id: 'legs', label: 'Beine', count: 4 },
  { id: 'accessories', label: 'Accessoires', count: 0 }
];

// Pastel Colors for placeholders
export const PASTEL_COLORS = [
  '#81c784', // Green
  '#a5d6a7', // Light Green
  '#c8e6c9', // Pale Green
  '#fff59d', // Yellow
  '#ffcc80', // Orange
  '#b39ddb', // Purple
  '#ce93d8', // Light Purple
  '#80deea', // Cyan
  '#90caf9', // Blue
  '#ef9a9a'  // Red
];

// Theme Colors
export const THEME = {
  pastelGreenFrom: '#b8e0b8',
  pastelGreenTo: '#e8f5e9',
  pastelGreenMid: '#c8e6c9',
  accentGreen: '#2e7d32',
  accentGreenSoft: '#388e3c'
};

// Animation Durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500
};

// Debounce Delays (ms)
export const DEBOUNCE = {
  render: 16,      // ~60fps
  resize: 100,
  input: 50,
  save: 500
};
