/**
 * Tests for building individual creatures and managing the party.
 *
 * The factory is where shared species data becomes a creature the player owns,
 * so this is the boundary where a bug would quietly corrupt someone's save.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCreature,
  recalculateStats,
  getDisplayName,
  getCreatureTypes,
  getCreatureSpecies,
  isFainted,
  getHpFraction,
  fullyHeal,
  getPendingEvolution,
  generateInstanceId,
} from '../src/systems/CreatureFactory.js';
import {
  addToParty,
  addToStorage,
  giveCreature,
  getActiveCreature,
  getHealthyCreatures,
  isPartyFull,
  isPartyEmpty,
  isPartyDefeated,
  getPartySize,
  findInParty,
  swapPartyMembers,
  describeParty,
} from '../src/systems/PartySystem.js';
import { createNewGameState } from '../src/core/GameState.js';
import { CREATURES, CREATURE_IDS, STARTER_LEVEL } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { PARTY, PROGRESSION } from '../src/config/balance.js';
import { calculateStats, experienceForLevel, STAT_KEYS } from '../src/systems/StatCalculator.js';

describe('creating a creature', () => {
  it('builds a complete instance', () => {
    const c = createCreature('pyrret', 5);
    expect(c.speciesId).toBe('pyrret');
    expect(c.level).toBe(5);
    expect(c.nickname).toBeNull();
    expect(c.status).toBeNull();
    expect(c.instanceId).toBeTruthy();
  });

  it('starts at full health', () => {
    const c = createCreature('pyrret', 5);
    expect(c.currentHp).toBe(c.stats.hp);
    expect(isFainted(c)).toBe(false);
    expect(getHpFraction(c)).toBe(1);
  });

  it('has stats matching the calculator exactly', () => {
    const c = createCreature('drizzle', 12);
    expect(c.stats).toEqual(calculateStats(CREATURES.drizzle, 12));
  });

  it('starts on its species growth curve at the right experience', () => {
    const c = createCreature('pebblit', 20);
    expect(c.experience).toBe(experienceForLevel(20, CREATURES.pebblit.growthRate));
  });

  it('knows the moves its species learns by that level', () => {
    const c = createCreature('pyrret', 5);
    const ids = c.moves.map((m) => m.id);
    expect(ids).toContain('ember');
    expect(ids).not.toContain('flameBurst');
  });

  it('gives every move full PP', () => {
    const c = createCreature('sproutle', 20);
    for (const move of c.moves) {
      expect(move.pp).toBe(move.maxPp);
      expect(move.maxPp).toBe(MOVES[move.id].pp);
    }
  });

  it('never exceeds the move limit', () => {
    for (const id of CREATURE_IDS) {
      const c = createCreature(id, PROGRESSION.maxLevel);
      expect(c.moves.length, `${id} has too many moves`).toBeLessThanOrEqual(PARTY.maxMoves);
      expect(c.moves.length, `${id} has no moves`).toBeGreaterThan(0);
    }
  });

  it('accepts a nickname', () => {
    const c = createCreature('pyrret', 5, { nickname: 'Sparky' });
    expect(getDisplayName(c)).toBe('Sparky');
  });

  it('falls back to the species name with no nickname', () => {
    expect(getDisplayName(createCreature('pyrret', 5))).toBe('Pyrret');
  });

  it('accepts an explicit move list', () => {
    const c = createCreature('pyrret', 5, { moves: ['tackle', 'ember'] });
    expect(c.moves.map((m) => m.id)).toEqual(['tackle', 'ember']);
  });

  it('drops unknown moves from an explicit list rather than breaking', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const c = createCreature('pyrret', 5, { moves: ['tackle', 'notAMove'] });
    expect(c.moves.map((m) => m.id)).toEqual(['tackle']);
    warn.mockRestore();
  });

  it('clamps out-of-range levels', () => {
    expect(createCreature('pyrret', 0).level).toBe(1);
    expect(createCreature('pyrret', 999).level).toBe(PROGRESSION.maxLevel);
  });

  it('returns null and logs an error for an unknown species', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(createCreature('notAThing', 5)).toBeNull();
    expect(error).toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
  });

  it('can build every species at every meaningful level', () => {
    for (const id of CREATURE_IDS) {
      for (const level of [1, 5, 16, 34, 50, 100]) {
        const c = createCreature(id, level);
        expect(c, `${id} at level ${level} failed to build`).not.toBeNull();
        expect(c.currentHp).toBeGreaterThan(0);
        for (const key of STAT_KEYS) expect(c.stats[key]).toBeGreaterThan(0);
      }
    }
  });
});

describe('instance ids', () => {
  it('gives every creature a different id', () => {
    const ids = new Set();
    for (let i = 0; i < 2000; i += 1) ids.add(generateInstanceId());
    expect(ids.size).toBe(2000);
  });

  it('never repeats an id across many created creatures', () => {
    const ids = new Set();
    for (let i = 0; i < 500; i += 1) ids.add(createCreature('nibbit', 3).instanceId);
    expect(ids.size).toBe(500);
  });
});

describe('creature helpers', () => {
  it('reads types and species from the instance', () => {
    const c = createCreature('thornmane', 40);
    expect(getCreatureTypes(c)).toEqual(['grass', 'fighting']);
    expect(getCreatureSpecies(c).name).toBe('Thornmane');
  });

  it('reports fainting at zero HP', () => {
    const c = createCreature('pyrret', 5);
    c.currentHp = 0;
    expect(isFainted(c)).toBe(true);
    expect(getHpFraction(c)).toBe(0);
  });

  it('reports half health as 0.5', () => {
    const c = createCreature('pyrret', 20);
    c.currentHp = Math.floor(c.stats.hp / 2);
    expect(getHpFraction(c)).toBeCloseTo(0.5, 1);
  });

  it('fully heals HP, status and PP', () => {
    const c = createCreature('pyrret', 20);
    c.currentHp = 1;
    c.status = 'burn';
    c.moves[0].pp = 0;

    fullyHeal(c);
    expect(c.currentHp).toBe(c.stats.hp);
    expect(c.status).toBeNull();
    expect(c.moves[0].pp).toBe(c.moves[0].maxPp);
  });
});

describe('recalculating stats', () => {
  it('updates stats after a level change', () => {
    const c = createCreature('pyrret', 5);
    const before = c.stats.attack;
    c.level = 15;
    recalculateStats(c);
    expect(c.stats.attack).toBeGreaterThan(before);
  });

  it('grants the extra max HP as real HP, so levelling up feels like a gain', () => {
    const c = createCreature('pyrret', 5);
    const hpBefore = c.stats.hp;
    c.currentHp = hpBefore;

    c.level = 6;
    recalculateStats(c);

    expect(c.currentHp).toBe(c.stats.hp);
    expect(c.stats.hp).toBeGreaterThan(hpBefore);
  });

  it('keeps existing damage rather than healing on level-up', () => {
    const c = createCreature('pyrret', 5);
    const maxBefore = c.stats.hp;
    c.currentHp = 3;

    c.level = 6;
    recalculateStats(c);

    const gained = c.stats.hp - maxBefore;
    expect(c.currentHp).toBe(3 + gained);
    expect(c.currentHp).toBeLessThan(c.stats.hp);
  });

  it('never leaves current HP above max', () => {
    const c = createCreature('pyrret', 40);
    c.currentHp = 9999;
    c.level = 5;
    recalculateStats(c);
    expect(c.currentHp).toBeLessThanOrEqual(c.stats.hp);
  });
});

describe('evolution readiness', () => {
  it('reports nothing below the evolution level', () => {
    expect(getPendingEvolution(createCreature('pyrret', 15))).toBeNull();
  });

  it('reports the target at and above the evolution level', () => {
    expect(getPendingEvolution(createCreature('pyrret', 16))).toBe('cindraw');
    expect(getPendingEvolution(createCreature('pyrret', 30))).toBe('cindraw');
  });

  it('reports nothing for a final form', () => {
    expect(getPendingEvolution(createCreature('emberax', 100))).toBeNull();
  });

  it('agrees with the database for every species', () => {
    for (const id of CREATURE_IDS) {
      const evo = CREATURES[id].evolution;
      if (!evo) {
        expect(getPendingEvolution(createCreature(id, PROGRESSION.maxLevel))).toBeNull();
      } else {
        expect(getPendingEvolution(createCreature(id, evo.level))).toBe(evo.to);
        if (evo.level > 1) {
          expect(getPendingEvolution(createCreature(id, evo.level - 1))).toBeNull();
        }
      }
    }
  });
});

describe('the party', () => {
  let state;
  beforeEach(() => {
    state = createNewGameState();
  });

  it('starts empty', () => {
    expect(isPartyEmpty(state)).toBe(true);
    expect(getPartySize(state)).toBe(0);
    expect(getActiveCreature(state)).toBeNull();
  });

  it('adds a creature', () => {
    expect(addToParty(state, createCreature('pyrret', STARTER_LEVEL))).toBe(true);
    expect(getPartySize(state)).toBe(1);
    expect(isPartyEmpty(state)).toBe(false);
  });

  it('holds up to the configured maximum', () => {
    for (let i = 0; i < PARTY.maxSize; i += 1) {
      expect(addToParty(state, createCreature('nibbit', 3))).toBe(true);
    }
    expect(isPartyFull(state)).toBe(true);
    expect(getPartySize(state)).toBe(PARTY.maxSize);
  });

  it('refuses a seventh creature and changes nothing', () => {
    for (let i = 0; i < PARTY.maxSize; i += 1) addToParty(state, createCreature('nibbit', 3));
    expect(addToParty(state, createCreature('pyrret', 5))).toBe(false);
    expect(getPartySize(state)).toBe(PARTY.maxSize);
  });

  it('refuses a null creature', () => {
    expect(addToParty(state, null)).toBe(false);
    expect(getPartySize(state)).toBe(0);
  });

  it('sends overflow to storage automatically', () => {
    for (let i = 0; i < PARTY.maxSize; i += 1) addToParty(state, createCreature('nibbit', 3));

    const result = giveCreature(state, createCreature('wispel', 10));
    expect(result).toEqual({ added: true, destination: 'storage' });
    expect(state.storage).toHaveLength(1);
    expect(getPartySize(state)).toBe(PARTY.maxSize);
  });

  it('puts a creature in the party when there is room', () => {
    const result = giveCreature(state, createCreature('wispel', 10));
    expect(result).toEqual({ added: true, destination: 'party' });
    expect(getPartySize(state)).toBe(1);
  });

  it('adds directly to storage when asked', () => {
    expect(addToStorage(state, createCreature('umbrat', 8))).toBe(true);
    expect(state.storage).toHaveLength(1);
  });
});

describe('choosing the active creature', () => {
  let state;
  beforeEach(() => {
    state = createNewGameState();
  });

  it('is the first party member when everyone is healthy', () => {
    const first = createCreature('pyrret', 5);
    addToParty(state, first);
    addToParty(state, createCreature('nibbit', 5));
    expect(getActiveCreature(state).instanceId).toBe(first.instanceId);
  });

  it('skips fainted members', () => {
    const fainted = createCreature('pyrret', 5);
    fainted.currentHp = 0;
    const healthy = createCreature('nibbit', 5);
    addToParty(state, fainted);
    addToParty(state, healthy);

    expect(getActiveCreature(state).instanceId).toBe(healthy.instanceId);
  });

  it('falls back to the first member when everyone has fainted', () => {
    const first = createCreature('pyrret', 5);
    first.currentHp = 0;
    addToParty(state, first);
    expect(getActiveCreature(state).instanceId).toBe(first.instanceId);
  });

  it('reports a wipe only when the party exists and is all fainted', () => {
    expect(isPartyDefeated(state)).toBe(false); // empty party is not a defeat

    const c = createCreature('pyrret', 5);
    addToParty(state, c);
    expect(isPartyDefeated(state)).toBe(false);

    c.currentHp = 0;
    expect(isPartyDefeated(state)).toBe(true);
    expect(getHealthyCreatures(state)).toHaveLength(0);
  });
});

describe('party utilities', () => {
  let state;
  beforeEach(() => {
    state = createNewGameState();
  });

  it('finds a member by instance id', () => {
    const c = createCreature('pyrret', 5);
    addToParty(state, c);
    expect(findInParty(state, c.instanceId)).toBe(c);
    expect(findInParty(state, 'nope')).toBeNull();
  });

  it('swaps two members', () => {
    const a = createCreature('pyrret', 5);
    const b = createCreature('nibbit', 5);
    addToParty(state, a);
    addToParty(state, b);

    expect(swapPartyMembers(state, 0, 1)).toBe(true);
    expect(state.party[0]).toBe(b);
    expect(state.party[1]).toBe(a);
  });

  it('refuses invalid swaps', () => {
    addToParty(state, createCreature('pyrret', 5));
    expect(swapPartyMembers(state, 0, 5)).toBe(false);
    expect(swapPartyMembers(state, 0, 0)).toBe(false);
    expect(swapPartyMembers(state, -1, 0)).toBe(false);
  });

  it('describes the party for the debug overlay', () => {
    expect(describeParty(state)).toBe('empty');
    addToParty(state, createCreature('pyrret', 5));
    expect(describeParty(state)).toMatch(/Pyrret L5/);
  });
});

describe('party data survives a round trip through JSON', () => {
  it('serialises and restores without loss', () => {
    const state = createNewGameState();
    addToParty(state, createCreature('pyrret', 12, { nickname: 'Ash' }));
    addToParty(state, createCreature('brookel', 25));

    const restored = JSON.parse(JSON.stringify(state));
    expect(restored.party).toEqual(state.party);
    expect(getDisplayName(restored.party[0])).toBe('Ash');
    expect(restored.party[1].stats).toEqual(state.party[1].stats);
  });
});
