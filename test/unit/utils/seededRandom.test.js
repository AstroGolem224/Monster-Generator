import { describe, it, expect } from 'vitest';
import { hashSeed, createSeededRandom, pickDeterministic } from '../../../src/utils/seededRandom.js';

describe('seededRandom', () => {
  it('hashSeed should be stable for same input', () => {
    expect(hashSeed('druid')).toBe(hashSeed('druid'));
  });

  it('createSeededRandom should produce deterministic sequences', () => {
    const rngA = createSeededRandom('monster-seed');
    const rngB = createSeededRandom('monster-seed');

    const seqA = [rngA(), rngA(), rngA(), rngA()];
    const seqB = [rngB(), rngB(), rngB(), rngB()];

    expect(seqA).toEqual(seqB);
  });

  it('pickDeterministic should pick same item for same seed progression', () => {
    const list = ['body', 'eyes', 'mouth', 'horns'];
    const rngA = createSeededRandom('alpha');
    const rngB = createSeededRandom('alpha');

    expect(pickDeterministic(list, rngA)).toBe(pickDeterministic(list, rngB));
  });
});
