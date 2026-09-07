/**
 * Tests for the team the player carries, the storage that catches the overflow,
 * and the Aether Index that records what they have met.
 *
 * These are the rules a capture depends on, so they are checked on their own
 * rather than only through a battle.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getPartySize, isPartyFull, isPartyEmpty, addToParty, addToStorage, giveCreature,
  getActiveCreature, getHealthyCreatures, isPartyDefeated, findInParty, findInStorage,
  findCreature, swapPartyMembers, movePartyMember, removeFromParty, isValidPartyIndex,
  getStorageCount, listStorage, describeParty,
} from '../src/systems/PartySystem.js';
import {
  markSeen, markCaught, isSeen, isCaught, countSeen, countCaught, countSpecies,
  getIndexRows,
} from '../src/systems/CreatureIndex.js';
import { receiveCapturedCreature } from '../src/systems/WildBattle.js';
import { createNewGameState } from '../src/core/GameState.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { PARTY } from '../src/config/balance.js';
import { CREATURES, CREATURE_IDS } from '../src/data/creatures.js';

/** A fresh, isolated game state — never the live one. */
const freshState = () => createNewGameState();

const teamOf = (n, speciesId = 'nibbit') =>
  Array.from({ length: n }, (_, i) => createCreature(speciesId, 5 + i));

// ---------------------------------------------------------------------------
// Party capacity
// ---------------------------------------------------------------------------

describe('party capacity', () => {
  it('starts empty', () => {
    const state = freshState();
    expect(isPartyEmpty(state)).toBe(true);
    expect(getPartySize(state)).toBe(0);
    expect(isPartyFull(state)).toBe(false);
  });

  it('accepts creatures up to the maximum', () => {
    const state = freshState();
    for (let i = 0; i < PARTY.maxSize; i += 1) {
      expect(addToParty(state, createCreature('nibbit', 5)), `slot ${i}`).toBe(true);
    }
    expect(getPartySize(state)).toBe(PARTY.maxSize);
    expect(isPartyFull(state)).toBe(true);
  });

  it('allows exactly six, never seven', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);

    expect(addToParty(state, createCreature('flittle', 5))).toBe(false);
    expect(getPartySize(state)).toBe(PARTY.maxSize);
  });

  it('refuses nothing at all', () => {
    const state = freshState();
    expect(addToParty(state, null)).toBe(false);
    expect(getPartySize(state)).toBe(0);
  });

  it('knows who is leading and who can still fight', () => {
    const state = freshState();
    state.party = teamOf(3);
    expect(getActiveCreature(state)).toBe(state.party[0]);

    state.party[0].currentHp = 0;
    expect(getActiveCreature(state)).toBe(state.party[1]);
    expect(getHealthyCreatures(state)).toHaveLength(2);
    expect(isPartyDefeated(state)).toBe(false);

    for (const creature of state.party) creature.currentHp = 0;
    expect(isPartyDefeated(state)).toBe(true);
  });

  it('summarises itself for the debug overlay', () => {
    const state = freshState();
    expect(describeParty(state)).toBe('empty');
    state.party = teamOf(2);
    expect(describeParty(state)).toMatch(/Nibbit L5/);
  });
});

// ---------------------------------------------------------------------------
// Reordering
// ---------------------------------------------------------------------------

