/**
 * saveSchema.test.js
 * ----------------------------------------------------------------------------
 * What goes into a save file, and whether it comes back out exactly.
 *
 *   - every GameState field is accounted for (the standing rule)
 *   - only plain data is written, picked by name, never runtime objects
 *   - derived caches (stats, max PP) are left out and rebuilt identically
 *   - the output is deterministic
 *   - a rich playthrough survives JSON and back without losing anything
 *   - creature identity: ids are kept, never regenerated, never duplicated
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createNewGameState } from '../src/core/GameState.js';
import {
  SAVE_VERSION, SAVE_GAME_ID, PERSISTENT_FIELDS,
  serializeGameState, serializeCreature, createSaveFile, buildSaveMetadata, describeLocation,
} from '../src/save/SaveSchema.js';
import { validateSaveFile, validateGameState } from '../src/save/SaveValidator.js';
import {
  createCreature, generateInstanceId, reserveInstanceIds, clearReservedInstanceIds,
  _resetInstanceCounter,
} from '../src/systems/CreatureFactory.js';
import { giveCreature } from '../src/systems/PartySystem.js';
import { calculateStats } from '../src/systems/StatCalculator.js';
import { getSpecies } from '../src/data/creatures.js';
import { MAPS } from '../src/data/maps/index.js';
import { buildRichState } from './helpers/richState.js';

/** Save, stringify, parse and validate: exactly what a real reload does. */
function roundTrip(state, options) {
  const text = JSON.stringify(createSaveFile(state, options));
  return validateSaveFile(JSON.parse(text));
}

const allCreatures = (state) => [...state.party, ...state.storage];

// ---------------------------------------------------------------------------
// The standing rule
// ---------------------------------------------------------------------------

describe('every GameState field is accounted for', () => {
  it('lists exactly the fields a new game has', () => {
    // If this fails you added a field to GameState. Decide whether it is
    // saved: add it to PERSISTENT_FIELDS and serializeGameState(), to
    // SaveValidator.js, to a migration if older saves need it, and to the
    // round-trip state in tests/helpers/richState.js.
    expect([...Object.keys(createNewGameState())].sort()).toEqual([...PERSISTENT_FIELDS].sort());
  });

  it('serialises every persistent field and nothing else', () => {
    expect(Object.keys(serializeGameState(createNewGameState())).sort())
      .toEqual([...PERSISTENT_FIELDS].sort());
  });

  it('keeps preferences out of the playthrough', () => {
    const state = createNewGameState();
    expect(state.settings).toBeUndefined();
    expect(serializeGameState(state).settings).toBeUndefined();
  });

  it('keeps the save version on the file, not on the state', () => {
    expect(createNewGameState().version).toBeUndefined();
    expect(createSaveFile(createNewGameState()).version).toBe(SAVE_VERSION);
  });
});

// ---------------------------------------------------------------------------
// What is written
// ---------------------------------------------------------------------------

