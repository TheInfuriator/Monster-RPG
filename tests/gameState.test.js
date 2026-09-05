/**
 * Tests for the shared game state and the random helpers.
 * Both are small now, but every later system builds on them.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewGameState,
  startNewGame,
  setGameState,
  setLocation,
  hasFlag,
  setFlag,
  gameState,
  SAVE_VERSION,
} from '../src/core/GameState.js';
import { STARTING_MAP_ID } from '../src/data/maps/index.js';
import { ECONOMY } from '../src/config/balance.js';
import {
  createSeededRandom,
  randomInt,
  chance,
  pickWeighted,
  clamp,
} from '../src/utils/rng.js';

describe('new game state', () => {
  beforeEach(() => setGameState(createNewGameState()));

  it('starts on the starting map with the configured money', () => {
    const state = createNewGameState();
    expect(state.location.mapId).toBe(STARTING_MAP_ID);
    expect(state.money).toBe(ECONOMY.startingMoney);
  });

  it('is stamped with the current save version', () => {
    expect(createNewGameState().version).toBe(SAVE_VERSION);
  });

  it('starts with an empty party, inventory and flag set', () => {
    const state = createNewGameState();
    expect(state.party).toEqual([]);
    expect(state.storage).toEqual([]);
    expect(state.badges).toEqual([]);
    expect(state.flags).toEqual({});
  });

  it('returns a fresh object each time, never a shared one', () => {
    const a = createNewGameState();
    const b = createNewGameState();
    a.party.push('something');
    expect(b.party).toEqual([]);
  });

  it('lets a new game set the player name', () => {
    const state = startNewGame('Robin');
    expect(state.playerName).toBe('Robin');
  });

  it('defaults the player name when none is given', () => {
    expect(startNewGame().playerName).toBe('Warden');
  });
});

describe('location tracking', () => {
  beforeEach(() => setGameState(createNewGameState()));

  it('records where the player is standing', () => {
    setLocation('emberhollow', 7, 12, 'left');
    expect(gameState.location).toEqual({
      mapId: 'emberhollow',
      x: 7,
      y: 12,
      facing: 'left',
    });
  });
});

describe('story flags', () => {
  beforeEach(() => setGameState(createNewGameState()));

  it('reports unset flags as false rather than undefined', () => {
    expect(hasFlag('neverSet')).toBe(false);
  });

  it('sets and reads a flag', () => {
    setFlag('starterChosen');
    expect(hasFlag('starterChosen')).toBe(true);
  });

  it('can clear a flag again', () => {
    setFlag('temporary');
    setFlag('temporary', false);
    expect(hasFlag('temporary')).toBe(false);
  });
});

describe('seeded randomness', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it('always returns values between 0 and 1', () => {
    const random = createSeededRandom(7);
    for (let i = 0; i < 500; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('random helpers', () => {
  it('randomInt includes both ends of the range', () => {
    expect(randomInt(5, 10, () => 0)).toBe(5);
    expect(randomInt(5, 10, () => 0.999999)).toBe(10);
  });

  it('chance(0) never happens and chance(1) always happens', () => {
    expect(chance(0, () => 0)).toBe(false);
    expect(chance(1, () => 0.999999)).toBe(true);
  });

  it('clamp keeps a value inside its bounds', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('weighted picking (used later for encounter tables)', () => {
  const table = [
    { id: 'common', weight: 70 },
    { id: 'uncommon', weight: 25 },
    { id: 'rare', weight: 5 },
  ];

  it('picks the first entry at the very bottom of the range', () => {
    expect(pickWeighted(table, () => 0).id).toBe('common');
  });

  it('picks the last entry at the very top of the range', () => {
    expect(pickWeighted(table, () => 0.999999).id).toBe('rare');
  });

  it('respects the weights across many rolls', () => {
    const random = createSeededRandom(99);
    const counts = { common: 0, uncommon: 0, rare: 0 };
    for (let i = 0; i < 10000; i += 1) counts[pickWeighted(table, random).id] += 1;

    // Generous bounds — this checks the distribution is roughly right,
    // not that the generator hits an exact number.
    expect(counts.common).toBeGreaterThan(6500);
    expect(counts.common).toBeLessThan(7500);
    expect(counts.rare).toBeGreaterThan(300);
    expect(counts.rare).toBeLessThan(700);
  });

  it('handles an empty table without throwing', () => {
    expect(pickWeighted([])).toBeUndefined();
  });
});
