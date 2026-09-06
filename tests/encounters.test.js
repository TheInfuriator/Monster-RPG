/**
 * Tests for wild-encounter rolling.
 *
 * The encounter rate, the anti-ambush cooldown and the list of moments when an
 * encounter must NOT happen are exactly the kind of rules that are painful to
 * verify by walking around in the game, so they are pinned down here with
 * injected randomness.
 */

import { describe, it, expect, vi } from 'vitest';
import { EncounterSystem, findEncounterBlocker } from '../src/systems/EncounterSystem.js';
import {
  ENCOUNTER_TABLES,
  getEncounterTable,
  getEncounterConfig,
  findEncounterTableProblems,
} from '../src/data/encounters.js';
import { ENCOUNTERS, PROGRESSION } from '../src/config/balance.js';
import { createSeededRandom } from '../src/utils/rng.js';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { CREATURES } from '../src/data/creatures.js';

/** Randomness that always rolls low, so every chance check succeeds. */
const alwaysLucky = () => 0;
/** Randomness that always rolls high, so every chance check fails. */
const neverLucky = () => 0.999999;

/** A step on encounter terrain with nothing else going on. */
const grassStep = { onEncounterTile: true };

describe('encounter tables', () => {
  it('defines at least one table', () => {
    expect(Object.keys(ENCOUNTER_TABLES).length).toBeGreaterThan(0);
  });

  // Auto-generated: a table added later is validated without touching this file.
  for (const [id, table] of Object.entries(ENCOUNTER_TABLES)) {
    describe(`table "${id}"`, () => {
      it('is not empty', () => {
        expect(table.length).toBeGreaterThan(0);
      });

      it('passes every data rule', () => {
        expect(findEncounterTableProblems(table, id)).toEqual([]);
      });

      it('only names species that exist', () => {
        for (const entry of table) {
          expect(CREATURES[entry.species], `unknown species "${entry.species}"`).toBeDefined();
        }
      });

      it('keeps levels inside the game bounds and the right way round', () => {
        for (const entry of table) {
          expect(entry.minLevel).toBeGreaterThanOrEqual(1);
          expect(entry.maxLevel).toBeLessThanOrEqual(PROGRESSION.maxLevel);
          expect(entry.maxLevel).toBeGreaterThanOrEqual(entry.minLevel);
        }
      });

      it('gives every entry a positive weight', () => {
        for (const entry of table) expect(entry.weight).toBeGreaterThan(0);
      });
    });
  }

  it('warns and returns null for an unknown table instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEncounterTable('nowhere')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and returns null for an empty table', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    ENCOUNTER_TABLES.__empty = [];
    expect(getEncounterTable('__empty')).toBeNull();
    expect(warn).toHaveBeenCalled();
    delete ENCOUNTER_TABLES.__empty;
    warn.mockRestore();
  });

  it('returns null for a map with no table, without warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEncounterTable(null)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('encounter table validation catches bad data', () => {
  it('rejects an empty table', () => {
    expect(findEncounterTableProblems([], 'x')).toEqual(['x: is empty']);
  });

  it('rejects a species that does not exist', () => {
    const problems = findEncounterTableProblems(
      [{ species: 'notacreature', minLevel: 2, maxLevel: 3, weight: 5 }],
      'x'
    );
    expect(problems.join(' ')).toMatch(/no such species/);
  });

  it('rejects a missing species id', () => {
    const problems = findEncounterTableProblems([{ minLevel: 2, maxLevel: 3, weight: 5 }], 'x');
    expect(problems.join(' ')).toMatch(/needs a species id/);
  });

  it('rejects minLevel above maxLevel', () => {
    const problems = findEncounterTableProblems(
      [{ species: 'nibbit', minLevel: 9, maxLevel: 3, weight: 5 }],
      'x'
    );
    expect(problems.join(' ')).toMatch(/is above maxLevel/);
  });

  it('rejects a level outside the game bounds', () => {
    expect(
      findEncounterTableProblems([{ species: 'nibbit', minLevel: 0, maxLevel: 3, weight: 5 }], 'x')
        .join(' ')
    ).toMatch(/levels must be between/);

    expect(
      findEncounterTableProblems(
        [{ species: 'nibbit', minLevel: 2, maxLevel: PROGRESSION.maxLevel + 1, weight: 5 }],
        'x'
      ).join(' ')
    ).toMatch(/levels must be between/);
  });

  it('rejects a zero or negative weight', () => {
    expect(
      findEncounterTableProblems([{ species: 'nibbit', minLevel: 2, maxLevel: 3, weight: 0 }], 'x')
        .join(' ')
    ).toMatch(/weight must be greater than zero/);

    expect(
      findEncounterTableProblems([{ species: 'nibbit', minLevel: 2, maxLevel: 3, weight: -4 }], 'x')
        .join(' ')
    ).toMatch(/weight must be greater than zero/);
  });

  it('rejects a fractional level', () => {
    expect(
      findEncounterTableProblems(
        [{ species: 'nibbit', minLevel: 2.5, maxLevel: 3, weight: 5 }],
        'x'
      ).join(' ')
    ).toMatch(/whole numbers/);
  });
});

