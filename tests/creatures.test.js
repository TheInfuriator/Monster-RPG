/**
 * Tests for the creature database.
 *
 * Nearly all of this runs over EVERY species automatically. Adding a creature
 * should be validated for free — a bad type, an unknown move in a learnset, an
 * evolution pointing at nothing, a duplicate index number.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CREATURES,
  CREATURE_IDS,
  STARTER_IDS,
  STARTER_LEVEL,
  getSpecies,
  getMovesAtLevel,
  getLearnableMoves,
  getPreEvolution,
} from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { TYPE_SET } from '../src/data/types.js';
import { GROWTH_RATE_SET, STAT_KEYS } from '../src/systems/StatCalculator.js';
import { PARTY, PROGRESSION } from '../src/config/balance.js';

const BODY_TYPES = new Set(['quadruped', 'blob', 'serpent', 'plant', 'bird', 'bug', 'rock', 'wisp']);

describe('creature database size and identity', () => {
  it('has at least the 20 species the roadmap calls for', () => {
    expect(CREATURE_IDS.length).toBeGreaterThanOrEqual(20);
  });

  it('uses each key as that species\' own id', () => {
    for (const [key, species] of Object.entries(CREATURES)) {
      expect(species.id, `key "${key}" does not match its id`).toBe(key);
    }
  });

  it('gives every species a unique display name', () => {
    const names = CREATURE_IDS.map((id) => CREATURES[id].name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every species a unique index number', () => {
    const numbers = CREATURE_IDS.map((id) => CREATURES[id].number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('numbers species consecutively from 1', () => {
    const numbers = CREATURE_IDS.map((id) => CREATURES[id].number).sort((a, b) => a - b);
    expect(numbers[0]).toBe(1);
    expect(numbers[numbers.length - 1]).toBe(numbers.length);
  });

  it('warns for an unknown species id instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getSpecies('notAThing')).toBeNull();
    warn.mockRestore();
  });
});

describe('every species is well-formed', () => {
  for (const [id, species] of Object.entries(CREATURES)) {
    describe(`species "${id}"`, () => {
      it('has a name and a real description', () => {
        expect(species.name).toBeTruthy();
        expect(species.description.length).toBeGreaterThan(20);
      });

      it('has one or two real types with no duplicates', () => {
        expect(Array.isArray(species.types)).toBe(true);
        expect(species.types.length).toBeGreaterThanOrEqual(1);
        expect(species.types.length).toBeLessThanOrEqual(2);
        expect(new Set(species.types).size).toBe(species.types.length);

        for (const type of species.types) {
          expect(TYPE_SET.has(type), `unknown type "${type}"`).toBe(true);
        }
      });

      it('has all six base stats in a sensible range', () => {
        for (const key of STAT_KEYS) {
          const value = species.baseStats[key];
          expect(typeof value, `missing base stat "${key}"`).toBe('number');
          expect(value).toBeGreaterThan(0);
          expect(value).toBeLessThanOrEqual(255);
        }
      });

      it('has a known growth rate', () => {
        expect(GROWTH_RATE_SET.has(species.growthRate), `bad growth rate "${species.growthRate}"`).toBe(true);
      });

      it('has a positive experience yield', () => {
        expect(species.baseExp).toBeGreaterThan(0);
      });

      it('has a catch rate inside the 0-255 scale', () => {
        expect(species.catchRate).toBeGreaterThan(0);
        expect(species.catchRate).toBeLessThanOrEqual(255);
      });

      it('has a body shape the artwork generator understands', () => {
        expect(species.appearance).toBeDefined();
        expect(
          BODY_TYPES.has(species.appearance.body),
          `unknown body "${species.appearance.body}"`
        ).toBe(true);
      });

      it('has a learnset of real moves', () => {
        expect(Array.isArray(species.learnset)).toBe(true);
        expect(species.learnset.length).toBeGreaterThan(0);

        for (const entry of species.learnset) {
          expect(MOVES[entry.move], `unknown move "${entry.move}"`).toBeDefined();
          expect(Number.isInteger(entry.level)).toBe(true);
          expect(entry.level).toBeGreaterThanOrEqual(1);
          expect(entry.level).toBeLessThanOrEqual(PROGRESSION.maxLevel);
        }
      });

      it('lists its learnset in level order', () => {
        const levels = species.learnset.map((e) => e.level);
        const sorted = [...levels].sort((a, b) => a - b);
        expect(levels).toEqual(sorted);
      });

      it('never learns the same move twice', () => {
        const moves = species.learnset.map((e) => e.move);
        expect(new Set(moves).size, `duplicate move in ${id}'s learnset`).toBe(moves.length);
      });

      it('knows at least one move the moment it exists', () => {
        const startingMoves = species.learnset.filter((e) => e.level === 1);
        expect(startingMoves.length, `${id} knows nothing at level 1`).toBeGreaterThan(0);
      });

      it('can actually attack from level 1', () => {
        const level1 = species.learnset.filter((e) => e.level === 1);
        const damaging = level1.filter((e) => MOVES[e.move].power !== null);
        expect(damaging.length, `${id} has no damaging move at level 1`).toBeGreaterThan(0);
      });

      it('has a valid evolution or none at all', () => {
        if (species.evolution === null) return;

        expect(species.evolution.method).toBe('level');
        expect(Number.isInteger(species.evolution.level)).toBe(true);
        expect(species.evolution.level).toBeGreaterThan(1);
        expect(species.evolution.level).toBeLessThanOrEqual(PROGRESSION.maxLevel);
        expect(
          CREATURES[species.evolution.to],
          `${id} evolves into "${species.evolution.to}", which does not exist`
        ).toBeDefined();
      });
    });
  }
});

describe('evolution graph', () => {
  it('never evolves a species into itself', () => {
    for (const [id, species] of Object.entries(CREATURES)) {
      if (species.evolution) expect(species.evolution.to).not.toBe(id);
    }
  });

  it('never has two species evolving into the same one', () => {
    const targets = CREATURE_IDS
      .map((id) => CREATURES[id].evolution?.to)
      .filter(Boolean);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('contains no evolution loops', () => {
    for (const startId of CREATURE_IDS) {
      const seen = new Set([startId]);
      let current = CREATURES[startId].evolution?.to;

      while (current) {
        expect(seen.has(current), `evolution loop involving "${startId}"`).toBe(false);
        seen.add(current);
        current = CREATURES[current].evolution?.to;
      }
    }
  });

  it('finds the species that evolves into a given one', () => {
    expect(getPreEvolution('cindraw')).toBe('pyrret');
    expect(getPreEvolution('pyrret')).toBeNull();
  });

  it('has evolutions at higher levels further along a chain', () => {
    for (const [id, species] of Object.entries(CREATURES)) {
      if (!species.evolution) continue;
      const next = CREATURES[species.evolution.to];
      if (!next.evolution) continue;

      expect(
        next.evolution.level,
        `${id} -> ${next.id} evolves later than ${next.id} -> ${next.evolution.to}`
      ).toBeGreaterThan(species.evolution.level);
    }
  });

  it('makes an evolved form stronger than what it came from', () => {
    const total = (s) => STAT_KEYS.reduce((sum, k) => sum + s.baseStats[k], 0);

    for (const species of Object.values(CREATURES)) {
      if (!species.evolution) continue;
      const evolved = CREATURES[species.evolution.to];
      expect(
        total(evolved),
        `${evolved.id} is not stronger than ${species.id}`
      ).toBeGreaterThan(total(species));
    }
  });
});

describe('starters', () => {
  it('offers exactly three', () => {
    expect(STARTER_IDS).toHaveLength(3);
  });

  it('offers species that exist', () => {
    for (const id of STARTER_IDS) expect(CREATURES[id], `no species "${id}"`).toBeDefined();
  });

  it('forms a Fire / Water / Grass triangle', () => {
    const types = STARTER_IDS.map((id) => CREATURES[id].types[0]);
    expect(new Set(types)).toEqual(new Set(['fire', 'water', 'grass']));
  });

  it('gives all three identical stat totals, so no pick is objectively best', () => {
    const total = (id) => STAT_KEYS.reduce((sum, k) => sum + CREATURES[id].baseStats[k], 0);
    const totals = STARTER_IDS.map(total);
    expect(new Set(totals).size, `starter totals differ: ${totals.join(', ')}`).toBe(1);
  });

  it('keeps that balance through every evolution stage', () => {
    const total = (id) => STAT_KEYS.reduce((sum, k) => sum + CREATURES[id].baseStats[k], 0);

    let stage = STARTER_IDS;
    while (stage.every((id) => CREATURES[id].evolution)) {
      stage = stage.map((id) => CREATURES[id].evolution.to);
      const totals = stage.map(total);
      expect(new Set(totals).size, `stage totals differ: ${stage.join('/')} = ${totals.join(', ')}`).toBe(1);
    }
  });

  it('gives each starter three evolution stages', () => {
    for (const id of STARTER_IDS) {
      const second = CREATURES[id].evolution;
      expect(second, `${id} does not evolve`).toBeTruthy();
      const third = CREATURES[second.to].evolution;
      expect(third, `${second.to} does not evolve`).toBeTruthy();
      expect(CREATURES[third.to].evolution, `${third.to} should be a final form`).toBeNull();
    }
  });

  it('gives each starter a damaging move of its own type at the level it is handed over', () => {
    for (const id of STARTER_IDS) {
      const species = CREATURES[id];
      const moves = getMovesAtLevel(species, STARTER_LEVEL, PARTY.maxMoves);
      const sameType = moves.filter(
        (m) => MOVES[m].power !== null && species.types.includes(MOVES[m].type)
      );
      expect(
        sameType.length,
        `${id} reaches level ${STARTER_LEVEL} with no ${species.types[0]} attack`
      ).toBeGreaterThan(0);
    }
  });

  it('is hard to catch, since it is a gift', () => {
    for (const id of STARTER_IDS) {
      expect(CREATURES[id].catchRate).toBeLessThanOrEqual(50);
    }
  });
});

describe('learnset helpers', () => {
  it('returns only moves already learned at a level', () => {
    const moves = getMovesAtLevel(CREATURES.pyrret, 1);
    expect(moves).toContain('scratch');
    expect(moves).not.toContain('flameBurst');
  });

  it('never returns more than the move limit', () => {
    for (const id of CREATURE_IDS) {
      const moves = getMovesAtLevel(CREATURES[id], PROGRESSION.maxLevel, PARTY.maxMoves);
      expect(moves.length).toBeLessThanOrEqual(PARTY.maxMoves);
    }
  });

  it('keeps the most recently learned moves when the list overflows', () => {
    const moves = getMovesAtLevel(CREATURES.pyrret, 100, 4);
    // The last four entries of Pyrret's learnset.
    const expected = CREATURES.pyrret.learnset.slice(-4).map((e) => e.move);
    expect(moves).toEqual(expected);
  });

  it('returns something for every species at every evolution level', () => {
    for (const id of CREATURE_IDS) {
      for (const level of [1, 5, 10, 20, 50, 100]) {
        expect(
          getMovesAtLevel(CREATURES[id], level).length,
          `${id} knows nothing at level ${level}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('lists all learnable moves', () => {
    expect(getLearnableMoves(CREATURES.pyrret)).toContain('flameBurst');
    expect(getLearnableMoves(null)).toEqual([]);
  });
});

describe('roster coverage', () => {
  it('has several evolutionary families', () => {
    const families = CREATURE_IDS.filter((id) => CREATURES[id].evolution).length;
    expect(families).toBeGreaterThanOrEqual(8);
  });

  it('has some single-stage species too', () => {
    const singles = CREATURE_IDS.filter(
      (id) => !CREATURES[id].evolution && !getPreEvolution(id)
    );
    expect(singles.length).toBeGreaterThanOrEqual(3);
  });

  it('covers a broad spread of types', () => {
    const types = new Set(CREATURE_IDS.flatMap((id) => CREATURES[id].types));
    expect(types.size).toBeGreaterThanOrEqual(10);
  });

  it('includes creatures suited to Route 1 — weak, common and fast to train', () => {
    const early = CREATURE_IDS.filter(
      (id) => CREATURES[id].catchRate >= 180 && CREATURES[id].baseExp <= 70
    );
    expect(early.length).toBeGreaterThanOrEqual(4);
  });

  it('includes creatures ready for the first gym level band', () => {
    // Anything that evolves between level 16 and 24 gives the player a real
    // power spike in the run-up to Beacon Hall 1.
    const midGame = CREATURE_IDS.filter((id) => {
      const evo = CREATURES[id].evolution;
      return evo && evo.level >= 16 && evo.level <= 24;
    });
    expect(midGame.length).toBeGreaterThanOrEqual(5);
  });

  it('has a mixture of physical, special, fast and bulky archetypes', () => {
    const has = (predicate) => CREATURE_IDS.some((id) => predicate(CREATURES[id].baseStats));
    expect(has((s) => s.attack >= s.spAttack + 15), 'no physical attackers').toBe(true);
    expect(has((s) => s.spAttack >= s.attack + 15), 'no special attackers').toBe(true);
    expect(has((s) => s.speed >= 60), 'no fast creatures').toBe(true);
    expect(has((s) => s.defense >= 68), 'no bulky creatures').toBe(true);
  });
});

describe('encounter tables line up with the roster', () => {
  it('only references species that exist', async () => {
    const { ENCOUNTER_TABLES } = await import('../src/data/encounters.js');
    for (const [tableId, table] of Object.entries(ENCOUNTER_TABLES)) {
      for (const entry of table) {
        expect(
          CREATURES[entry.species],
          `encounter table "${tableId}" references unknown species "${entry.species}"`
        ).toBeDefined();
      }
    }
  });
});
