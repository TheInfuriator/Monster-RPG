/**
 * saveManager.test.js
 * ----------------------------------------------------------------------------
 * The two save slots, end to end, against an in-memory store:
 *
 *   - manual and autosave are written and judged independently
 *   - a save is all or nothing: a failed write never disturbs the last save
 *   - damaged and newer-version saves are reported, never loaded, never
 *     quietly overwritten by the game
 *   - what Continue should do, for every combination of slots
 *   - a load either fully happens or changes nothing
 *   - New Game never deletes a save
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SLOTS, SLOT_MESSAGES, readSlot, listSlots, getContinueChoice, saveToSlot, loadSlot,
  prepareLoad, deleteSlot, hasAnySave, beginNewGame, applyLoadedState,
} from '../src/save/SaveManager.js';
import { createMemoryStorage, STORAGE_KEYS } from '../src/save/SaveStorage.js';
import { SAVE_VERSION, createSaveFile } from '../src/save/SaveSchema.js';
import { FUTURE_VERSION_MESSAGE } from '../src/save/SaveMigrations.js';
import { phase9Save } from '../src/save/legacyFixtures.js';
import { gameState, setGameState, createNewGameState } from '../src/core/GameState.js';
import {
  createCreature, clearReservedInstanceIds, _resetInstanceCounter,
} from '../src/systems/CreatureFactory.js';
import { buildRichState } from './helpers/richState.js';

let storage;

beforeEach(() => {
  storage = createMemoryStorage();
  clearReservedInstanceIds();
  setGameState(createNewGameState());
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

const save = (slot, state, now = 1000, extra = {}) => saveToSlot(slot, state, { storage, now, ...extra });
const raw = (slot) => storage.getItem(STORAGE_KEYS[slot]);

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

describe('two independent slots', () => {
  it('start empty', () => {
    const slots = listSlots({ storage });
    expect(slots.manual.status).toBe('empty');
    expect(slots.autosave.status).toBe('empty');
  });

  it('a manual save fills only the manual slot', () => {
    expect(save('manual', buildRichState()).ok).toBe(true);
    expect(raw('manual')).not.toBeNull();
    expect(raw('autosave')).toBeNull();
  });

  it('an autosave fills only the autosave slot', () => {
    expect(save('autosave', buildRichState()).ok).toBe(true);
    expect(raw('autosave')).not.toBeNull();
    expect(raw('manual')).toBeNull();
  });

  it('an autosave never changes the manual save', () => {
    save('manual', buildRichState(), 1);
    const before = raw('manual');
    const later = buildRichState();
    later.money = 1;
    save('autosave', later, 2);
    expect(raw('manual')).toBe(before);
  });

  it('each slot remembers where it came from', () => {
    save('manual', buildRichState());
    save('autosave', buildRichState());
    const slots = listSlots({ storage });
    expect(slots.manual.metadata.source).toBe('manual');
    expect(slots.autosave.metadata.source).toBe('autosave');
  });

  it('refuses a slot that does not exist', () => {
    expect(() => saveToSlot('slot3', buildRichState(), { storage })).toThrow(/Unknown save slot/);
    expect(() => readSlot('cloud', { storage })).toThrow(/Unknown save slot/);
  });

  it('uses the documented keys and no others', () => {
    save('manual', buildRichState());
    save('autosave', buildRichState());
    const keys = SLOTS.map((slot) => STORAGE_KEYS[slot]);
    expect(keys).toEqual(['aetheria-chronicles/save/manual', 'aetheria-chronicles/save/autosave']);
  });
});

describe('what a slot reports', () => {
  it('summarises a valid save without loading it into the game', () => {
    const live = gameState;
    save('manual', buildRichState(), 4242);
    const summary = readSlot('manual', { storage });

    expect(summary.status).toBe('valid');
    expect(summary.metadata.savedAt).toBe(4242);
    expect(summary.metadata.playerName).toBe('Robin');
    expect(summary.metadata.locationName).toBe('Thistlewood — The Verdant Hall');
    expect(summary.metadata.badgeCount).toBe(1);
    expect(gameState).toBe(live);
  });

  it.each([
    ['text that is not JSON', 'not json at all', 'corrupt'],
    ['a save cut off half way', null, 'corrupt'],
    ['JSON that is not a save', '[1,2,3]', 'corrupt'],
    ['another program\'s JSON', '{"game":"other","version":2}', 'corrupt'],
    ['a save with a nonsense version', null, 'corrupt'],
    ['a save whose party is not a list', null, 'corrupt'],
    ['a save with an unknown species', null, 'corrupt'],
    ['a save from a newer version', null, 'incompatible'],
  ])('%s is %s', (label, text, status) => {
    const file = createSaveFile(buildRichState(), { savedAt: 5 });
    let stored = text;
    if (label.includes('cut off')) stored = JSON.stringify(file).slice(0, 300);
    if (label.includes('nonsense version')) stored = JSON.stringify({ ...file, version: 'two' });
    if (label.includes('party')) stored = JSON.stringify({ ...file, gameState: { ...file.gameState, party: 'x' } });
    if (label.includes('species')) {
      file.gameState.party[0].speciesId = 'missingno';
      stored = JSON.stringify(file);
    }
    if (label.includes('newer')) stored = JSON.stringify({ ...file, version: SAVE_VERSION + 1 });

    storage.setItem(STORAGE_KEYS.manual, stored);
    const summary = readSlot('manual', { storage });
    expect(summary.status).toBe(status);
    expect(summary.metadata).toBeNull();
    expect(summary.state).toBeNull();
    expect(summary.message).toBe(status === 'incompatible' ? FUTURE_VERSION_MESSAGE : SLOT_MESSAGES.corrupt);
  });

  it('never deletes a damaged save on its own', () => {
    storage.setItem(STORAGE_KEYS.manual, '{broken');
    listSlots({ storage });
    loadSlot('manual', { storage });
    expect(raw('manual')).toBe('{broken');
  });

  it('reports storage that cannot even be read as unusable, without throwing', () => {
    const locked = { getItem() { throw new Error('SecurityError'); }, setItem() {}, removeItem() {} };
    const slots = listSlots({ storage: locked });
    expect(slots.manual.status).toBe('corrupt');
    expect(slots.manual.message).toBe(SLOT_MESSAGES.unavailable);
  });

  it('a legacy version 1 save is found, updated and labelled with its slot', () => {
    storage.setItem(STORAGE_KEYS.autosave, JSON.stringify(phase9Save()));
    const summary = readSlot('autosave', { storage });
    expect(summary.status).toBe('valid');
    expect(summary.migratedFrom).toBe(1);
    expect(summary.metadata.source).toBe('autosave');
    expect(summary.metadata.savedAt).toBe(0);
    expect(summary.warnings).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Continue
// ---------------------------------------------------------------------------

describe('what Continue does', () => {
  const choice = () => getContinueChoice(listSlots({ storage }));

  it('is disabled with no saves', () => {
    expect(choice()).toMatchObject({ canContinue: false, needsChooser: false, preselected: null });
  });

  it('loads the only save straight away', () => {
    save('manual', buildRichState());
    expect(choice()).toMatchObject({ canContinue: true, needsChooser: false, preselected: 'manual' });
  });

  it('loads the only save straight away when it is the autosave', () => {
    save('autosave', buildRichState());
    expect(choice()).toMatchObject({ canContinue: true, needsChooser: false, preselected: 'autosave' });
  });

  it('offers a choice with two saves, the newest preselected', () => {
    save('manual', buildRichState(), 100);
    save('autosave', buildRichState(), 200);
    expect(choice()).toMatchObject({ canContinue: true, needsChooser: true, preselected: 'autosave' });

    save('manual', buildRichState(), 300);
    expect(choice().preselected).toBe('manual');
  });

  it('breaks a tie in favour of the manual save', () => {
    save('manual', buildRichState(), 100);
    save('autosave', buildRichState(), 100);
    expect(choice().preselected).toBe('manual');
  });

  it('is disabled when the only save is damaged', () => {
    storage.setItem(STORAGE_KEYS.manual, '{oops');
    expect(choice()).toMatchObject({ canContinue: false, preselected: null });
    expect(choice().problems).toEqual([{ slot: 'manual', status: 'corrupt', message: SLOT_MESSAGES.corrupt }]);
  });

  it('a damaged manual save never hides a good autosave', () => {
    storage.setItem(STORAGE_KEYS.manual, '{oops');
    save('autosave', buildRichState());
    expect(choice()).toMatchObject({ canContinue: true, needsChooser: true, preselected: 'autosave' });
  });

  it('a newer-version save is shown as a problem, not an option', () => {
    const future = { ...createSaveFile(buildRichState()), version: SAVE_VERSION + 1 };
    storage.setItem(STORAGE_KEYS.autosave, JSON.stringify(future));
    save('manual', buildRichState());
    const result = choice();
    expect(result.validSlots).toEqual(['manual']);
    expect(result.problems[0]).toMatchObject({ slot: 'autosave', status: 'incompatible' });
  });

  it('is disabled when every save is unusable', () => {
    storage.setItem(STORAGE_KEYS.manual, '{oops');
    storage.setItem(STORAGE_KEYS.autosave, JSON.stringify({ ...createSaveFile(buildRichState()), version: 99 }));
    expect(choice().canContinue).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Writing safely
// ---------------------------------------------------------------------------

describe('a save is all or nothing', () => {
  it('a write the browser refuses leaves the previous save exactly as it was', () => {
    save('manual', buildRichState(), 1);
    const before = raw('manual');

    storage.setItem = () => {
      const error = new Error('The quota has been exceeded.');
      error.name = 'QuotaExceededError';
      throw error;
    };
    const result = saveToSlot('manual', createNewGameState(), { storage, now: 2 });

    expect(result).toMatchObject({ ok: false, reason: 'storageFull', message: SLOT_MESSAGES.storageFull });
    expect(raw('manual')).toBe(before);
    expect(readSlot('manual', { storage }).status).toBe('valid');
  });

  it('any other refusal is reported separately', () => {
    storage.setItem = () => { throw new Error('SecurityError'); };
    expect(saveToSlot('manual', buildRichState(), { storage }).reason).toBe('storageRefused');
  });

  it('a state that would not load is never written', () => {
    save('manual', buildRichState(), 1);
    const before = raw('manual');
    const broken = buildRichState();
    broken.party[0].speciesId = 'deletedSpecies';
    const writes = vi.spyOn(storage, 'setItem');

    const result = save('manual', broken, 2);
    expect(result).toMatchObject({ ok: false, reason: 'wouldNotLoad' });
    expect(writes).not.toHaveBeenCalled();
    expect(raw('manual')).toBe(before);
  });

  it('never removes the old save before writing the new one', () => {
    save('manual', buildRichState(), 1);
    const removals = vi.spyOn(storage, 'removeItem');
    save('manual', buildRichState(), 2);
    expect(removals).not.toHaveBeenCalled();
  });

  it('does not change the game it is saving', () => {
    const state = buildRichState();
    const before = JSON.stringify(state);
    save('manual', state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('reports its size and how long it took, and stays small', () => {
    const result = save('manual', buildRichState());
    expect(result.bytes).toBe(raw('manual').length);
    expect(result.bytes).toBeLessThan(16 * 1024);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('a newer game\'s save is protected', () => {
  const plantFuture = (slot) => {
    const text = JSON.stringify({ ...createSaveFile(buildRichState()), version: SAVE_VERSION + 1 });
    storage.setItem(STORAGE_KEYS[slot], text);
    return text;
  };

  it('the autosave will not overwrite it', () => {
    const text = plantFuture('autosave');
    const result = save('autosave', buildRichState());
    expect(result).toMatchObject({ ok: false, reason: 'newerSave' });
    expect(raw('autosave')).toBe(text);
  });

  it('a manual save will not overwrite it by accident either', () => {
    const text = plantFuture('manual');
    expect(save('manual', buildRichState()).reason).toBe('newerSave');
    expect(raw('manual')).toBe(text);
  });

  it('only an explicit, confirmed manual save replaces it', () => {
    plantFuture('manual');
    expect(save('manual', buildRichState(), 1, { overwriteNewer: true }).ok).toBe(true);
    expect(readSlot('manual', { storage }).status).toBe('valid');
  });

  it('a merely damaged autosave may be replaced by the next autosave', () => {
    storage.setItem(STORAGE_KEYS.autosave, '{damaged');
    expect(save('autosave', buildRichState()).ok).toBe(true);
    expect(readSlot('autosave', { storage }).status).toBe('valid');
  });
});

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

describe('loading', () => {
  it('makes the saved game the live one', () => {
    const state = buildRichState();
    save('manual', state);
    const result = loadSlot('manual', { storage });

    expect(result.ok).toBe(true);
    expect(gameState).toEqual(state);
    expect(gameState).not.toBe(state);
  });

  it('a failed load leaves the live game exactly as it was', () => {
    const live = gameState;
    const snapshot = JSON.stringify(live);
    storage.setItem(STORAGE_KEYS.manual, '{broken');

    const result = loadSlot('manual', { storage });
    expect(result.ok).toBe(false);
    expect(result.message).toBe(SLOT_MESSAGES.corrupt);
    expect(gameState).toBe(live);
    expect(JSON.stringify(gameState)).toBe(snapshot);
  });

  it('loading an empty slot changes nothing', () => {
    const live = gameState;
    expect(loadSlot('autosave', { storage }).ok).toBe(false);
    expect(gameState).toBe(live);
  });

  it('a newer-version save is refused with its message and changes nothing', () => {
    const live = gameState;
    storage.setItem(STORAGE_KEYS.manual, JSON.stringify({ ...createSaveFile(buildRichState()), version: 50 }));
    const result = loadSlot('manual', { storage });
    expect(result.ok).toBe(false);
    expect(result.message).toBe(FUTURE_VERSION_MESSAGE);
    expect(gameState).toBe(live);
  });

  it('places the player safely before handing over the state', () => {
    const state = buildRichState();
    state.location = { mapId: 'verdantHall', x: 5, y: 2, facing: 'up' }; // a hedge wall
    save('manual', state);
    const result = prepareLoad('manual', { storage });
    expect(result.ok).toBe(true);
    expect(result.position.source).not.toBe('saved');
    expect(result.state.location).toMatchObject({ mapId: result.position.mapId, x: result.position.x });
    expect(result.warnings.join()).toMatch(/cannot be stood on/);
  });

  it('reserves every loaded id, so new creatures never collide with them', () => {
    const state = buildRichState();
    save('manual', state);
    loadSlot('manual', { storage });

    const loadedIds = new Set([...gameState.party, ...gameState.storage].map((c) => c.instanceId));
    // The id counter starts again from zero, exactly as it does after a real
    // page reload. (The forced worst case — a repeated clock and "random"
    // suffix — is proved in saveSchema.test.js.)
    _resetInstanceCounter();
    for (let i = 0; i < 100; i += 1) expect(loadedIds.has(createCreature('nibbit', 2).instanceId)).toBe(false);
  });

  it('a legacy save loads through the same door', () => {
    storage.setItem(STORAGE_KEYS.manual, JSON.stringify(phase9Save()));
    const result = loadSlot('manual', { storage });
    expect(result.ok).toBe(true);
    expect(gameState.puzzles.verdantHall.hedgeNorth).toBe(true);
    expect(gameState.party[1].nickname).toBe('Pip');
  });

  it('twenty save-and-load cycles change nothing at all', () => {
    const state = buildRichState();
    applyLoadedState(state);
    const first = JSON.stringify(createSaveFile(gameState, { savedAt: 1 }));

    for (let i = 0; i < 20; i += 1) {
      save(i % 2 === 0 ? 'manual' : 'autosave', gameState, 1);
      loadSlot(i % 2 === 0 ? 'manual' : 'autosave', { storage });
    }
    expect(JSON.stringify(createSaveFile(gameState, { savedAt: 1 }))).toBe(first);
  });
});

// ---------------------------------------------------------------------------
// New Game
// ---------------------------------------------------------------------------

describe('New Game never deletes a save', () => {
  it('both slots survive a New Game', () => {
    save('manual', buildRichState(), 1);
    save('autosave', buildRichState(), 2);
    const manual = raw('manual');
    const autosave = raw('autosave');

    beginNewGame();

    expect(raw('manual')).toBe(manual);
    expect(raw('autosave')).toBe(autosave);
    expect(gameState.party).toEqual([]);
  });

  it('the old save still loads after a New Game has started', () => {
    save('manual', buildRichState());
    beginNewGame();
    expect(loadSlot('manual', { storage }).ok).toBe(true);
    expect(gameState.playerName).toBe('Robin');
  });

  it('knows when there is something worth warning about', () => {
    expect(hasAnySave({ storage })).toBe(false);
    storage.setItem(STORAGE_KEYS.autosave, '{damaged');
    expect(hasAnySave({ storage })).toBe(true);
  });
});

describe('deleting (debug only)', () => {
  it('empties one slot and leaves the other', () => {
    save('manual', buildRichState());
    save('autosave', buildRichState());
    expect(deleteSlot('manual', { storage })).toBe(true);
    expect(raw('manual')).toBeNull();
    expect(raw('autosave')).not.toBeNull();
  });
});
