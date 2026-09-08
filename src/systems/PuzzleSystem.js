/**
 * PuzzleSystem.js
 * ----------------------------------------------------------------------------
 * Barriers that open and close, and the switches that move them.
 *
 * Pure: no Phaser, no scenes. It is handed a map definition and the saved
 * puzzle state and it answers "which barriers are closed right now" and "what
 * does pressing this switch do". WorldScene draws the result; TileMap turns it
 * into collision. Nothing here knows about either.
 *
 * WHY ONE MECHANISM FOR THE GATE AND THE HEDGES
 * Route 1's north gate and the Verdant Hall's hedges are the same problem: a
 * set of tiles that is solid sometimes and not others, where the picture and
 * the collision must never disagree. Writing `if (map === 'route1' && x === 10)`
 * anywhere would be two special cases waiting to drift apart. Instead a map
 * declares its barriers as data and there is one rule for all of them.
 *
 * THE TWO KINDS OF BARRIER
 *
 *   FLAG-DRIVEN   `openWhen: 'route1GateOpen'`
 *                 Open exactly when that condition holds, and no other state is
 *                 stored. Route 1's gate is this: the warden's dialogue sets a
 *                 flag and the gate is open from then on, forever, with nothing
 *                 to keep in sync and no way to open it "twice".
 *
 *   SWITCH-DRIVEN `closed: true` and no `openWhen`
 *                 Starts as declared and is moved by root switches. The state
 *                 lives in `gameState.puzzles[mapId]` as plain booleans.
 *
 * A barrier may have both: an `openWhen` condition FORCES it open whatever the
 * switches say. That is how the Verdant Hall relaxes for good once its Sigil
 * has been won.
 *
 * A MAP DECLARES
 *   barriers: [{ id, tile, tiles: [[x, y], ...], closed?, openWhen?, name? }]
 *   switches: [{ id, x, y, retract: '<barrierId>', extend: '<barrierId>', name? }]
 *
 * `tile` is an ordinary character from src/data/tiles.js — the barrier is drawn
 * as, and blocks like, that tile while it is closed. The tile UNDERNEATH it in
 * the map source must be walkable, because that is what the player walks
 * through once it retracts.
 */

import { TILE_DEFINITIONS } from '../data/tiles.js';
import { gameState } from '../core/GameState.js';

/** Every barrier a map declares. Always an array, never undefined. */
export function getBarriers(definition) {
  return (definition && definition.barriers) || [];
}

/** Every switch a map declares. */
export function getSwitches(definition) {
  return (definition && definition.switches) || [];
}

export function getBarrier(definition, barrierId) {
  return getBarriers(definition).find((b) => b.id === barrierId) || null;
}

/** The switch standing on a tile, or null. Switches are stepped ON, not faced. */
export function getSwitchAt(definition, x, y) {
  return getSwitches(definition).find((s) => s.x === x && s.y === y) || null;
}

/**
 * True if any switch on this map moves this barrier.
 *
 * This — not the presence of `openWhen` — is what decides whether a barrier has
 * a saved position. The Verdant Hall's hedges have BOTH a switch and an
 * `openWhen`, so asking the wrong question would throw away the puzzle every
 * time the state was read.
 */
export function isSwitchDriven(definition, barrierId) {
  return getSwitches(definition).some(
    (entry) => entry.retract === barrierId || entry.extend === barrierId
  );
}

/**
 * Where a map's switch-driven barrier state is kept.
 *
 * Keyed by map id inside one plain object on GameState, so it serialises with
 * everything else and a map the player has never entered simply has no entry.
 */
function getStoredState(mapId, state) {
  if (!state.puzzles) state.puzzles = {};
  if (!state.puzzles[mapId]) state.puzzles[mapId] = {};
  return state.puzzles[mapId];
}

/**
 * Which barriers on this map are closed right now.
 *
 * @param {object} definition a map definition
 * @param {object} [options]
 * @param {Record<string, boolean>} [options.conditions] world conditions, for `openWhen`
 * @param {object} [options.state] GameState, for stored switch positions
 * @returns {Record<string, boolean>} barrierId -> closed?
 */
export function createBarrierState(definition, { conditions = {}, state = gameState } = {}) {
  const barriers = getBarriers(definition);
  if (barriers.length === 0) return {};

  const stored = getStoredState(definition.id, state);
  const result = {};

  for (const barrier of barriers) {
    // An `openWhen` condition wins over everything: once the flag or Sigil is
    // there, the barrier is open and stays open, whatever the switches did.
    if (barrier.openWhen && conditions[barrier.openWhen]) {
      result[barrier.id] = false;
      continue;
    }

    // Otherwise a switch-driven barrier is wherever it was last pushed, and
    // anything else is simply as it was declared. A barrier with an `openWhen`
    // and NO switch — Route 1's gate — therefore has nothing stored at all,
    // which is why that gate can never get out of step with its flag.
    const remembered = isSwitchDriven(definition, barrier.id) && barrier.id in stored;
    result[barrier.id] = remembered
      ? Boolean(stored[barrier.id])
      : barrier.closed !== false;
  }

  return result;
}

