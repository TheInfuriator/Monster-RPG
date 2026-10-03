/**
 * ledges.test.js
 * ----------------------------------------------------------------------------
 * One-way ledges (Phase 13): a ledge is solid to walk onto, and stepping
 * toward it in the direction it faces hops the player over it. Tested on a
 * tiny made-up map, then — the important part — over EVERY real map: a ledge
 * is a one-way door, and a one-way door can strand a player in a pocket with
 * no way out. From every tile a player can reach, an exit must still be
 * reachable, ledges and all.
 */

import { describe, it, expect } from 'vitest';
import { TileMap } from '../src/systems/TileMap.js';
import { TILE_DEFINITIONS } from '../src/data/tiles.js';
import { MAPS } from '../src/data/maps/index.js';
import { createBarrierState, getBarriers } from '../src/systems/PuzzleSystem.js';

/**
 *   #####
 *   #...#     L  a ledge facing down at (2, 2)
 *   #.L.#     a player at (2, 1) stepping down lands on (2, 3)
 *   #...#
 *   #.~.#     water at (2, 4): a hop that would land in it is refused
 *   #####
 */
const tiny = {
  id: 'ledgeTest',
  name: 'Ledge test',
  tiles: ['#####', '#...#', '#.L.#', '#...#', '#.L.#', '#.~.#', '#####'],
  spawnPoints: { default: { x: 1, y: 1, facing: 'down' } },
};

describe('a ledge', () => {
  const map = new TileMap(tiny);

  it('is solid to walk onto', () => {
    expect(TILE_DEFINITIONS.L.solid).toBe(true);
    expect(TILE_DEFINITIONS.L.ledge).toBe('down');
    expect(map.isWalkable(2, 2)).toBe(false);
  });

  it('is hopped going the way it faces, landing two tiles on', () => {
    expect(map.getLedgeHop(2, 1, 'down')).toEqual({ x: 2, y: 3 });
  });

  it('cannot be climbed the wrong way, or hopped sideways', () => {
    expect(map.getLedgeHop(2, 3, 'up')).toBeNull();
    expect(map.getLedgeHop(1, 2, 'right')).toBeNull();
    expect(map.getLedgeHop(3, 2, 'left')).toBeNull();
  });

  it('refuses a hop that would land somewhere you cannot stand', () => {
    expect(map.getLedgeHop(2, 3, 'down')).toBeNull();   // into the water
  });

  it('is not a hop when there is no ledge in the way', () => {
    expect(map.getLedgeHop(1, 1, 'down')).toBeNull();
  });

  it('never lands past the edge of the map', () => {
    const edge = new TileMap({ id: 'edge', tiles: ['...', '.L.'], spawnPoints: { default: { x: 0, y: 0 } } });
    expect(edge.getLedgeHop(1, 0, 'down')).toBeNull();
  });
});

/**
 * Where a player can go from a tile on a map: walking, and hopping ledges in
 * their one direction. Closed barriers are walls; people and items are not
 * counted (they never sit on a ledge's landing — the map tests check that).
 */
function neighbours(map, x, y) {
  const out = [];
  for (const [dx, dy, direction] of [[0, -1, 'up'], [0, 1, 'down'], [-1, 0, 'left'], [1, 0, 'right']]) {
    if (map.isWalkable(x + dx, y + dy)) out.push([x + dx, y + dy]);
    const hop = map.getLedgeHop(x, y, direction);
    if (hop) out.push([hop.x, hop.y]);
  }
  return out;
}