describe('the save file', () => {
  it('has the documented envelope', () => {
    const file = createSaveFile(createNewGameState(), { source: 'autosave', savedAt: 123 });
    expect(Object.keys(file).sort()).toEqual(['game', 'gameState', 'metadata', 'version']);
    expect(file.game).toBe(SAVE_GAME_ID);
    expect(file.version).toBe(SAVE_VERSION);
    expect(file.metadata.source).toBe('autosave');
    expect(file.metadata.savedAt).toBe(123);
  });

  it('is plain JSON — it survives stringify unchanged', () => {
    const file = createSaveFile(buildRichState(), { savedAt: 5 });
    expect(JSON.parse(JSON.stringify(file))).toEqual(file);
  });

  it('holds no functions, class instances or undefined values anywhere', () => {
    const file = createSaveFile(buildRichState(), { savedAt: 5 });
    const walk = (value, path) => {
      expect(value, path).not.toBeUndefined();
      expect(typeof value, path).not.toBe('function');
      if (value && typeof value === 'object') {
        const proto = Object.getPrototypeOf(value);
        expect(proto === Object.prototype || proto === Array.prototype, path).toBe(true);
        for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
      }
    };
    walk(file, 'file');
  });

  it('picks fields by name, so runtime junk never reaches the file', () => {
    const state = buildRichState();
    // The kinds of thing that must never be saved.
    state.sprite = { scene: {} };
    state.dialogueOpen = true;
    state.party[0].battler = { stages: { attack: 2 }, sleepTurns: 3 };
    state.party[0].sprite = { destroy() {} };
    state.party[0].moves[0].disabled = true;
    state.location.tween = { stop() {} };

    const saved = serializeGameState(state);
    expect(saved.sprite).toBeUndefined();
    expect(saved.dialogueOpen).toBeUndefined();
    expect(saved.party[0].battler).toBeUndefined();
    expect(saved.party[0].sprite).toBeUndefined();
    expect(saved.party[0].moves[0]).toEqual({ id: state.party[0].moves[0].id, pp: state.party[0].moves[0].pp });
    expect(saved.location.tween).toBeUndefined();
  });

  it('leaves derived caches out: stats and maximum PP are rebuilt on load', () => {
    const creature = createCreature('pyrret', 12);
    const saved = serializeCreature(creature);
    expect(saved.stats).toBeUndefined();
    expect(saved.moves.every((move) => move.maxPp === undefined)).toBe(true);
    expect(Object.keys(saved).sort()).toEqual([
      'currentHp', 'experience', 'instanceId', 'level', 'metAt', 'moves', 'nickname', 'speciesId', 'status',
    ]);
  });

  it('never shares references with the live state', () => {
    const state = buildRichState();
    const saved = serializeGameState(state);
    state.party[0].moves[0].pp = 0;
    state.flags.newFlag = true;
    state.location.x = 1;
    state.puzzles.verdantHall.hedgeWest = !state.puzzles.verdantHall.hedgeWest;
    state.inventory.potion = 99;
    state.badges.push('tidalSigil');

    expect(saved.party[0].moves[0].pp).not.toBe(0);
    expect(saved.flags.newFlag).toBeUndefined();
    expect(saved.location.x).toBe(18);
    expect(saved.inventory.potion).toBe(3);
    expect(saved.badges).toEqual(['verdantSigil']);
    expect(saved.puzzles.verdantHall).not.toEqual(state.puzzles.verdantHall);
  });

  it('is deterministic: the same facts in a different order give the same JSON', () => {
    const a = createNewGameState();
    const b = createNewGameState();
    b.createdAt = a.createdAt;

    a.flags.one = true; a.flags.two = true;
    b.flags.two = true; b.flags.one = true;
    a.inventory.potion = 1; a.inventory.antidote = 2;
    b.inventory.antidote = 2; b.inventory.potion = 1;
    a.defeatedTrainers.route1Scout = true; a.defeatedTrainers.route1Treader = true;
    b.defeatedTrainers.route1Treader = true; b.defeatedTrainers.route1Scout = true;
    a.creatureIndex.seen.nibbit = true; a.creatureIndex.seen.flittle = true;
    b.creatureIndex.seen.flittle = true; b.creatureIndex.seen.nibbit = true;
    a.puzzles.verdantHall = { hedgeWest: false, hedgeEast: true };
    b.puzzles.verdantHall = { hedgeEast: true, hedgeWest: false };

    expect(JSON.stringify(serializeGameState(a))).toBe(JSON.stringify(serializeGameState(b)));
  });

  it('writes the same text twice for the same state', () => {
    const state = buildRichState();
    const one = JSON.stringify(createSaveFile(state, { savedAt: 1 }));
    const two = JSON.stringify(createSaveFile(state, { savedAt: 1 }));
    expect(one).toBe(two);
  });
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

describe('save metadata', () => {
  it('summarises the playthrough for the title screen', () => {
    const state = buildRichState();
    const meta = buildSaveMetadata(state, { source: 'manual', savedAt: 99 });

    expect(meta).toEqual({
      source: 'manual',
      savedAt: 99,
      playerName: 'Robin',
      mapId: 'verdantHall',
      locationName: 'Thistlewood — The Verdant Hall',
      badgeCount: 1,
      partySize: 6,
      caughtCount: Object.keys(state.creatureIndex.caught).length,
      playTimeMs: state.playTimeMs,
      lead: { speciesId: 'cindraw', name: 'Cindraw', level: state.party[0].level },
    });
  });

  it('uses a nickname for the lead when there is one', () => {
    const state = createNewGameState();
    state.party.push(createCreature('flittle', 4, { nickname: 'Pip' }));
    expect(buildSaveMetadata(state).lead.name).toBe('Pip');
  });

  it('has no lead before the starter', () => {
    expect(buildSaveMetadata(createNewGameState()).lead).toBeNull();
  });

  it('names outdoor maps plainly', () => {
    expect(describeLocation('route1')).toBe(MAPS.route1.name);
    expect(describeLocation('thistlewood')).toBe('Thistlewood');
  });

  it('tells the two Mender\'s Halls apart by their town', () => {
    expect(describeLocation('mendersHall')).toBe("Emberhollow Town — Mender's Hall");
    expect(describeLocation('thistlewoodMendersHall')).toBe("Thistlewood — Mender's Hall");
    expect(describeLocation('mendersHall')).not.toBe(describeLocation('thistlewoodMendersHall'));
  });

  it('gives every map a distinct place name', () => {
    const names = Object.keys(MAPS).map(describeLocation);
    expect(new Set(names).size).toBe(names.length);
  });

  it('never crashes on an unknown map', () => {
    expect(describeLocation('nowhere')).toBe('Somewhere unknown');
  });
});

// ---------------------------------------------------------------------------
// The round trip
// ---------------------------------------------------------------------------

describe('a rich playthrough survives save and load exactly', () => {
  it('loads with no warnings', () => {
    const result = roundTrip(buildRichState());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('comes back deeply equal to what was saved', () => {
    const state = buildRichState();
    expect(roundTrip(state).state).toEqual(state);
  });

  it('comes back as a NEW object, never the one that was saved', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(loaded).not.toBe(state);
    expect(loaded.party[0]).not.toBe(state.party[0]);
  });

  it('is stable: saving what was loaded writes the same file', () => {
    const state = buildRichState();
    const first = JSON.stringify(createSaveFile(state, { savedAt: 7 }));
    const again = JSON.stringify(createSaveFile(roundTrip(state).state, { savedAt: 7 }));
    expect(again).toBe(first);
  });

  it('keeps an evolved creature evolved, at its level, with its moves', () => {
    const state = buildRichState();
    const lead = roundTrip(state).state.party[0];
    expect(lead.speciesId).toBe('cindraw');
    expect(lead.level).toBe(state.party[0].level);
    expect(lead.experience).toBe(state.party[0].experience);
    expect(lead.moves).toEqual(state.party[0].moves);
  });

  it('keeps damage, spent PP, status and fainting', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(loaded.party[0].currentHp).toBe(state.party[0].currentHp);
    expect(loaded.party[1].currentHp).toBe(1);
    expect(loaded.party[1].status).toBe('poison');
    expect(loaded.party[1].moves[0].pp).toBe(state.party[1].moves[0].pp);
    expect(loaded.party[2].currentHp).toBe(0);
  });

  it('rebuilds stats identical to the live cache', () => {
    const state = buildRichState();
    for (const creature of allCreatures(roundTrip(state).state)) {
      expect(creature.stats).toEqual(calculateStats(getSpecies(creature.speciesId), creature.level));
    }
  });

  it('keeps party order, storage order and nicknames', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(loaded.party.map((c) => c.speciesId)).toEqual(state.party.map((c) => c.speciesId));
    expect(loaded.storage.map((c) => c.speciesId)).toEqual(state.storage.map((c) => c.speciesId));
    expect(loaded.party[1].nickname).toBe('Pip');
  });

  it('keeps the bag, the coins, flags, trainers, Sigils, puzzles and recovery point', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(loaded.inventory).toEqual({ potion: 3, superPotion: 2, basicOrb: 3, antidote: 1 });
    expect(loaded.money).toBe(state.money);
    expect(loaded.flags).toEqual(state.flags);
    expect(loaded.defeatedTrainers).toEqual({ route1Scout: true, verdantGardenerTeal: true });
    expect(loaded.badges).toEqual(['verdantSigil']);
    expect(loaded.puzzles).toEqual(state.puzzles);
    expect(loaded.respawn).toEqual({ mapId: 'thistlewoodMendersHall', spawn: 'default' });
    expect(loaded.creatureIndex).toEqual(state.creatureIndex);
    expect(loaded.location).toEqual({ mapId: 'verdantHall', x: 18, y: 10, facing: 'left' });
  });

  it('round-trips a brand new game too', () => {
    const state = createNewGameState();
    const result = roundTrip(state);
    expect(result.warnings).toEqual([]);
    expect(result.state).toEqual(state);
  });

  it('round-trips a creature at the level cap with experience past the last threshold', () => {
    const state = createNewGameState();
    const capped = createCreature('nibbit', 100);
    capped.experience += 5000;
    state.party.push(capped);
    const result = roundTrip(state);
    expect(result.warnings).toEqual([]);
    expect(result.state.party[0].experience).toBe(capped.experience);
  });
});

