/**
 * rng.js
 * ----------------------------------------------------------------------------
 * Small random-number helpers.
 *
 * `createSeededRandom` returns a repeatable random function. We use it for
 * generated artwork so the speckles on a grass tile look the same every time the
 * game loads, and for tests that need predictable "random" results.
 */

/**
 * A tiny, fast, well-behaved seeded generator (mulberry32).
 * @param {number} seed
 * @returns {() => number} a function returning a float in [0, 1)
 */
export function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random integer from min to max, inclusive of both. */
export function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/** Random float between min and max. */
export function randomFloat(min, max, random = Math.random) {
  return random() * (max - min) + min;
}

/** True with the given probability (0 = never, 1 = always). */
export function chance(probability, random = Math.random) {
  return random() < probability;
}

/** A random element of an array. Returns undefined for an empty array. */
export function pickRandom(items, random = Math.random) {
  if (!items || items.length === 0) return undefined;
  return items[Math.floor(random() * items.length)];
}

/**
 * Pick one entry from a list of `{ weight, ... }` objects, where a higher weight
 * means a higher chance. Used later for wild-encounter tables.
 */
export function pickWeighted(entries, random = Math.random) {
  if (!entries || entries.length === 0) return undefined;

  const total = entries.reduce((sum, entry) => sum + (entry.weight || 0), 0);
  if (total <= 0) return entries[0];

  let roll = random() * total;
  for (const entry of entries) {
    roll -= entry.weight || 0;
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}

/** Force a number to stay between min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
