/**
 * Tests for stat calculation and the experience curves.
 *
 * These numbers decide whether the game is fair, so the boundaries matter:
 * level 1, the level cap, and the exact points where a creature levels up.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateStat,
  calculateStats,
  clampLevel,
  experienceForLevel,
  levelFromExperience,
  experienceToNextLevel,
  experienceProgress,
  GROWTH_RATES,
  GROWTH_RATE_IDS,
  STAT_KEYS,
  STAT_NAMES,
} from '../src/systems/StatCalculator.js';
import { PROGRESSION } from '../src/config/balance.js';
import { CREATURES } from '../src/data/creatures.js';

const testSpecies = {
  baseStats: { hp: 50, attack: 60, defense: 40, spAttack: 55, spDefense: 45, speed: 70 },
};

describe('level clamping', () => {
  it('keeps levels inside 1..maxLevel', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(-5)).toBe(1);
    expect(clampLevel(1)).toBe(1);
    expect(clampLevel(PROGRESSION.maxLevel)).toBe(PROGRESSION.maxLevel);
    expect(clampLevel(PROGRESSION.maxLevel + 50)).toBe(PROGRESSION.maxLevel);
  });

  it('floors fractional levels', () => {
    expect(clampLevel(7.9)).toBe(7);
  });

  it('falls back to level 1 for anything that is not a real number', () => {
    // Deliberately the SAFE end of the range: a stray level 1 creature is
    // harmless, a stray level 100 one would wreck the game's balance.
    expect(clampLevel(NaN)).toBe(1);
    expect(clampLevel(Infinity)).toBe(1);
    expect(clampLevel(-Infinity)).toBe(1);
    expect(clampLevel(undefined)).toBe(1);
    expect(clampLevel('12')).toBe(1);
    expect(clampLevel(null)).toBe(1);
  });
});

describe('stat formula', () => {
  it('follows the documented HP formula', () => {
    // floor(2 * 50 * 50 / 100) + 50 + 10
    expect(calculateStat('hp', 50, 50)).toBe(50 + 50 + 10);
  });

  it('follows the documented formula for other stats', () => {
    // floor(2 * 60 * 50 / 100) + 5
    expect(calculateStat('attack', 60, 50)).toBe(60 + 5);
  });

  it('gives HP more than other stats from the same base', () => {
    expect(calculateStat('hp', 50, 20)).toBeGreaterThan(calculateStat('attack', 50, 20));
  });

  it('increases monotonically with level', () => {
    for (const key of STAT_KEYS) {
      let previous = 0;
      for (let level = 1; level <= PROGRESSION.maxLevel; level += 1) {
        const value = calculateStat(key, 60, level);
        expect(value, `${key} dropped at level ${level}`).toBeGreaterThanOrEqual(previous);
        previous = value;
      }
    }
  });

  it('never produces a zero or negative stat', () => {
    for (const key of STAT_KEYS) {
      expect(calculateStat(key, 1, 1)).toBeGreaterThan(0);
    }
  });

  it('calculates every stat for a species', () => {
    const stats = calculateStats(testSpecies, 50);
    for (const key of STAT_KEYS) expect(typeof stats[key]).toBe('number');
    expect(stats.hp).toBe(110);
    expect(stats.attack).toBe(65);
    expect(stats.speed).toBe(75);
  });

  it('produces whole numbers only', () => {
    for (const species of Object.values(CREATURES)) {
      for (const level of [1, 7, 23, 50, 100]) {
        const stats = calculateStats(species, level);
        for (const key of STAT_KEYS) {
          expect(Number.isInteger(stats[key]), `${species.id} ${key} at L${level}`).toBe(true);
        }
      }
    }
  });

  it('gives every real species a survivable amount of HP at level 5', () => {
    for (const species of Object.values(CREATURES)) {
      const stats = calculateStats(species, 5);
      expect(stats.hp, `${species.id} is too fragile at level 5`).toBeGreaterThanOrEqual(15);
    }
  });

  it('names every stat for the UI', () => {
    for (const key of STAT_KEYS) expect(STAT_NAMES[key]).toBeTruthy();
  });
});

describe('growth curves', () => {
  it('defines exactly the three planned rates', () => {
    expect(GROWTH_RATE_IDS.sort()).toEqual(['fast', 'medium', 'slow']);
  });

  it('starts every curve at zero for level 1', () => {
    for (const rate of GROWTH_RATE_IDS) {
      expect(experienceForLevel(1, rate)).toBe(0);
    }
  });

  it('follows the documented cubic formula', () => {
    for (const [rate, multiplier] of Object.entries(GROWTH_RATES)) {
      expect(experienceForLevel(10, rate)).toBe(Math.floor(multiplier * 1000));
      expect(experienceForLevel(50, rate)).toBe(Math.floor(multiplier * 125000));
    }
  });

  it('orders the curves fast < medium < slow at every level', () => {
    for (let level = 2; level <= PROGRESSION.maxLevel; level += 1) {
      const fast = experienceForLevel(level, 'fast');
      const medium = experienceForLevel(level, 'medium');
      const slow = experienceForLevel(level, 'slow');
      expect(fast).toBeLessThan(medium);
      expect(medium).toBeLessThan(slow);
    }
  });

  it('increases with every level', () => {
    for (const rate of GROWTH_RATE_IDS) {
      for (let level = 2; level <= PROGRESSION.maxLevel; level += 1) {
        expect(experienceForLevel(level, rate)).toBeGreaterThan(
          experienceForLevel(level - 1, rate)
        );
      }
    }
  });

  it('warns and falls back to medium for an unknown rate', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(experienceForLevel(10, 'glacial')).toBe(1000);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('level from experience', () => {
  it('is level 1 at zero or negative experience', () => {
    expect(levelFromExperience(0, 'medium')).toBe(1);
    expect(levelFromExperience(-100, 'medium')).toBe(1);
  });

  it('is exactly the inverse of experienceForLevel at every threshold', () => {
    for (const rate of GROWTH_RATE_IDS) {
      for (let level = 1; level <= PROGRESSION.maxLevel; level += 1) {
        const exp = experienceForLevel(level, rate);
        expect(levelFromExperience(exp, rate), `${rate} level ${level}`).toBe(level);
      }
    }
  });

  it('stays on the lower level one point short of the threshold', () => {
    for (const rate of GROWTH_RATE_IDS) {
      for (const level of [5, 16, 34, 50]) {
        const threshold = experienceForLevel(level, rate);
        expect(levelFromExperience(threshold - 1, rate)).toBe(level - 1);
      }
    }
  });

  it('never exceeds the level cap however much experience is given', () => {
    expect(levelFromExperience(999999999, 'fast')).toBe(PROGRESSION.maxLevel);
  });
});

describe('experience to next level', () => {
  it('is the full gap when a creature has just levelled up', () => {
    const atFive = experienceForLevel(5, 'medium');
    const toSix = experienceForLevel(6, 'medium') - atFive;
    expect(experienceToNextLevel(atFive, 5, 'medium')).toBe(toSix);
  });

  it('is zero at the level cap', () => {
    const capped = experienceForLevel(PROGRESSION.maxLevel, 'medium');
    expect(experienceToNextLevel(capped, PROGRESSION.maxLevel, 'medium')).toBe(0);
  });

  it('never goes negative when a creature has surplus experience', () => {
    expect(experienceToNextLevel(999999, 5, 'medium')).toBe(0);
  });
});

describe('experience progress bar', () => {
  it('is 0 immediately after levelling up', () => {
    expect(experienceProgress(experienceForLevel(10, 'medium'), 10, 'medium')).toBe(0);
  });

  it('is close to 1 just before the next level', () => {
    const next = experienceForLevel(11, 'medium');
    expect(experienceProgress(next - 1, 10, 'medium')).toBeGreaterThan(0.99);
  });

  it('is roughly half way at the midpoint', () => {
    const start = experienceForLevel(10, 'medium');
    const end = experienceForLevel(11, 'medium');
    const middle = start + Math.floor((end - start) / 2);
    expect(experienceProgress(middle, 10, 'medium')).toBeCloseTo(0.5, 1);
  });

  it('stays inside 0..1 for nonsense input', () => {
    expect(experienceProgress(-500, 10, 'medium')).toBe(0);
    expect(experienceProgress(999999999, 10, 'medium')).toBe(1);
    expect(experienceProgress(0, PROGRESSION.maxLevel, 'medium')).toBe(1);
  });
});
