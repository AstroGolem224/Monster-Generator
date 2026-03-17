/**
 * Canvas Controller - Manages the preview canvas
 */

import { assetLoader } from '../../infrastructure/assets/AssetLoader.js';
import { PREVIEW_SIZE, BASE_SIZE_RATIO } from '../../config/constants.js';
import { Actions } from '../../core/state/actions.js';
import { emberParticles } from '../effects/EmberParticles.js';

const GRID_STEP = 0.125;

export class CanvasController {
  constructor(store, sceneService, reducers) {
    this.store = store;
    this.sceneService = sceneService;
    this.reducers = reducers;
    
    this.canvas = document.getElementById('previewCanvas');
    this.ctx = this.canvas?.getContext('2d');
    
    this.isDragging = false;
    this.draggedItemId = null;
    this.renderPending = false;
    this.snapEnabled = false;
    this.guidesEnabled = false;
    
    this._boundMouseMove = this._handleMouseMove.bind(this);
    this._boundMouseUp = this._handleMouseUp.bind(this);
    this._boundUnsubscribe = null;
    this._boundPrecisionChange = this._handlePrecisionChange.bind(this);
  }

  async init() {
    if (!this.canvas || !this.ctx) {
      console.warn('[CanvasController] Canvas not found');
      return;
    }

    this.canvas.width = PREVIEW_SIZE;
    this.canvas.height = PREVIEW_SIZE;

    this._offscreenCanvas = document.createElement('canvas');
    this._offscreenCanvas.width = PREVIEW_SIZE;
    this._offscreenCanvas.height = PREVIEW_SIZE;
    this._offscreenCtx = this._offscreenCanvas.getContext('2d');

    this._setupEventListeners();
    this._subscribeToState();
    emberParticles.start();
    this._scheduleRender();
  }

  _setupEventListeners() {
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
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mouseup', this._boundMouseUp);
    document.addEventListener('monster:precision-change', this._boundPrecisionChange);
  }

  _handlePrecisionChange(event) {
    this.snapEnabled = !!event.detail?.snapEnabled;
    this.guidesEnabled = !!event.detail?.guidesEnabled;
    this._scheduleRender();
  }

  _handleMouseMove(e) {
    if (!this.isDragging || !this.draggedItemId) return;
    const pos = this._getCanvasPoint(e);
    let normPos = this._pixelToNormalized(pos.x, pos.y);
    if (this.snapEnabled) {
      normPos = {
        x: snapValue(normPos.x, GRID_STEP),
        y: snapValue(normPos.y, GRID_STEP)
      };
    }
    this.sceneService.moveItem(this.draggedItemId, normPos);
  }

