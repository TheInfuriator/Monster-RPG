/**
 * storage.test.js
 * ----------------------------------------------------------------------------
 * The storage terminal's rules (Phase 13, src/systems/StorageSystem.js):
 * deposit, withdraw and swap, the party's limits, atomic refusals, that the
 * Aether that moves is exactly the one that arrives — and that all of it
 * survives a save and a load.
 */

import { describe, it, expect } from 'vitest';
import {
  canDeposit, canWithdraw, canSwap, depositCreature, withdrawCreature, swapCreatures, STORAGE_REFUSALS,
} from '../src/systems/StorageSystem.js';
import { createNewGameState, gameState } from '../src/core/GameState.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { createSeededRandom } from '../src/utils/rng.js';
import { PARTY } from '../src/config/balance.js';
import { saveToSlot, loadSlot } from '../src/save/SaveManager.js';
import { createMemoryStorage } from '../src/save/SaveStorage.js';
import { MAPS } from '../src/data/maps/index.js';
import { TILE_DEFINITIONS } from '../src/data/tiles.js';

/** A party of `n` and a storage of `m`, every one different and recognisable. */
function stateWith(n, m) {
  const state = createNewGameState();
  const species = ['nibbit', 'flittle', 'vinelet', 'grubbit', 'pebblit', 'zaplet', 'rimelet', 'cirrup', 'delvit'];
  for (let i = 0; i < n; i += 1) state.party.push(createCreature(species[i % species.length], 10 + i));
  for (let i = 0; i < m; i += 1) state.storage.push(createCreature(species[(i + 3) % species.length], 20 + i));
  return state;
}

/** Everyone the player owns, by id. */
const everyone = (state) => [...state.party, ...state.storage].map((c) => c.instanceId).sort();
const faint = (creature) => { creature.currentHp = 0; return creature; };