/**
 * Press a switch: retract one barrier, extend another.
 *
 * Refuses — changing NOTHING — if extending a barrier would close it on top of
 * somebody. A hedge growing through the player would be the worst kind of bug,
 * so it is ruled out here rather than hoped against. The maps are also
 * validated so no switch can ever put a barrier under a person, which makes
 * this a safety net rather than a game rule.
 *
 * @param {object} definition   the map definition
 * @param {string} switchId
 * @param {object} [options]
 * @param {object} [options.state]     GameState (only `puzzles` is written)
 * @param {Array<{x: number, y: number}>} [options.occupants] player and NPCs
 * @returns {{changed: boolean, retracted: string|null, extended: string|null, reason: string|null}}
 */
export function pressSwitch(definition, switchId, { state = gameState, occupants = [] } = {}) {
  const refuse = (reason) => ({ changed: false, retracted: null, extended: null, reason });

  const entry = getSwitches(definition).find((s) => s.id === switchId);
  if (!entry) return refuse('unknownSwitch');

  const retracted = entry.retract ? getBarrier(definition, entry.retract) : null;
  const extended = entry.extend ? getBarrier(definition, entry.extend) : null;

  if (entry.retract && !retracted) return refuse('unknownBarrier');
  if (entry.extend && !extended) return refuse('unknownBarrier');

  if (extended) {
    const blocked = new Set(occupants.map((who) => `${who.x},${who.y}`));
    const wouldTrap = (extended.tiles || []).some(([x, y]) => blocked.has(`${x},${y}`));
    if (wouldTrap) return refuse('occupied');
  }

  const stored = getStoredState(definition.id, state);
  if (retracted) stored[retracted.id] = false;
  if (extended) stored[extended.id] = true;

  return {
    changed: true,
    retracted: retracted ? retracted.id : null,
    extended: extended ? extended.id : null,
    reason: null,
  };
}

/**
 * Put every switch-driven barrier on a map back to how it was declared.
 * The documented way out if a player has tangled the hedges — and what the
 * reset root in the Verdant Hall's porch does.
 *
 * @returns {number} how many barriers were reset
 */
export function resetPuzzle(definition, { state = gameState } = {}) {
  // Only what a switch can move. A gate the story opened is not the player's to
  // shut again, and resetting must never take progress away.
  const barriers = getBarriers(definition)
    .filter((b) => isSwitchDriven(definition, b.id));
  if (barriers.length === 0) return 0;

  const stored = getStoredState(definition.id, state);
  for (const barrier of barriers) stored[barrier.id] = barrier.closed !== false;
  return barriers.length;
}

/** True if this map has anything that can open or close. */
export function hasPuzzle(definition) {
  return getSwitches(definition).length > 0;
}

// ---------------------------------------------------------------------------
// Reachability — proving a puzzle can always be finished
// ---------------------------------------------------------------------------

/**
 * Everywhere the player can walk from a tile, given a set of closed barriers.
 *
 * Plain flood fill over the map's own characters plus the barriers. Used by the
 * tests to prove that a puzzle can be solved and — more importantly — that it
 * can never be locked into a state the player cannot walk out of.
 *
 * @param {object} definition
 * @param {{x: number, y: number}} from
 * @param {Record<string, boolean>} closed barrierId -> closed?
 * @returns {Set<string>} "x,y" keys
 */
export function floodFill(definition, from, closed = {}) {
  const rows = definition.tiles;
  const height = rows.length;
  const width = rows[0].length;

  const blockedByBarrier = new Set();
  for (const barrier of getBarriers(definition)) {
    if (!closed[barrier.id]) continue;
    for (const [x, y] of barrier.tiles || []) blockedByBarrier.add(`${x},${y}`);
  }

  const walkable = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    if (blockedByBarrier.has(`${x},${y}`)) return false;
    const tile = TILE_DEFINITIONS[rows[y][x]];
    return Boolean(tile) && !tile.solid;
  };

  const seen = new Set();
  if (!walkable(from.x, from.y)) return seen;

  const queue = [[from.x, from.y]];
  seen.add(`${from.x},${from.y}`);

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !walkable(nx, ny)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }

  return seen;
}

/**
 * Explore every situation a player could actually get into on this map.
 *
 * A situation is "where I can stand" plus "which barriers are closed". From
 * each one, pressing any switch the player can REACH produces another. This
 * walks all of them, which is what lets a test say — not hope — that a goal is
 * always reachable and the door is never lost.
 *
 * @param {object} definition
 * @param {{x: number, y: number}} start where the player comes in
 * @param {Record<string, boolean>} initialClosed
 * @returns {Array<{closed: Record<string, boolean>, reachable: Set<string>}>}
 */
