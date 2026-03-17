/**
 * Picker Controller - Manages the parts picker UI
 */

import { partCatalog } from '../../domain/catalog/PartCatalog.js';
import { Actions } from '../../core/state/actions.js';
import { assetLoader } from '../../infrastructure/assets/AssetLoader.js';
import { createSeededRandom, pickDeterministic } from '../../utils/seededRandom.js';

export class PickerController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.tabsEl = document.getElementById('categoryTabs');
    this.gridEl = document.getElementById('partsGrid');
    this.randomBtn = document.getElementById('randomBtnPicker');
    this.newSeedBtn = document.getElementById('newSeedBtn');
    this.seedInput = document.getElementById('seedInput');
    this.locksEl = document.getElementById('categoryLocks');
    
    this.activeCategoryId = 'body';
    this.lockedCategories = new Set();
    
    this._abortController = null;
    this._unsubscribe = null;
  }

  async init() {
    if (!this.tabsEl || !this.gridEl) {
      console.warn('[PickerController] Required elements not found');
      return;
    }

    if (this.seedInput && !this.seedInput.value.trim()) {
      this.seedInput.value = this._generateSeedLabel();
    }

    this._renderTabs();
    this._renderLocks();
    this._renderGrid();
    this._setupEventListeners();
    this._subscribeToState();
  }

  _renderTabs() {
    const categories = partCatalog.getCategories();
    this.tabsEl.innerHTML = categories.map(cat => `
      <button
        type="button"
        class="picker__tab"
        data-category="${cat.id}"
        role="tab"
        aria-selected="${cat.id === this.activeCategoryId}"
        aria-controls="partsGrid"
        id="tab-${cat.id}"
      >${cat.label}</button>
    `).join('');
  }

  _renderLocks() {
    if (!this.locksEl) return;
    const categories = partCatalog.getCategories();
    this.locksEl.innerHTML = categories.map(cat => `
      <button
        type="button"
        class="picker__lock"
        data-lock-category="${cat.id}"
        data-locked="${this.lockedCategories.has(cat.id)}"
        aria-pressed="${this.lockedCategories.has(cat.id)}"
      >${this.lockedCategories.has(cat.id) ? '🔒' : '🔓'} ${cat.label}</button>
    `).join('');
  }

  _renderGrid() {
    const parts = partCatalog.getGridParts(this.activeCategoryId);
    this.gridEl.innerHTML = parts.map((part) => {
      if (!part) {
        return `<div class="picker__tile-wrap picker__tile--empty"></div>`;
      }
      
      return `
        <div
          class="picker__tile-wrap"
          draggable="true"
          role="button"
          aria-label="${part.label}"
          tabindex="0"
          data-category="${part.categoryId}"
          data-part-id="${part.id}"
          data-asset-url="${part.assetUrl}"
          data-color="${part.color}"
        >
          <div class="picker__tile-thumb" style="background-color: ${part.color}">
            <span class="picker__tile-number">${part.id + 1}</span>
          </div>
        </div>
      `;
    }).join('');

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this._loadThumbnails(parts), { timeout: 2000 });
    } else {
      setTimeout(() => this._loadThumbnails(parts), 100);
    }
  }

  async _loadThumbnails(parts) {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    const thumbs = this.gridEl.querySelectorAll('.picker__tile-thumb');
    
    for (let i = 0; i < parts.length; i++) {
      if (signal.aborted) return;
      const part = parts[i];
      const thumb = thumbs[i];
      if (!part || !thumb) continue;

      try {
        await assetLoader.load(part.assetUrl);
        if (signal.aborted) return;
        const img = document.createElement('img');
        img.src = part.assetUrl;
        img.alt = '';
        img.className = 'picker__tile-img';
        img.draggable = false;
        img.style.filter = 'drop-shadow(0 0 6px rgba(212, 82, 10, 0.4))';
        thumb.innerHTML = '';
        thumb.appendChild(img);
      } catch {
        if (signal.aborted) return;
        thumb.style.background = `linear-gradient(135deg, ${part.color}40, ${part.color}20)`;
        thumb.style.border = `1px solid ${part.color}60`;
      }
    }
  }

  destroy() {
    if (this._abortController) this._abortController.abort();
    if (this._unsubscribe) this._unsubscribe();
  }

  _setupEventListeners() {
    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.picker__tab');
      if (!tab) return;
      this._switchCategory(tab.dataset.category);
    });

    this.locksEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lock-category]');
      if (!btn) return;
      const categoryId = btn.dataset.lockCategory;
      if (this.lockedCategories.has(categoryId)) {
        this.lockedCategories.delete(categoryId);
      } else {
        this.lockedCategories.add(categoryId);
      }
      this._renderLocks();
    });

    this.gridEl.addEventListener('click', (e) => {
      const tile = e.target.closest('.picker__tile-wrap[data-category]');
      if (!tile || tile.classList.contains('picker__tile--empty')) return;
      this._addPartAtCenter(tile.dataset);
    });

    this.gridEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const tile = e.target.closest('.picker__tile-wrap[data-category]');
      if (!tile || tile.classList.contains('picker__tile--empty')) return;
      e.preventDefault();
      this._addPartAtCenter(tile.dataset);
    });

    this.gridEl.addEventListener('dragstart', (e) => {
      const tile = e.target.closest('.picker__tile-wrap[data-category]');
      if (!tile) return;
      e.dataTransfer.setData('application/json', JSON.stringify({
        categoryId: tile.dataset.category,
        partId: parseInt(tile.dataset.partId, 10),
        assetUrl: tile.dataset.assetUrl,
        color: tile.dataset.color
      }));
      e.dataTransfer.effectAllowed = 'copy';
    });

    this.randomBtn?.addEventListener('click', () => this._applySeededRandomizer());
    this.newSeedBtn?.addEventListener('click', () => {
      if (this.seedInput) this.seedInput.value = this._generateSeedLabel();
      this._announce('Neuer Seed erzeugt');
    });
  }

  _subscribeToState() {
    this._unsubscribe = this.store.subscribe((state) => {
      const newCategoryId = state.ui.activeCategoryId;
      if (newCategoryId !== this.activeCategoryId) {
        this.activeCategoryId = newCategoryId;
        this._updateActiveTab();
        this._renderGrid();
      }
    });
  }

  _switchCategory(categoryId) {
    this.activeCategoryId = categoryId;
    this.store.dispatch(Actions.selectCategory(categoryId), this.reducers);
    this._updateActiveTab();
    this._renderGrid();
  }

  _updateActiveTab() {
    const tabs = this.tabsEl.querySelectorAll('.picker__tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.category === this.activeCategoryId;
      tab.setAttribute('aria-selected', String(isActive));
    });
  }

  _addPartAtCenter(dataset) {
    const part = partCatalog.getPart(dataset.category, parseInt(dataset.partId, 10));
    if (!part) return;
    this.sceneService.addItem(part, { x: 0.5, y: 0.5 });
    this._announce('Teil hinzugefügt');
  }

  _applySeededRandomizer() {
    const seed = this.seedInput?.value.trim() || this._generateSeedLabel();
    if (this.seedInput && !this.seedInput.value.trim()) {
      this.seedInput.value = seed;
    }

    const categories = partCatalog.getCategories().filter(cat => !this.lockedCategories.has(cat.id));
    if (!categories.length) {
      this._announce('Alle Kategorien sind gelockt');
      return;
    }

    const rng = createSeededRandom(seed);
    const existingItems = this.sceneService.getAllItems();

    categories.forEach((category, index) => {
      const parts = partCatalog.getParts(category.id);
      const chosenPart = pickDeterministic(parts, rng);
      if (!chosenPart) return;

      const matching = existingItems.filter(item => item.categoryId === category.id);
      const targetX = 0.25 + (rng() * 0.5);
      const targetY = 0.25 + (rng() * 0.5);
      const targetScale = 0.8 + (rng() * 1.3);
      const targetRotation = Math.floor(rng() * 8) * 45;

      if (matching.length > 0) {
        this.store.dispatch(Actions.updateItem(matching[0].id, {
          partId: chosenPart.id,
          assetUrl: chosenPart.assetUrl,
          color: chosenPart.color,
          label: chosenPart.label,
          x: targetX,
          y: targetY,
          scale: targetScale,
          rotation: targetRotation
        }), this.reducers);
      } else {
        this.sceneService.addItem(chosenPart, { x: targetX, y: targetY });
      }
    });

    this._announce(`Seed-Randomizer angewendet: ${seed}`);
  }

  _generateSeedLabel() {
    return `DRUID-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  _announce(message) {
    this.store.dispatch(Actions.announce(message), this.reducers);
  }
}
