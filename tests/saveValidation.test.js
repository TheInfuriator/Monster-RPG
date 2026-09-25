/**
 * saveValidation.test.js
 * ----------------------------------------------------------------------------
 * A save file is untrusted input. These tests feed the validator every kind
 * of damage the save system is meant to survive and check it does the right
 * thing with each:
 *
 *   REFUSE   when we cannot tell what the player had
 *   REPAIR   (with a warning) when the intent is obvious and nothing real is lost
 *
 * and that a refused save never produces a half-built state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createNewGameState } from '../src/core/GameState.js';
import { createSaveFile, serializeGameState, SAVE_VERSION } from '../src/save/SaveSchema.js';
import { validateSaveFile, validateGameState } from '../src/save/SaveValidator.js';
import { clearReservedInstanceIds } from '../src/systems/CreatureFactory.js';
import { experienceForLevel, calculateStats } from '../src/systems/StatCalculator.js';
import { getSpecies } from '../src/data/creatures.js';
import { getMove } from '../src/data/moves.js';
import { PARTY } from '../src/config/balance.js';
import { buildRichState } from './helpers/richState.js';

/** The serialised rich state, ready to be damaged. */
const damaged = () => JSON.parse(JSON.stringify(serializeGameState(buildRichState())));

/** Validate, expecting it to be refused. */
function expectRefused(raw, pattern) {
  const result = validateGameState(raw);
  expect(result.ok).toBe(false);
  expect(result.state).toBeNull();
  if (pattern) expect(result.errors.join('\n')).toMatch(pattern);
  return result;
}

/** Validate, expecting a repair (loads, with a warning matching the pattern). */
function expectRepaired(raw, pattern) {
  const result = validateGameState(raw);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
  if (pattern) expect(result.warnings.join('\n')).toMatch(pattern);
  return result.state;
}

beforeEach(() => clearReservedInstanceIds());

// ---------------------------------------------------------------------------
// The file itself
// ---------------------------------------------------------------------------