export function explorePuzzleStates(definition, start, initialClosed) {
  const barrierIds = getBarriers(definition).map((b) => b.id).sort();
  const key = (closed) => barrierIds.map((id) => (closed[id] ? '1' : '0')).join('');

  const seen = new Map();
  const queue = [{ ...initialClosed }];
  seen.set(key(initialClosed), null);

  const results = [];

  while (queue.length > 0) {
    const closed = queue.pop();
    const reachable = floodFill(definition, start, closed);
    results.push({ closed, reachable });

    for (const entry of getSwitches(definition)) {
      if (!reachable.has(`${entry.x},${entry.y}`)) continue;   // cannot get to it

      const next = { ...closed };
      if (entry.retract) next[entry.retract] = false;
      if (entry.extend) next[entry.extend] = true;

      const nextKey = key(next);
      if (seen.has(nextKey)) continue;
      seen.set(nextKey, null);
      queue.push(next);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Check one map's barriers and switches and list everything wrong.
 *
 * A list rather than a throw, so the data tests can run it over EVERY map
 * automatically — a barrier added later is validated the moment it exists.
 *
 * @returns {string[]} empty when the map is sound
 */
export function findPuzzleProblems(definition) {
  const problems = [];
  const barriers = getBarriers(definition);
  const switches = getSwitches(definition);
  if (barriers.length === 0 && switches.length === 0) return problems;

  const rows = definition.tiles;
  const height = rows.length;
  const width = rows[0].length;
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
  const sourceTile = (x, y) => TILE_DEFINITIONS[rows[y][x]];

  const barrierIds = new Set();
  const barrierTiles = new Map();

  for (const barrier of barriers) {
    const where = `${definition.id} barrier "${barrier.id}"`;

    if (!barrier.id) problems.push(`${definition.id}: a barrier has no id`);
    if (barrierIds.has(barrier.id)) problems.push(`${where}: duplicate id`);
    barrierIds.add(barrier.id);

    if (!TILE_DEFINITIONS[barrier.tile]) {
      problems.push(`${where}: tile "${barrier.tile}" is not a known map character`);
    } else if (!TILE_DEFINITIONS[barrier.tile].solid) {
      problems.push(`${where}: tile "${barrier.tile}" is not solid, so closing it would block nothing`);
    }

    if (!Array.isArray(barrier.tiles) || barrier.tiles.length === 0) {
      problems.push(`${where}: needs at least one tile`);
      continue;
    }

    for (const pair of barrier.tiles) {
      if (!Array.isArray(pair) || pair.length !== 2) {
        problems.push(`${where}: every tile must be [x, y]`);
        continue;
      }
      const [x, y] = pair;
      if (!inBounds(x, y)) {
        problems.push(`${where}: tile (${x}, ${y}) is outside the map`);
        continue;
      }
      // The tile underneath has to be WALKABLE, or retracting the barrier would
      // reveal a wall and the player would be stuck staring at an open gate.
      const tile = sourceTile(x, y);
      if (!tile || tile.solid) {
        problems.push(
          `${where}: tile (${x}, ${y}) is solid in the map source, so opening it changes nothing`
        );
      }
      const key = `${x},${y}`;
      if (barrierTiles.has(key)) {
        problems.push(`${where}: tile (${x}, ${y}) is also covered by "${barrierTiles.get(key)}"`);
      }
      barrierTiles.set(key, barrier.id);
    }
  }

  // Nobody may live on a barrier tile: a hedge closing on a person is exactly
  // the bug the occupancy guard exists to prevent, and a static NPC standing
  // there would hit it every time.
  for (const npc of definition.npcs || []) {
    const owner = barrierTiles.get(`${npc.x},${npc.y}`);
    if (owner) problems.push(`${definition.id}: NPC "${npc.id}" stands on barrier "${owner}"`);
  }
  for (const [name, spawn] of Object.entries(definition.spawnPoints || {})) {
    const owner = barrierTiles.get(`${spawn.x},${spawn.y}`);
    if (owner) problems.push(`${definition.id}: spawn "${name}" sits on barrier "${owner}"`);
  }

  const switchIds = new Set();
  for (const entry of switches) {
    const where = `${definition.id} switch "${entry.id}"`;

    if (!entry.id) problems.push(`${definition.id}: a switch has no id`);
    if (switchIds.has(entry.id)) problems.push(`${where}: duplicate id`);
    switchIds.add(entry.id);

    if (!inBounds(entry.x, entry.y)) {
      problems.push(`${where}: is outside the map`);
    } else if (!sourceTile(entry.x, entry.y) || sourceTile(entry.x, entry.y).solid) {
      problems.push(`${where}: stands on a solid tile, so it could never be stepped on`);
    }

    // A switch under a barrier could be sealed away with itself inside.
    const owner = barrierTiles.get(`${entry.x},${entry.y}`);
    if (owner) problems.push(`${where}: stands on barrier "${owner}"`);

    if (!entry.retract && !entry.extend) problems.push(`${where}: does nothing`);
    if (entry.retract && !barrierIds.has(entry.retract)) {
      problems.push(`${where}: retracts unknown barrier "${entry.retract}"`);
    }
    if (entry.extend && !barrierIds.has(entry.extend)) {
      problems.push(`${where}: extends unknown barrier "${entry.extend}"`);
    }
    if (entry.retract && entry.retract === entry.extend) {
      problems.push(`${where}: retracts and extends the same barrier`);
    }
  }

  return problems;
}
