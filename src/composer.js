/**
 * Canvas-Compositing: zeichnet placedItems mit Position, Skalierung, Rotation.
 * Hit-Test und Export für die Drag-and-Drop-Szene.
 */

import { loadImage, getCachedImage } from './assetLoader.js';

const EXPORT_SIZE = 512;

/** Basisgröße pro Teil (Anteil an min(canvas)), vor Skalierung */
const BASE_SIZE_RATIO = 0.2;

function drawPlaceholderBlob(ctx, x, y, r, fillColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.stroke();
  ctx.restore();
}

/**
 * Zeichnet ein platziertes Teil (Bild oder Platzhalter) mit Transform inkl. Spiegelung.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ scale: number, rotation: number, flipH?: boolean, flipV?: boolean, assetUrl: string, color: string }} item
 * @param {number} cx - Pixel X (Mitte)
 * @param {number} cy - Pixel Y (Mitte)
 * @param {number} halfSize - Halbe Kantenlänge in Pixel (vor scale)
 * @param {HTMLImageElement | null} img
 */
function drawPlacedItem(ctx, item, cx, cy, halfSize, img) {
  const size = 2 * halfSize * item.scale;
  const half = size / 2;
  const flipH = !!item.flipH;
  const flipV = !!item.flipV;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.translate(-half, -half);
  if (flipH || flipV) {
    ctx.translate(half, half);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-half, -half);
  }
  if (img) {
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, size, size);
  } else {
    drawPlaceholderBlob(ctx, half, half, half, item.color);
  }
  ctx.restore();
}

/**
 * Malt alle placedItems auf das Canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ id: string, categoryId: string, partId: number, assetUrl: string, color: string, x: number, y: number, scale: number, rotation: number }>} placedItems
 * @param {() => void} [onImageLoaded]
 */
export function drawPlacedItems(canvas, placedItems, onImageLoaded) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const minSize = Math.min(w, h);
  const baseHalf = (minSize * BASE_SIZE_RATIO) / 2;

  ctx.clearRect(0, 0, w, h);

  if (!placedItems || placedItems.length === 0) {
    ctx.fillStyle = 'rgba(46, 125, 50, 0.15)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, minSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  for (const item of placedItems) {
    const cx = item.x * w;
    const cy = item.y * h;
    const img = getCachedImage(item.assetUrl);
    if (img) {
      drawPlacedItem(ctx, item, cx, cy, baseHalf, img);
    } else {
      drawPlacedItem(ctx, item, cx, cy, baseHalf, null);
      if (item.assetUrl && onImageLoaded) {
        loadImage(item.assetUrl).then(() => onImageLoaded()).catch(() => {});
      }
    }
  }
}

/**
 * Hit-Test: welches placedItem liegt unter (pixelX, pixelY)? Rückgabe von hinten (letztes in Liste = vorderstes).
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{ id: string, x: number, y: number, scale: number, rotation: number }>} placedItems
 * @param {number} pixelX
 * @param {number} pixelY
 * @returns {{ id: string } | null}
 */
export function getPlacedItemAt(canvas, placedItems, pixelX, pixelY) {
  if (!placedItems || placedItems.length === 0) return null;
  const w = canvas.width;
  const h = canvas.height;
  const minSize = Math.min(w, h);
  const baseHalf = (minSize * BASE_SIZE_RATIO) / 2;

  for (let i = placedItems.length - 1; i >= 0; i--) {
    const item = placedItems[i];
    const cx = item.x * w;
    const cy = item.y * h;
    const size = 2 * baseHalf * item.scale;
    const half = size / 2;
    const rad = (item.rotation * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);
    const dx = pixelX - cx;
    const dy = pixelY - cy;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    if (Math.abs(localX) <= half && Math.abs(localY) <= half) {
      return { id: item.id };
    }
  }
  return null;
}

/**
 * Canvas-Koordinaten (Pixel) aus Event (Mouse/Touch) relativ zum Canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {MouseEvent | TouchEvent} e
 * @returns {{ x: number, y: number } | null}
 */
export function getCanvasPoint(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX, clientY;
  if (e.type.startsWith('touch')) {
    const t = e.touches?.[0] ?? e.changedTouches?.[0];
    if (!t) return null;
    clientX = t.clientX;
    clientY = t.clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * Normalisierte Koordinaten (0–1) aus Pixel.
 */
export function pixelToNormalized(canvas, pixelX, pixelY) {
  return {
    x: pixelX / canvas.width,
    y: pixelY / canvas.height,
  };
}

/**
 * PNG-Data-URL in Export-Auflösung.
 * @param {Array<{ id: string, categoryId: string, partId: number, assetUrl: string, color: string, x: number, y: number, scale: number, rotation: number }>} placedItems
 * @returns {string}
 */
export function exportToDataURL(placedItems) {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  drawPlacedItems(canvas, placedItems || []);
  return canvas.toDataURL('image/png');
}