describe('maps that enable encounters', () => {
  // Auto-generated over every map, so a new area cannot ship broken.
  for (const [id, definition] of Object.entries(MAPS)) {
    const config = getEncounterConfig(definition);
    if (!config) continue;

    describe(`map "${id}"`, () => {
      it('names a table that exists and is usable', () => {
        expect(ENCOUNTER_TABLES[config.tableId], `unknown table "${config.tableId}"`).toBeDefined();
        expect(findEncounterTableProblems(ENCOUNTER_TABLES[config.tableId], config.tableId))
          .toEqual([]);
      });

      it('has a sane rate and cooldown', () => {
        expect(config.rate).toBeGreaterThan(0);
        expect(config.rate).toBeLessThanOrEqual(1);
        expect(config.cooldownSteps).toBeGreaterThanOrEqual(0);
      });

      it('actually has encounter terrain on it', () => {
        const map = new TileMap(definition);
        let tiles = 0;
        for (let y = 0; y < map.height; y += 1) {
          for (let x = 0; x < map.width; x += 1) {
            if (map.hasEncounters(x, y)) tiles += 1;
          }
        }
        expect(tiles, `map "${id}" enables encounters but has nowhere to have them`)
          .toBeGreaterThan(0);
      });
    });
  }

  it('leaves interiors without encounters', () => {
    for (const [id, definition] of Object.entries(MAPS)) {
      if (!definition.interior) continue;
      expect(getEncounterConfig(definition), `interior "${id}" should not have encounters`)
        .toBeNull();
    }
  });
});

describe('reading a map encounter config', () => {
  it('understands the short form', () => {
    const config = getEncounterConfig({ encounterTable: 'route1' });
    expect(config.tableId).toBe('route1');
    expect(config.rate).toBe(ENCOUNTERS.chancePerStep);
    expect(config.cooldownSteps).toBe(ENCOUNTERS.cooldownSteps);
    expect(config.terrain).toBeNull();
  });

  it('understands the long form and its overrides', () => {
    const config = getEncounterConfig({
      encounters: { table: 'route1', rate: 0.5, cooldownSteps: 8, terrain: ['tall_grass'] },
    });
    expect(config.tableId).toBe('route1');
    expect(config.rate).toBe(0.5);
    expect(config.cooldownSteps).toBe(8);
    expect(config.terrain).toEqual(['tall_grass']);
  });

  it('clamps a silly rate rather than trusting it', () => {
    expect(getEncounterConfig({ encounters: { table: 'route1', rate: 4 } }).rate).toBe(1);
    expect(getEncounterConfig({ encounters: { table: 'route1', rate: -1 } }).rate).toBe(0);
  });

  it('returns null when a map has no encounters', () => {
    expect(getEncounterConfig({ id: 'somewhere' })).toBeNull();
    expect(getEncounterConfig(null)).toBeNull();
  });
});

describe('encounter terrain comes from tile and map data', () => {
  const route1 = new TileMap(MAPS.route1);

  it('is true on tall grass', () => {
    const grass = findTile(route1, (map, x, y) => map.getTile(x, y).id === 'tall_grass');
    expect(route1.hasEncounters(grass.x, grass.y)).toBe(true);
  });

  it('is false on the path', () => {
    const path = findTile(route1, (map, x, y) => map.getTile(x, y).id === 'path');
    expect(route1.hasEncounters(path.x, path.y)).toBe(false);
  });

  it('is false off the edge of the map', () => {
    expect(route1.hasEncounters(-1, 0)).toBe(false);
    expect(route1.hasEncounters(0, 9999)).toBe(false);
  });

  it('is false everywhere on a map with no encounter table', () => {
    const indoors = new TileMap(MAPS.playerHouse);
    let any = false;
    for (let y = 0; y < indoors.height; y += 1) {
      for (let x = 0; x < indoors.width; x += 1) {
        if (indoors.hasEncounters(x, y)) any = true;
      }
    }
    expect(any).toBe(false);
  });

  it('honours a map that narrows its encounter terrain', () => {
    const narrowed = new TileMap({
      ...MAPS.route1,
      encounterTable: undefined,
      encounters: { table: 'route1', terrain: ['nothing_like_this'] },
    });
    const grass = findTile(narrowed, (map, x, y) => map.getTile(x, y).id === 'tall_grass');
    expect(narrowed.hasEncounters(grass.x, grass.y)).toBe(false);
  });
});