  _handleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedItemId = null;
    }
  }

  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('dragover', this._boundDragOver);
      this.canvas.removeEventListener('drop', this._boundDrop);
      this.canvas.removeEventListener('mousedown', this._boundMouseDown);
    }
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mouseup', this._boundMouseUp);
    document.removeEventListener('monster:precision-change', this._boundPrecisionChange);
    if (this._boundUnsubscribe) this._boundUnsubscribe();
    if (emberParticles) emberParticles.stop();
  }

  _subscribeToState() {
    this._boundUnsubscribe = this.store.subscribe((state, prevState) => {
      const itemsChanged = JSON.stringify(state.scene.placedItems) !== JSON.stringify(prevState?.scene?.placedItems);
      const selectionChanged = state.scene.selectedItemId !== prevState?.scene?.selectedItemId;
      if (itemsChanged || selectionChanged) this._scheduleRender();
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
    const decorations = this.store.select(state => state.ui.decorations);
    this._offscreenCtx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    this._drawDecorBackground(this._offscreenCtx, decorations);

    if (this.guidesEnabled) {
      this._drawPrecisionGuides(this._offscreenCtx);
    }
    if (this.snapEnabled) {
      this._drawGrid(this._offscreenCtx);
    }
    
    if (!items || items.length === 0) {
      this._drawEmptyPlaceholder(this._offscreenCtx);
      this._drawDecorOverlay(this._offscreenCtx, decorations);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this._offscreenCanvas, 0, 0);
      return;
    }

    const baseHalf = (PREVIEW_SIZE * BASE_SIZE_RATIO) / 2;
    const uncachedUrls = items.map(item => item.assetUrl).filter(url => !assetLoader.isCached(url));
    if (uncachedUrls.length > 0) {
      await assetLoader.preload(uncachedUrls);
    }

    for (const item of items) {
      const cx = item.x * PREVIEW_SIZE;
      const cy = item.y * PREVIEW_SIZE;
      const img = assetLoader.getCached(item.assetUrl);
      this._drawItem(this._offscreenCtx, item, cx, cy, baseHalf, img, item.id === selectedId);
    }

    this._drawDecorOverlay(this._offscreenCtx, decorations);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this._offscreenCanvas, 0, 0);
  }

  _drawDecorBackground(ctx, decorations) {
    switch (decorations?.background) {
      case 'midnight': {
        const g = ctx.createLinearGradient(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        g.addColorStop(0, '#09111f');
        g.addColorStop(1, '#1a2740');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        break;
      }
      case 'slime-lab': {
        const g = ctx.createLinearGradient(0, 0, 0, PREVIEW_SIZE);
        g.addColorStop(0, '#112b1d');
        g.addColorStop(1, '#59d67c');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        break;
      }
      case 'sunset': {
        const g = ctx.createLinearGradient(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        g.addColorStop(0, '#ff8a5b');
        g.addColorStop(0.5, '#ff4db8');
        g.addColorStop(1, '#5b4bff');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        break;
      }
      case 'ember-glow':
      default: {
        const g = ctx.createRadialGradient(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE * 0.1, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE * 0.8);
        g.addColorStop(0, 'rgba(255,123,46,0.35)');
        g.addColorStop(1, '#100f13');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      }
    }
  }

  _drawDecorOverlay(ctx, decorations) {
    if (!decorations) return;
    this._drawSticker(ctx, decorations.sticker);
    this._drawFrame(ctx, decorations.frame);
    this._drawTitle(ctx, decorations.title);
  }

  _drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(201, 151, 42, 0.12)';
    ctx.lineWidth = 1;
    for (let step = GRID_STEP; step < 1; step += GRID_STEP) {
      const pos = step * PREVIEW_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, PREVIEW_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(PREVIEW_SIZE, pos);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawPrecisionGuides(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(13, 232, 245, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(PREVIEW_SIZE / 2, 0);
    ctx.lineTo(PREVIEW_SIZE / 2, PREVIEW_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, PREVIEW_SIZE / 2);
    ctx.lineTo(PREVIEW_SIZE, PREVIEW_SIZE / 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawItem(ctx, item, cx, cy, baseHalf, img, isSelected) {
    const size = 2 * baseHalf * item.scale;
    const half = size / 2;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((item.rotation * Math.PI) / 180);
    ctx.translate(-half, -half);
    
    if (item.flipH || item.flipV) {
      ctx.translate(half, half);
      ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
      ctx.translate(-half, -half);
    }
    
    if (img) {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
    } else {
      this._drawPlaceholder(ctx, half, half, half, item.color);
    }
    
    if (isSelected) {
      ctx.shadowColor = '#d4520a';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#ff7b2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-2, -2, size + 4, size + 4);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 123, 46, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, size - 4, size - 4);
    }
    
    ctx.restore();
  }

  _drawFrame(ctx, frame) {
    if (frame === 'none') return;
    ctx.save();
    switch (frame) {
      case 'arcade':
        ctx.strokeStyle = '#0de8f5';
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, PREVIEW_SIZE - 16, PREVIEW_SIZE - 16);
        break;
      case 'slime':
        ctx.strokeStyle = '#7fffa1';
        ctx.lineWidth = 12;
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(10, 10, PREVIEW_SIZE - 20, PREVIEW_SIZE - 20);
        break;
      case 'ember-frame':
      default:
        ctx.strokeStyle = '#d4520a';
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, PREVIEW_SIZE - 16, PREVIEW_SIZE - 16);
        ctx.strokeStyle = 'rgba(255, 180, 90, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 18, PREVIEW_SIZE - 36, PREVIEW_SIZE - 36);
        break;
    }
    ctx.restore();
  }

  _drawSticker(ctx, sticker) {
    ctx.save();
    ctx.font = `${Math.round(PREVIEW_SIZE * 0.08)}px sans-serif`;
    switch (sticker) {
      case 'spark':
        ctx.fillText('✦', PREVIEW_SIZE * 0.12, PREVIEW_SIZE * 0.18);
        ctx.fillText('✦', PREVIEW_SIZE * 0.8, PREVIEW_SIZE * 0.22);
        break;
      case 'stars':
        ctx.fillText('★', PREVIEW_SIZE * 0.1, PREVIEW_SIZE * 0.16);
        ctx.fillText('★', PREVIEW_SIZE * 0.82, PREVIEW_SIZE * 0.2);
        ctx.fillText('★', PREVIEW_SIZE * 0.18, PREVIEW_SIZE * 0.86);
        break;
      case 'hearts':
        ctx.fillText('❤', PREVIEW_SIZE * 0.1, PREVIEW_SIZE * 0.17);
        ctx.fillText('❤', PREVIEW_SIZE * 0.82, PREVIEW_SIZE * 0.24);
        break;
      case 'danger':
        ctx.fillStyle = 'rgba(255,214,10,0.9)';
        ctx.fillRect(PREVIEW_SIZE * 0.04, PREVIEW_SIZE * 0.08, PREVIEW_SIZE * 0.3, PREVIEW_SIZE * 0.06);
        ctx.fillRect(PREVIEW_SIZE * 0.66, PREVIEW_SIZE * 0.86, PREVIEW_SIZE * 0.3, PREVIEW_SIZE * 0.06);
        break;
    }
    ctx.restore();
  }

  _drawTitle(ctx, title) {
    if (!title) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(PREVIEW_SIZE * 0.12, PREVIEW_SIZE * 0.84, PREVIEW_SIZE * 0.76, PREVIEW_SIZE * 0.09);
    ctx.fillStyle = '#f5e7c2';
    ctx.font = `700 ${Math.round(PREVIEW_SIZE * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title.slice(0, 24), PREVIEW_SIZE / 2, PREVIEW_SIZE * 0.9);
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
    ctx.shadowColor = '#d4520a';
    ctx.shadowBlur = 30;
    ctx.fillStyle = 'rgba(212, 82, 10, 0.1)';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
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
    let normPos = this._pixelToNormalized(pos.x, pos.y);
    if (this.snapEnabled) {
      normPos = {
        x: snapValue(normPos.x, GRID_STEP),
        y: snapValue(normPos.y, GRID_STEP)
      };
    }

    this.sceneService.addItem(data, normPos);
    this._announce('Teil hinzugefügt');
  }

  _hitTest(px, py) {
    const items = this.store.select(state => state.scene.placedItems);
    const baseHalf = (PREVIEW_SIZE * BASE_SIZE_RATIO) / 2;
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const cx = item.x * PREVIEW_SIZE;
      const cy = item.y * PREVIEW_SIZE;
      const size = 2 * baseHalf * item.scale;
      const half = size / 2;
      const rad = (item.rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const dx = px - cx;
      const dy = py - cy;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      if (Math.abs(localX) <= half && Math.abs(localY) <= half) return item;
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
    this.store.dispatch(Actions.announce(message), this.reducers);
  }
}

function snapValue(value, step) {
  return Math.max(0, Math.min(1, Math.round(value / step) * step));
}