describe('the save file envelope', () => {
  const good = () => JSON.parse(JSON.stringify(createSaveFile(buildRichState(), { savedAt: 10 })));

  it('accepts a sound file', () => {
    expect(validateSaveFile(good()).ok).toBe(true);
  });

  it.each([
    ['null', null],
    ['a number', 42],
    ['a string', 'save'],
    ['an array', []],
  ])('refuses %s', (_label, value) => {
    const result = validateSaveFile(value);
    expect(result.ok).toBe(false);
    expect(result.state).toBeNull();
  });

  it('refuses JSON from some other program', () => {
    const file = good();
    file.game = 'something-else';
    expect(validateSaveFile(file).errors[0]).toMatch(/not an Aetheria/);
  });

  it('refuses a file that has not been migrated to this version', () => {
    const file = good();
    file.version = SAVE_VERSION - 1;
    expect(validateSaveFile(file).ok).toBe(false);
  });

  it('refuses a file with no game data', () => {
    const file = good();
    delete file.gameState;
    expect(validateSaveFile(file).errors[0]).toMatch(/no game data/);
  });

  it('rebuilds a garbled summary rather than refusing a sound save', () => {
    const file = good();
    file.metadata = { savedAt: 10, source: 'manual', playerName: 7 };
    const result = validateSaveFile(file);
    expect(result.ok).toBe(true);
    expect(result.metadata.playerName).toBe('Robin');
    expect(result.metadata.savedAt).toBe(10);
    expect(result.warnings.join()).toMatch(/summary/);
  });

  it('treats a summary with no time as the oldest save', () => {
    const file = good();
    file.metadata = null;
    const result = validateSaveFile(file);
    expect(result.ok).toBe(true);
    expect(result.metadata.savedAt).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Refusals
// ---------------------------------------------------------------------------

describe('refused: we can no longer tell what the player had', () => {
  it.each([
    ['the party is not a list', (s) => { s.party = { 0: s.party[0] }; }, /party is not a list/],
    ['storage is not a list', (s) => { s.storage = 'none'; }, /storage is not a list/],
    ['the bag is not an object', (s) => { s.inventory = ['potion']; }, /bag/],
    ['the coins are not a number', (s) => { s.money = 'lots'; }, /coin count/],
    ['the coins are NaN-like', (s) => { s.money = null; }, /coin count/],
    ['the flags are not an object', (s) => { s.flags = 'gotStarter'; }, /story flags/],
    ['the Sigils are not a list', (s) => { s.badges = 'verdantSigil'; }, /Sigils/],
    ['the trainer record is not an object', (s) => { s.defeatedTrainers = []; }, /beaten-trainer/],
    ['the puzzle record is not an object', (s) => { s.puzzles = 3; }, /puzzle record/],
    ['the Index is not an object', (s) => { s.creatureIndex = []; }, /Index/],
    ['the Index seen list is garbage', (s) => { s.creatureIndex.seen = 'all'; }, /seen/],
    ['a party entry is not a creature', (s) => { s.party[1] = 'flittle'; }, /party slot 2 is not a creature/],
    ['a creature is an unknown species', (s) => { s.party[0].speciesId = 'missingno'; }, /unknown species/],
    ['a creature has no species', (s) => { delete s.storage[0].speciesId; }, /storage slot 1 is an unknown species/],
    ['a creature has no level', (s) => { s.party[2].level = 'ten'; }, /no readable level/],
    ['a creature\'s moves are not a list', (s) => { s.party[0].moves = 'ember'; }, /move list/],
  ])('when %s', (_label, damage, pattern) => {
    const raw = damaged();
    damage(raw);
    expectRefused(raw, pattern);
  });

  it('refuses no game data at all', () => {
    expectRefused(undefined, /no game data/);
    expectRefused([], /no game data/);
  });

  it('reports every problem at once, not just the first', () => {
    const raw = damaged();
    raw.money = 'x';
    raw.badges = 'y';
    raw.party[0].speciesId = 'z';
    expect(validateGameState(raw).errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Repairs
// ---------------------------------------------------------------------------

describe('repaired: older saves missing whole collections', () => {
  it.each([
    ['storage', (s) => delete s.storage, (st) => expect(st.storage).toEqual([])],
    ['the bag', (s) => delete s.inventory, (st) => expect(st.inventory).toEqual({})],
    ['the Sigils', (s) => delete s.badges, (st) => expect(st.badges).toEqual([])],
    ['the flags', (s) => delete s.flags, (st) => expect(st.flags).toEqual({})],
    ['beaten trainers', (s) => delete s.defeatedTrainers, (st) => expect(st.defeatedTrainers).toEqual({})],
    ['puzzles', (s) => delete s.puzzles, (st) => expect(st.puzzles).toEqual({})],
    ['the Index', (s) => delete s.creatureIndex, (st) => expect(st.creatureIndex).toEqual({ seen: {}, caught: {} })],
    ['the recovery point', (s) => delete s.respawn, (st) => expect(st.respawn).toEqual({ mapId: 'mendersHall', spawn: 'default' })],
    ['play time', (s) => delete s.playTimeMs, (st) => expect(st.playTimeMs).toBe(0)],
  ])('%s', (_label, damage, check) => {
    const raw = damaged();
    damage(raw);
    check(expectRepaired(raw));
  });

  it('a missing coin count falls back to the starting money', () => {
    const raw = damaged();
    delete raw.money;
    expect(expectRepaired(raw, /No coins/).money).toBe(createNewGameState().money);
  });
});

describe('repaired: numbers out of range', () => {
  it('negative coins become zero', () => {
    const raw = damaged();
    raw.money = -500;
    expect(expectRepaired(raw, /Coins -500 corrected to 0/).money).toBe(0);
  });

  it('fractional coins are rounded down', () => {
    const raw = damaged();
    raw.money = 10.9;
    expect(expectRepaired(raw).money).toBe(10);
  });

  it('bag quantities of zero, below zero or not numbers are dropped', () => {
    const raw = damaged();
    raw.inventory = { potion: 0, antidote: -3, basicOrb: 'many', superPotion: 2 };
    const state = expectRepaired(raw, /Potion had quantity 0/);
    expect(state.inventory).toEqual({ superPotion: 2 });
  });

  it('HP above the maximum is clamped to it', () => {
    const raw = damaged();
    raw.party[0].currentHp = 9999;
    const state = expectRepaired(raw, /HP 9999 corrected/);
    expect(state.party[0].currentHp).toBe(state.party[0].stats.hp);
  });

  it('negative HP becomes fainted, not negative', () => {
    const raw = damaged();
    raw.party[0].currentHp = -4;
    expect(expectRepaired(raw).party[0].currentHp).toBe(0);
  });

  it('missing HP is restored to full', () => {
    const raw = damaged();
    delete raw.party[0].currentHp;
    const state = expectRepaired(raw, /HP missing/);
    expect(state.party[0].currentHp).toBe(state.party[0].stats.hp);
  });

  it('PP above the maximum is clamped, and missing PP is refilled', () => {
    const raw = damaged();
    raw.party[0].moves[0].pp = 999;
    delete raw.party[0].moves[1].pp;
    const state = expectRepaired(raw, /PP 999 corrected/);
    for (const move of state.party[0].moves.slice(0, 2)) {
      expect(move.pp).toBe(getMove(move.id).pp);
    }
  });

  it('a level beyond the cap is brought back to it, with matching stats', () => {
    const raw = damaged();
    raw.party[3].level = 250;
    const state = expectRepaired(raw, /level 250 corrected to 100/);
    expect(state.party[3].level).toBe(100);
    expect(state.party[3].stats).toEqual(calculateStats(getSpecies(state.party[3].speciesId), 100));
  });

  it('experience outside its level\'s band is pulled into it', () => {
    const raw = damaged();
    raw.party[3].experience = 0;
    const state = expectRepaired(raw, /experience 0 corrected/);
    const creature = state.party[3];
    const growth = getSpecies(creature.speciesId).growthRate;
    expect(creature.experience).toBe(experienceForLevel(creature.level, growth));
  });

  it('experience high enough for the next level is capped below it, not levelled', () => {
    const raw = damaged();
    const growth = getSpecies(raw.party[3].speciesId).growthRate;
    raw.party[3].experience = experienceForLevel(raw.party[3].level + 3, growth);
    const state = expectRepaired(raw);
    expect(state.party[3].level).toBe(raw.party[3].level);
    expect(state.party[3].experience).toBe(experienceForLevel(raw.party[3].level + 1, growth) - 1);
  });

  it('bad play time and start date are replaced', () => {
    const raw = damaged();
    raw.playTimeMs = -1;
    raw.createdAt = 'yesterday';
    const state = expectRepaired(raw, /Play time/);
    expect(state.playTimeMs).toBe(0);
    expect(typeof state.createdAt).toBe('number');
  });
});

describe('repaired: ids for content that does not exist', () => {
  it('unknown items are dropped from the bag', () => {
    const raw = damaged();
    raw.inventory.moonStone = 2;
    const state = expectRepaired(raw, /Unknown item "moonStone"/);
    expect(state.inventory.moonStone).toBeUndefined();
    expect(state.inventory.potion).toBe(3);
  });

  it('unknown and duplicate Sigils are dropped, order kept', () => {
    const raw = damaged();
    raw.badges = ['verdantSigil', 'fakeSigil', 'verdantSigil', 42];
    const state = expectRepaired(raw, /Unknown Sigil "fakeSigil"/);
    expect(state.badges).toEqual(['verdantSigil']);
  });

  it('unknown trainers are dropped from the beaten list', () => {
    const raw = damaged();
    raw.defeatedTrainers.ghostTrainer = true;
    const state = expectRepaired(raw, /Unknown trainer "ghostTrainer"/);
    expect(state.defeatedTrainers.ghostTrainer).toBeUndefined();
    expect(state.defeatedTrainers.route1Scout).toBe(true);
  });

  it('a trainer recorded as anything but true is not counted as beaten', () => {
    const raw = damaged();
    raw.defeatedTrainers.route1Treader = 'yes';
    raw.defeatedTrainers.route1Aspirant = false;
    const state = expectRepaired(raw);
    expect(state.defeatedTrainers.route1Treader).toBeUndefined();
    expect(state.defeatedTrainers.route1Aspirant).toBeUndefined();
  });

  it('unknown moves are removed and the rest kept', () => {
    const raw = damaged();
    raw.party[0].moves.push({ id: 'hyperLaser', pp: 5 });
    raw.party[0].moves.unshift({ id: 'fakeMove', pp: 5 });
    const state = expectRepaired(raw, /unknown move "fakeMove"/);
    expect(state.party[0].moves.map((m) => m.id)).not.toContain('fakeMove');
    expect(state.party[0].moves.length).toBeLessThanOrEqual(PARTY.maxMoves);
  });

  it('a creature left with no usable moves is given its natural ones', () => {
    const raw = damaged();
    raw.party[2].moves = [{ id: 'nope', pp: 1 }];
    const state = expectRepaired(raw, /no usable moves/);
    expect(state.party[2].moves.length).toBeGreaterThan(0);
  });

  it('duplicate moves are removed', () => {
    const raw = damaged();
    raw.party[2].moves = [raw.party[2].moves[0], { ...raw.party[2].moves[0] }];
    const state = expectRepaired(raw, /duplicate/);
    expect(state.party[2].moves).toHaveLength(1);
  });

  it('an unknown status is cleared', () => {
    const raw = damaged();
    raw.party[1].status = 'cursed';
    expect(expectRepaired(raw, /unknown status "cursed"/).party[1].status).toBeNull();
  });

  it('unknown species in the Index are dropped, and caught implies seen', () => {
    const raw = damaged();
    raw.creatureIndex.seen.missingno = true;
    raw.creatureIndex.caught.grubbit = true;
    delete raw.creatureIndex.seen.grubbit;
    const state = expectRepaired(raw, /caught but not seen/);
    expect(state.creatureIndex.seen.missingno).toBeUndefined();
    expect(state.creatureIndex.seen.grubbit).toBe(true);
  });

  it('puzzle entries for unknown maps or barriers are dropped', () => {
    const raw = damaged();
    raw.puzzles.atlantis = { door: true };
    raw.puzzles.verdantHall.hedgeImaginary = true;
    const state = expectRepaired(raw, /unknown map "atlantis"/);
    expect(state.puzzles.atlantis).toBeUndefined();
    expect(state.puzzles.verdantHall.hedgeImaginary).toBeUndefined();
  });

  it('a flag-driven gate cannot be opened by writing it into the puzzle record', () => {
    // Route 1's gate follows a story flag; its state is never stored. An entry
    // for it could only be tampering, so it is ignored.
    const raw = damaged();
    raw.puzzles.route1 = { route1Gate: false };
    const state = expectRepaired(raw, /not a switch-moved barrier/);
    expect(state.puzzles.route1).toEqual({});
  });

  it('a non-boolean switch position is dropped', () => {
    const raw = damaged();
    raw.puzzles.verdantHall.hedgeNorth = 'open';
    expect(expectRepaired(raw).puzzles.verdantHall.hedgeNorth).toBeUndefined();
  });

  it('non-boolean flags are stored as booleans', () => {
    const raw = damaged();
    raw.flags.gotStarter = 1;
    raw.flags.somethingOff = 0;
    const state = expectRepaired(raw, /gotStarter/);
    expect(state.flags.gotStarter).toBe(true);
    expect(state.flags.somethingOff).toBe(false);
  });
});

describe('repaired: creature ids', () => {
  it('a missing id is issued', () => {
    const raw = damaged();
    delete raw.party[1].instanceId;
    const state = expectRepaired(raw, /had no id/);
    expect(typeof state.party[1].instanceId).toBe('string');
    expect(state.party[1].instanceId.length).toBeGreaterThan(0);
  });

  it('a duplicated id is kept by the first creature and replaced on the second', () => {
    const raw = damaged();
    raw.storage[0].instanceId = raw.party[0].instanceId;
    const state = expectRepaired(raw, /shared the id/);
    expect(state.party[0].instanceId).toBe(raw.party[0].instanceId);
    expect(state.storage[0].instanceId).not.toBe(raw.party[0].instanceId);
    // Both creatures are kept.
    expect(state.storage[0].speciesId).toBe(raw.storage[0].speciesId);
  });

  it('every id is unique afterwards, even with several clashes', () => {
    const raw = damaged();
    for (const creature of [...raw.party, ...raw.storage]) creature.instanceId = 'same';
    const state = expectRepaired(raw);
    const ids = [...state.party, ...state.storage].map((c) => c.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('repaired: the party itself', () => {
  it('a party over the limit sends the extras to storage — nothing is lost', () => {
    const raw = damaged();
    const extra = raw.storage.splice(0, 2);
    raw.party.push(...extra);
    const before = raw.party.length + raw.storage.length;

    const state = expectRepaired(raw, /moved to storage/);
    expect(state.party).toHaveLength(PARTY.maxSize);
    expect(state.party.length + state.storage.length).toBe(before);
  });

  it('an empty party is fine — that is a game before the starter', () => {
    const raw = serializeGameState(createNewGameState());
    const state = expectRepaired(raw);
    expect(state.party).toEqual([]);
  });

  it('a bad nickname is removed, a good one kept', () => {
    const raw = damaged();
    raw.party[0].nickname = 12;
    raw.party[2].nickname = 'x'.repeat(200);
    const state = expectRepaired(raw, /nickname/);
    expect(state.party[0].nickname).toBeNull();
    expect(state.party[2].nickname).toBeNull();
    expect(state.party[1].nickname).toBe('Pip');
  });

  it('a bad met location is removed', () => {
    const raw = damaged();
    raw.party[0].metAt = { map: 'x' };
    expect(expectRepaired(raw, /met location/).party[0].metAt).toBeNull();
  });
});

describe('repaired: where the player is', () => {
  it('an unknown map sends the player to the recovery point', () => {
    const raw = damaged();
    raw.location.mapId = 'atlantis';
    const state = expectRepaired(raw, /atlantis/);
    expect(state.location).toEqual({ mapId: 'thistlewoodMendersHall', x: null, y: null, facing: 'down' });
  });

  it('coordinates off the map fall back to that map\'s spawn', () => {
    const raw = damaged();
    raw.location.x = 500;
    const state = expectRepaired(raw, /not on/);
    expect(state.location).toEqual({ mapId: 'verdantHall', x: null, y: null, facing: 'left' });
  });

  it.each([
    [-1, 3], [2.5, 3], ['4', 3], [null, 3], [4, undefined],
  ])('coordinates (%s, %s) are rejected', (x, y) => {
    const raw = damaged();
    raw.location.x = x;
    raw.location.y = y;
    expect(expectRepaired(raw).location.x).toBeNull();
  });

  it('a nonsense facing becomes "down"', () => {
    const raw = damaged();
    raw.location.facing = 'sideways';
    expect(expectRepaired(raw, /sideways/).location.facing).toBe('down');
  });

  it('no position at all wakes the player at the recovery point', () => {
    const raw = damaged();
    delete raw.location;
    expect(expectRepaired(raw).location.mapId).toBe('thistlewoodMendersHall');
  });

  it('an unknown recovery point is replaced with Emberhollow\'s', () => {
    const raw = damaged();
    raw.respawn = { mapId: 'thistlewood', spawn: 'noSuchSpawn' };
    expect(expectRepaired(raw).respawn).toEqual({ mapId: 'mendersHall', spawn: 'default' });
  });

  it('a bad player name falls back to the default', () => {
    const raw = damaged();
    raw.playerName = '   ';
    expect(expectRepaired(raw, /Player name/).playerName).toBe('Warden');
  });
});

describe('ids that are really JavaScript built-ins', () => {
  // `CREATURES.constructor` exists on every object. A lookup that did not
  // check for OWN keys would accept these as real content.
  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
    'a creature of species "%s" is refused',
    (id) => {
      const raw = damaged();
      raw.party[0].speciesId = id;
      expectRefused(raw, /unknown species/);
    }
  );

  it('built-in names are unknown items, moves, statuses, trainers, Sigils and maps', () => {
    const raw = JSON.parse(`{
      "inventory": { "constructor": 1, "__proto__": 2, "potion": 1 },
      "badges": ["hasOwnProperty"],
      "defeatedTrainers": { "toString": true },
      "puzzles": { "constructor": { "a": true } },
      "creatureIndex": { "seen": { "valueOf": true }, "caught": {} },
      "flags": { "__proto__": true, "gotStarter": true },
      "location": { "mapId": "constructor", "x": 1, "y": 1, "facing": "down" },
      "respawn": { "mapId": "mendersHall", "spawn": "toString" },
      "party": [{
        "instanceId": "a", "speciesId": "nibbit", "nickname": null, "level": 5,
        "experience": 0, "currentHp": 5, "status": "valueOf", "metAt": null,
        "moves": [{ "id": "constructor", "pp": 1 }, { "id": "tackle", "pp": 1 }]
      }],
      "storage": [], "money": 5, "playerName": "Robin", "playTimeMs": 0, "createdAt": 1
    }`);

    const state = expectRepaired(raw);
    expect(Object.keys(state.inventory)).toEqual(['potion']);
    expect(Object.getPrototypeOf(state.inventory)).toBe(Object.prototype);
    expect(state.badges).toEqual([]);
    expect(state.defeatedTrainers).toEqual({});
    expect(state.puzzles).toEqual({});
    expect(state.creatureIndex.seen).toEqual({});
    expect(Object.keys(state.flags)).toEqual(['gotStarter']);
    expect(Object.getPrototypeOf(state.flags)).toBe(Object.prototype);
    expect(state.location.mapId).toBe('mendersHall');
    expect(state.respawn).toEqual({ mapId: 'mendersHall', spawn: 'default' });
    expect(state.party[0].status).toBeNull();
    expect(state.party[0].moves.map((m) => m.id)).toEqual(['tackle']);
  });
});

describe('the data getters themselves ignore built-in names', () => {
  it('returns nothing for inherited keys', async () => {
    const { getSpecies } = await import('../src/data/creatures.js');
    const { getItem } = await import('../src/data/items.js');
    const { getMove: move } = await import('../src/data/moves.js');
    const { getTrainer } = await import('../src/data/trainers.js');
    const { getBadge } = await import('../src/data/badges.js');
    const { getStatus } = await import('../src/data/statuses.js');
    const { getShop } = await import('../src/data/shops.js');
    const { getMapDefinition } = await import('../src/data/maps/index.js');
    const quiet = vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (const getter of [getSpecies, getItem, move, getTrainer, getBadge, getStatus, getShop]) {
      expect(getter('constructor')).toBeFalsy();
      expect(getter('toString')).toBeFalsy();
    }
    expect(() => getMapDefinition('constructor')).toThrow(/Unknown map/);
    quiet.mockRestore();
  });
});

describe('a refused save changes nothing', () => {
  it('returns no state at all, never a partial one', () => {
    const raw = damaged();
    raw.party[3].speciesId = 'bad';
    const result = validateGameState(raw);
    expect(result.state).toBeNull();
  });

  it('never mutates the raw data it was given', () => {
    const raw = damaged();
    raw.money = -5;
    raw.inventory.moonStone = 1;
    const copy = JSON.parse(JSON.stringify(raw));
    validateGameState(raw);
    expect(raw).toEqual(copy);
  });
});

describe('the player\'s starter (Phase 11)', () => {
  it('keeps a valid starter', () => {
    const raw = damaged();
    const result = validateGameState(raw);
    expect(result.warnings).toEqual([]);
    expect(result.state.starter).toBe('pyrret');
  });

  it('accepts "unknown" without complaint', () => {
    const raw = damaged();
    raw.starter = null;
    const result = validateGameState(raw);
    expect(result.warnings).toEqual([]);
    expect(result.state.starter).toBeNull();
  });

  it('repairs a missing starter to "unknown", to be read from the party', () => {
    const raw = damaged();
    delete raw.starter;
    expect(expectRepaired(raw, /No starter recorded/).starter).toBeNull();
  });

  it('repairs something that is not a starter', () => {
    for (const junk of ['flittle', 'toString', 7, {}, '']) {
      const raw = damaged();
      raw.starter = junk;
      expect(expectRepaired(raw, /is not a starter/).starter).toBeNull();
    }
  });
});
