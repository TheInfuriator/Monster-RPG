/**
 * SaveManager.js
 * ----------------------------------------------------------------------------
 * The ONE owner of saving and loading. Scenes ask it to save, to list the
 * slots, or to load one; nothing else in the game reads or writes a save.
 *
 * TWO SLOTS, THE SAME FORMAT
 *   manual     written only when the player chooses Save in the menu
 *   autosave   written by the game at safe moments; never touches the manual
 *
 * Each is judged on its own, so a damaged manual save never hides a good
 * autosave, and the other way round.
 *
 * SAVING IS ALL OR NOTHING
 * The whole save is built, turned into text, and CHECKED — parsed back and
 * validated exactly as a load would — before storage is touched. Only then is
 * it written, in a single `setItem` call, which either replaces the old value
 * completely or (storage full, storage refused) throws and leaves the old
 * value exactly where it was. The previous save is never removed first.
 *
 * LOADING NEVER HALF-HAPPENS
 * read → parse → migrate → validate → build a fresh state → find a safe tile.
 * The live game is only touched at the very end, by `applyLoadedState()`,
 * once everything has succeeded. A failure at any step leaves the running game
 * — the title screen — exactly as it was.
 */

import { setGameState, startNewGame } from '../core/GameState.js';
import { clearReservedInstanceIds, reserveInstanceIds } from '../systems/CreatureFactory.js';
import { createSaveFile, buildSaveMetadata, SAVE_VERSION } from './SaveSchema.js';
import { validateSaveFile } from './SaveValidator.js';
import { migrateSave, detectSaveVersion, FUTURE_VERSION_MESSAGE } from './SaveMigrations.js';
import { resolveRestorePosition } from './RestorePosition.js';
import { getStorage, STORAGE_KEYS } from './SaveStorage.js';

/** The save slots, in the order the Continue screen lists them. */
export const SLOTS = ['manual', 'autosave'];

/** How each slot is named on screen. */
export const SLOT_LABELS = {
  manual: 'Manual Save',
  autosave: 'Autosave',
};

/** What a player is told about a save that cannot be used. */
export const SLOT_MESSAGES = {
  corrupt: 'This save is damaged and cannot be loaded.',
  incompatible: FUTURE_VERSION_MESSAGE,
  unavailable: 'Saves could not be read in this browser.',
  storageFull: 'There was no room to save. Your previous save is unchanged.',
  storageRefused: 'The browser refused to save. Your previous save is unchanged.',
  wouldNotLoad: 'Something in the game could not be saved safely. Your previous save is unchanged.',
  newerSave: 'The slot holds a save from a newer version of the game, so it was left alone.',
};

/** A millisecond clock for timing a save: the precise one where there is one. */
function clockNow() {
  return globalThis.performance ? globalThis.performance.now() : Date.now();
}

function assertSlot(slot) {
  if (!SLOTS.includes(slot)) {
    throw new Error(`[Save] Unknown save slot "${slot}". Slots: ${SLOTS.join(', ')}.`);
  }
}

