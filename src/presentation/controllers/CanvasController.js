/**
 * Canvas Controller - Manages the preview canvas
 */

import { assetLoader } from '../../infrastructure/assets/AssetLoader.js';
import { PREVIEW_SIZE, BASE_SIZE_RATIO } from '../../config/constants.js';
import { Actions } from '../../core/state/actions.js';
import { emberParticles } from '../effects/EmberParticles.js';

export class CanvasController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.canvas = document.getElementById('previewCanvas');
    this.ctx = this.canvas?.getContext('2d');
    
    // Interaction state
    this.isDragging = false;
    this.draggedItemId = null;
    this.renderPending = false;
    
    // Bound event handlers for cleanup
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._boundUnsubscribe = null;
  }

  async init() {
    if (!this.canvas || !this.ctx) {
      console.warn('[CanvasController] Canvas not found');
      return;
    }

    // Set canvas size
    this.canvas.width = PREVIEW_SIZE;
    this.canvas.height = PREVIEW_SIZE;

    // Create offscreen canvas for double buffering
    this._offscreenCanvas = document.createElement('canvas');
    this._offscreenCanvas.width = PREVIEW_SIZE;
    this._offscreenCanvas.height = PREVIEW_SIZE;
    this._offscreenCtx = this._offscreenCanvas.getContext('2d');

    this._setupEventListeners();
    this._subscribeToState();
    
    // Start particle system
    emberParticles.start();
    
    // Initial render
    this._scheduleRender();
  }

  _setupEventListeners() {
    // Drop handling
    this._boundDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    };
    this._boundDrop = (e) => {
      e.preventDefault();
      this._handleDrop(e);
    };
    this._boundMouseDown = (e) => {
      const pos = this._getCanvasPoint(e);
      const hitItem = this._hitTest(pos.x, pos.y);
      
      if (hitItem) {
        this.draggedItemId = hitItem.id;
        this.sceneService.selectItem(hitItem.id);
        this.isDragging = true;
      } else {
        this.sceneService.selectItem(null);
      }
    };

    this.canvas.addEventListener('dragover', this._boundDragOver);
    this.canvas.addEventListener('drop', this._boundDrop);
    this.canvas.addEventListener('mousedown', this._boundMouseDown);

    // Window events (need cleanup)
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);
  }

  _handleMouseMove(e) {
    if (!this.isDragging || !this.draggedItemId) return;
    
    const pos = this._getCanvasPoint(e);
    const normPos = this._pixelToNormalized(pos.x, pos.y);
    
    this.sceneService.moveItem(this.draggedItemId, normPos);
  }

  _handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedItemId = null;
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  destroy() {
    // Remove canvas event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('dragover', this._boundDragOver);
      this.canvas.removeEventListener('drop', this._boundDrop);
      this.canvas.removeEventListener('mousedown', this._boundMouseDown);
    }

    // Remove window event listeners
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);

    // Unsubscribe from store
    if (this._boundUnsubscribe) {
      this._boundUnsubscribe();
    }

    // Stop particle system
    if (emberParticles) {
      emberParticles.stop();
    }
  }

  _subscribeToState() {
    this._boundUnsubscribe = this.store.subscribe((state, prevState) => {
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
    
    // Clear offscreen canvas
    this._offscreenCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    
    // Draw empty placeholder
    if (!items || items.length === 0) {
      this._drawEmptyPlaceholder(this._offscreenCtx);
      // Copy to main canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this._offscreenCanvas, 0, 0);
      return;
    }

    const baseHalf = (PREVIEW_SIZE * BASE_SIZE_RATIO) / 2;

    // Preload missing images (only uncached ones)
    const uncachedUrls = items
      .map(item => item.assetUrl)
      .filter(url => !assetLoader.isCached(url));
    
    if (uncachedUrls.length > 0) {
      await assetLoader.preload(uncachedUrls);
    }

    // Draw each item to offscreen canvas
    for (const item of items) {
      const cx = item.x * PREVIEW_SIZE;
      const cy = item.y * PREVIEW_SIZE;
      const img = assetLoader.getCached(item.assetUrl);
      
      this._drawItem(this._offscreenCtx, item, cx, cy, baseHalf, img, item.id === selectedId);
    }

    // Copy offscreen to main canvas in one operation
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this._offscreenCanvas, 0, 0);
  }

  _drawItem(ctx, item, cx, cy, baseHalf, img, isSelected) {
    const size = 2 * baseHalf * item.scale;
    const half = size / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.translate(-half, -half);
    
    // Apply flipping
    if (item.flipH || item.flipV) {
      ctx.translate(half, half);
      ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
      ctx.translate(-half, -half);
    }
    
    if (img) {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
    } else {
      // Draw placeholder
      this._drawPlaceholder(ctx, half, half, half, item.color);
    }
    
    // Selection highlight — Ember glow effect
    if (isSelected) {
      // Outer glow
      ctx.shadowColor = '#d4520a';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ff7b2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, size + 4, size + 4);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Inner highlight
      ctx.strokeStyle = 'rgba(255, 123, 46, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, size - 4, size - 4);
    }
    
    ctx.restore();
  }

  _drawPlaceholder(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = Math.max(2, radius * 0.08);
    ctx.stroke();
  }

  _drawEmptyPlaceholder(ctx) {
    const center = PREVIEW_SIZE / 2;
    const radius = PREVIEW_SIZE * 0.25;
    
    // Ember-colored placeholder with glow
    ctx.shadowColor = '#d4520a';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(212, 82, 10, 0.1)';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Inner ring
    ctx.strokeStyle = 'rgba(212, 82, 10, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
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
      this.reducers
    );
  }
}