describe('reordering the party', () => {
  it('swaps two members and changes who leads', () => {
    const state = freshState();
    state.party = teamOf(3);
    const [first, second] = state.party;

    expect(swapPartyMembers(state, 0, 1)).toBe(true);
    expect(state.party[0]).toBe(second);
    expect(state.party[1]).toBe(first);
    expect(getActiveCreature(state)).toBe(second);
  });

  it('keeps every creature, and the same individuals', () => {
    const state = freshState();
    state.party = teamOf(4);
    const ids = state.party.map((c) => c.instanceId);

    swapPartyMembers(state, 0, 3);
    expect(state.party).toHaveLength(4);
    expect(new Set(state.party.map((c) => c.instanceId))).toEqual(new Set(ids));
  });

  it('does nothing at all for an invalid swap', () => {
    const state = freshState();
    state.party = teamOf(2);
    const before = [...state.party];

    expect(swapPartyMembers(state, 0, 5)).toBe(false);
    expect(swapPartyMembers(state, -1, 1)).toBe(false);
    expect(swapPartyMembers(state, 0, 0)).toBe(false);
    expect(swapPartyMembers(state, 1.5, 0)).toBe(false);
    expect(state.party).toEqual(before);
  });

  it('moves a member to another slot, sliding the rest along', () => {
    const state = freshState();
    state.party = teamOf(4);
    const [a, b, c, d] = state.party;

    expect(movePartyMember(state, 3, 0)).toBe(true);
    expect(state.party).toEqual([d, a, b, c]);
  });

  it('does nothing at all for an invalid move', () => {
    const state = freshState();
    state.party = teamOf(3);
    const before = [...state.party];

    expect(movePartyMember(state, 0, 9)).toBe(false);
    expect(movePartyMember(state, 9, 0)).toBe(false);
    expect(movePartyMember(state, 1, 1)).toBe(false);
    expect(state.party).toEqual(before);
  });

  it('validates indexes on their own', () => {
    const state = freshState();
    state.party = teamOf(2);
    expect(isValidPartyIndex(state, 0)).toBe(true);
    expect(isValidPartyIndex(state, 1)).toBe(true);
    expect(isValidPartyIndex(state, 2)).toBe(false);
    expect(isValidPartyIndex(state, -1)).toBe(false);
    expect(isValidPartyIndex(state, '0')).toBe(false);
  });

  it('removes a member, but never the last one', () => {
    const state = freshState();
    state.party = teamOf(2);
    const second = state.party[1];

    expect(removeFromParty(state, 1)).toBe(second);
    expect(getPartySize(state)).toBe(1);
    expect(removeFromParty(state, 0)).toBeNull();
    expect(getPartySize(state)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

describe('storage', () => {
  it('takes the overflow when the party is full', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    const extra = createCreature('emberfly', 6);

    const result = giveCreature(state, extra);
    expect(result).toEqual({ added: true, destination: 'storage' });
    expect(getPartySize(state)).toBe(PARTY.maxSize);
    expect(getStorageCount(state)).toBe(1);
    expect(listStorage(state)[0]).toBe(extra);
  });

  it('goes to the party while there is room', () => {
    const state = freshState();
    const creature = createCreature('nibbit', 3);

    expect(giveCreature(state, creature)).toEqual({ added: true, destination: 'party' });
    expect(state.party[0]).toBe(creature);
    expect(getStorageCount(state)).toBe(0);
  });

  it('never overwrites what is already stored', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);

    const stored = [];
    for (let i = 0; i < 5; i += 1) {
      const creature = createCreature('flittle', 4 + i);
      stored.push(creature);
      giveCreature(state, creature);
    }

    expect(getStorageCount(state)).toBe(5);
    expect(listStorage(state)).toEqual(stored);
    expect(new Set(stored.map((c) => c.instanceId)).size).toBe(5);
  });

  it('finds a stored creature by its instance id', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    const creature = createCreature('puffcap', 5);
    giveCreature(state, creature);

    expect(findInStorage(state, creature.instanceId)).toBe(creature);
    expect(findInParty(state, creature.instanceId)).toBeNull();
    expect(findCreature(state, creature.instanceId)).toBe(creature);
    expect(findInStorage(state, 'nope')).toBeNull();
  });

  it('hands out a copy of its list, so callers cannot reorder it by accident', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    giveCreature(state, createCreature('nibbit', 2));

    const listed = listStorage(state);
    listed.push('junk');
    expect(getStorageCount(state)).toBe(1);
  });

  it('serialises as plain data', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    giveCreature(state, createCreature('vinelet', 4));

    const round = JSON.parse(JSON.stringify(state));
    expect(round.storage).toHaveLength(1);
    expect(round.storage[0].instanceId).toBe(state.storage[0].instanceId);
  });

  it('refuses nothing at all', () => {
    const state = freshState();
    expect(addToStorage(state, null)).toBe(false);
    expect(getStorageCount(state)).toBe(0);
    expect(giveCreature(state, null)).toEqual({ added: false, destination: null });
  });
});