function findTile(map, predicate) {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      if (predicate(map, x, y)) return { x, y };
    }
  }
  throw new Error('No matching tile on this map');
}

describe('EncounterSystem', () => {
  it('is inactive for a map with no encounter table', () => {
    const system = new EncounterSystem(null);
    expect(system.isActive).toBe(false);
    expect(system.step(grassStep)).toBeNull();
  });

  it('is active for a map with a table', () => {
    expect(new EncounterSystem('route1').isActive).toBe(true);
  });

  it('accepts a bare table id as well as a config object', () => {
    const fromId = new EncounterSystem('route1');
    const fromConfig = new EncounterSystem(getEncounterConfig(MAPS.route1));
    expect(fromId.tableId).toBe(fromConfig.tableId);
    expect(fromId.rate).toBe(fromConfig.rate);
    expect(fromId.cooldownSteps).toBe(fromConfig.cooldownSteps);
  });

  it('takes its rate and cooldown from the map, not from a global', () => {
    const system = new EncounterSystem({ tableId: 'route1', rate: 0.9, cooldownSteps: 7 });
    expect(system.rate).toBe(0.9);
    expect(system.cooldownSteps).toBe(7);
  });

  it('never triggers off an encounter tile', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    for (let i = 0; i < 20; i += 1) {
      expect(system.step({ onEncounterTile: false })).toBeNull();
    }
  });

  it('triggers in tall grass when the roll succeeds', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const result = system.step(grassStep);
    expect(result).not.toBeNull();
    expect(typeof result.species).toBe('string');
    expect(typeof result.level).toBe('number');
  });

  it('never triggers when the roll fails', () => {
    const system = new EncounterSystem('route1', neverLucky);
    for (let i = 0; i < 50; i += 1) {
      expect(system.step(grassStep)).toBeNull();
    }
  });

  it('still accepts the plain boolean form', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    expect(system.step(true)).not.toBeNull();
    expect(system.step(false)).toBeNull();
  });

  it('is deterministic for a given seed', () => {
    const runOnce = () => {
      const system = new EncounterSystem('route1', createSeededRandom(4242));
      const seen = [];
      for (let i = 0; i < 60; i += 1) seen.push(system.step(grassStep));
      return JSON.stringify(seen);
    };
    expect(runOnce()).toBe(runOnce());
  });
});

describe('encounter rate boundaries', () => {
  it('a rate of 0 never triggers, however lucky the roll', () => {
    const system = new EncounterSystem({ tableId: 'route1', rate: 0 }, alwaysLucky);
    for (let i = 0; i < 50; i += 1) expect(system.step(grassStep)).toBeNull();
  });

  it('a rate of 1 triggers on every eligible step', () => {
    const system = new EncounterSystem(
      { tableId: 'route1', rate: 1, cooldownSteps: 0 },
      neverLucky
    );
    for (let i = 0; i < 10; i += 1) expect(system.step(grassStep)).not.toBeNull();
  });
});

describe('situations that suppress an encounter', () => {
  const cases = [
    ['a battle is already running', { battleActive: true }],
    ['the map is changing', { transitioning: true }],
    ['dialogue is open', { dialogueOpen: true }],
    ['a menu owns the input', { overlayActive: true }],
    ['the player is not in control', { inputLocked: true }],
  ];

  for (const [reason, facts] of cases) {
    it(`refuses when ${reason}`, () => {
      expect(findEncounterBlocker(facts)).toBe(reason);

      const system = new EncounterSystem('route1', alwaysLucky);
      expect(system.step({ ...grassStep, ...facts })).toBeNull();
    });

    it(`does not spend cooldown when ${reason}`, () => {
      const system = new EncounterSystem('route1', alwaysLucky);
      system.applyCooldown(2);
      system.step({ ...grassStep, ...facts });
      expect(system.cooldown).toBe(2);
    });
  }

  it('allows an ordinary step', () => {
    expect(findEncounterBlocker({})).toBeNull();
    expect(findEncounterBlocker({ onEncounterTile: true })).toBeNull();
  });

  it('refuses while encounters are switched off', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.disabled = true;
    expect(system.step(grassStep)).toBeNull();

    system.disabled = false;
    expect(system.step(grassStep)).not.toBeNull();
  });
});

