/**
 * Monster Generator: placedItems (Drag-and-Drop), Selector mit Thumbnails, Trash, Scaler/Turner, Presets.
 */
import { getCategories, getPartsForCategory, MAX_TILES } from './parts.js';
import {
  drawPlacedItems,
  exportToDataURL,
  getPlacedItemAt,
  getCanvasPoint,
  pixelToNormalized,
} from './composer.js';
import { loadImage, getCachedImage } from './assetLoader.js';

const STORAGE_KEY = 'monster-generator-placed-items';
const PRESETS_KEY = 'monster-generator-presets';
const MAX_PRESETS = 10;

/** @type {Array<{ id: string, categoryId: string, partId: number, assetUrl: string, color: string, x: number, y: number, scale: number, rotation: number }>} */
let placedItems = [];
/** @type {string | null} */
let selectedItemId = null;
/** @type {string | null} */
let draggedItemId = null;
let isDragging = false;
let activeCategoryId = 'body';

const categoryTabsEl = document.getElementById('categoryTabs');
const partsGridEl = document.getElementById('partsGrid');
const previewCanvas = document.getElementById('previewCanvas');
const exportBtn = document.getElementById('exportBtn');
const randomBtn = document.getElementById('randomBtn');
const randomBtnPicker = document.getElementById('randomBtnPicker');
const liveRegion = document.getElementById('liveRegion');
const presetName = document.getElementById('presetName');
const presetSelect = document.getElementById('presetSelect');
const savePresetBtn = document.getElementById('savePresetBtn');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');
const resetBtn = document.getElementById('resetBtn');
const trashBtn = document.getElementById('trashBtn');
const mirrorHBtn = document.getElementById('mirrorHBtn');
const mirrorVBtn = document.getElementById('mirrorVBtn');
const scalerPanel = document.getElementById('scalerPanel');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const rotationSlider = document.getElementById('rotationSlider');
const rotationValue = document.getElementById('rotationValue');

if (!categoryTabsEl || !partsGridEl || !previewCanvas || !exportBtn) throw new Error('DOM elements missing');

function nextId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function announce(message) {
  if (liveRegion) {
    liveRegion.textContent = '';
    liveRegion.textContent = message;
  }
}

function ensureItemFlip(item) {
  if (item.flipH === undefined) item.flipH = false;
  if (item.flipV === undefined) item.flipV = false;
  return item;
}

function loadStoredScene() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) placedItems = arr.map(ensureItemFlip);
  } catch (_) {}
}

function saveScene() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placedItems));
  } catch (_) {}
}

function getPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function savePresets(presets) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets.slice(0, MAX_PRESETS)));
  } catch (_) {}
}

function renderTabs() {
  const categories = getCategories();
  categoryTabsEl.innerHTML = '';
  categories.forEach((cat) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'picker__tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', activeCategoryId === cat.id ? 'true' : 'false');
    button.setAttribute('aria-controls', 'partsGrid');
    button.id = `tab-${cat.id}`;
    button.textContent = cat.label;
    button.addEventListener('click', () => switchCategory(cat.id));
    categoryTabsEl.appendChild(button);
  });
}

function switchCategory(categoryId) {
  activeCategoryId = categoryId;
  getCategories().forEach((cat) => {
    const tab = document.getElementById(`tab-${cat.id}`);
    if (tab) tab.setAttribute('aria-selected', cat.id === activeCategoryId ? 'true' : 'false');
  });
  renderGrid();
}

function renderGrid() {
  const parts = getPartsForCategory(activeCategoryId);
  partsGridEl.innerHTML = '';
  for (let i = 0; i < MAX_TILES; i++) {
    const part = parts[i] ?? null;
    const tile = document.createElement('div');
    tile.className = 'picker__tile-wrap' + (part ? '' : ' picker__tile--empty');
    if (!part) {
      partsGridEl.appendChild(tile);
      continue;
    }
    tile.draggable = true;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', part.label);
    tile.tabIndex = 0;
    tile.dataset.categoryId = activeCategoryId;
    tile.dataset.partId = String(part.id);
    tile.dataset.assetUrl = part.assetUrl;
    tile.dataset.color = part.color;
    tile.dataset.label = part.label;

    const thumb = document.createElement('div');
    thumb.className = 'picker__tile-thumb';
    thumb.style.backgroundColor = part.color;
    thumb.textContent = part.id + 1;
    loadImage(part.assetUrl)
      .then(() => {
        thumb.textContent = '';
        const img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.referrerPolicy = 'no-referrer';
        img.src = part.assetUrl;
        img.classList.add('picker__tile-img');
        thumb.appendChild(img);
      })
      .catch(() => {});
    tile.appendChild(thumb);

    tile.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        categoryId: activeCategoryId,
        partId: part.id,
        assetUrl: part.assetUrl,
        color: part.color,
        label: part.label,
      }));
      e.dataTransfer.effectAllowed = 'copy';
    });

    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addItemAtCenter(activeCategoryId, part);
      }
    });

    partsGridEl.appendChild(tile);
  }
}