// ---------------------------------------------------------------------------
// The index
// ---------------------------------------------------------------------------

describe('the Aether Index', () => {
  it('starts blank', () => {
    const state = freshState();
    expect(countSeen(state)).toBe(0);
    expect(countCaught(state)).toBe(0);
    expect(isSeen('nibbit', state)).toBe(false);
    expect(isCaught('nibbit', state)).toBe(false);
  });

  it('records a species as seen', () => {
    const state = freshState();
    expect(markSeen('nibbit', state)).toBe(true);
    expect(isSeen('nibbit', state)).toBe(true);
    expect(isCaught('nibbit', state)).toBe(false);
  });

  it('seen does not imply caught', () => {
    const state = freshState();
    markSeen('flittle', state);
    expect(countSeen(state)).toBe(1);
    expect(countCaught(state)).toBe(0);
  });

  it('caught always implies seen', () => {
    const state = freshState();
    markCaught('vinelet', state);
    expect(isSeen('vinelet', state)).toBe(true);
    expect(isCaught('vinelet', state)).toBe(true);
  });

  it('is idempotent — recording twice changes nothing', () => {
    const state = freshState();
    markSeen('nibbit', state);
    markSeen('nibbit', state);
    markCaught('nibbit', state);
    markCaught('nibbit', state);

    expect(countSeen(state)).toBe(1);
    expect(countCaught(state)).toBe(1);
  });

  it('rejects a species that does not exist, without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = freshState();

    expect(markSeen('notacreature', state)).toBe(false);
    expect(markCaught('notacreature', state)).toBe(false);
    expect(markSeen(null, state)).toBe(false);
    expect(countSeen(state)).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('survives an older save with no index on it', () => {
    const state = freshState();
    delete state.creatureIndex;

    expect(markSeen('nibbit', state)).toBe(true);
    expect(isSeen('nibbit', state)).toBe(true);
  });

  it('serialises as plain data', () => {
    const state = freshState();
    markCaught('nibbit', state);
    markSeen('flittle', state);

    const round = JSON.parse(JSON.stringify(state));
    expect(round.creatureIndex.caught.nibbit).toBe(true);
    expect(round.creatureIndex.seen.flittle).toBe(true);
  });

  it('has a slot for every species and no others', () => {
    const rows = getIndexRows(freshState());
    expect(rows).toHaveLength(countSpecies());
    expect(rows).toHaveLength(CREATURE_IDS.length);

    for (const row of rows) {
      expect(CREATURES[row.id], `index row for unknown "${row.id}"`).toBeDefined();
    }
  });

  it('lists species in number order, with no gaps or duplicates', () => {
    const numbers = getIndexRows(freshState()).map((row) => row.number);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('hides a species the player has never met', () => {
    const row = getIndexRows(freshState()).find((r) => r.id === 'nibbit');
    expect(row.seen).toBe(false);
    expect(row.caught).toBe(false);
    expect(row.name).toBe('-----');
    expect(row.types).toEqual([]);
    expect(row.description).toBeNull();
    expect(row.number).toBeGreaterThan(0);
  });

  it('shows the name and types once it has been seen', () => {
    const state = freshState();
    markSeen('nibbit', state);

    const row = getIndexRows(state).find((r) => r.id === 'nibbit');
    expect(row.seen).toBe(true);
    expect(row.caught).toBe(false);
    expect(row.name).toBe(CREATURES.nibbit.name);
    expect(row.types).toEqual(CREATURES.nibbit.types);
    // The write-up is the reward for catching one.
    expect(row.description).toBeNull();
  });

  it('shows the write-up once it has been caught', () => {
    const state = freshState();
    markCaught('nibbit', state);

    const row = getIndexRows(state).find((r) => r.id === 'nibbit');
    expect(row.caught).toBe(true);
    expect(row.description).toBe(CREATURES.nibbit.description);
  });
});

// ---------------------------------------------------------------------------
// Taking delivery of a capture
// ---------------------------------------------------------------------------

describe('receiving a captured creature', () => {
  it('puts it in the party and says so', () => {
    const state = freshState();
    state.party = teamOf(2);
    const caught = createCreature('nibbit', 4);

    const result = receiveCapturedCreature(caught, state);
    expect(result.destination).toBe('party');
    expect(state.party[2]).toBe(caught);
    expect(result.messages.join(' ')).toMatch(/joined your party/i);
  });

  it('sends it to storage when the party is full, and explains why', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    const caught = createCreature('emberfly', 6);

    const result = receiveCapturedCreature(caught, state);
    expect(result.destination).toBe('storage');
    expect(getPartySize(state)).toBe(PARTY.maxSize);
    expect(findInStorage(state, caught.instanceId)).toBe(caught);
    expect(result.messages.join(' ')).toMatch(/party is full/i);
    expect(result.messages.join(' ')).toMatch(/sent to storage/i);
  });

  it('marks the species caught, and therefore seen', () => {
    const state = freshState();
    const caught = createCreature('puffcap', 5);

    receiveCapturedCreature(caught, state);
    expect(isCaught('puffcap', state)).toBe(true);
    expect(isSeen('puffcap', state)).toBe(true);
  });

  it('keeps the exact individual, not a rebuilt copy', () => {
    const state = freshState();
    const caught = createCreature('vinelet', 7);
    caught.currentHp = 3;
    caught.status = 'sleep';
    caught.moves[0].pp = 1;
    const id = caught.instanceId;

    receiveCapturedCreature(caught, state);

    const stored = findCreature(state, id);
    expect(stored).toBe(caught);
    expect(stored.currentHp).toBe(3);
    expect(stored.status).toBe('sleep');
    expect(stored.moves[0].pp).toBe(1);
    expect(stored.level).toBe(7);
  });

  it('uses the nickname when the creature has one', () => {
    const state = freshState();
    const caught = createCreature('nibbit', 4, { nickname: 'Scrap' });

    const result = receiveCapturedCreature(caught, state);
    expect(result.messages.join(' ')).toMatch(/Scrap/);
  });

  it('does nothing when handed nothing', () => {
    const state = freshState();
    expect(receiveCapturedCreature(null, state)).toEqual({ destination: null, messages: [] });
    expect(getPartySize(state)).toBe(0);
  });

  it('several captures at a full party all survive, distinctly', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);

    const caught = ['nibbit', 'flittle', 'vinelet'].map((id, i) => {
      const creature = createCreature(id, 3 + i);
      receiveCapturedCreature(creature, state);
      return creature;
    });

    expect(getStorageCount(state)).toBe(3);
    for (const creature of caught) {
      expect(findInStorage(state, creature.instanceId)).toBe(creature);
    }
    expect(countCaught(state)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe('what the player is carrying is always real', () => {
  it('every creature a fresh game can hold references a real species', () => {
    const state = freshState();
    state.party = teamOf(3, 'nibbit');
    state.party.push(createCreature('pyrret', 5));
    receiveCapturedCreature(createCreature('flittle', 4), state);

    for (const creature of [...state.party, ...listStorage(state)]) {
      expect(CREATURES[creature.speciesId], `unknown species "${creature.speciesId}"`)
        .toBeDefined();
      expect(creature.instanceId).toBeTruthy();
      expect('nickname' in creature).toBe(true);
    }
  });

  it('instance ids are unique across party and storage', () => {
    const state = freshState();
    state.party = teamOf(PARTY.maxSize);
    for (let i = 0; i < 4; i += 1) {
      receiveCapturedCreature(createCreature('nibbit', 3), state);
    }

    const ids = [...state.party, ...listStorage(state)].map((c) => c.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
