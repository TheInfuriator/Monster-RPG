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
 * WHAT IS NOT HERE
 * Only the PLAYTHROUGH lives on GameState. The player's preferences (text
 * speed, volume) belong to the player rather than to one game, so they live in
 * `src/core/Settings.js` under their own storage key and survive a New Game.
 * Nothing that belongs to the screen — sprites, timers, an open dialogue box —
 * is ever put here, which is what lets `src/save/SaveSchema.js` save it.
 *
 * Adding a field? It must also be added to the save: see the standing rule at
 * the top of SaveSchema.js. A test fails until it is.
 */

import { STARTING_MAP_ID } from '../data/maps/index.js';
import { ECONOMY } from '../config/balance.js';

/** A brand new playthrough. Always returns a fresh object — never a shared one. */
export function createNewGameState() {
  return {
    // --- Player identity ---
    playerName: 'Warden',
    /**
     * Which starter the player took at the Warden's Lodge, as its species id
     * ('pyrret', 'drizzle' or 'sproutle'), or null before they have one. The
     * rival takes the starter strong against it (see src/data/rivals.js).
     */
    starter: null,

    // --- Where the player is ---
    location: {
      mapId: STARTING_MAP_ID,
      x: null, // null means "use the map's default spawn point"
      y: null,
      facing: 'down',
    },

    /**
     * Where the player wakes up after blacking out. A map id and a NAMED spawn
     * point, never raw coordinates, so it goes through the same transition
     * machinery as any door and cannot land the player inside a wall.
     *
     * Healing at a Mender's Hall sets this. It starts at Emberhollow's, so a
     * player who blacks out before ever visiting one still has somewhere safe
     * to wake up.
     */
    respawn: {
      mapId: 'mendersHall',
      spawn: 'default',
    },

    // --- Progress (filled in by later phases) ---
    money: ECONOMY.startingMoney,
    party: [],
    storage: [],
    inventory: {},
    /** Sigil ids, in the order they were earned. See BadgeSystem. */
    badges: [],
    flags: {},
    defeatedTrainers: {},

    /**
     * Which barriers a map's switches have moved, keyed by map id:
     *   { verdantHall: { hedgeEast: false, hedgeNorth: true } }
     *
     * Plain booleans, so the Verdant Hall's hedges save and load with
     * everything else. A map the player has never entered simply has no entry
     * and falls back to how its barriers are declared. See PuzzleSystem.
     */
    puzzles: {},
    creatureIndex: { seen: {}, caught: {} },

    // --- Bookkeeping ---
    /** Time spent in the game, counted by `src/core/PlayClock.js`. */
    playTimeMs: 0,
    /** When this playthrough began. */
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

// ---------------------------------------------------------------------------
// Where the player wakes up after a blackout
// ---------------------------------------------------------------------------

/**
 * The current recovery point, always a usable `{ mapId, spawn }`.
 *
 * Falls back to Emberhollow's Mender's Hall rather than returning null, so
 * blackout code never has to handle "nowhere to go".
 */
export function getRecoveryPoint(state = gameState) {
  const point = state.respawn;
  if (point && point.mapId && point.spawn) return { ...point };

  return { mapId: 'mendersHall', spawn: 'default' };
}

/**
 * Record a new recovery point. Every Mender's Hall calls this when it heals
 * you, which is all it takes for a future healing centre to become the place
 * you wake up — the blackout code never changes.
 *
 * @returns {boolean} false (changing nothing) for an incomplete point
 */
export function setRecoveryPoint(mapId, spawn = 'default', state = gameState) {
  if (typeof mapId !== 'string' || mapId.length === 0) return false;
  if (typeof spawn !== 'string' || spawn.length === 0) return false;

  state.respawn = { mapId, spawn };
  return true;
}
