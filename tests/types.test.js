/**
 * Tests for the type system.
 *
 * Two kinds of check here:
 *  1. The chart DATA is structurally valid — every id real, every multiplier a
 *     legal value. This runs over the whole table automatically, so a typo in a
 *     new matchup is caught without anyone writing a test for it.
 *  2. The effectiveness LOGIC is right, including the dual-type multiplication
 *     and immunity rules that are easy to get subtly wrong.
 */

import { describe, it, expect, vi } from 'vitest';
import { TYPES, TYPE_CHART, TYPE_INFO, TYPE_SET, isValidType, getTypeName } from '../src/data/types.js';
import {
  getEffectiveness,
  getSingleEffectiveness,
  describeEffectiveness,
  getEffectivenessMessage,
  hasSameTypeBonus,
  EFFECTIVENESS,
} from '../src/systems/TypeChart.js';

const LEGAL_MULTIPLIERS = new Set([0, 0.5, 2]);

describe('type list', () => {
  it('defines all 18 planned types', () => {
    expect(TYPES).toHaveLength(18);
  });

  it('has no duplicates', () => {
    expect(new Set(TYPES).size).toBe(TYPES.length);
  });

  it('uses lowercase ids only', () => {
    for (const type of TYPES) expect(type).toBe(type.toLowerCase());
  });

  it('includes every type the design document plans for', () => {
    const planned = [
      'normal', 'fire', 'water', 'grass', 'electric', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
    ];
    for (const type of planned) expect(TYPE_SET.has(type)).toBe(true);
  });

  it('gives every type a display name and two colours', () => {
    for (const type of TYPES) {
      const info = TYPE_INFO[type];
      expect(info, `no TYPE_INFO for "${type}"`).toBeDefined();
      expect(info.name).toBeTruthy();
      expect(typeof info.color).toBe('number');
      expect(typeof info.dark).toBe('number');
    }
  });

  it('validates type ids', () => {
    expect(isValidType('fire')).toBe(true);
    expect(isValidType('lava')).toBe(false);
    expect(getTypeName('fire')).toBe('Fire');
    expect(getTypeName('lava')).toBe('Unknown');
  });
});

describe('chart data integrity', () => {
  it('has a row for every type', () => {
    for (const type of TYPES) {
      expect(TYPE_CHART[type], `no chart row for "${type}"`).toBeDefined();
    }
  });

  it('has no rows for types that do not exist', () => {
    for (const attacker of Object.keys(TYPE_CHART)) {
      expect(TYPE_SET.has(attacker), `chart row for unknown type "${attacker}"`).toBe(true);
    }
  });

  it('only ever defends with real types', () => {
    for (const [attacker, row] of Object.entries(TYPE_CHART)) {
      for (const defender of Object.keys(row)) {
        expect(
          TYPE_SET.has(defender),
          `${attacker} -> unknown defending type "${defender}"`
        ).toBe(true);
      }
    }
  });

  it('only uses 0, 0.5 or 2 as multipliers', () => {
    for (const [attacker, row] of Object.entries(TYPE_CHART)) {
      for (const [defender, multiplier] of Object.entries(row)) {
        expect(
          LEGAL_MULTIPLIERS.has(multiplier),
          `${attacker} -> ${defender} is ${multiplier}; neutral matchups must be omitted, not written as 1`
        ).toBe(true);
      }
    }
  });

  it('never writes a neutral matchup explicitly', () => {
    // Listing a 1 would make the table longer without changing anything.
    for (const row of Object.values(TYPE_CHART)) {
      expect(Object.values(row)).not.toContain(1);
    }
  });
});

