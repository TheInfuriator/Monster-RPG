/**
 * Tests for NPC presence: the two optional map fields that let the story put
 * someone on a map or take them off it.
 */

import { describe, it, expect } from 'vitest';
import { isNpcPresent, stepsToLeave, wayHome } from '../src/systems/NpcPresence.js';
import { MAPS } from '../src/data/maps/index.js';
import { DIRECTIONS } from '../src/config/controls.js';

const npc = (fields = {}) => ({ id: 'someone', x: 1, y: 1, ...fields });

describe('whether an NPC is on their map', () => {
  it('always, for an NPC with no presence fields — which is nearly everyone', () => {
    expect(isNpcPresent(npc(), {})).toBe(true);
    expect(isNpcPresent(npc(), { anything: true })).toBe(true);
  });

  it('only once presentWhen holds', () => {
    const waiting = npc({ presentWhen: 'badge:verdantSigil' });
    expect(isNpcPresent(waiting, {})).toBe(false);
    expect(isNpcPresent(waiting, { 'badge:verdantSigil': true })).toBe(true);
  });

  it('needs EVERY presentWhen condition when given a list', () => {
    const waiting = npc({ presentWhen: ['a', 'b'] });
    expect(isNpcPresent(waiting, { a: true })).toBe(false);
    expect(isNpcPresent(waiting, { a: true, b: true })).toBe(true);
  });

  it('leaves as soon as absentWhen holds', () => {
    const leaving = npc({ absentWhen: 'trainer:someone' });
    expect(isNpcPresent(leaving, {})).toBe(true);
    expect(isNpcPresent(leaving, { 'trainer:someone': true })).toBe(false);
  });

  it('leaves when ANY absentWhen condition holds', () => {
    const leaving = npc({ absentWhen: ['a', 'b'] });
    expect(isNpcPresent(leaving, { b: true })).toBe(false);
  });

  it('arrives and leaves: absent, present, gone', () => {
    const visitor = npc({ presentWhen: 'arrived', absentWhen: 'left' });
    expect(isNpcPresent(visitor, {})).toBe(false);
    expect(isNpcPresent(visitor, { arrived: true })).toBe(true);
    expect(isNpcPresent(visitor, { arrived: true, left: true })).toBe(false);
  });

  it('treats a missing conditions object as "nothing has happened"', () => {
    expect(isNpcPresent(npc({ presentWhen: 'x' }))).toBe(false);
    expect(isNpcPresent(npc())).toBe(true);
  });
});

describe('how far a beaten trainer walks to leave', () => {
  const at = (tileX, tileY) => ({ tileX, tileY, homeX: 26, homeY: 5 });

  it('walks the declared steps from their own tile', () => {
    expect(stepsToLeave(at(26, 5), { direction: 'up', steps: 3 })).toBe(3);
  });

  it('first walks back up the lane they came down to challenge', () => {
    // Kestrel spotted the player at (26, 10) and stopped at (26, 9).
    expect(stepsToLeave(at(26, 9), { direction: 'up', steps: 3 })).toBe(7);
  });

  it('works the same way in every direction', () => {
    const home = { homeX: 10, homeY: 10 };
    expect(stepsToLeave({ ...home, tileX: 10, tileY: 7 }, { direction: 'down', steps: 2 })).toBe(5);
    expect(stepsToLeave({ ...home, tileX: 13, tileY: 10 }, { direction: 'left', steps: 2 })).toBe(5);
    expect(stepsToLeave({ ...home, tileX: 8, tileY: 10 }, { direction: 'right', steps: 2 })).toBe(4);
  });

  it('never walks fewer than the declared steps, whichever side they ended up on', () => {
    expect(stepsToLeave(at(26, 3), { direction: 'up', steps: 3 })).toBe(3);
  });
});

describe('the way back to a trainer\'s post', () => {
  const home = { homeX: 14, homeY: 4 };

  it('is straight back up the lane they walked down', () => {
    expect(wayHome({ ...home, tileX: 14, tileY: 8 })).toEqual({ direction: 'up', steps: 4 });
  });

  it('works along any lane', () => {
    expect(wayHome({ ...home, tileX: 14, tileY: 1 })).toEqual({ direction: 'down', steps: 3 });
    expect(wayHome({ ...home, tileX: 17, tileY: 4 })).toEqual({ direction: 'left', steps: 3 });
    expect(wayHome({ ...home, tileX: 12, tileY: 4 })).toEqual({ direction: 'right', steps: 2 });
  });

  it('is nothing when they never left', () => {
    expect(wayHome({ ...home, tileX: 14, tileY: 4 })).toBeNull();
  });

  it('refuses a diagonal, which a sight lane can never be', () => {
    expect(wayHome({ ...home, tileX: 15, tileY: 6 })).toBeNull();
  });
});

describe('presence and exit fields on every map', () => {
  const isConditionList = (value) =>
    typeof value === 'string'
      ? value.length > 0
      : Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string' && v);

  for (const [mapId, map] of Object.entries(MAPS)) {
    for (const entry of map.npcs || []) {
      if (entry.presentWhen === undefined && entry.absentWhen === undefined
        && entry.exitAfterDefeat === undefined && entry.returnAfterDefeat === undefined) continue;

      describe(`${mapId}:${entry.id}`, () => {
        it('writes its conditions as a name or a list of names', () => {
          if (entry.presentWhen !== undefined) expect(isConditionList(entry.presentWhen)).toBe(true);
          if (entry.absentWhen !== undefined) expect(isConditionList(entry.absentWhen)).toBe(true);
        });

        it('either walks home or walks off after a defeat — never both', () => {
          if (entry.returnAfterDefeat === undefined) return;
          expect(entry.returnAfterDefeat).toBe(true);
          expect(entry.trainer).toBeTruthy();
          expect(entry.exitAfterDefeat).toBeUndefined();
        });

        it('only walks off after a defeat if it is a trainer who then leaves', () => {
          if (entry.exitAfterDefeat === undefined) return;
          expect(entry.trainer).toBeTruthy();
          expect([].concat(entry.absentWhen ?? [])).toContain(`trainer:${entry.trainer}`);

          const { direction, steps } = entry.exitAfterDefeat;
          expect(DIRECTIONS).toContain(direction);
          expect(Number.isInteger(steps)).toBe(true);
          expect(steps).toBeGreaterThanOrEqual(1);
          expect(steps).toBeLessThanOrEqual(8);
        });
      });
    }
  }
});