describe('depositing', () => {
  it('moves a party member to the end of storage, and the party closes up', () => {
    const state = stateWith(3, 1);
    const moving = state.party[1];
    const result = depositCreature(state, 1);
    expect(result.ok).toBe(true);
    expect(state.party.map((c) => c.instanceId)).not.toContain(moving.instanceId);
    expect(state.party.length).toBe(2);
    expect(state.storage.at(-1)).toBe(moving);   // the very same object
  });

  it('refuses the last Aether in the party', () => {
    const state = stateWith(1, 2);
    const before = JSON.stringify(state);
    expect(depositCreature(state, 0)).toMatchObject({ ok: false, reason: 'lastUsable' });
    expect(JSON.stringify(state)).toBe(before);
  });

  it('refuses the last one able to FIGHT, even with fainted ones beside it', () => {
    const state = stateWith(3, 0);
    faint(state.party[0]);
    faint(state.party[2]);
    expect(canDeposit(state, 1).reason).toBe('lastUsable');
    // ...but a fainted one can go, because the healthy one stays.
    expect(canDeposit(state, 0).ok).toBe(true);
    expect(depositCreature(state, 2).ok).toBe(true);
  });

  it('refuses a slot that does not exist, changing nothing', () => {
    const state = stateWith(2, 0);
    const before = JSON.stringify(state);
    for (const index of [-1, 2, 1.5, '0', null, undefined]) {
      expect(depositCreature(state, index).reason).toBe('noSuchCreature');
    }
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('withdrawing', () => {
  it('brings a stored Aether to the end of the party', () => {
    const state = stateWith(2, 3);
    const moving = state.storage[1];
    expect(withdrawCreature(state, 1).ok).toBe(true);
    expect(state.party.at(-1)).toBe(moving);
    expect(state.storage).not.toContain(moving);
  });

  it(`refuses when ${PARTY.maxSize} are already travelling — swap instead`, () => {
    const state = stateWith(PARTY.maxSize, 2);
    const before = JSON.stringify(state);
    const result = withdrawCreature(state, 0);
    expect(result).toMatchObject({ ok: false, reason: 'partyFull' });
    expect(result.message).toMatch(/Swap/);
    expect(JSON.stringify(state)).toBe(before);
    expect(canSwap(state, 0, 0).ok).toBe(true);
  });

  it('refuses an empty storage slot', () => {
    expect(canWithdraw(stateWith(2, 0), 0).reason).toBe('noSuchCreature');
  });
});

describe('swapping', () => {
  it('trades places: each takes the other\'s slot, nobody else moves', () => {
    const state = stateWith(4, 3);
    const out = state.party[2];
    const into = state.storage[1];
    const others = [state.party[0], state.party[1], state.party[3], state.storage[0], state.storage[2]];
    const result = swapCreatures(state, 2, 1);
    expect(result).toMatchObject({ ok: true, deposited: out, withdrawn: into });
    expect(state.party[2]).toBe(into);
    expect(state.storage[1]).toBe(out);
    expect([state.party[0], state.party[1], state.party[3], state.storage[0], state.storage[2]]).toEqual(others);
  });

  it('works with a full party', () => {
    const state = stateWith(PARTY.maxSize, 1);
    expect(swapCreatures(state, 5, 0).ok).toBe(true);
    expect(state.party.length).toBe(PARTY.maxSize);
  });

  it('refuses to swap the last fighter for a fainted Aether', () => {
    const state = stateWith(1, 1);
    faint(state.storage[0]);
    const before = JSON.stringify(state);
    expect(swapCreatures(state, 0, 0).reason).toBe('lastUsable');
    expect(JSON.stringify(state)).toBe(before);
  });

  it('lets a fainted party member be swapped for a healthy one', () => {
    const state = stateWith(2, 1);
    faint(state.party[1]);
    expect(swapCreatures(state, 1, 0).ok).toBe(true);
  });
});

describe('nothing is ever lost, duplicated or changed', () => {
  it('keeps every Aether, exactly as it was, through hundreds of random moves', () => {
    const random = createSeededRandom(1313);
    const state = stateWith(4, 5);
    faint(state.storage[2]);
    state.party[0].nickname = 'Sparky';
    state.party[1].status = 'burn';
    state.party[2].moves[0].pp = 3;
    const ids = everyone(state);
    const fingerprint = (s) => Object.fromEntries([...s.party, ...s.storage].map((c) => [c.instanceId, JSON.stringify(c)]));
    const before = fingerprint(state);

    for (let i = 0; i < 600; i += 1) {
      const p = Math.floor(random() * 8) - 1;
      const s = Math.floor(random() * 11) - 1;
      const move = Math.floor(random() * 3);
      if (move === 0) depositCreature(state, p);
      else if (move === 1) withdrawCreature(state, s);
      else swapCreatures(state, p, s);

      expect(everyone(state)).toEqual(ids);
      expect(state.party.length).toBeGreaterThanOrEqual(1);
      expect(state.party.length).toBeLessThanOrEqual(PARTY.maxSize);
      expect(state.party.some((c) => c.currentHp > 0)).toBe(true);
    }
    // Not one field of any Aether changed: HP, PP, status, nickname, moves, EXP.
    expect(fingerprint(state)).toEqual(before);
  });

  it('explains every refusal in words', () => {
    for (const message of Object.values(STORAGE_REFUSALS)) expect(message.length).toBeGreaterThan(10);
  });
});

describe('a save remembers exactly where everyone is', () => {
  it('survives saving and loading after deposits, withdrawals and a swap', () => {
    const storage = createMemoryStorage();
    const state = stateWith(5, 3);
    state.storage[0].nickname = 'Kept';
    state.party[4].status = 'poison';
    depositCreature(state, 4);
    withdrawCreature(state, 1);
    swapCreatures(state, 0, 0);
    const expected = { party: state.party.map((c) => c.instanceId), storage: state.storage.map((c) => c.instanceId) };

    expect(saveToSlot('manual', state, { storage }).ok).toBe(true);
    expect(loadSlot('manual', { storage }).ok).toBe(true);
    expect(gameState.party.map((c) => c.instanceId)).toEqual(expected.party);
    expect(gameState.storage.map((c) => c.instanceId)).toEqual(expected.storage);
    expect(gameState.party.find((c) => c.nickname === 'Kept')).toBeDefined();
    expect(gameState.storage.find((c) => c.status === 'poison')).toBeDefined();
  });
});

describe('every Mender\'s Hall has a terminal', () => {
  const halls = Object.values(MAPS).filter((map) => (map.npcs || [])
    .some((npc) => (npc.dialogue || []).some?.((b) => b && b.action === 'heal')));

  it('one per Hall, on a terminal tile, opened with the storage action', () => {
    expect(halls.length).toBe(4);
    for (const map of halls) {
      const terminals = (map.interactables || []).filter((e) => (e.dialogue || []).some?.((b) => b && b.action === 'storage'));
      expect(terminals.length, map.id).toBe(1);
      const [{ x, y }] = terminals;
      expect(TILE_DEFINITIONS[map.tiles[y][x]].id, map.id).toBe('storage_terminal');
    }
  });
});