function addItemAtCenter(categoryId, part) {
  placedItems.push({
    id: nextId(),
    categoryId,
    partId: part.id,
    assetUrl: part.assetUrl,
    color: part.color,
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
  });
  saveScene();
  renderPreview();
  announce('Teil hinzugefügt.');
}

function addItemAt(categoryId, part, normX, normY) {
  placedItems.push({
    id: nextId(),
    categoryId,
    partId: part.id,
    assetUrl: part.assetUrl,
    color: part.color,
    x: normX,
    y: normY,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false,
  });
  saveScene();
  renderPreview();
}

let renderPending = false;
function scheduleRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    drawPlacedItems(previewCanvas, placedItems, scheduleRender);
  });
}

function renderPreview() {
  drawPlacedItems(previewCanvas, placedItems, scheduleRender);
}

function setupCanvasDrop() {
  previewCanvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  previewCanvas.addEventListener('drop', (e) => {
    e.preventDefault();
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch (_) {
      return;
    }
    if (!data || !data.assetUrl) return;
    const pt = getCanvasPoint(previewCanvas, e);
    if (!pt) return;
    const norm = pixelToNormalized(previewCanvas, pt.x, pt.y);
    placedItems.push({
      id: nextId(),
      categoryId: data.categoryId,
      partId: data.partId,
      assetUrl: data.assetUrl,
      color: data.color || '#c8e6c9',
      x: norm.x,
      y: norm.y,
      scale: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
    });
    saveScene();
    renderPreview();
    announce('Teil hinzugefügt.');
  });
}

function setupCanvasMouse() {
  previewCanvas.addEventListener('mousedown', (e) => {
    const pt = getCanvasPoint(previewCanvas, e);
    if (!pt) return;
    const hit = getPlacedItemAt(previewCanvas, placedItems, pt.x, pt.y);
    if (hit) {
      draggedItemId = hit.id;
      selectedItemId = hit.id;
      isDragging = true;
      updateScalerPanel();
    } else {
      selectedItemId = null;
      updateScalerPanel();
    }
  });

  const moveHandler = (e) => {
    if (!isDragging || !draggedItemId) return;
    const pt = getCanvasPoint(previewCanvas, e);
    if (!pt) return;
    const norm = pixelToNormalized(previewCanvas, pt.x, pt.y);
    const item = placedItems.find((p) => p.id === draggedItemId);
    if (item) {
      item.x = Math.max(0, Math.min(1, norm.x));
      item.y = Math.max(0, Math.min(1, norm.y));
      renderPreview();
    }
  };

  const upHandler = () => {
    if (isDragging) saveScene();
    isDragging = false;
    draggedItemId = null;
  };

  window.addEventListener('mousemove', moveHandler);
  window.addEventListener('mouseup', upHandler);
}

function updateScalerPanel() {
  if (!scalerPanel || !scaleSlider || !scaleValue || !rotationSlider || !rotationValue) return;
  const item = placedItems.find((p) => p.id === selectedItemId);
  if (!item) {
    scalerPanel.hidden = true;
    if (trashBtn) trashBtn.disabled = true;
    return;
  }
  scalerPanel.hidden = false;
  if (trashBtn) trashBtn.disabled = false;
  const scalePct = Math.round(item.scale * 100);
  scaleSlider.value = String(Math.max(50, Math.min(400, scalePct)));
  scaleValue.textContent = scaleSlider.value;
  rotationSlider.value = String(Math.round(item.rotation));
  rotationValue.textContent = rotationSlider.value;
  if (mirrorHBtn) mirrorHBtn.setAttribute('aria-pressed', item.flipH ? 'true' : 'false');
  if (mirrorVBtn) mirrorVBtn.setAttribute('aria-pressed', item.flipV ? 'true' : 'false');
}