function reachableFrom(map, starts) {
  const seen = new Set(starts.map(([x, y]) => `${x},${y}`));
  const queue = [...starts];
  while (queue.length > 0) {
    const [x, y] = queue.pop();
    for (const [nx, ny] of neighbours(map, x, y)) {
      const key = `${nx},${ny}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}

/** Tiles (of `among`) from which some exit can still be reached. */
function canStillLeave(map, exits, among) {
  // Walk the graph backwards from every exit.
  const back = new Map();
  for (const key of among) {
    const [x, y] = key.split(',').map(Number);
    for (const [nx, ny] of neighbours(map, x, y)) {
      const to = `${nx},${ny}`;
      if (!back.has(to)) back.set(to, []);
      back.get(to).push(key);
    }
  }
  const good = new Set(exits.map((e) => `${e.x},${e.y}`).filter((k) => among.has(k)));
  const queue = [...good];
  while (queue.length > 0) {
    const key = queue.pop();
    for (const from of back.get(key) || []) {
      if (!good.has(from)) {
        good.add(from);
        queue.push(from);
      }
    }
  }
  return good;
}

/**
 * Every tile a player can reach on a map (from any spawn) from which no exit
 * can be reached any more — the tiles a ledge would strand them on.
 *
 * @param {object} definition a map
 * @param {Record<string, boolean>} closed which barriers are shut
 * @returns {string[]} 'x,y' keys; empty when nobody can be stranded
 */
function findStrandedTiles(definition, closed) {
  const map = new TileMap(definition);
  map.setBarrierState(closed);
  const starts = Object.values(definition.spawnPoints).map((s) => [s.x, s.y]);
  const reach = reachableFrom(map, starts);
  const good = canStillLeave(map, definition.exits, reach);
  return [...reach].filter((k) => !good.has(k));
}

describe('the strand check itself', () => {
  //   #######
  //   #.....#   a pocket: the ledge row at y=2 drops into a walled pit
  //   #LLLLL#   (y=3) whose only way out is... nothing. The checker must see it.
  //   #.....#
  //   #######
  const pit = {
    id: 'pit', name: 'pit',
    tiles: ['###.###', '#.....#', '#LLLLL#', '#.....#', '#######'],
    spawnPoints: { default: { x: 3, y: 1 } },
    exits: [{ x: 3, y: 0, to: 'nowhere', spawn: 'default' }],
  };
  it('finds a pit a ledge drops you into', () => {
    expect(findStrandedTiles(pit, {}).sort()).toEqual(['1,3', '2,3', '3,3', '4,3', '5,3']);
  });
  it('passes the same pit once a path climbs back out of it', () => {
    const stairs = { ...pit, tiles: ['###.###', '#.....#', '#LLLL.#', '#.....#', '#######'] };
    expect(findStrandedTiles(stairs, {})).toEqual([]);
  });
});

describe('ledges never strand anyone, on any map', () => {
  const withLedges = Object.entries(MAPS)
    .filter(([, definition]) => definition.tiles.some((row) => [...row].some((c) => TILE_DEFINITIONS[c]?.ledge)));

  it('the check has real maps to look at', () => {
    expect(withLedges.length).toBeGreaterThan(0);
  });

  for (const [id, definition] of withLedges) {
    it(`${id}, as found: from every reachable tile, an exit is still reachable`, () => {
      expect(findStrandedTiles(definition, createBarrierState(definition, { state: { puzzles: {} } }))).toEqual([]);
    });

    it(`${id}, with every barrier open: the same`, () => {
      const open = Object.fromEntries(getBarriers(definition).map((b) => [b.id, false]));
      expect(findStrandedTiles(definition, open)).toEqual([]);
    });

    it(`${id}: every ledge can actually be hopped from somewhere`, () => {
      const map = new TileMap(definition);
      map.setBarrierState(Object.fromEntries(getBarriers(definition).map((b) => [b.id, false])));
      definition.tiles.forEach((row, y) => [...row].forEach((c, x) => {
        const ledge = TILE_DEFINITIONS[c]?.ledge;
        if (!ledge) return;
        const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[ledge];
        expect(map.getLedgeHop(x - dx, y - dy, ledge), `ledge at ${x},${y}`).not.toBeNull();
      }));
    });

    it(`${id}: every ledge lands on open ground — no person, item or ambush on the landing`, () => {
      const taken = new Set([
        ...(definition.npcs || []).map((n) => `${n.x},${n.y}`),
        ...(definition.interactables || []).map((e) => `${e.x},${e.y}`),
      ]);
      // A wanderer could step onto a landing, so none may roam near one.
      const wanderers = (definition.npcs || []).filter((n) => n.movement === 'wander');
      definition.tiles.forEach((row, y) => [...row].forEach((c, x) => {
        const ledge = TILE_DEFINITIONS[c]?.ledge;
        if (!ledge) return;
        const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[ledge];
        const land = [x + dx, y + dy];
        const landTile = TILE_DEFINITIONS[definition.tiles[land[1]][land[0]]];
        expect(taken.has(`${land[0]},${land[1]}`), `landing ${land} is occupied`).toBe(false);
        expect(Boolean(landTile.encounter), `landing ${land} is encounter ground`).toBe(false);
        for (const npc of wanderers) {
          const near = Math.abs(npc.x - land[0]) + Math.abs(npc.y - land[1]) <= (npc.wanderRadius || 0);
          expect(near, `${npc.id} wanders onto landing ${land}`).toBe(false);
        }
      }));
    });
  }
});
