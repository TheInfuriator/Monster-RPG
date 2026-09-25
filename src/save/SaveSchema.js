/**
 * SaveSchema.js
 * ----------------------------------------------------------------------------
 * What a save file looks like, and how a live GameState becomes one.
 *
 * A SAVE FILE is plain JSON with four parts:
 *
 *   {
 *     game: 'aetheria-chronicles',   so a stray JSON blob is never mistaken for a save
 *     version: 2,                    the shape of everything below — see SAVE_VERSION
 *     metadata: { ... },             what the title screen shows, no world needed
 *     gameState: { ... },            the playthrough itself
 *   }
 *
 * WHAT GOES IN `gameState` — AND WHAT DOES NOT
 * Only CANONICAL state: facts that cannot be worked out from anything else.
 * The party's levels, experience, HP, PP and status; the bag; the coins; the
 * flags; who has been beaten; which hedges the switches moved; the Sigils.
 *
 * Anything that CAN be worked out is left out and rebuilt on load, so a save
 * can never disagree with itself:
 *
 *   creature.stats     recalculated from species + level
 *   move.maxPp         read from the move's own data
 *   barrier states     recalculated from flags, Sigils and `puzzles`
 *   NPC positions      read from the map
 *
 * And nothing that belongs to the screen is ever saved: no Phaser objects,
 * no timers, no open dialogue, no menu cursor, no battle in progress.
 * The serialiser picks fields BY NAME rather than copying objects, which is
 * what makes that a guarantee instead of a hope.
 *
 * THE STANDING RULE
 * Any future persistent gameplay field added to GameState must be added here
 * (`serializeGameState`), to validation and defaults (`SaveValidator.js`), to a
 * migration where older saves need it (`SaveMigrations.js`), and to the
 * round-trip tests. `tests/saveSchema.test.js` fails if a GameState field is
 * not accounted for, so the rule cannot be forgotten quietly.
 */

import { MAPS } from '../data/maps/index.js';
import { CREATURES } from '../data/creatures.js';
import { getDisplayName } from '../systems/CreatureFactory.js';

/**
 * The shape of saved data. Bump this whenever the shape changes, and add a
 * migration from the previous number in `SaveMigrations.js`.
 *
 *   1  Phases 1-9: the in-memory GameState, never actually written anywhere.
 *   2  Phase 10: the save file envelope; settings moved out to their own
 *      storage key; derived caches (stats, maxPp) no longer stored.
 *   3  Phase 11: `starter` — which starter the player took, which the rival's
 *      choice depends on. Earlier saves never recorded it; the 2 -> 3
 *      migration recovers it from the creature met at the Warden's Lodge.
 */
export const SAVE_VERSION = 3;

/** Written into every save so an unrelated JSON value is never loaded as one. */
export const SAVE_GAME_ID = 'aetheria-chronicles';

/** Where a save came from. */
export const SAVE_SOURCES = ['manual', 'autosave'];

/**
 * Every field of GameState, sorted into what is saved and what is not.
 * `tests/saveSchema.test.js` checks this list against `createNewGameState()`,
 * so adding a field to GameState without deciding its fate fails the build.
 */
