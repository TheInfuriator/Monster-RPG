/**
 * GameState.js
 * ----------------------------------------------------------------------------
 * The one place that holds everything about the current playthrough.
 *
 * WHY A SINGLE SHARED OBJECT?
 * Scenes in Phaser are created and destroyed as the player moves between the
 * overworld, battles, and menus. If each scene owned its own copy of the party or
 * the player's position, keeping them in sync would be a constant source of bugs.
 * Instead there is exactly one GameState, every scene reads and writes it, and
 * the save system just serialises it.
 *
 * This starts small. Later phases add `party`, `inventory`, `flags`, `badges`,
 * and so on — each as another field on this same object.
 */

import { STARTING_MAP_ID } from '../data/maps/index.js';
import { ECONOMY } from '../config/balance.js';

/**
 * Bumped whenever the shape of saved data changes, so the save system can
 * detect and handle old saves instead of loading them and breaking.
 */
export const SAVE_VERSION = 1;

/** A brand new playthrough. Always returns a fresh object — never a shared one. */
export function createNewGameState() {
  return {
    version: SAVE_VERSION,

    // --- Player identity ---
    playerName: 'Warden',

    // --- Where the player is ---
    location: {
      mapId: STARTING_MAP_ID,
      x: null, // null means "use the map's default spawn point"
      y: null,
      facing: 'down',
    },

    /** Where the player respawns after losing a battle. Set by Mender's Halls. */
    respawn: {
      mapId: STARTING_MAP_ID,
      spawn: 'default',
    },

    // --- Progress (filled in by later phases) ---
    money: ECONOMY.startingMoney,
    party: [],
    storage: [],
    inventory: {},
    badges: [],
    flags: {},
    defeatedTrainers: {},
    creatureIndex: { seen: {}, caught: {} },

    // --- Bookkeeping ---
    playTimeMs: 0,
    createdAt: Date.now(),
  };
}

/**
 * The live state for the current session.
 * Modules import `gameState` and mutate it directly — deliberately simple.
 */
export let gameState = createNewGameState();

/** Replace the whole state, e.g. on New Game or after loading a save. */
export function setGameState(next) {
  gameState = next;
  return gameState;
}

/** Start a brand new playthrough, discarding whatever was in memory. */
export function startNewGame(playerName) {
  const fresh = createNewGameState();
  if (playerName) fresh.playerName = playerName;
  return setGameState(fresh);
}

// ---------------------------------------------------------------------------
// Small helpers so scenes do not poke at raw fields everywhere.
// ---------------------------------------------------------------------------

/** Record where the player is standing, so it survives scene changes and saves. */
export function setLocation(mapId, x, y, facing) {
  gameState.location = { mapId, x, y, facing };
}

/** True if a story flag has been set. Unknown flags are simply false. */
export function hasFlag(name) {
  return Boolean(gameState.flags[name]);
}

/** Set a story flag. Flags are how NPCs and maps react to progress. */
export function setFlag(name, value = true) {
  gameState.flags[name] = value;
}
