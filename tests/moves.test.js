/**
 * Tests for the move database.
 *
 * Most of these run over EVERY move automatically. That is the point: adding a
 * new move should be validated without anyone writing a test for it, so a bad
 * type, an impossible accuracy or a malformed effect is caught immediately.
 */

import { describe, it, expect, vi } from 'vitest';
import { MOVES, MOVE_IDS, getMove } from '../src/data/moves.js';
import { TYPE_SET } from '../src/data/types.js';
import { STATUS_SET } from '../src/data/statuses.js';
import {
  MOVE_CATEGORY_SET,
  MOVE_CATEGORIES,
  EFFECT_KINDS,
  EFFECT_KIND_SET,
  MODIFIABLE_STAT_SET,
  EFFECT_TARGET_SET,
  MAX_STAT_STAGE,
} from '../src/data/moveEffects.js';

describe('move database size and shape', () => {
  it('has at least the 40 moves the roadmap calls for', () => {
    expect(MOVE_IDS.length).toBeGreaterThanOrEqual(40);
  });

  it('uses each key as that move\'s own id', () => {
    for (const [key, move] of Object.entries(MOVES)) {
      expect(move.id, `key "${key}" does not match its id`).toBe(key);
    }
  });

  it('gives every move a unique display name', () => {
    const names = Object.values(MOVES).map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('warns for an unknown move id rather than throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getMove('notAMove')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('every move is well-formed', () => {
  for (const [id, move] of Object.entries(MOVES)) {
    describe(`move "${id}"`, () => {
      it('has a name and a description', () => {
        expect(move.name).toBeTruthy();
        expect(move.description).toBeTruthy();
        expect(move.description.length).toBeGreaterThan(10);
      });

      it('has a real type', () => {
        expect(TYPE_SET.has(move.type), `unknown type "${move.type}"`).toBe(true);
      });

      it('has a real category', () => {
        expect(MOVE_CATEGORY_SET.has(move.category), `bad category "${move.category}"`).toBe(true);
      });

      it('has sensible PP', () => {
        expect(Number.isInteger(move.pp)).toBe(true);
        expect(move.pp).toBeGreaterThan(0);
        expect(move.pp).toBeLessThanOrEqual(40);
      });

      it('has a numeric priority', () => {
        expect(Number.isInteger(move.priority)).toBe(true);
        expect(Math.abs(move.priority)).toBeLessThanOrEqual(5);
      });

      it('has accuracy that is either null (never misses) or a percentage', () => {
        if (move.accuracy !== null) {
          expect(move.accuracy).toBeGreaterThan(0);
          expect(move.accuracy).toBeLessThanOrEqual(100);
        }
      });

      it('has power only if it is a damaging move', () => {
        if (move.category === MOVE_CATEGORIES.STATUS) {
          expect(move.power, 'status moves must have null power').toBeNull();
        } else {
          expect(move.power, 'damaging moves need power').toBeGreaterThan(0);
          expect(move.power).toBeLessThanOrEqual(150);
        }
      });
    });
  }
});

describe('every move effect is well-formed', () => {
  const withEffects = Object.values(MOVES).filter((m) => m.effect);

  it('has moves with effects at all', () => {
    expect(withEffects.length).toBeGreaterThan(10);
  });

  for (const move of withEffects) {
    describe(`effect on "${move.id}"`, () => {
      const effect = move.effect;

      it('uses a known effect kind', () => {
        expect(EFFECT_KIND_SET.has(effect.kind), `unknown kind "${effect.kind}"`).toBe(true);
      });

      it('has a valid chance if it declares one', () => {
        if (effect.chance !== undefined) {
          expect(effect.chance).toBeGreaterThan(0);
          expect(effect.chance).toBeLessThanOrEqual(1);
        }
      });

      it('matches the required shape for its kind', () => {
        switch (effect.kind) {
          case EFFECT_KINDS.STATUS:
            expect(STATUS_SET.has(effect.status), `unknown status "${effect.status}"`).toBe(true);
            break;

          case EFFECT_KINDS.STAT_CHANGE:
            expect(EFFECT_TARGET_SET.has(effect.target), `bad target "${effect.target}"`).toBe(true);
            expect(MODIFIABLE_STAT_SET.has(effect.stat), `bad stat "${effect.stat}"`).toBe(true);
            expect(Number.isInteger(effect.stages)).toBe(true);
            expect(effect.stages).not.toBe(0);
            expect(Math.abs(effect.stages)).toBeLessThanOrEqual(MAX_STAT_STAGE);
            break;

          case EFFECT_KINDS.HEAL:
          case EFFECT_KINDS.DRAIN:
          case EFFECT_KINDS.RECOIL:
            expect(effect.fraction).toBeGreaterThan(0);
            expect(effect.fraction).toBeLessThanOrEqual(1);
            break;

          case EFFECT_KINDS.MULTI_HIT:
            expect(Number.isInteger(effect.min)).toBe(true);
            expect(Number.isInteger(effect.max)).toBe(true);
            expect(effect.min).toBeGreaterThanOrEqual(2);
            expect(effect.max).toBeGreaterThanOrEqual(effect.min);
            break;

          case EFFECT_KINDS.FLINCH:
            expect(effect.chance).toBeDefined();
            break;

          default:
            throw new Error(`unhandled effect kind "${effect.kind}"`);
        }
      });
    });
  }

  it('never puts a damage-dependent effect on a status move', () => {
    const damageDependent = [EFFECT_KINDS.DRAIN, EFFECT_KINDS.RECOIL, EFFECT_KINDS.MULTI_HIT];
    for (const move of withEffects) {
      if (damageDependent.includes(move.effect.kind)) {
        expect(
          move.category,
          `"${move.id}" is a status move but its effect needs damage to work`
        ).not.toBe(MOVE_CATEGORIES.STATUS);
      }
    }
  });

  it('only heals with status moves, which is where healing belongs', () => {
    for (const move of withEffects) {
      if (move.effect.kind === EFFECT_KINDS.HEAL) {
        expect(move.category).toBe(MOVE_CATEGORIES.STATUS);
      }
    }
  });
});

describe('the roster covers what Phase 4 needs to build battles', () => {
  const has = (predicate) => Object.values(MOVES).some(predicate);
  const effectOf = (kind) => (m) => m.effect && m.effect.kind === kind;

  it('has all three categories', () => {
    for (const category of Object.values(MOVE_CATEGORIES)) {
      expect(has((m) => m.category === category), `no ${category} moves`).toBe(true);
    }
  });

  it('has weak and strong damaging moves', () => {
    expect(has((m) => m.power !== null && m.power <= 45)).toBe(true);
    expect(has((m) => m.power !== null && m.power >= 85)).toBe(true);
  });

  it('has at least one priority move', () => {
    expect(has((m) => m.priority > 0)).toBe(true);
  });

  it('has a move for every status condition', () => {
    for (const status of STATUS_SET) {
      expect(
        has((m) => m.effect && m.effect.kind === EFFECT_KINDS.STATUS && m.effect.status === status),
        `no move inflicts "${status}"`
      ).toBe(true);
    }
  });

  it('has healing, draining and recoil', () => {
    expect(has(effectOf(EFFECT_KINDS.HEAL))).toBe(true);
    expect(has(effectOf(EFFECT_KINDS.DRAIN))).toBe(true);
    expect(has(effectOf(EFFECT_KINDS.RECOIL))).toBe(true);
  });

  it('has a multi-hit move', () => {
    expect(has(effectOf(EFFECT_KINDS.MULTI_HIT))).toBe(true);
  });

  it('can raise and lower every battle stat it claims to support', () => {
    for (const stat of ['attack', 'defense', 'speed']) {
      expect(
        has((m) => m.effect?.kind === EFFECT_KINDS.STAT_CHANGE && m.effect.stat === stat && m.effect.stages > 0),
        `nothing raises ${stat}`
      ).toBe(true);
      expect(
        has((m) => m.effect?.kind === EFFECT_KINDS.STAT_CHANGE && m.effect.stat === stat && m.effect.stages < 0),
        `nothing lowers ${stat}`
      ).toBe(true);
    }
  });

  it('can modify accuracy', () => {
    expect(
      has((m) => m.effect?.kind === EFFECT_KINDS.STAT_CHANGE && m.effect.stat === 'accuracy')
    ).toBe(true);
  });

  it('covers a broad spread of types', () => {
    const types = new Set(Object.values(MOVES).map((m) => m.type));
    expect(types.size).toBeGreaterThanOrEqual(10);
  });
});