export const PERSISTENT_FIELDS = [
  'playerName',
  'starter',
  'location',
  'respawn',
  'money',
  'party',
  'storage',
  'inventory',
  'badges',
  'flags',
  'defeatedTrainers',
  'puzzles',
  'creatureIndex',
  'playTimeMs',
  'createdAt',
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/**
 * A copy of an object with its keys in alphabetical order.
 *
 * Two identical playthroughs that happened to pick things up in a different
 * order would otherwise produce different JSON. Sorting makes the output
 * depend only on WHAT is saved, which makes saves easy to compare in tests.
 */
function sortedObject(source, mapValue = (value) => value) {
  const result = {};
  for (const key of Object.keys(source || {}).sort()) {
    result[key] = mapValue(source[key], key);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Serialising
// ---------------------------------------------------------------------------

/**
 * One creature, as it is saved. Its stats and each move's maximum PP are left
 * out: they are recalculated on load from the species, level and move data.
 */
export function serializeCreature(creature) {
  return {
    instanceId: creature.instanceId,
    speciesId: creature.speciesId,
    nickname: creature.nickname ?? null,
    level: creature.level,
    experience: creature.experience,
    currentHp: creature.currentHp,
    moves: (creature.moves || []).map((move) => ({ id: move.id, pp: move.pp })),
    status: creature.status ?? null,
    metAt: creature.metAt ?? null,
  };
}

/**
 * The canonical part of a GameState, as plain JSON-safe data.
 *
 * Never returns a reference into the live state: everything is copied, so
 * the game carrying on cannot change a save that is being written.
 */
export function serializeGameState(state) {
  return {
    playerName: state.playerName,
    starter: state.starter ?? null,
    location: {
      mapId: state.location.mapId,
      x: state.location.x,
      y: state.location.y,
      facing: state.location.facing,
    },
    respawn: {
      mapId: state.respawn.mapId,
      spawn: state.respawn.spawn,
    },
    money: state.money,
    party: state.party.map(serializeCreature),
    storage: (state.storage || []).map(serializeCreature),
    inventory: sortedObject(state.inventory),
    badges: [...(state.badges || [])],
    flags: sortedObject(state.flags),
    defeatedTrainers: sortedObject(state.defeatedTrainers),
    puzzles: sortedObject(state.puzzles, (barriers) => sortedObject(barriers)),
    creatureIndex: {
      seen: sortedObject(state.creatureIndex?.seen),
      caught: sortedObject(state.creatureIndex?.caught),
    },
    playTimeMs: state.playTimeMs,
    createdAt: state.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Metadata — what the title screen shows without loading the world
// ---------------------------------------------------------------------------

/**
 * A place name a player would recognise.
 *
 * Both towns have a "Mender's Hall" and a "Supply Post", so an interior is
 * named with the town its door opens onto: "Thistlewood — Mender's Hall".
 * That is read from the map's own exits, so a new town needs no entry here.
 */
export function describeLocation(mapId) {
  const map = Object.hasOwn(MAPS, mapId) ? MAPS[mapId] : null;
  if (!map) return 'Somewhere unknown';
  if (!map.interior) return map.name;

  const outside = (map.exits || [])
    .map((exit) => MAPS[exit.to])
    .find((target) => target && !target.interior);

  return outside ? `${outside.name} — ${map.name}` : map.name;
}

/**
 * The summary stored alongside a save.
 *
 * Everything the Continue screen needs is here, already worked out, so
 * showing two save slots never means building two worlds.
 */
export function buildSaveMetadata(state, { source = 'manual', savedAt = Date.now() } = {}) {
  const lead = state.party[0] || null;
  const caught = Object.keys(state.creatureIndex?.caught || {}).length;

  return {
    source,
    savedAt,
    playerName: state.playerName,
    mapId: state.location.mapId,
    locationName: describeLocation(state.location.mapId),
    badgeCount: (state.badges || []).length,
    partySize: state.party.length,
    caughtCount: caught,
    playTimeMs: state.playTimeMs,
    lead: lead && Object.hasOwn(CREATURES, lead.speciesId)
      ? { speciesId: lead.speciesId, name: getDisplayName(lead), level: lead.level }
      : null,
  };
}

/**
 * A complete save file for this state.
 *
 * @param {object} state            the live GameState
 * @param {object} [options]
 * @param {'manual'|'autosave'} [options.source]
 * @param {number} [options.savedAt] milliseconds since 1970; tests pass a fixed one
 */
export function createSaveFile(state, { source = 'manual', savedAt = Date.now() } = {}) {
  return {
    game: SAVE_GAME_ID,
    version: SAVE_VERSION,
    metadata: buildSaveMetadata(state, { source, savedAt }),
    gameState: serializeGameState(state),
  };
}