describe('single-type effectiveness', () => {
  it('is neutral for unlisted matchups', () => {
    expect(getSingleEffectiveness('normal', 'water')).toBe(1);
  });

  it('reads super effective matchups', () => {
    expect(getSingleEffectiveness('fire', 'grass')).toBe(2);
    expect(getSingleEffectiveness('water', 'fire')).toBe(2);
    expect(getSingleEffectiveness('grass', 'water')).toBe(2);
  });

  it('reads resisted matchups', () => {
    expect(getSingleEffectiveness('fire', 'water')).toBe(0.5);
    expect(getSingleEffectiveness('grass', 'fire')).toBe(0.5);
  });

  it('reads immunities', () => {
    expect(getSingleEffectiveness('normal', 'ghost')).toBe(0);
    expect(getSingleEffectiveness('ghost', 'normal')).toBe(0);
    expect(getSingleEffectiveness('electric', 'ground')).toBe(0);
    expect(getSingleEffectiveness('ground', 'flying')).toBe(0);
    expect(getSingleEffectiveness('poison', 'steel')).toBe(0);
    expect(getSingleEffectiveness('psychic', 'dark')).toBe(0);
    expect(getSingleEffectiveness('dragon', 'fairy')).toBe(0);
  });

  it('warns and stays neutral for an unknown type', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getSingleEffectiveness('lava', 'grass')).toBe(1);
    expect(getSingleEffectiveness('fire', 'metal')).toBe(1);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('makes the starter triangle work in both directions', () => {
    expect(getSingleEffectiveness('fire', 'grass')).toBe(2);
    expect(getSingleEffectiveness('grass', 'fire')).toBe(0.5);
    expect(getSingleEffectiveness('water', 'fire')).toBe(2);
    expect(getSingleEffectiveness('fire', 'water')).toBe(0.5);
    expect(getSingleEffectiveness('grass', 'water')).toBe(2);
    expect(getSingleEffectiveness('water', 'grass')).toBe(0.5);
  });
});

describe('dual-type effectiveness', () => {
  it('multiplies two super-effective matchups into 4x', () => {
    // Rock hits Flying x2 and Bug x2 -> a Bug/Flying creature takes 4x.
    expect(getEffectiveness('rock', ['bug', 'flying'])).toBe(4);
  });

  it('multiplies two resistances into 0.25x', () => {
    // Grass is resisted by both Fire and Flying.
    expect(getEffectiveness('grass', ['fire', 'flying'])).toBe(0.25);
  });

  it('cancels a strength against a resistance', () => {
    // Grass hits Water x2 but Flying x0.5.
    expect(getEffectiveness('grass', ['water', 'flying'])).toBe(1);
  });

  it('lets a single immunity beat any number of weaknesses', () => {
    // Ground hits Steel x2, but Flying is immune to Ground entirely.
    expect(getEffectiveness('ground', ['steel', 'flying'])).toBe(0);
  });

  it('handles a single type in the array', () => {
    expect(getEffectiveness('fire', ['grass'])).toBe(2);
  });

  it('warns and stays neutral for an empty or missing type list', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getEffectiveness('fire', [])).toBe(1);
    expect(getEffectiveness('fire', null)).toBe(1);
    warn.mockRestore();
  });

  it('agrees with the chart for every possible dual-type pairing', () => {
    // Brute force: the combined result must always be the product of its parts.
    for (const attacker of TYPES) {
      for (const a of TYPES) {
        for (const b of TYPES) {
          const expected =
            getSingleEffectiveness(attacker, a) * getSingleEffectiveness(attacker, b);
          expect(getEffectiveness(attacker, [a, b])).toBe(expected);
        }
      }
    }
  });
});

describe('describing effectiveness', () => {
  it('names each band correctly', () => {
    expect(describeEffectiveness(0)).toBe(EFFECTIVENESS.IMMUNE);
    expect(describeEffectiveness(0.25)).toBe(EFFECTIVENESS.VERY_RESISTED);
    expect(describeEffectiveness(0.5)).toBe(EFFECTIVENESS.RESISTED);
    expect(describeEffectiveness(1)).toBe(EFFECTIVENESS.NEUTRAL);
    expect(describeEffectiveness(2)).toBe(EFFECTIVENESS.SUPER);
    expect(describeEffectiveness(4)).toBe(EFFECTIVENESS.VERY_SUPER);
  });

  it('says nothing extra for a neutral hit', () => {
    expect(getEffectivenessMessage(1)).toBeNull();
  });

  it('has a message for every non-neutral band', () => {
    for (const multiplier of [0, 0.25, 0.5, 2, 4]) {
      expect(getEffectivenessMessage(multiplier)).toBeTruthy();
    }
  });
});

describe('same-type attack bonus', () => {
  it('is true when the move type matches one of the user types', () => {
    expect(hasSameTypeBonus('fire', ['fire'])).toBe(true);
    expect(hasSameTypeBonus('flying', ['normal', 'flying'])).toBe(true);
  });

  it('is false otherwise', () => {
    expect(hasSameTypeBonus('water', ['fire'])).toBe(false);
    expect(hasSameTypeBonus('water', [])).toBe(false);
    expect(hasSameTypeBonus('water', null)).toBe(false);
  });
});
