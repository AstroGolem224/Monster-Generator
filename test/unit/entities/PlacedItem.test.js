import { describe, it, expect } from 'vitest';
import {
  createPlacedItem,
  updatePlacedItem,
  clonePlacedItem,
  hitTest,
  serializePlacedItem,
  deserializePlacedItem
} from '../../../src/core/entities/PlacedItem.js';

describe('PlacedItem', () => {
  describe('createPlacedItem', () => {
    it('should create item with defaults', () => {
      const item = createPlacedItem({
        categoryId: 'body',
        partId: 1,
        assetUrl: '/assets/body/1.png',
        color: '#ff0000'
      });

      expect(item.id).toBeDefined();
      expect(item.categoryId).toBe('body');
      expect(item.partId).toBe(1);
      expect(item.x).toBe(0.5);
      expect(item.y).toBe(0.5);
      expect(item.scale).toBe(1);
      expect(item.rotation).toBe(0);
      expect(item.flipH).toBe(false);
      expect(item.flipV).toBe(false);
    });

    it('should clamp position values', () => {
      const item = createPlacedItem({
        x: 2, // Should be clamped to 1
        y: -0.5 // Should be clamped to 0
      });

      expect(item.x).toBe(1);
      expect(item.y).toBe(0);
    });

    it('should clamp scale values', () => {
      const itemLow = createPlacedItem({ scale: 0.1 });
      expect(itemLow.scale).toBe(0.5);

      const itemHigh = createPlacedItem({ scale: 10 });
      expect(itemHigh.scale).toBe(4);
    });

    it('should normalize rotation', () => {
      const item = createPlacedItem({ rotation: 400 });
      expect(item.rotation).toBe(40);
    });

    it('should generate unique IDs', () => {
      const item1 = createPlacedItem({});
      const item2 = createPlacedItem({});
      expect(item1.id).not.toBe(item2.id);
    });
  });

  describe('updatePlacedItem', () => {
    it('should update item immutably', () => {
      const original = createPlacedItem({ categoryId: 'body' });
      const updated = updatePlacedItem(original, { scale: 2 });

      expect(original.scale).toBe(1);
      expect(updated.scale).toBe(2);
      expect(updated.id).toBe(original.id);
      expect(updated.categoryId).toBe('body');
    });

    it('should validate updates', () => {
      const original = createPlacedItem({});
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Invalid scale
      const updated = updatePlacedItem(original, { scale: 'invalid' });
      expect(updated.scale).toBe(1); // Unchanged

      consoleSpy.mockRestore();
    });

    it('should normalize rotation on update', () => {
      const original = createPlacedItem({ rotation: 0 });
      const updated = updatePlacedItem(original, { rotation: 720 });
      expect(updated.rotation).toBe(0);
    });
  });

  describe('clonePlacedItem', () => {
    it('should create copy with new ID', () => {
      const original = createPlacedItem({ categoryId: 'head' });
      const cloned = clonePlacedItem(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.categoryId).toBe(original.categoryId);
    });

    it('should apply overrides', () => {
      const original = createPlacedItem({ x: 0.5, y: 0.5 });
      const cloned = clonePlacedItem(original, { x: 0.7, y: 0.8 });

      expect(cloned.x).toBe(0.7);
      expect(cloned.y).toBe(0.8);
    });
  });

  describe('hitTest', () => {
    it('should detect hit within bounds', () => {
      const item = createPlacedItem({ x: 0.5, y: 0.5, scale: 1 });
      
      expect(hitTest(item, 0.5, 0.5, 0.1)).toBe(true);
      expect(hitTest(item, 0.52, 0.52, 0.1)).toBe(true);
    });

    it('should not detect hit outside bounds', () => {
      const item = createPlacedItem({ x: 0.5, y: 0.5, scale: 1 });
      
      expect(hitTest(item, 0.8, 0.8, 0.1)).toBe(false);
    });

    it('should consider scale', () => {
      const item = createPlacedItem({ x: 0.5, y: 0.5, scale: 2 });
      
      // Larger scale = larger hit area
      expect(hitTest(item, 0.6, 0.6, 0.1)).toBe(true);
    });
  });

  describe('serializePlacedItem / deserializePlacedItem', () => {
    it('should roundtrip correctly', () => {
      const original = createPlacedItem({
        categoryId: 'body',
        partId: 5,
        x: 0.3,
        y: 0.7,
        scale: 1.5,
        rotation: 45,
        flipH: true
      });

      const serialized = serializePlacedItem(original);
      const deserialized = deserializePlacedItem(serialized);

      expect(deserialized.categoryId).toBe(original.categoryId);
      expect(deserialized.partId).toBe(original.partId);
      expect(deserialized.x).toBe(original.x);
      expect(deserialized.y).toBe(original.y);
      expect(deserialized.scale).toBe(original.scale);
      expect(deserialized.rotation).toBe(original.rotation);
      expect(deserialized.flipH).toBe(original.flipH);
    });
  });
});
