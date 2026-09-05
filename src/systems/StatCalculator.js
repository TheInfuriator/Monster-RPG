/**
 * StatCalculator.js
 * ----------------------------------------------------------------------------
 * Turns a species' base stats and a level into the numbers a battle uses, and
 * handles the experience curves that decide when a creature levels up.
 *
 * Pure maths, no Phaser, fully unit tested.
 *
 * THE STAT FORMULA
 *   HP     = floor(2 * base * level / 100) + level + 10
 *   others = floor(2 * base * level / 100) + 5
 *
 * HP gets the extra `+ level + 10` so creatures always have a healthy buffer and
 * low-level battles are not decided by a single hit.
 *
 * DESIGN NOTE — no individual variance.
 * Two creatures of the same species at the same level have identical stats.
 * Real monster RPGs add hidden per-individual values here, but that is a lot of
 * hidden complexity for a player to reason about and for us to explain. The
 * formula has an obvious place to add them later if we ever want to.
 *
 * THE EXPERIENCE CURVES
 * Three curves only, all cubic, differing by a single multiplier:
 *   fast    0.8 * level^3     reaches high levels soonest
 *   medium  1.0 * level^3
 *   slow    1.25 * level^3    slowest, used by the strongest families
 * Fewer curves means balance is much easier to reason about.
 */

import { PROGRESSION } from '../config/balance.js';

/** The six stats every creature has. `hp` is special-cased in the formula. */
export const STAT_KEYS = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];

/** Human-readable stat names, for the creature detail screen. */
export const STAT_NAMES = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  spAttack: 'Sp. Atk',
  spDefense: 'Sp. Def',
  speed: 'Speed',
};

/** Multiplier applied to level^3 for each growth rate. */
export const GROWTH_RATES = {
  fast: 0.8,
  medium: 1.0,
  slow: 1.25,
};

export const GROWTH_RATE_IDS = Object.keys(GROWTH_RATES);
export const GROWTH_RATE_SET = new Set(GROWTH_RATE_IDS);

/**
 * Keep a level inside the legal range, whatever nonsense is passed in.
 *
 * Anything that is not a finite number — NaN, undefined, Infinity, a corrupted
 * save — becomes level 1 rather than the cap. That is deliberate: a level 1
 * creature appearing by mistake is a harmless oddity, whereas a level 100 one
 * would quietly break the game's balance.
 */
export function clampLevel(level) {
  if (!Number.isFinite(level)) return 1;
  return Math.min(Math.max(Math.floor(level), 1), PROGRESSION.maxLevel);
}

/**
 * One stat's value at a given level.
 *
 * @param {string} statKey  one of STAT_KEYS
 * @param {number} baseValue the species' base stat
 * @param {number} level
 * @returns {number}
 */
export function calculateStat(statKey, baseValue, level) {
  const safeLevel = clampLevel(level);
  const core = Math.floor((2 * baseValue * safeLevel) / 100);

  return statKey === 'hp' ? core + safeLevel + 10 : core + 5;
}

/**
 * Every stat for a species at a level.
 *
 * @param {object} species a species definition from src/data/creatures.js
 * @param {number} level
 * @returns {{hp:number, attack:number, defense:number, spAttack:number, spDefense:number, speed:number}}
 */
export function calculateStats(species, level) {
  const stats = {};
  for (const key of STAT_KEYS) {
    stats[key] = calculateStat(key, species.baseStats[key], level);
  }
  return stats;
}

/**
 * Total experience needed to BE a given level.
 * Level 1 is always 0, so a new creature starts its curve at zero.
 *
 * @param {number} level
 * @param {string} growthRate
 * @returns {number}
 */
export function experienceForLevel(level, growthRate = 'medium') {
  const safeLevel = clampLevel(level);
  if (safeLevel <= 1) return 0;

  const multiplier = GROWTH_RATES[growthRate];
  if (multiplier === undefined) {
    console.warn(
      `[StatCalculator] Unknown growth rate "${growthRate}". ` +
        `Known: ${GROWTH_RATE_IDS.join(', ')}. Using "medium".`
    );
    return Math.floor(safeLevel ** 3);
  }

  return Math.floor(multiplier * safeLevel ** 3);
}

/**
 * What level a given amount of experience corresponds to.
 * Walks up from level 1 rather than inverting the cube, which keeps it exact and
 * makes it impossible to disagree with `experienceForLevel`.
 *
 * @param {number} experience
 * @param {string} growthRate
 * @returns {number}
 */
export function levelFromExperience(experience, growthRate = 'medium') {
  if (!Number.isFinite(experience) || experience <= 0) return 1;

  let level = 1;
  while (
    level < PROGRESSION.maxLevel &&
    experience >= experienceForLevel(level + 1, growthRate)
  ) {
    level += 1;
  }
  return level;
}

/**
 * Experience still needed before the next level.
 * Returns 0 at the level cap, where there is no next level to reach.
 */
export function experienceToNextLevel(experience, level, growthRate = 'medium') {
  const safeLevel = clampLevel(level);
  if (safeLevel >= PROGRESSION.maxLevel) return 0;

  const needed = experienceForLevel(safeLevel + 1, growthRate) - experience;
  return Math.max(0, needed);
}

/**
 * How far through the current level a creature is, as 0..1.
 * Handy for drawing an experience bar without the UI redoing this maths.
 */
export function experienceProgress(experience, level, growthRate = 'medium') {
  const safeLevel = clampLevel(level);
  if (safeLevel >= PROGRESSION.maxLevel) return 1;

  const start = experienceForLevel(safeLevel, growthRate);
  const end = experienceForLevel(safeLevel + 1, growthRate);
  const span = end - start;
  if (span <= 0) return 1;

  const progress = (experience - start) / span;
  return Math.min(Math.max(progress, 0), 1);
}
