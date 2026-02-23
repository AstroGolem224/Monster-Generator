/**
 * Lädt Teil-Assets (Bilder), Cache, Fehler → Caller nutzt Platzhalter.
 */

const CACHE = new Map();
const FAILED = new Set();
const LOADING = new Map();
const MAX_CACHE = 80;

/**
 * Lädt ein Bild; bei Erfolg im Cache speichern, bei Fehler reject.
 * Dedupliziert laufende Requests und merkt sich fehlgeschlagene URLs.
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
  if (FAILED.has(url)) return Promise.reject(new Error(`Previously failed: ${url}`));

  const cached = CACHE.get(url);
  if (cached) return Promise.resolve(cached);

  const inflight = LOADING.get(url);
  if (inflight) return inflight;

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (CACHE.size >= MAX_CACHE) {
        const first = CACHE.keys().next().value;
        if (first != null) CACHE.delete(first);
      }
      CACHE.set(url, img);
      LOADING.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      FAILED.add(url);
      LOADING.delete(url);
      reject(new Error(`Failed to load: ${url}`));
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });

  LOADING.set(url, promise);
  return promise;
}

/**
 * Liefert gecachtes Bild oder null.
 * @param {string} url
 * @returns {HTMLImageElement | null}
 */
export function getCachedImage(url) {
  return CACHE.get(url) ?? null;
}
