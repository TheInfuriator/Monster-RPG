/**
 * Tests for wild-encounter rolling.
 *
 * The encounter rate and the anti-ambush cooldown are exactly the kind of rules
 * that are painful to verify by walking around in the game, so they are pinned
 * down here with injected randomness.
 */

import { describe, it, expect, vi } from 'vitest';
import { EncounterSystem } from '../src/systems/EncounterSystem.js';
import { ENCOUNTER_TABLES, getEncounterTable } from '../src/data/encounters.js';
import { ENCOUNTERS } from '../src/config/balance.js';
import { createSeededRandom } from '../src/utils/rng.js';

/** Randomness that always rolls low, so every chance check succeeds. */
const alwaysLucky = () => 0;
/** Randomness that always rolls high, so every chance check fails. */
const neverLucky = () => 0.999999;

describe('encounter tables', () => {
  it('defines at least one table', () => {
    expect(Object.keys(ENCOUNTER_TABLES).length).toBeGreaterThan(0);
  });

  it('gives every entry a species, a valid level range and a positive weight', () => {
    for (const [id, table] of Object.entries(ENCOUNTER_TABLES)) {
      expect(table.length, `table "${id}" is empty`).toBeGreaterThan(0);
      for (const entry of table) {
        expect(typeof entry.species, `${id}: species must be a string`).toBe('string');
        expect(entry.species.length).toBeGreaterThan(0);
        expect(entry.minLevel).toBeGreaterThan(0);
        expect(entry.maxLevel).toBeGreaterThanOrEqual(entry.minLevel);
        expect(entry.weight).toBeGreaterThan(0);
      }
    }
  });

  it('warns and returns null for an unknown table instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEncounterTable('nowhere')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('returns null for a map with no table, without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEncounterTable(null)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('EncounterSystem', () => {
  it('is inactive for a map with no encounter table', () => {
    const system = new EncounterSystem(null);
    expect(system.isActive).toBe(false);
    expect(system.step(true)).toBeNull();
  });

  it('is active for a map with a table', () => {
    expect(new EncounterSystem('route1').isActive).toBe(true);
  });

  it('never triggers off an encounter tile', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    for (let i = 0; i < 20; i += 1) {
      expect(system.step(false)).toBeNull();
    }
  });

  it('triggers in tall grass when the roll succeeds', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const result = system.step(true);
    expect(result).not.toBeNull();
    expect(typeof result.species).toBe('string');
    expect(typeof result.level).toBe('number');
  });

  it('never triggers when the roll fails', () => {
    const system = new EncounterSystem('route1', neverLucky);
    for (let i = 0; i < 50; i += 1) {
      expect(system.step(true)).toBeNull();
    }
  });
});

describe('anti-ambush cooldown', () => {
  it('cannot trigger twice in a row, even with maximum luck', () => {
    const system = new EncounterSystem('route1', alwaysLucky);

    expect(system.step(true)).not.toBeNull(); // first encounter

    // The next `cooldownSteps` grass tiles must be safe.
    for (let i = 0; i < ENCOUNTERS.cooldownSteps; i += 1) {
      expect(system.step(true), `step ${i + 1} after an encounter should be safe`).toBeNull();
    }

    // Then encounters are possible again.
    expect(system.step(true)).not.toBeNull();
  });

  it('burns off the cooldown while walking on safe ground', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.step(true);
    expect(system.cooldown).toBe(ENCOUNTERS.cooldownSteps);

    system.step(false);
    expect(system.cooldown).toBe(ENCOUNTERS.cooldownSteps - 1);
  });

  it('never lets the cooldown go negative', () => {
    const system = new EncounterSystem('route1', neverLucky);
    for (let i = 0; i < 10; i += 1) system.step(false);
    expect(system.cooldown).toBe(0);
  });
});

describe('rolled encounters', () => {
  it('always produces a species from the table', () => {
    const system = new EncounterSystem('route1', createSeededRandom(11));
    const valid = new Set(ENCOUNTER_TABLES.route1.map((e) => e.species));

    for (let i = 0; i < 300; i += 1) {
      const result = system.roll();
      expect(valid.has(result.species)).toBe(true);
    }
  });

  it('always produces a level inside that species level range', () => {
    const system = new EncounterSystem('route1', createSeededRandom(23));
    const ranges = new Map(
      ENCOUNTER_TABLES.route1.map((e) => [e.species, [e.minLevel, e.maxLevel]])
    );

    for (let i = 0; i < 300; i += 1) {
      const { species, level } = system.roll();
      const [min, max] = ranges.get(species);
      expect(level).toBeGreaterThanOrEqual(min);
      expect(level).toBeLessThanOrEqual(max);
    }
  });

  it('respects weights: a rare species really is rare', () => {
    const system = new EncounterSystem('route1', createSeededRandom(77));
    const counts = {};
    for (let i = 0; i < 5000; i += 1) {
      const { species } = system.roll();
      counts[species] = (counts[species] || 0) + 1;
    }

    // nibbit has weight 30, emberfly has weight 3 — roughly ten times rarer.
    expect(counts.nibbit).toBeGreaterThan(counts.emberfly * 4);
  });
});
