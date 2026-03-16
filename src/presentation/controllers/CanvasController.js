/**
 * Canvas Controller - Manages the preview canvas
 */

import { assetLoader } from '../../infrastructure/assets/AssetLoader.js';
import { PREVIEW_SIZE, BASE_SIZE_RATIO } from '../../config/constants.js';
import { Actions } from '../../core/state/actions.js';

export class CanvasController {
  constructor(store, sceneService) {
    this.store = store;
    this.sceneService = sceneService;
    
    this.canvas = document.getElementById('previewCanvas');
    this.ctx = this.canvas?.getContext('2d');
    
    // Interaction state
    this.isDragging = false;
    this.draggedItemId = null;
    this.renderPending = false;
  }

  async init() {
    if (!this.canvas || !this.ctx) {
      console.warn('[CanvasController] Canvas not found');
      return;
    }

    // Set canvas size
    this.canvas.width = PREVIEW_SIZE;
    this.canvas.height = PREVIEW_SIZE;

    this._setupEventListeners();
    this._subscribeToState();
    
    // Initial render
    this._scheduleRender();
  }

  _setupEventListeners() {
    // Drop handling
    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this._handleDrop(e);
    });

    // Mouse interactions
    this.canvas.addEventListener('mousedown', (e) => {
      const pos = this._getCanvasPoint(e);
      const hitItem = this._hitTest(pos.x, pos.y);
      
      if (hitItem) {
        this.draggedItemId = hitItem.id;
        this.sceneService.selectItem(hitItem.id);
        this.isDragging = true;
      } else {
        this.sceneService.selectItem(null);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.draggedItemId) return;
      
      const pos = this._getCanvasPoint(e);
      const normPos = this._pixelToNormalized(pos.x, pos.y);
      
      this.sceneService.moveItem(this.draggedItemId, normPos);
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.draggedItemId = null;
      }
    });
  }

  _subscribeToState() {
    this.store.subscribe((state, prevState) => {
      const itemsChanged = JSON.stringify(state.scene.placedItems) !== 
                          JSON.stringify(prevState?.scene?.placedItems);
      const selectionChanged = state.scene.selectedItemId !== prevState?.scene?.selectedItemId;
      
      if (itemsChanged || selectionChanged) {
        this._scheduleRender();
      }
    });
  }

  _scheduleRender() {
    if (this.renderPending) return;
    
    this.renderPending = true;
    requestAnimationFrame(() => {
      this.renderPending = false;
      this._render();
    });
  }

  async _render() {
    const items = this.store.select(state => state.scene.placedItems);
    const selectedId = this.store.select(state => state.scene.selectedItemId);
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw empty placeholder
    if (!items || items.length === 0) {
      this._drawEmptyPlaceholder();
      return;
    }

    const baseHalf = (PREVIEW_SIZE * BASE_SIZE_RATIO) / 2;

    // Preload missing images
    const urls = items.map(item => item.assetUrl);
    await assetLoader.preload(urls);

    // Draw each item
    for (const item of items) {
      const cx = item.x * PREVIEW_SIZE;
      const cy = item.y * PREVIEW_SIZE;
      const img = assetLoader.getCached(item.assetUrl);
      
      this._drawItem(item, cx, cy, baseHalf, img, item.id === selectedId);
    }
  }

  _drawItem(item, cx, cy, baseHalf, img, isSelected) {
    const size = 2 * baseHalf * item.scale;
    const half = size / 2;
    
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate((item.rotation * Math.PI) / 180);
    this.ctx.translate(-half, -half);
    
    // Apply flipping
    if (item.flipH || item.flipV) {
      this.ctx.translate(half, half);
      this.ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
      this.ctx.translate(-half, -half);
    }
    
    if (img) {
      this.ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
    } else {
      // Draw placeholder
      this._drawPlaceholder(half, half, half, item.color);
    }
    
    // Selection highlight
    if (isSelected) {
      this.ctx.strokeStyle = '#2e7d32';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(0, 0, size, size);
    }
    
    this.ctx.restore();
  }

  _drawPlaceholder(x, y, radius, color) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = Math.max(2, radius * 0.08);
    this.ctx.stroke();
  }

  _drawEmptyPlaceholder() {
    const center = PREVIEW_SIZE / 2;
    const radius = PREVIEW_SIZE * 0.25;
    
    this.ctx.fillStyle = 'rgba(46, 125, 50, 0.15)';
    this.ctx.beginPath();
    this.ctx.arc(center, center, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _handleDrop(e) {
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }

    if (!data?.assetUrl) return;

    const pos = this._getCanvasPoint(e);
    const normPos = this._pixelToNormalized(pos.x, pos.y);

    this.sceneService.addItem(data, normPos);
    this._announce('Teil hinzugefügt');
  }

  _hitTest(px, py) {
    const items = this.store.select(state => state.scene.placedItems);
    const baseHalf = (PREVIEW_SIZE * BASE_SIZE_RATIO) / 2;

    // Check in reverse order (top items first)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const cx = item.x * PREVIEW_SIZE;
      const cy = item.y * PREVIEW_SIZE;
      const size = 2 * baseHalf * item.scale;
      const half = size / 2;

      // Transform point to local space
      const rad = (item.rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const dx = px - cx;
      const dy = py - cy;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      if (Math.abs(localX) <= half && Math.abs(localY) <= half) {
        return item;
      }
    }
    return null;
  }

  _getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _pixelToNormalized(px, py) {
    return {
      x: Math.max(0, Math.min(1, px / this.canvas.width)),
      y: Math.max(0, Math.min(1, py / this.canvas.height))
    };
  }

  _announce(message) {
    this.store.dispatch(
      Actions.announce(message),
      require('../../core/state/reducers.js').rootReducer
    );
  }
}
