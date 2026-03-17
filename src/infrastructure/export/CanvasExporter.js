/**
 * Canvas Export Functionality
 */

import { EXPORT_SIZE } from '../../config/constants.js';
import { assetLoader } from '../assets/AssetLoader.js';

export class CanvasExporter {
  constructor(defaultOptions = {}) {
    this._defaultOptions = {
      size: EXPORT_SIZE,
      format: 'image/png',
      quality: 0.92,
      background: 'transparent',
      decorations: null,
      ...defaultOptions
    };
  }

  async exportToDataURL(items, options = {}) {
    const opts = { ...this._defaultOptions, ...options };
    const canvas = this._createCanvas(opts.size);
    await this._renderItems(canvas, items, opts);
    return canvas.toDataURL(opts.format, opts.quality);
  }

  async exportToBlob(items, options = {}) {
    const opts = { ...this._defaultOptions, ...options };
    const canvas = this._createCanvas(opts.size);
    await this._renderItems(canvas, items, opts);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), opts.format, opts.quality);
    });
  }

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

  async generateThumbnail(items, size = 128) {
    return this.exportToDataURL(items, { size, format: 'image/jpeg', quality: 0.8 });
  }

  _createCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }

  async _renderItems(canvas, items, options) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    const decorations = options.decorations || null;
    this._drawDecorations(ctx, size, decorations, 'background');

    if (options.background !== 'transparent') {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, size, size);
    }

    if (!items || items.length === 0) {
      this._drawEmptyPlaceholder(ctx, size);
      this._drawDecorations(ctx, size, decorations, 'overlay');
      return;
    }

    const baseHalf = (size * 0.2) / 2;
    const urls = items.map(item => item.assetUrl);
    await assetLoader.preload(urls);

    for (const item of items) {
      const cx = item.x * size;
      const cy = item.y * size;
      const img = assetLoader.getCached(item.assetUrl);
      this._drawItem(ctx, item, cx, cy, baseHalf, img);
    }

    this._drawDecorations(ctx, size, decorations, 'overlay');
  }

  _drawItem(ctx, item, cx, cy, baseHalf, img) {
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
    ctx.restore();
  }

  _drawDecorations(ctx, size, decorations, phase) {
    if (!decorations) return;
    if (phase === 'background') {
      drawBackground(ctx, size, decorations.background);
    }
    if (phase === 'overlay') {
      drawSticker(ctx, size, decorations.sticker);
      drawFrame(ctx, size, decorations.frame);
      drawTitle(ctx, size, decorations.title);
    }
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

function drawBackground(ctx, size, background) {
  switch (background) {
    case 'midnight': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#09111f');
      g.addColorStop(1, '#1a2740');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case 'slime-lab': {
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, '#112b1d');
      g.addColorStop(1, '#59d67c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case 'sunset': {
      const g = ctx.createLinearGradient(0, 0, size, size);
      g.addColorStop(0, '#ff8a5b');
      g.addColorStop(0.5, '#ff4db8');
      g.addColorStop(1, '#5b4bff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
    case 'ember-glow':
    default: {
      const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.8);
      g.addColorStop(0, 'rgba(255,123,46,0.35)');
      g.addColorStop(1, '#100f13');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      break;
    }
  }
}

function drawFrame(ctx, size, frame) {
  if (frame === 'none') return;
  ctx.save();
  switch (frame) {
    case 'arcade':
      ctx.strokeStyle = '#0de8f5';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, size - 20, size - 20);
      break;
    case 'slime':
      ctx.strokeStyle = '#7fffa1';
      ctx.lineWidth = 16;
      ctx.setLineDash([12, 10]);
      ctx.strokeRect(12, 12, size - 24, size - 24);
      break;
    case 'ember-frame':
    default:
      ctx.strokeStyle = '#d4520a';
      ctx.lineWidth = 12;
      ctx.strokeRect(10, 10, size - 20, size - 20);
      ctx.strokeStyle = 'rgba(255, 180, 90, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(22, 22, size - 44, size - 44);
      break;
  }
  ctx.restore();
}

function drawSticker(ctx, size, sticker) {
  ctx.save();
  ctx.font = `${Math.round(size * 0.09)}px sans-serif`;
  switch (sticker) {
    case 'spark':
      ctx.fillText('✦', size * 0.13, size * 0.18);
      ctx.fillText('✦', size * 0.82, size * 0.22);
      ctx.fillText('✦', size * 0.75, size * 0.84);
      break;
    case 'stars':
      ctx.fillText('★', size * 0.12, size * 0.16);
      ctx.fillText('★', size * 0.82, size * 0.2);
      ctx.fillText('★', size * 0.18, size * 0.82);
      break;
    case 'hearts':
      ctx.fillText('❤', size * 0.11, size * 0.18);
      ctx.fillText('❤', size * 0.82, size * 0.22);
      break;
    case 'danger':
      ctx.fillStyle = 'rgba(255, 214, 10, 0.9)';
      ctx.fillRect(size * 0.05, size * 0.08, size * 0.3, size * 0.08);
      ctx.fillRect(size * 0.65, size * 0.82, size * 0.3, size * 0.08);
      break;
  }
  ctx.restore();
}

function drawTitle(ctx, size, title) {
  if (!title) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(size * 0.12, size * 0.84, size * 0.76, size * 0.1);
  ctx.fillStyle = '#f5e7c2';
  ctx.font = `700 ${Math.round(size * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(title.slice(0, 24), size / 2, size * 0.905);
  ctx.restore();
}

export const canvasExporter = new CanvasExporter();