// ---------------------------------------------------------------------------
// Creature identity
// ---------------------------------------------------------------------------

describe('creature identity across save and load', () => {
  afterEach(() => {
    clearReservedInstanceIds();
    vi.restoreAllMocks();
  });

  it('keeps every instance id exactly', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(allCreatures(loaded).map((c) => c.instanceId))
      .toEqual(allCreatures(state).map((c) => c.instanceId));
  });

  it('neither adds nor loses a creature', () => {
    const state = buildRichState();
    const loaded = roundTrip(state).state;
    expect(loaded.party).toHaveLength(state.party.length);
    expect(loaded.storage).toHaveLength(state.storage.length);
  });

  it('has no duplicate ids after a round trip', () => {
    const ids = allCreatures(roundTrip(buildRichState()).state).map((c) => c.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never generates an id that a loaded creature holds', () => {
    // Force the generator to produce the same id every time: same clock,
    // same counter, same "random" suffix — the worst case after a reload.
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    _resetInstanceCounter();
    const clash = generateInstanceId();

    _resetInstanceCounter();
    reserveInstanceIds([clash]);
    const next = generateInstanceId();
    expect(next).not.toBe(clash);
  });

  it('skips a whole run of reserved ids', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    _resetInstanceCounter();
    const taken = [generateInstanceId(), generateInstanceId(), generateInstanceId()];

    _resetInstanceCounter();
    reserveInstanceIds(taken);
    expect(taken).not.toContain(generateInstanceId());
  });

  it('new creatures after a load never collide with the loaded ones', () => {
    const loaded = roundTrip(buildRichState()).state;
    const loadedIds = new Set(allCreatures(loaded).map((c) => c.instanceId));
    reserveInstanceIds(loadedIds);
    _resetInstanceCounter();

    for (let i = 0; i < 200; i += 1) {
      expect(loadedIds.has(createCreature('nibbit', 3).instanceId)).toBe(false);
    }
  });

  it('forgets reservations when asked, e.g. for a New Game', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1);
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    _resetInstanceCounter();
    const id = generateInstanceId();
    reserveInstanceIds([id]);
    clearReservedInstanceIds();
    _resetInstanceCounter();
    expect(generateInstanceId()).toBe(id);
  });

  it('a creature arriving with an owned id is given a new one, not merged', () => {
    const state = createNewGameState();
    const first = createCreature('nibbit', 3);
    giveCreature(state, first);

    const impostor = createCreature('flittle', 3);
    impostor.instanceId = first.instanceId;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    giveCreature(state, impostor);

    expect(state.party).toHaveLength(2);
    expect(state.party[1].instanceId).not.toBe(first.instanceId);
    expect(state.party[0].instanceId).toBe(first.instanceId);
  });

  it('a creature arriving in storage is checked against the party too', () => {
    const state = createNewGameState();
    for (let i = 0; i < 6; i += 1) giveCreature(state, createCreature('nibbit', 3));
    const impostor = createCreature('flittle', 3);
    impostor.instanceId = state.party[2].instanceId;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    giveCreature(state, impostor);

    expect(state.storage).toHaveLength(1);
    expect(state.storage[0].instanceId).not.toBe(state.party[2].instanceId);
  });
});

describe('validateGameState on its own', () => {
  beforeEach(() => clearReservedInstanceIds());

  it('builds the same state from the serialised form', () => {
    const state = buildRichState();
    const result = validateGameState(serializeGameState(state));
    expect(result.ok).toBe(true);
    expect(result.state).toEqual(state);
  });
});
