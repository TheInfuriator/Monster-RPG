/**
 * leverProof.js — proving a lever puzzle can never trap anyone
 * ----------------------------------------------------------------------------
 * A lever puzzle (Mistvault's valves, the Tidal Hall's wheels) is safe when,
 * from EVERY situation a player can get into, they can still walk out of the
 * map and still reach its goal. "Situation" means two things at once:
 *
 *   - which position every lever is in (what PuzzleSystem stores), and
 *   - which patch of floor the player is standing in.
 *
 * The second matters: a player who crossed a bridge and then had it vanish
 * behind them is in a different situation from one who did not, even with
 * the levers in the same positions. So this walks the PRODUCT of the two —
 * every lever setting times every connected patch of floor — starting from
 * where the player comes in, pressing every lever they can stand next to.
 * Then it checks every situation it found, not a handful picked by hand.
 *
 * Deliberately pessimistic: NPCs and ground items are treated as walls (an
 * item stays put until it is picked up; a trainer may never be fought).
 */

import { TILE_DEFINITIONS } from '../../src/data/tiles.js';
import {
  createBarrierState, getBarriers, getLevers, getLeverStateIds, nextLeverState,
} from '../../src/systems/PuzzleSystem.js';

const key = (x, y) => `${x},${y}`;
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];

/**
 * @param {object} definition a map
 * @param {object} options
 * @param {Array<{x: number, y: number, stored?: object}>} options.starts
 *        where the player can come in; `stored` is the lever setting they find
 *        (default: everything in its first position)
 * @param {Record<string, boolean>} [options.conditions] world conditions
 * @returns {{ nodes: Array<{ stored: object, region: Set<string>, next: number[] }> }}
 */
export function exploreSituations(definition, { starts, conditions = {} }) {
  const ids = [...getLeverStateIds(definition)].sort();
  const stateKey = (stored) => ids.map((id) => (stored[id] ? '1' : '0')).join('');
  const rows = definition.tiles;

  const people = new Set([
    ...(definition.npcs || []).map((n) => key(n.x, n.y)),
    ...(definition.interactables || []).filter((e) => e.type === 'item').map((e) => key(e.x, e.y)),
  ]);

  const closedTiles = (stored) => {
    const closed = createBarrierState(definition, {
      conditions, state: { puzzles: { [definition.id]: { ...stored } } },
    });
    const tiles = new Set();
    for (const barrier of getBarriers(definition)) {
      if (closed[barrier.id]) for (const [x, y] of barrier.tiles) tiles.add(key(x, y));
    }
    return tiles;
  };

  const region = (from, blocked) => {
    const walkable = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < rows[0].length
      && !blocked.has(key(x, y)) && !people.has(key(x, y))
      && TILE_DEFINITIONS[rows[y][x]] && !TILE_DEFINITIONS[rows[y][x]].solid;
    const seen = new Set();
    if (!walkable(from.x, from.y)) return seen;
    const queue = [[from.x, from.y]];
    seen.add(key(from.x, from.y));
    while (queue.length > 0) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of SIDES) {
        const k = key(x + dx, y + dy);
        if (!seen.has(k) && walkable(x + dx, y + dy)) {
          seen.add(k);
          queue.push([x + dx, y + dy]);
        }
      }
    }
    return seen;
  };

  const nodes = [];
  const index = new Map();
  const visit = (stored, tile) => {
    const reg = region(tile, closedTiles(stored));
    const id = `${stateKey(stored)}|${[...reg].sort()[0]}`;
    if (index.has(id)) return index.get(id);
    const node = { stored, region: reg, next: [] };
    index.set(id, nodes.length);
    nodes.push(node);
    for (const lever of getLevers(definition)) {
      const stand = SIDES.map(([dx, dy]) => ({ x: lever.x + dx, y: lever.y + dy }))
        .find((t) => reg.has(key(t.x, t.y)));
      if (!stand) continue;
      const next = nextLeverState(definition, lever.id, stored);
      node.next.push(visit(next, stand));
    }
    // Walking about inside the region is free; the region is the node.
    return index.get(id);
  };

  const initial = Object.fromEntries(ids.map((id) => [id, false]));
  for (const start of starts) visit({ ...initial, ...(start.stored || {}) }, start);
  return { nodes };
}

/**
 * From every situation, can a goal still be reached by walking and pressing
 * levers? Returns the situations from which it cannot — empty means proved.
 *
 * @param {ReturnType<typeof exploreSituations>} graph
 * @param {(node) => boolean} isGoal
 */
export function situationsThatCannotReach(graph, isGoal) {
  const { nodes } = graph;
  // Work backwards from every goal situation.
  const back = nodes.map(() => []);
  nodes.forEach((node, i) => node.next.forEach((j) => back[j].push(i)));
  const good = new Set();
  const queue = [];
  nodes.forEach((node, i) => {
    if (isGoal(node)) {
      good.add(i);
      queue.push(i);
    }
  });
  while (queue.length > 0) {
    const i = queue.pop();
    for (const j of back[i]) {
      if (!good.has(j)) {
        good.add(j);
        queue.push(j);
      }
    }
  }
  return nodes.filter((_, i) => !good.has(i));
}

export const tileKey = key;
