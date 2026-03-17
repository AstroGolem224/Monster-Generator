export function hashSeed(input) {
  const text = `${input ?? ''}`.trim() || 'monster-generator';
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seedInput) {
  let state = hashSeed(seedInput) || 1;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDeterministic(list, rng) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = Math.floor(rng() * list.length);
  return list[index] ?? null;
}
