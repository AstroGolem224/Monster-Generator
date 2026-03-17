import { describe, it, expect } from 'vitest';
import { Serializer } from '../../../src/infrastructure/export/Serializer.js';

describe('Serializer', () => {
  const sampleItems = [
    {
      id: 'item-1',
      categoryId: 'body',
      partId: 0,
      assetUrl: '/assets/parts/body/0.png',
      color: '#ff0000',
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      flipH: false,
      flipV: false,
      label: 'Body 1'
    },
    {
      id: 'item-2',
      categoryId: 'eyes',
      partId: 2,
      assetUrl: '/assets/parts/eyes/2.png',
      color: '#00ff00',
      x: 0.45,
      y: 0.42,
      scale: 0.8,
      rotation: 15,
      flipH: true,
      flipV: false,
      label: 'Eyes 3'
    }
  ];

  it('should roundtrip scene data through shareable format', () => {
    const encoded = Serializer.toShareable(sampleItems);
    const decoded = Serializer.fromShareable(encoded);

    expect(decoded).toHaveLength(2);
    expect(decoded[0].categoryId).toBe('body');
    expect(decoded[1].flipH).toBe(true);
    expect(decoded[1].label).toBe('Eyes 3');
  });

  it('should return empty array for invalid shareable data', () => {
    expect(Serializer.fromShareable('definitely-not-valid')).toEqual([]);
  });
});
