import { describe, it, expect } from 'vitest';
import {
  createPart,
  createPartsForCategory,
  serializePart,
  isValidAssetUrl
} from '../../../src/core/entities/Part.js';

describe('Part', () => {
  describe('createPart', () => {
    it('should create part with correct properties', () => {
      const part = createPart({
        id: 5,
        categoryId: 'body',
        categoryLabel: 'Körper',
        color: '#ff0000'
      });

      expect(part.id).toBe(5);
      expect(part.label).toBe('Körper 6'); // id + 1
      expect(part.assetUrl).toBe('/assets/parts/body/5.png');
      expect(part.color).toBe('#ff0000');
      expect(part.categoryId).toBe('body');
    });

    it('should freeze part object', () => {
      const part = createPart({ id: 0, categoryId: 'head', categoryLabel: 'Kopf', color: '#fff' });
      expect(() => { part.id = 10; }).toThrow();
    });
  });

  describe('createPartsForCategory', () => {
    it('should create multiple parts', () => {
      const parts = createPartsForCategory({
        categoryId: 'eyes',
        categoryLabel: 'Augen',
        count: 3,
        color: '#0000ff'
      });

      expect(parts).toHaveLength(3);
      expect(parts[0].id).toBe(0);
      expect(parts[1].id).toBe(1);
      expect(parts[2].id).toBe(2);
      expect(parts[0].label).toBe('Augen 1');
    });
  });

  describe('serializePart', () => {
    it('should serialize part correctly', () => {
      const part = createPart({ id: 2, categoryId: 'mouth', categoryLabel: 'Mund', color: '#fff' });
      const serialized = serializePart(part);

      expect(serialized.id).toBe(2);
      expect(serialized.categoryId).toBe('mouth');
    });
  });

  describe('isValidAssetUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidAssetUrl('/assets/parts/body/1.png')).toBe(true);
      expect(isValidAssetUrl('https://example.com/image.png')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidAssetUrl('not-a-url')).toBe(false);
      expect(isValidAssetUrl('')).toBe(false);
      expect(isValidAssetUrl(null)).toBe(false);
    });
  });
});
