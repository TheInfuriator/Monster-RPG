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
 *
 * LEVERS, CURRENTS AND SIGNALS (Phase 12)
 * A second way to move barriers, for puzzles that are not "this switch swaps
 * those two hedges". A LEVER is a solid object the player FACES and presses
 * Confirm at (a valve, a tide wheel). It has exactly two positions and is
 * stored as one boolean, like everything else in `gameState.puzzles`:
 *
 *   levers: [{ id, name, x, y, positions: ['west', 'east'], look: 'valve',
 *              state?: 'tide',            // levers sharing a state move together
 *              input?, outputs?: { west: 'westRun', east: 'eastRun' },  // a valve
 *              says?: { west: 'The current swings west.', ... },
 *              dry?: 'It turns, but no current reaches it.' }]
 *
 * Levers produce SIGNALS — plain names like `tide:high` (a lever state and its
 * position) or `current:westRun` (a channel the aether current is flowing
 * along). A valve passes current from its `input` channel to the output its
 * position selects; `flow.sources` are always flowing. So a valve downstream of
 * another does nothing unless the first sends it current — that is Mistvault's
 * puzzle, and it is not a hedge swap.
 *
 *   flow: { sources: ['spring'], allPoweredWhen: 'mistvaultSiphonStopped' }
 *
 * A barrier can follow a signal instead of a switch:
 *
 *   openWhenSignal: 'current:westRun'   open only while it holds (a mist bridge)
 *   closedWhenSignal: 'tide:high'       shut only while it holds (a flooded floor)
 *
 * and `glows: [{ signal, tile, tiles }]` draws tiles that light up while a
 * signal holds — purely a picture, so the player can SEE where the current
 * runs. A glow may follow a world condition instead (`when: 'someFlag'`), for
 * channels the story lights for good. `closedWhen: '<world condition>'` is the mirror of `openWhen`: shut
 * while the condition holds (Route 2's spring filling back up).
 *
 * WHAT DECIDES A BARRIER, in order:
 *   openWhen (world)  ->  closedWhen (world)  ->  a signal  ->  a switch  ->  as declared
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
  const signals = getPuzzleSignals(definition, { state, conditions });
  const result = {};

  for (const barrier of barriers) {
    // An `openWhen` condition wins over everything: once the flag or Sigil is
    // there, the barrier is open and stays open, whatever the switches did.
    if (barrier.openWhen && conditions[barrier.openWhen]) {
      result[barrier.id] = false;
      continue;
    }
    // Its mirror: shut while a world condition holds.
    if (barrier.closedWhen && conditions[barrier.closedWhen]) {
      result[barrier.id] = true;
      continue;
    }
    // Following a lever's signal: derived every time, never stored, so it can
    // never disagree with the levers.
    if (barrier.openWhenSignal) {
      result[barrier.id] = !signals.has(barrier.openWhenSignal);
      continue;
    }
    if (barrier.closedWhenSignal) {
      result[barrier.id] = signals.has(barrier.closedWhenSignal);
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

/** True if this map has anything the player can operate. */
export function hasPuzzle(definition) {
  return getSwitches(definition).length > 0 || getLevers(definition).length > 0;
}

// ---------------------------------------------------------------------------
// Levers, currents and signals (Phase 12)
// ---------------------------------------------------------------------------

/** Every lever a map declares. */
export function getLevers(definition) {
  return (definition && definition.levers) || [];
}

/** The lever on a tile, or null. Levers are FACED, like a sign. */
export function getLeverAt(definition, x, y) {
  return getLevers(definition).find((lever) => lever.x === x && lever.y === y) || null;
}

/** The stored state a lever moves — its own id unless it shares one. */
export function leverStateId(lever) {
  return lever.state || lever.id;
}

/** Every lever state id on a map: what `gameState.puzzles[mapId]` may hold for levers. */
export function getLeverStateIds(definition) {
  return new Set(getLevers(definition).map(leverStateId));
}

/**
 * True if `key` is something this map really stores: a switch-moved barrier or
 * a lever state. The save validator asks this, so nothing else gets in.
 */
export function isPuzzleStateKey(definition, key) {
  return isSwitchDriven(definition, key) || getLeverStateIds(definition).has(key);
}

/** Read a map's stored puzzle record WITHOUT creating one. */
function readStoredState(mapId, state) {
  return (state && state.puzzles && state.puzzles[mapId]) || {};
}

/**
 * Which position each lever state is in: { tide: 'low', diverterA: 'west' }.
 * Nothing stored means the first position.
 */
export function getLeverPositions(definition, state = gameState) {
  const stored = readStoredState(definition.id, state);
  const positions = {};
  for (const lever of getLevers(definition)) {
    const id = leverStateId(lever);
    if (Object.hasOwn(positions, id)) continue;
    positions[id] = lever.positions[stored[id] === true ? 1 : 0];
  }
  return positions;
}

/** Every channel a map's current can flow along: the sources and every valve output. */
export function getChannels(definition) {
  const channels = new Set((definition.flow && definition.flow.sources) || []);
  for (const lever of getLevers(definition)) {
    for (const out of Object.values(lever.outputs || {})) channels.add(out);
  }
  return channels;
}

/**
 * Which channels have current in them.
 *
 * Sources always do. A valve passes its input's current on to the output its
 * position selects — and passes on nothing if its input is dry, which is the
 * whole point of a valve downstream of another. `allPoweredWhen` floods every
 * channel at once (the siphon is off; the current is back at full strength).
 *
 * @param {object} definition
 * @param {Record<string, string>} positions from getLeverPositions()
 * @param {Record<string, boolean>} [conditions]
 * @returns {Set<string>}
 */
export function getPoweredChannels(definition, positions, conditions = {}) {
  const flow = definition.flow;
  if (!flow) return new Set();
  if (flow.allPoweredWhen && conditions[flow.allPoweredWhen]) return getChannels(definition);

  const powered = new Set(flow.sources || []);
  // The valve network is small and acyclic (validated), so passing current on
  // until nothing changes settles in a few rounds.
  let changed = true;
  while (changed) {
    changed = false;
    for (const lever of getLevers(definition)) {
      if (!lever.input || !powered.has(lever.input)) continue;
      const out = (lever.outputs || {})[positions[leverStateId(lever)]];
      if (out && !powered.has(out)) {
        powered.add(out);
        changed = true;
      }
    }
  }
  return powered;
}

/**
 * Every signal holding right now: `<leverState>:<position>` for each lever
 * state and `current:<channel>` for each channel with current in it.
 *
 * @returns {Set<string>}
 */
export function getPuzzleSignals(definition, { state = gameState, conditions = {} } = {}) {
  const signals = new Set();
  if (getLevers(definition).length === 0 && !definition.flow) return signals;

  const positions = getLeverPositions(definition, state);
  for (const [id, position] of Object.entries(positions)) signals.add(`${id}:${position}`);
  for (const channel of getPoweredChannels(definition, positions, conditions)) {
    signals.add(`current:${channel}`);
  }
  return signals;
}

/** Every signal this map could EVER produce — what validation checks references against. */
export function getPossibleSignals(definition) {
  const possible = new Set();
  for (const lever of getLevers(definition)) {
    for (const position of lever.positions || []) possible.add(`${leverStateId(lever)}:${position}`);
  }
  for (const channel of getChannels(definition)) possible.add(`current:${channel}`);
  return possible;
}

/**
 * Pull a lever into its other position.
 *
 * Like a switch, it refuses — changing NOTHING — if that would close a barrier
 * on top of somebody (a bridge vanishing under a person, a floor flooding over
 * one). The maps are validated so no lever stands beside a barrier, which makes
 * this a safety net rather than a rule anyone meets.
 *
 * @returns {{ changed: boolean, position: string|null, opened: string[],
 *             closed: string[], dry: boolean, reason: string|null }}
 *   `dry` is true for a valve that turned with no current reaching it.
 */
export function pressLever(definition, leverId, {
  state = gameState, occupants = [], conditions = {},
} = {}) {
  const refuse = (reason) => ({
    changed: false, position: null, opened: [], closed: [], dry: false, reason,
  });

  const lever = getLevers(definition).find((entry) => entry.id === leverId);
  if (!lever) return refuse('unknownLever');

  const id = leverStateId(lever);
  const current = readStoredState(definition.id, state);
  const next = !(current[id] === true);

  const before = createBarrierState(definition, { conditions, state });
  const trial = { puzzles: { ...(state.puzzles || {}), [definition.id]: { ...current, [id]: next } } };
  const after = createBarrierState(definition, { conditions, state: trial });

  const opened = Object.keys(after).filter((b) => before[b] && !after[b]);
  const closed = Object.keys(after).filter((b) => !before[b] && after[b]);

  const blocked = new Set(occupants.map((who) => `${who.x},${who.y}`));
  const wouldTrap = closed.some((barrierId) => (getBarrier(definition, barrierId).tiles || [])
    .some(([x, y]) => blocked.has(`${x},${y}`)));
  if (wouldTrap) return refuse('occupied');

  getStoredState(definition.id, state)[id] = next;

  // A valve whose input channel is dark turns, but passes nothing on — worth
  // saying, because it is exactly the clue the player needs.
  const dry = Boolean(lever.input)
    && !getPuzzleSignals(definition, { state, conditions }).has(`current:${lever.input}`);

  return {
    changed: true, position: lever.positions[next ? 1 : 0], opened, closed, dry, reason: null,
  };
}

/**
 * Explore every lever setting a player could actually reach on this map.
 *
 * The lever version of `explorePuzzleStates`: a situation is "which position
 * every lever state is in", and from each one the player can pull any lever
 * they can stand next to. Used by the tests to prove a dungeon or a Hall can
 * always be finished and never traps anyone.
 *
 * @param {object} definition
 * @param {{x: number, y: number}} start
 * @param {object} [options]
 * @param {Record<string, boolean>} [options.conditions] world conditions
 * @returns {Array<{ stored: Record<string, boolean>, closed: Record<string, boolean>,
 *                   reachable: Set<string> }>}
 */
export function exploreLeverStates(definition, start, { conditions = {} } = {}) {
  const ids = [...getLeverStateIds(definition)].sort();
  const key = (stored) => ids.map((id) => (stored[id] ? '1' : '0')).join('');
  const initial = Object.fromEntries(ids.map((id) => [id, false]));

  const seen = new Set([key(initial)]);
  const queue = [initial];
  const results = [];

  while (queue.length > 0) {
    const stored = queue.pop();
    const fake = { puzzles: { [definition.id]: { ...stored } } };
    const closed = createBarrierState(definition, { conditions, state: fake });
    const reachable = floodFill(definition, start, closed);
    results.push({ stored, closed, reachable });

    for (const lever of getLevers(definition)) {
      const nextTo = [[0, -1], [0, 1], [-1, 0], [1, 0]]
        .some(([dx, dy]) => reachable.has(`${lever.x + dx},${lever.y + dy}`));
      if (!nextTo) continue;

      const next = { ...stored, [leverStateId(lever)]: !stored[leverStateId(lever)] };
      const nextKey = key(next);
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);
      queue.push(next);
    }
  }
  return results;
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
  const levers = getLevers(definition);
  const glows = definition.glows || [];
  if (barriers.length === 0 && switches.length === 0 && levers.length === 0
    && glows.length === 0 && !definition.flow) return problems;

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

  problems.push(...findLeverProblems(definition, { barrierTiles, inBounds, sourceTile }));
  return problems;
}

/**
 * The Phase 12 half of validation: levers, the current, signal-driven
 * barriers and glows. Every reference has to point at something real, and no
 * lever may stand where using it could close a barrier under the player.
 */
function findLeverProblems(definition, { barrierTiles, inBounds, sourceTile }) {
  const problems = [];
  const levers = getLevers(definition);
  const possible = getPossibleSignals(definition);
  const channels = getChannels(definition);

  const leverIds = new Set();
  const positionsByState = new Map();
  for (const lever of levers) {
    const where = `${definition.id} lever "${lever.id}"`;
    if (!lever.id) problems.push(`${definition.id}: a lever has no id`);
    if (leverIds.has(lever.id)) problems.push(`${where}: duplicate id`);
    leverIds.add(lever.id);
    if (isSwitchDriven(definition, leverStateId(lever)) || getBarrier(definition, leverStateId(lever))) {
      problems.push(`${where}: its state id "${leverStateId(lever)}" is also a barrier's id`);
    }

    const positions = lever.positions;
    if (!Array.isArray(positions) || positions.length !== 2
      || positions.some((p) => typeof p !== 'string' || !p) || positions[0] === positions[1]) {
      problems.push(`${where}: needs exactly two different positions`);
      continue;
    }
    const shared = positionsByState.get(leverStateId(lever));
    if (shared && shared.join() !== positions.join()) {
      problems.push(`${where}: shares state "${leverStateId(lever)}" but not its positions`);
    }
    positionsByState.set(leverStateId(lever), positions);

    if (!inBounds(lever.x, lever.y)) {
      problems.push(`${where}: is outside the map`);
      continue;
    }
    // Faced like a sign, so it must be something you cannot walk onto.
    if (!sourceTile(lever.x, lever.y) || !sourceTile(lever.x, lever.y).solid) {
      problems.push(`${where}: stands on a walkable tile — a lever is faced, not stepped on`);
    }
    for (const [dx, dy] of [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const owner = barrierTiles.get(`${lever.x + dx},${lever.y + dy}`);
      if (owner) {
        problems.push(`${where}: stands next to barrier "${owner}" — someone could be on it when it moves`);
      }
    }

    if (lever.input !== undefined || lever.outputs !== undefined) {
      if (typeof lever.input !== 'string' || !channels.has(lever.input)) {
        problems.push(`${where}: takes current from an unknown channel "${lever.input}"`);
      }
      const outs = lever.outputs || {};
      for (const [position, channel] of Object.entries(outs)) {
        if (!positions.includes(position)) problems.push(`${where}: has an output for unknown position "${position}"`);
        if (typeof channel !== 'string' || !channel) problems.push(`${where}: output "${position}" names no channel`);
      }
    }
    if (lever.dry !== undefined && (typeof lever.dry !== 'string' || !lever.dry || !lever.input)) {
      problems.push(`${where}: "dry" is text for a valve with an input`);
    }
    for (const position of Object.keys(lever.says || {})) {
      if (!positions.includes(position)) problems.push(`${where}: says something for unknown position "${position}"`);
    }
  }

  // The current only flows one way: a channel can never feed itself.
  const feeds = new Map();
  for (const lever of levers) {
    if (!lever.input) continue;
    for (const out of Object.values(lever.outputs || {})) {
      if (!feeds.has(lever.input)) feeds.set(lever.input, new Set());
      feeds.get(lever.input).add(out);
    }
  }
  const visiting = new Set();
  const done = new Set();
  const cycles = (channel) => {
    if (done.has(channel)) return false;
    if (visiting.has(channel)) return true;
    visiting.add(channel);
    const loop = [...(feeds.get(channel) || [])].some(cycles);
    visiting.delete(channel);
    done.add(channel);
    return loop;
  };
  if ([...feeds.keys()].some(cycles)) problems.push(`${definition.id}: the current runs in a circle`);

  for (const barrier of getBarriers(definition)) {
    const where = `${definition.id} barrier "${barrier.id}"`;
    const signal = barrier.openWhenSignal || barrier.closedWhenSignal;
    if (barrier.openWhenSignal && barrier.closedWhenSignal) {
      problems.push(`${where}: follows two signals at once`);
    }
    if (signal && !possible.has(signal)) problems.push(`${where}: follows signal "${signal}", which nothing produces`);
    if (signal && isSwitchDriven(definition, barrier.id)) {
      problems.push(`${where}: is moved by a switch AND follows a signal`);
    }
  }

  for (const [index, glow] of (definition.glows || []).entries()) {
    const where = `${definition.id} glow ${index}`;
    // Lit by a lever's signal OR by a world condition — exactly one of them.
    if ((glow.signal === undefined) === (glow.when === undefined)) {
      problems.push(`${where}: needs exactly one of "signal" or "when"`);
    } else if (glow.signal !== undefined && !possible.has(glow.signal)) {
      problems.push(`${where}: follows signal "${glow.signal}", which nothing produces`);
    } else if (glow.when !== undefined && (typeof glow.when !== 'string' || !glow.when)) {
      problems.push(`${where}: "when" must name a condition`);
    }
    if (!TILE_DEFINITIONS[glow.tile]) problems.push(`${where}: tile "${glow.tile}" is not a known map character`);
    for (const pair of glow.tiles || []) {
      if (!Array.isArray(pair) || !inBounds(pair[0], pair[1])) problems.push(`${where}: has a tile outside the map`);
    }
  }

  return problems;
}