function setupScalerPanel() {
  if (!scaleSlider || !scaleValue || !rotationSlider || !rotationValue) return;
  scaleSlider.addEventListener('input', () => {
    const item = placedItems.find((p) => p.id === selectedItemId);
    if (!item) return;
    item.scale = scaleSlider.valueAsNumber / 100;
    scaleValue.textContent = String(Math.round(item.scale * 100));
    saveScene();
    renderPreview();
  });
  rotationSlider.addEventListener('input', () => {
    const item = placedItems.find((p) => p.id === selectedItemId);
    if (!item) return;
    item.rotation = rotationSlider.valueAsNumber;
    rotationValue.textContent = String(Math.round(item.rotation));
    saveScene();
    renderPreview();
  });
  if (mirrorHBtn) {
    mirrorHBtn.addEventListener('click', () => {
      const item = placedItems.find((p) => p.id === selectedItemId);
      if (!item) return;
      item.flipH = !item.flipH;
      saveScene();
      renderPreview();
      updateScalerPanel();
      announce(item.flipH ? 'Horizontal gespiegelt.' : 'Horizontal zurückgesetzt.');
    });
  }
  if (mirrorVBtn) {
    mirrorVBtn.addEventListener('click', () => {
      const item = placedItems.find((p) => p.id === selectedItemId);
      if (!item) return;
      item.flipV = !item.flipV;
      saveScene();
      renderPreview();
      updateScalerPanel();
      announce(item.flipV ? 'Vertikal gespiegelt.' : 'Vertikal zurückgesetzt.');
    });
  }
  if (trashBtn) {
    trashBtn.addEventListener('click', () => {
      if (!selectedItemId) return;
      placedItems = placedItems.filter((p) => p.id !== selectedItemId);
      selectedItemId = null;
      saveScene();
      renderPreview();
      updateScalerPanel();
      announce('Teil entfernt.');
    });
  }
}

function renderPresetSelect() {
  if (!presetSelect) return;
  const presets = getPresets();
  const selected = presetSelect.value;
  presetSelect.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '– auswählen –';
  presetSelect.appendChild(defaultOpt);
  presets.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    if (p.name === selected) opt.selected = true;
    presetSelect.appendChild(opt);
  });
}

function handleSavePreset() {
  const name = (presetName?.value ?? '').trim();
  if (!name) {
    announce('Bitte einen Preset-Namen eingeben.');
    return;
  }
  const presets = getPresets();
  if (presets.some((p) => p.name === name)) {
    announce('Ein Preset mit diesem Namen existiert bereits.');
    return;
  }
  if (presets.length >= MAX_PRESETS) presets.shift();
  presets.push({ name, placedItems: JSON.parse(JSON.stringify(placedItems)) });
  savePresets(presets);
  renderPresetSelect();
  if (presetName) presetName.value = '';
  announce('Preset gespeichert.');
}

function handleLoadPreset() {
  const name = presetSelect?.value ?? '';
  if (!name) {
    announce('Bitte ein Preset auswählen.');
    return;
  }
  const presets = getPresets();
  const preset = presets.find((p) => p.name === name);
  if (!preset) {
    announce('Preset nicht gefunden.');
    return;
  }
  placedItems = Array.isArray(preset.placedItems) ? JSON.parse(JSON.stringify(preset.placedItems)).map(ensureItemFlip) : [];
  selectedItemId = null;
  saveScene();
  renderPreview();
  updateScalerPanel();
  renderPresetSelect();
  announce('Preset geladen.');
}

function handleDeletePreset() {
  const name = presetSelect?.value ?? '';
  if (!name) {
    announce('Bitte ein Preset zum Löschen auswählen.');
    return;
  }
  const presets = getPresets().filter((p) => p.name !== name);
  savePresets(presets);
  renderPresetSelect();
  announce('Preset gelöscht.');
}

function handleReset() {
  placedItems = [];
  selectedItemId = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
  saveScene();
  renderPreview();
  updateScalerPanel();
  announce('Zurückgesetzt.');
}

function randomMonster() {
  const cats = getCategories();
  if (cats.length === 0) return;
  const cat = cats[Math.floor(Math.random() * cats.length)];
  const parts = getPartsForCategory(cat.id);
  if (parts.length === 0) return;
  const part = parts[Math.floor(Math.random() * parts.length)];
  addItemAtCenter(cat.id, part);
  announce('Zufälliges Teil hinzugefügt.');
}

function handleExport() {
  const dataUrl = exportToDataURL(placedItems);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'monster.png';
  a.click();
}

// Init
loadStoredScene();
renderTabs();
renderGrid();
renderPreview();
renderPresetSelect();
updateScalerPanel();

setupCanvasDrop();
setupCanvasMouse();
setupScalerPanel();

exportBtn.addEventListener('click', handleExport);
if (randomBtn) randomBtn.addEventListener('click', randomMonster);
if (randomBtnPicker) randomBtnPicker.addEventListener('click', randomMonster);
if (savePresetBtn) savePresetBtn.addEventListener('click', handleSavePreset);
if (loadPresetBtn) loadPresetBtn.addEventListener('click', handleLoadPreset);
if (deletePresetBtn) deletePresetBtn.addEventListener('click', handleDeletePreset);
if (resetBtn) resetBtn.addEventListener('click', handleReset);
