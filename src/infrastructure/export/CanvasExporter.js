/**
 * Canvas Export Functionality
 */

import { EXPORT_SIZE } from '../../config/constants.js';
import { assetLoader } from '../assets/AssetLoader.js';

/**
 * @typedef {Object} ExportOptions
 * @property {number} [size=512] - Export size in pixels
 * @property {string} [format='image/png'] - MIME type
 * @property {number} [quality=0.92] - JPEG quality (0-1)
 * @property {string} [background='transparent'] - Background color or 'transparent'
 */

export class CanvasExporter {
  /**
   * @param {ExportOptions} [defaultOptions]
   */
  constructor(defaultOptions = {}) {
    this._defaultOptions = {
      size: EXPORT_SIZE,
      format: 'image/png',
      quality: 0.92,
      background: 'transparent',
      ...defaultOptions
    };
  }

  /**
   * Export placed items to Data URL
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @param {ExportOptions} [options]
   * @returns {Promise<string>}
   */
  async exportToDataURL(items, options = {}) {
    const opts = { ...this._defaultOptions, ...options };
    const canvas = this._createCanvas(opts.size);
    
    await this._renderItems(canvas, items, opts);
    
    return canvas.toDataURL(opts.format, opts.quality);
  }

  /**
   * Export placed items to Blob
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @param {ExportOptions} [options]
   * @returns {Promise<Blob>}
   */
  async exportToBlob(items, options = {}) {
    const opts = { ...this._defaultOptions, ...options };
    const canvas = this._createCanvas(opts.size);
    
    await this._renderItems(canvas, items, opts);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), opts.format, opts.quality);
    });
  }

  /**
   * Export and trigger download
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @param {string} filename
   * @param {ExportOptions} [options]
   */
  async download(items, filename = 'monster.png', options = {}) {
    const dataUrl = await this.exportToDataURL(items, options);
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate a preview thumbnail
   * @param {Array<import('../../core/entities/PlacedItem').PlacedItem>} items
   * @param {number} [size=128]
   * @returns {Promise<string>}
   */
  async generateThumbnail(items, size = 128) {
    return this.exportToDataURL(items, { size, format: 'image/jpeg', quality: 0.8 });
  }

  // Private methods

  _createCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  async _renderItems(canvas, items, options) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Background
    if (options.background !== 'transparent') {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, size, size);
    }
    
    if (!items || items.length === 0) {
      // Draw placeholder when empty
      this._drawEmptyPlaceholder(ctx, size);
      return;
    }

    // Calculate base size
    const baseHalf = (size * 0.2) / 2;

    // Preload all images
    const urls = items.map(item => item.assetUrl);
    await assetLoader.preload(urls);

    // Draw each item
    for (const item of items) {
      const cx = item.x * size;
      const cy = item.y * size;
      const img = assetLoader.getCached(item.assetUrl);
      
      await this._drawItem(ctx, item, cx, cy, baseHalf, img);
    }
  }

  _drawItem(ctx, item, cx, cy, baseHalf, img) {
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

  _drawEmptyPlaceholder(ctx, size) {
    const center = size / 2;
    const radius = size * 0.25;
    
    ctx.fillStyle = 'rgba(46, 125, 50, 0.15)';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Export singleton
export const canvasExporter = new CanvasExporter();