/** The raw text in a slot, or null. Never throws. */
function readText(slot, storage) {
  try {
    return { text: storage.getItem(STORAGE_KEYS[slot]), readable: true };
  } catch (error) {
    console.warn(`[Save] Could not read the ${SLOT_LABELS[slot]}:`, error?.message || error);
    return { text: null, readable: false };
  }
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/**
 * Read one slot all the way through, without touching the live game.
 *
 * @returns {{
 *   slot: string,
 *   status: 'empty'|'valid'|'corrupt'|'incompatible',
 *   metadata: object|null,   what the Continue screen shows (valid saves only)
 *   state: object|null,      a fresh, validated GameState (valid saves only)
 *   message: string|null,    why it cannot be used (corrupt/incompatible only)
 *   errors: string[],
 *   warnings: string[],
 *   migratedFrom: number|null,
 * }}
 */
export function readSlot(slot, { storage = getStorage() } = {}) {
  assertSlot(slot);
  const base = {
    slot, status: 'empty', metadata: null, state: null, message: null,
    errors: [], warnings: [], migratedFrom: null,
  };

  const { text, readable } = readText(slot, storage);
  if (!readable) {
    return { ...base, status: 'corrupt', message: SLOT_MESSAGES.unavailable, errors: [SLOT_MESSAGES.unavailable] };
  }
  if (text === null || text === undefined) return base;

  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return {
      ...base, status: 'corrupt', message: SLOT_MESSAGES.corrupt, errors: ['The save is not valid JSON.'],
    };
  }

  const migration = migrateSave(raw);
  if (!migration.ok) {
    const future = migration.status === 'future';
    return {
      ...base,
      status: future ? 'incompatible' : 'corrupt',
      message: future ? SLOT_MESSAGES.incompatible : SLOT_MESSAGES.corrupt,
      errors: [migration.error],
    };
  }

  const migrated = migration.status === 'migrated';
  // An older save never had a summary, so its absence is expected, not damage.
  const result = validateSaveFile(migration.file, { expectMetadata: !migrated });
  if (!result.ok) {
    return { ...base, status: 'corrupt', message: SLOT_MESSAGES.corrupt, errors: result.errors, warnings: result.warnings };
  }

  // A migrated save has no summary of its own, so one is built from its data.
  // It is labelled with the slot it was found in, since that is where it
  // lives, and its time is unknown — so it sorts as the oldest.
  const metadata = migrated
    ? buildSaveMetadata(result.state, { source: slot, savedAt: 0 })
    : result.metadata;

  return {
    ...base,
    status: 'valid',
    metadata,
    state: result.state,
    warnings: result.warnings,
    migratedFrom: migrated ? migration.fromVersion : null,
  };
}

/** Both slots, read independently. */
export function listSlots({ storage = getStorage() } = {}) {
  const summaries = {};
  for (const slot of SLOTS) summaries[slot] = readSlot(slot, { storage });
  return summaries;
}

/**
 * What the title screen's Continue should do, decided from the slot summaries.
 *
 *   no valid save                  Continue is disabled
 *   exactly one valid save, and
 *     the other slot is empty      Continue loads it straight away
 *   anything else                  Continue opens the chooser — two saves to
 *                                  pick from, or a damaged one to explain
 *
 * The most recent valid save is preselected. A tie goes to the manual save,
 * since that is the one the player chose to make.
 */
export function getContinueChoice(summaries) {
  const valid = SLOTS
    .map((slot) => summaries[slot])
    .filter((summary) => summary && summary.status === 'valid')
    .sort((a, b) => (b.metadata.savedAt - a.metadata.savedAt) || (SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot)));

  const problems = SLOTS
    .map((slot) => summaries[slot])
    .filter((summary) => summary && (summary.status === 'corrupt' || summary.status === 'incompatible'));

  return {
    canContinue: valid.length > 0,
    needsChooser: valid.length > 1 || (valid.length === 1 && problems.length > 0),
    preselected: valid.length > 0 ? valid[0].slot : null,
    validSlots: valid.map((summary) => summary.slot),
    problems: problems.map((summary) => ({ slot: summary.slot, status: summary.status, message: summary.message })),
  };
}

