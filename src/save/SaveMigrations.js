/**
 * SaveMigrations.js
 * ----------------------------------------------------------------------------
 * Brings an older save up to the current version, one step at a time.
 *
 * HOW IT WORKS
 * `MIGRATIONS[n]` turns a version-n save into a version-(n+1) save. Loading a
 * version-1 save today runs 1→2; when version 3 exists, the same save runs
 * 1→2 and then 2→3. Each step only ever has to know about the version just
 * before it, so old migrations are never rewritten.
 *
 * Every migration is PURE: it gets a copy, returns a new object, and never
 * reads or writes anything else. That makes each one a small unit test.
 *
 * TO CHANGE THE SAVE SHAPE
 *   1. Bump SAVE_VERSION in SaveSchema.js.
 *   2. Add `MIGRATIONS[old]` here, turning the old shape into the new one.
 *   3. Add a fixture of the old shape to legacyFixtures.js and a test that
 *      it loads.
 *
 * WHAT MIGRATION DOES NOT DO
 * It does not validate — the result still goes through SaveValidator, which
 * repairs or refuses. And it never touches storage: a migrated save is only
 * written back in the new shape the next time the player (or the autosave)
 * actually saves.
 *
 * A save from a NEWER version than this game is refused, never "migrated
 * down" — see FUTURE_VERSION_MESSAGE.
 */

import { SAVE_VERSION, SAVE_GAME_ID } from './SaveSchema.js';
import { findLodgeStarter } from '../systems/RivalSystem.js';

/** Shown for a save made by a newer build of the game. */
export const FUTURE_VERSION_MESSAGE =
  'This save was created by a newer version of the game and cannot be loaded here.';

/** A deep copy of plain JSON data, so a migration can never alter its input. */
function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// The migrations
// ---------------------------------------------------------------------------

/**
 * Version 1 → 2.
 *
 * Version 1 is the GameState the game kept in memory through Phases 1-9: a
 * bare object stamped `version: 1`, with the player's settings inside it and
 * each creature carrying its calculated stats and each move its maximum PP.
 * Fields arrived phase by phase, so an early one lacks storage, the Index,
 * the recovery point, beaten trainers, puzzles or Sigils.
 *
 * Version 2 wraps the game data in the save file envelope, moves settings out
 * (they are global preferences now, stored separately; a v1 save's settings
 * are dropped rather than overriding the player's current ones), leaves the
 * derived caches out, and fills in every collection a v1 save predates with
 * the empty value a new game would have.
 */
export function migrateV1toV2(v1) {
  const source = copy(v1);
  delete source.version;
  delete source.settings;

  const stripCaches = (creature) => {
    if (!isPlainObject(creature)) return creature;
    const rest = { ...creature };
    delete rest.stats;
    if (Array.isArray(rest.moves)) {
      rest.moves = rest.moves.map((move) => {
        if (!isPlainObject(move)) return move;
        const kept = { ...move };
        delete kept.maxPp;
        return kept;
      });
    }
    return rest;
  };

  const gameState = { ...source };
  if (Array.isArray(gameState.party)) gameState.party = gameState.party.map(stripCaches);
  if (Array.isArray(gameState.storage)) gameState.storage = gameState.storage.map(stripCaches);

  // What each later phase added. Missing in an older save means "none yet".
  const defaults = {
    party: [],
    storage: [],
    inventory: {},
    flags: {},
    badges: [],
    defeatedTrainers: {},
    puzzles: {},
    creatureIndex: { seen: {}, caught: {} },
    respawn: { mapId: 'mendersHall', spawn: 'default' },
    playTimeMs: 0,
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (gameState[key] === undefined) gameState[key] = value;
  }

  return {
    game: SAVE_GAME_ID,
    version: 2,
    // A v1 save never had a summary. The loader rebuilds it from the data.
    metadata: null,
    gameState,
  };
}

/**
 * Version 2 → 3.
 *
 * Version 3 records which starter the player took (`starter`), because the
 * rival's choice depends on it. Versions 1 and 2 never wrote it down — but the
 * starter is always in the save regardless: it is the creature met at the
 * Warden's Lodge, and starters cannot be released or traded. So the answer is
 * recovered from there, as the base of its family (a Cindraw means Pyrret).
 *
 * A save with no starter yet gets null, exactly like a new game. A save that
 * somehow has none to find also gets null, and the rival reads the party
 * again at battle time (see RivalSystem.getPlayerStarter).
 *
 * Nothing else changes, and the summary is kept: a Phase 10 save shows the
 * same place and time on the Continue screen after migrating as before.
 */
export function migrateV2toV3(v2) {
  const file = copy(v2);
  if (isPlainObject(file.gameState) && file.gameState.starter === undefined) {
    file.gameState.starter = findLodgeStarter(file.gameState);
  }
  file.version = 3;
  return file;
}

/** Version n → n + 1, for every version that has ever existed. */
export const MIGRATIONS = {
  1: migrateV1toV2,
  2: migrateV2toV3,
};

// ---------------------------------------------------------------------------
// Running them
// ---------------------------------------------------------------------------

/**
 * Which version a parsed save claims to be, or null if it is not recognisably
 * a save of this game at all.
 *
 * A version-2+ save says so in its envelope. A version-1 save is a bare state:
 * an object with `version: 1` and a location.
 */
export function detectSaveVersion(raw) {
  if (!isPlainObject(raw)) return null;

  if (raw.game === SAVE_GAME_ID) {
    return Number.isInteger(raw.version) ? raw.version : null;
  }

  if (raw.game === undefined && raw.version === 1 && isPlainObject(raw.location)) return 1;

  return null;
}

/**
 * Bring a parsed save up to SAVE_VERSION.
 *
 * @returns {{
 *   ok: boolean,
 *   status: 'current'|'migrated'|'future'|'unrecognised',
 *   file: object|null,        the current-version file, when ok
 *   fromVersion: number|null,
 *   applied: string[],        e.g. ['1→2']
 *   error: string|null,
 * }}
 */
export function migrateSave(raw) {
  const fromVersion = detectSaveVersion(raw);

  if (fromVersion === null || fromVersion < 1) {
    return {
      ok: false, status: 'unrecognised', file: null, fromVersion, applied: [],
      error: 'This is not a save this game recognises.',
    };
  }

  if (fromVersion > SAVE_VERSION) {
    return {
      ok: false, status: 'future', file: null, fromVersion, applied: [], error: FUTURE_VERSION_MESSAGE,
    };
  }

  if (fromVersion === SAVE_VERSION) {
    return { ok: true, status: 'current', file: raw, fromVersion, applied: [], error: null };
  }

  let file = raw;
  const applied = [];
  for (let version = fromVersion; version < SAVE_VERSION; version += 1) {
    const step = MIGRATIONS[version];
    if (!step) {
      return {
        ok: false, status: 'unrecognised', file: null, fromVersion, applied,
        error: `There is no way to update a version ${version} save.`,
      };
    }
    file = step(file);
    applied.push(`${version}→${version + 1}`);
  }

  return { ok: true, status: 'migrated', file, fromVersion, applied, error: null };
}
