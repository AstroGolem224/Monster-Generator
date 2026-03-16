import { describe, it, expect } from 'vitest';
import {
  createPreset,
  updatePreset,
  renamePreset,
  serializePreset,
  deserializePreset,
  isEqualPreset,
  getPresetInfo
} from '../../../src/core/entities/Preset.js';
import { createPlacedItem } from '../../../src/core/entities/PlacedItem.js';

describe('Preset', () => {
  describe('createPreset', () => {
    it('should create preset with valid name', () => {
      const items = [createPlacedItem({ categoryId: 'body' })];
      const preset = createPreset({ name: 'My Preset', items });

      expect(preset.name).toBe('My Preset');
      expect(preset.items).toHaveLength(1);
      expect(preset.createdAt).toBeDefined();
      expect(preset.updatedAt).toBeDefined();
    });

    it('should trim name', () => {
      const preset = createPreset({ name: '  Trimmed  ', items: [] });
      expect(preset.name).toBe('Trimmed');
    });

    it('should throw on empty name', () => {
      expect(() => {
        createPreset({ name: '', items: [] });
      }).toThrow('Preset name is required');
    });

    it('should throw on too long name', () => {
      expect(() => {
        createPreset({ name: 'a'.repeat(31), items: [] });
      }).toThrow('too long');
    });

    it('should throw on invalid characters', () => {
      expect(() => {
        createPreset({ name: 'Invalid@Name!', items: [] });
      }).toThrow('invalid characters');
    });

    it('should freeze preset', () => {
      const preset = createPreset({ name: 'Test', items: [] });
      expect(() => { preset.name = 'Changed'; }).toThrow();
    });
  });

  describe('updatePreset', () => {
    it('should update items', () => {
      const preset = createPreset({ name: 'Test', items: [] });
      const newItems = [createPlacedItem({})];
      
      const updated = updatePreset(preset, newItems);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.name).toBe('Test');
    });
  });

  describe('renamePreset', () => {
    it('should change name', () => {
      const preset = createPreset({ name: 'OldName', items: [] });
      const renamed = renamePreset(preset, 'NewName');
      
      expect(renamed.name).toBe('NewName');
    });
  });

  describe('serializePreset / deserializePreset', () => {
    it('should roundtrip correctly', () => {
      const items = [createPlacedItem({ categoryId: 'head' })];
      const original = createPreset({ name: 'Test', items });
      
      const serialized = serializePreset(original);
      const deserialized = deserializePreset(serialized);
      
      expect(deserialized.name).toBe(original.name);
      expect(deserialized.items).toHaveLength(1);
      expect(deserialized.items[0].categoryId).toBe('head');
    });
  });

  describe('isEqualPreset', () => {
    it('should return true for identical presets', () => {
      const items = [createPlacedItem({ categoryId: 'body' })];
      const preset1 = createPreset({ name: 'Test', items });
      const preset2 = createPreset({ name: 'Test', items });
      
      expect(isEqualPreset(preset1, preset2)).toBe(true);
    });

    it('should return false for different presets', () => {
      const preset1 = createPreset({ name: 'Test1', items: [] });
      const preset2 = createPreset({ name: 'Test2', items: [] });
      
      expect(isEqualPreset(preset1, preset2)).toBe(false);
    });
  });

  describe('getPresetInfo', () => {
    it('should return display info', () => {
      const items = [createPlacedItem({}), createPlacedItem({})];
      const preset = createPreset({ name: 'MyPreset', items });
      
      const info = getPresetInfo(preset);
      
      expect(info.name).toBe('MyPreset');
      expect(info.itemCount).toBe(2);
      expect(info.createdAt).toBeDefined();
    });
  });
});