/** True if either slot holds anything at all — worth a warning before New Game. */
export function hasAnySave({ storage = getStorage() } = {}) {
  return SLOTS.some((slot) => readText(slot, storage).text !== null);
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

/**
 * Save a state into a slot. All or nothing — see the top of this file.
 *
 * @param {'manual'|'autosave'} slot
 * @param {object} state  the live GameState
 * @param {object} [options]
 * @param {boolean} [options.overwriteNewer] allow replacing a save from a newer
 *        version. Only the manual Save passes this, after asking the player.
 *        The autosave never does.
 * @returns {{ ok: boolean, reason: string|null, message: string|null,
 *             metadata: object|null, bytes: number, durationMs: number }}
 */
export function saveToSlot(slot, state, {
  storage = getStorage(), now = Date.now(), overwriteNewer = false,
} = {}) {
  assertSlot(slot);
  const started = clockNow();
  const finish = (fields) => ({
    ok: false,
    reason: null,
    message: null,
    metadata: null,
    bytes: 0,
    ...fields,
    durationMs: clockNow() - started,
  });

  // Never replace a newer game's save by accident.
  if (!overwriteNewer) {
    const existing = readText(slot, storage).text;
    if (existing !== null && isNewerVersion(existing)) {
      return finish({ reason: 'newerSave', message: SLOT_MESSAGES.newerSave });
    }
  }

  let text;
  let file;
  try {
    file = createSaveFile(state, { source: slot, savedAt: now });
    text = JSON.stringify(file);
  } catch (error) {
    console.error('[Save] Could not build the save:', error);
    return finish({ reason: 'wouldNotLoad', message: SLOT_MESSAGES.wouldNotLoad });
  }

  // Prove it loads BEFORE it replaces anything.
  const check = validateSaveFile(JSON.parse(text));
  if (!check.ok) {
    console.error('[Save] The save would not load, so it was not written:', check.errors);
    return finish({ reason: 'wouldNotLoad', message: SLOT_MESSAGES.wouldNotLoad });
  }

  try {
    storage.setItem(STORAGE_KEYS[slot], text);
  } catch (error) {
    const full = /quota/i.test(error?.name || '') || /quota/i.test(error?.message || '');
    console.warn(`[Save] The ${SLOT_LABELS[slot]} was not written:`, error?.message || error);
    return finish({
      reason: full ? 'storageFull' : 'storageRefused',
      message: full ? SLOT_MESSAGES.storageFull : SLOT_MESSAGES.storageRefused,
    });
  }

  return finish({ ok: true, metadata: file.metadata, bytes: text.length });
}

/** True if this stored text is a save from a later version than this game. */
function isNewerVersion(text) {
  try {
    const version = detectSaveVersion(JSON.parse(text));
    return version !== null && version > SAVE_VERSION;
  } catch {
    return false;
  }
}

/** Remove a slot. Only the debug tools do this; the game never deletes a save. */
export function deleteSlot(slot, { storage = getStorage() } = {}) {
  assertSlot(slot);
  try {
    storage.removeItem(STORAGE_KEYS[slot]);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * Prepare a slot for play: everything except touching the live game.
 *
 * @returns {{ ok: boolean, state: object|null, position: object|null,
 *             message: string|null, warnings: string[], summary: object }}
 */
export function prepareLoad(slot, { storage = getStorage() } = {}) {
  const summary = readSlot(slot, { storage });

  if (summary.status !== 'valid') {
    return {
      ok: false,
      state: null,
      position: null,
      message: summary.message || 'There is no save in that slot.',
      warnings: summary.warnings,
      summary,
    };
  }

  const position = resolveRestorePosition(summary.state);
  const state = summary.state;
  state.location = { mapId: position.mapId, x: position.x, y: position.y, facing: position.facing };

  return {
    ok: true,
    state,
    position,
    message: null,
    warnings: [...summary.warnings, ...position.warnings],
    summary,
  };
}

/**
 * Make a prepared state the live game. The last step of a load, and the only
 * one that changes anything.
 */
export function applyLoadedState(state) {
  clearReservedInstanceIds();
  reserveInstanceIds([...state.party, ...state.storage].map((creature) => creature.instanceId));
  return setGameState(state);
}

/**
 * Load a slot into the live game, or change nothing.
 *
 * @returns the prepareLoad() result
 */
export function loadSlot(slot, { storage = getStorage() } = {}) {
  const prepared = prepareLoad(slot, { storage });
  if (!prepared.ok) {
    console.warn(`[Save] Could not load the ${SLOT_LABELS[slot] || slot}: ${prepared.message}`);
    return prepared;
  }

  for (const warning of prepared.warnings) console.warn(`[Save] ${warning}`);
  applyLoadedState(prepared.state);
  console.info(
    `[Save] Loaded the ${SLOT_LABELS[slot]}` +
      (prepared.summary.migratedFrom ? ` (updated from version ${prepared.summary.migratedFrom})` : '') +
      ` at ${prepared.position.mapId} (${prepared.position.x}, ${prepared.position.y}).`
  );
  return prepared;
}

/**
 * Start a brand new playthrough. Saves are NOT touched: the manual save stays
 * until the player saves over it, and the autosave until the new game next
 * autosaves.
 */
export function beginNewGame(playerName) {
  clearReservedInstanceIds();
  return startNewGame(playerName);
}
