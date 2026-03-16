/**
 * Picker Controller - Manages the parts picker UI
 */

import { partCatalog } from '../../domain/catalog/PartCatalog.js';
import { Actions } from '../../core/state/actions.js';
import { assetLoader } from '../../infrastructure/assets/AssetLoader.js';

export class PickerController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    // DOM elements
    this.tabsEl = document.getElementById('categoryTabs');
    this.gridEl = document.getElementById('partsGrid');
    this.randomBtn = document.getElementById('randomBtnPicker');
    
    // State
    this.activeCategoryId = 'body';
    
    // AbortController for thumbnail loading
    this._abortController = null;
    this._unsubscribe = null;
  }

  async init() {
    if (!this.tabsEl || !this.gridEl) {
      console.warn('[PickerController] Required elements not found');
      return;
    }

    this._renderTabs();
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

  _renderGrid() {
    const parts = partCatalog.getGridParts(this.activeCategoryId);
    
    this.gridEl.innerHTML = parts.map((part, index) => {
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

    // Load images after rendering with glow effect (using requestIdleCallback for performance)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this._loadThumbnails(parts), { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(() => this._loadThumbnails(parts), 100);
    }
  }

  async _loadThumbnails(parts) {
    // Cancel previous loading
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    
    const thumbs = this.gridEl.querySelectorAll('.picker__tile-thumb');
    
    for (let i = 0; i < parts.length; i++) {
      if (signal.aborted) return; // Check if cancelled
      
      const part = parts[i];
      const thumb = thumbs[i];
      
      if (!part || !thumb) continue;

      try {
        await assetLoader.load(part.assetUrl);
        
        if (signal.aborted) return; // Check again after await
        
        const img = document.createElement('img');
        img.src = part.assetUrl;
        img.alt = '';
        img.className = 'picker__tile-img';
        img.draggable = false;
        img.style.filter = 'drop-shadow(0 0 6px rgba(212, 82, 10, 0.4))';
        
        // Replace number with image
        thumb.innerHTML = '';
        thumb.appendChild(img);
      } catch (error) {
        if (signal.aborted) return;
        
        // Keep the colored placeholder with number
        thumb.style.background = `linear-gradient(135deg, ${part.color}40, ${part.color}20)`;
        thumb.style.border = `1px solid ${part.color}60`;
      }
    }
  }

  /**
   * Cleanup method
   */
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
    }
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  _setupEventListeners() {
    // Tab switching
    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.picker__tab');
      if (!tab) return;
      
      const categoryId = tab.dataset.category;
      this._switchCategory(categoryId);
    });

    // Grid interactions
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

    // Drag and drop
    this.gridEl.addEventListener('dragstart', (e) => {
      const tile = e.target.closest('.picker__tile-wrap[data-category]');
      if (!tile) return;
      
      e.dataTransfer.setData('application/json', JSON.stringify({
        categoryId: tile.dataset.category,
        partId: parseInt(tile.dataset.partId),
        assetUrl: tile.dataset.assetUrl,
        color: tile.dataset.color
      }));
      e.dataTransfer.effectAllowed = 'copy';
    });

    // Random button
    if (this.randomBtn) {
      this.randomBtn.addEventListener('click', () => {
        this._addRandomPart();
      });
    }
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
    this.store.dispatch(
      Actions.selectCategory(categoryId),
      require('../../core/state/reducers.js').rootReducer
    );
    this._updateActiveTab();
    this._renderGrid();
  }

  _updateActiveTab() {
    const tabs = this.tabsEl.querySelectorAll('.picker__tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.category === this.activeCategoryId;
      tab.setAttribute('aria-selected', isActive);
    });
  }

  _addPartAtCenter(dataset) {
    const part = partCatalog.getPart(dataset.category, parseInt(dataset.partId));
    if (!part) return;

    this.sceneService.addItem(part, { x: 0.5, y: 0.5 });
    this._announce('Teil hinzugefügt');
  }

  _addRandomPart() {
    const random = partCatalog.getRandomPart();
    if (!random) return;

    this.sceneService.addItem(random.part, { x: 0.5, y: 0.5 });
    this._announce('Zufälliges Teil hinzugefügt');
  }

  _announce(message) {
    this.store.dispatch(
      Actions.announce(message),
      require('../../core/state/reducers.js').rootReducer
    );
  }
}