describe('anti-ambush cooldown', () => {
  it('cannot trigger twice in a row, even with maximum luck', () => {
    const system = new EncounterSystem('route1', alwaysLucky);

    expect(system.step(grassStep)).not.toBeNull(); // first encounter

    // The next `cooldownSteps` grass tiles must be safe.
    for (let i = 0; i < ENCOUNTERS.cooldownSteps; i += 1) {
      expect(system.step(grassStep), `step ${i + 1} after an encounter should be safe`).toBeNull();
    }

    // Then encounters are possible again.
    expect(system.step(grassStep)).not.toBeNull();
  });

  it('sets the cooldown from the map, not from a global', () => {
    const system = new EncounterSystem(
      { tableId: 'route1', rate: 1, cooldownSteps: 6 },
      alwaysLucky
    );
    system.step(grassStep);
    expect(system.cooldown).toBe(6);
  });

  it('burns off the cooldown while walking on safe ground', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.step(grassStep);
    expect(system.cooldown).toBe(ENCOUNTERS.cooldownSteps);

    system.step({ onEncounterTile: false });
    expect(system.cooldown).toBe(ENCOUNTERS.cooldownSteps - 1);
  });

  it('eventually expires', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.step(grassStep);
    for (let i = 0; i < ENCOUNTERS.cooldownSteps; i += 1) system.step({ onEncounterTile: false });
    expect(system.cooldown).toBe(0);
  });

  it('never lets the cooldown go negative', () => {
    const system = new EncounterSystem('route1', neverLucky);
    for (let i = 0; i < 10; i += 1) system.step({ onEncounterTile: false });
    expect(system.cooldown).toBe(0);
  });

  it('protects the player when a battle ends', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.applyCooldown();
    expect(system.cooldown).toBe(ENCOUNTERS.cooldownAfterBattle);

    for (let i = 0; i < ENCOUNTERS.cooldownAfterBattle; i += 1) {
      expect(system.step(grassStep), 'returning from a battle must not re-ambush').toBeNull();
    }
    expect(system.step(grassStep)).not.toBeNull();
  });

  it('never shortens an existing cooldown', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.applyCooldown(9);
    system.applyCooldown(2);
    expect(system.cooldown).toBe(9);
  });

  it('refuses a negative grant', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    system.applyCooldown(-5);
    expect(system.cooldown).toBe(0);
  });
});

describe('forcing an encounter (debug only)', () => {
  it('skips the chance roll exactly once', () => {
    const system = new EncounterSystem({ tableId: 'route1', cooldownSteps: 0 }, neverLucky);
    system.forceNext = true;

    expect(system.step(grassStep)).not.toBeNull();
    expect(system.forceNext).toBe(false);
    expect(system.step(grassStep)).toBeNull();
  });

  it('still obeys the terrain and the cooldown', () => {
    const system = new EncounterSystem('route1', neverLucky);
    system.forceNext = true;
    expect(system.step({ onEncounterTile: false })).toBeNull();

    system.applyCooldown(2);
    expect(system.step(grassStep)).toBeNull();
  });

  it('defaults to off, so normal play is unaffected', () => {
    const system = new EncounterSystem('route1');
    expect(system.forceNext).toBe(false);
    expect(system.disabled).toBe(false);
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

  it('lands on the minimum level when the roll is lowest', () => {
    const system = new EncounterSystem('route1', alwaysLucky);
    const first = ENCOUNTER_TABLES.route1[0];
    const result = system.roll();
    expect(result.species).toBe(first.species);
    expect(result.level).toBe(first.minLevel);
  });

  it('lands on the maximum level when the roll is highest', () => {
    const system = new EncounterSystem('route1', neverLucky);
    const last = ENCOUNTER_TABLES.route1[ENCOUNTER_TABLES.route1.length - 1];
    const result = system.roll();
    expect(result.species).toBe(last.species);
    expect(result.level).toBe(last.maxLevel);
  });

  it('can produce the rare entry at all', () => {
    const system = new EncounterSystem('route1', createSeededRandom(5));
    const rare = ENCOUNTER_TABLES.route1[ENCOUNTER_TABLES.route1.length - 1].species;

    let found = false;
    for (let i = 0; i < 4000 && !found; i += 1) {
      if (system.roll().species === rare) found = true;
    }
    expect(found, `the rare "${rare}" should still be reachable`).toBe(true);
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

  it('picks the commonest entry far more often than the rarest', () => {
    const table = ENCOUNTER_TABLES.route1;
    const commonest = [...table].sort((a, b) => b.weight - a.weight)[0];
    const rarest = [...table].sort((a, b) => a.weight - b.weight)[0];

    const system = new EncounterSystem('route1', createSeededRandom(99));
    const counts = {};
    for (let i = 0; i < 5000; i += 1) {
      const { species } = system.roll();
      counts[species] = (counts[species] || 0) + 1;
    }

    expect(counts[commonest.species]).toBeGreaterThan(counts[rarest.species]);
  });
});
