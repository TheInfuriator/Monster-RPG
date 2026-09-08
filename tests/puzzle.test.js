/**
 * puzzle.test.js
 * ----------------------------------------------------------------------------
 * Barriers, root switches, and the promise that the Verdant Hall can never lock
 * a player in.
 *
 * The important tests here are the last block. Rather than checking a few
 * hand-picked situations, they WALK EVERY SITUATION the player could reach —
 * every combination of open and closed hedges that any order of switch presses
 * can produce — and assert that Fern is reachable from at least one of them and
 * that the door is reachable from ALL of them. That is a proof rather than a
 * spot check, and it will keep being one if the Hall is ever redesigned.
 */

import { describe, it, expect } from 'vitest';
import {
  getBarriers, getSwitches, getBarrier, getSwitchAt,
  createBarrierState, pressSwitch, resetPuzzle, hasPuzzle,
  floodFill, explorePuzzleStates, findPuzzleProblems,
} from '../src/systems/PuzzleSystem.js';
import { TileMap } from '../src/systems/TileMap.js';
import { MAPS } from '../src/data/maps/index.js';
import { verdantHall } from '../src/data/maps/verdantHall.js';
import { route1 } from '../src/data/maps/route1.js';
import { createNewGameState } from '../src/core/GameState.js';

const freshState = () => createNewGameState();

/**
 * A tiny map to test the mechanism itself on, so these tests keep meaning the
 * same thing even if the Verdant Hall is redesigned.
 *
 *   ####     #  wall
 *   #..#     .  floor
 *   #..#     the barrier stands at (2, 2); the switch is at (1, 3)
 *   #..#
 *   ####
 */
const testMap = {
  id: 'testPuzzle',
  name: 'Test',
  tiles: [
    '####',
    '#..#',
    '#..#',
    '#..#',
    '####',
  ],
  barriers: [
    { id: 'gateA', name: 'gate A', tile: '#', tiles: [[2, 2]], closed: true },
    { id: 'gateB', name: 'gate B', tile: '#', tiles: [[1, 2]], closed: false },
  ],
  switches: [
    { id: 'lever', name: 'the lever', x: 1, y: 3, retract: 'gateA', extend: 'gateB' },
  ],
  spawnPoints: { default: { x: 1, y: 1, facing: 'down' } },
};

// ---------------------------------------------------------------------------
// Reading a map's barriers
// ---------------------------------------------------------------------------

describe('reading barriers and switches', () => {
  it('returns an empty list for a map with neither', () => {
    expect(getBarriers(MAPS.playerHouse)).toEqual([]);
    expect(getSwitches(MAPS.playerHouse)).toEqual([]);
    expect(hasPuzzle(MAPS.playerHouse)).toBe(false);
  });

  it('survives being handed nothing at all', () => {
    expect(getBarriers(null)).toEqual([]);
    expect(getSwitches(undefined)).toEqual([]);
  });

  it('finds a barrier by id, and null for one that does not exist', () => {
    expect(getBarrier(verdantHall, 'hedgeNorth').id).toBe('hedgeNorth');
    expect(getBarrier(verdantHall, 'nope')).toBeNull();
  });

  it('finds the switch standing on a tile', () => {
    expect(getSwitchAt(verdantHall, 2, 5).id).toBe('rootWest');
    expect(getSwitchAt(verdantHall, 2, 6)).toBeNull();
  });

  it('knows which maps have a puzzle and which only have a gate', () => {
    expect(hasPuzzle(verdantHall)).toBe(true);
    // Route 1's gate is opened by a flag, not by a switch.
    expect(hasPuzzle(route1)).toBe(false);
    expect(getBarriers(route1)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('working out which barriers are closed', () => {
  it('starts every barrier as its map declares it', () => {
    const state = createBarrierState(testMap, { state: freshState() });
    expect(state).toEqual({ gateA: true, gateB: false });
  });

  it('is an empty object for a map with no barriers', () => {
    expect(createBarrierState(MAPS.playerHouse, { state: freshState() })).toEqual({});
  });

  it('opens a flag-driven barrier the moment its condition holds', () => {
    const state = freshState();
    expect(createBarrierState(route1, { conditions: {}, state }).route1Gate).toBe(true);
    expect(
      createBarrierState(route1, { conditions: { route1GateOpen: true }, state }).route1Gate
    ).toBe(false);
  });

  it('keeps a flag-driven barrier open once the flag is set, with nothing stored', () => {
    const state = freshState();
    const conditions = { route1GateOpen: true };

    createBarrierState(route1, { conditions, state });
    // No switch state is written for a flag-driven barrier: there is nothing to
    // get out of step with, which is why the gate cannot "open twice".
    expect(state.puzzles.route1 ?? {}).toEqual({});
    expect(createBarrierState(route1, { conditions, state }).route1Gate).toBe(false);
  });

  it('lets an openWhen condition override whatever the switches did', () => {
    const state = freshState();
    // Tangle the hedges first.
    pressSwitch(verdantHall, 'rootSouth', { state });
    expect(createBarrierState(verdantHall, { state }).hedgeEast).toBe(true);

    // The Sigil stands every hedge open regardless.
    const after = createBarrierState(verdantHall, {
      conditions: { 'badge:verdantSigil': true },
      state,
    });
    expect(after).toEqual({ hedgeWest: false, hedgeEast: false, hedgeNorth: false });
  });

  it('keeps each map\'s state separate', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootSouth', { state });

    expect(state.puzzles.verdantHall).toBeDefined();
    expect(state.puzzles.testPuzzle).toBeUndefined();
    expect(createBarrierState(testMap, { state })).toEqual({ gateA: true, gateB: false });
  });
});

// ---------------------------------------------------------------------------
// Switches
// ---------------------------------------------------------------------------

describe('pressing a switch', () => {
  it('retracts one barrier and extends another', () => {
    const state = freshState();
    const outcome = pressSwitch(testMap, 'lever', { state });

    expect(outcome).toEqual({
      changed: true, retracted: 'gateA', extended: 'gateB', reason: null,
    });
    expect(createBarrierState(testMap, { state })).toEqual({ gateA: false, gateB: true });
  });

  it('leaves every other barrier alone', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootWest', { state });

    const after = createBarrierState(verdantHall, { state });
    expect(after.hedgeEast).toBe(false);   // retracted
    expect(after.hedgeNorth).toBe(true);   // extended
    expect(after.hedgeWest).toBe(true);    // untouched, still as declared
  });

  it('is deterministic — pressing the same switch twice lands in the same place', () => {
    const once = freshState();
    const twice = freshState();

    pressSwitch(testMap, 'lever', { state: once });
    pressSwitch(testMap, 'lever', { state: twice });
    pressSwitch(testMap, 'lever', { state: twice });

    expect(createBarrierState(testMap, { state: twice }))
      .toEqual(createBarrierState(testMap, { state: once }));
  });

  it('refuses an unknown switch and changes nothing', () => {
    const state = freshState();
    const outcome = pressSwitch(testMap, 'nope', { state });

    expect(outcome.changed).toBe(false);
    expect(outcome.reason).toBe('unknownSwitch');
    expect(createBarrierState(testMap, { state })).toEqual({ gateA: true, gateB: false });
  });

  it('refuses a switch pointing at a barrier that does not exist', () => {
    const broken = {
      ...testMap,
      switches: [{ id: 'lever', x: 1, y: 3, retract: 'ghost', extend: 'gateB' }],
    };
    expect(pressSwitch(broken, 'lever', { state: freshState() }).reason)
      .toBe('unknownBarrier');
  });

  it('NEVER closes a barrier on top of somebody', () => {
    const state = freshState();
    // Somebody is standing exactly where gateB would grow.
    const outcome = pressSwitch(testMap, 'lever', {
      state,
      occupants: [{ x: 1, y: 2 }],
    });

    expect(outcome.changed).toBe(false);
    expect(outcome.reason).toBe('occupied');
    // All or nothing: the retraction does not happen either.
    expect(createBarrierState(testMap, { state })).toEqual({ gateA: true, gateB: false });
  });

  it('does not mind somebody standing where a barrier is RETRACTING', () => {
    const open = {
      ...testMap,
      barriers: [
        { id: 'gateA', tile: '#', tiles: [[2, 2]], closed: false },
        { id: 'gateB', tile: '#', tiles: [[1, 2]], closed: false },
      ],
    };
    // Standing on gateA's tile while it draws back is fine — it is leaving.
    expect(pressSwitch(open, 'lever', {
      state: freshState(),
      occupants: [{ x: 2, y: 2 }],
    }).changed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe('resetting a puzzle', () => {
  it('puts every switch-driven barrier back as declared', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootSouth', { state });
    pressSwitch(verdantHall, 'rootWest', { state });

    expect(resetPuzzle(verdantHall, { state })).toBe(verdantHall.barriers.length);
    expect(createBarrierState(verdantHall, { state }))
      .toEqual({ hedgeWest: true, hedgeEast: true, hedgeNorth: true });
  });

  it('is atomic — one call, every barrier, or none', () => {
    const state = freshState();
    pressSwitch(testMap, 'lever', { state });
    resetPuzzle(testMap, { state });
    expect(createBarrierState(testMap, { state })).toEqual({ gateA: true, gateB: false });
  });

  it('does nothing on a map with no barriers', () => {
    expect(resetPuzzle(MAPS.playerHouse, { state: freshState() })).toBe(0);
  });

  it('never touches a flag-driven barrier', () => {
    const state = freshState();
    const conditions = { route1GateOpen: true };

    expect(resetPuzzle(route1, { state })).toBe(0);
    // Resetting cannot shut a gate the player has already had opened for them.
    expect(createBarrierState(route1, { conditions, state }).route1Gate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Barriers and collision agree
// ---------------------------------------------------------------------------

describe('a barrier blocks exactly what it looks like it blocks', () => {
  it('makes its tiles unwalkable while closed and walkable while open', () => {
    const map = new TileMap(verdantHall);

    map.setBarrierState({ hedgeNorth: true });
    expect(map.isWalkable(10, 6)).toBe(false);
    expect(map.isBlockedByBarrier(10, 6)).toBe(true);

    map.setBarrierState({ hedgeNorth: false });
    expect(map.isWalkable(10, 6)).toBe(true);
    expect(map.isBlockedByBarrier(10, 6)).toBe(false);
  });

  it('leaves tiles no barrier covers exactly as they were', () => {
    const map = new TileMap(verdantHall);
    map.setBarrierState({ hedgeNorth: true, hedgeEast: true, hedgeWest: true });

    expect(map.isWalkable(10, 7)).toBe(true);    // the lane behind the hedge
    expect(map.isWalkable(4, 4)).toBe(false);    // ordinary hedge, always solid
  });

  it('names the barrier standing on a tile', () => {
    const map = new TileMap(verdantHall);
    expect(map.getBarrierIdAt(17, 12)).toBe('hedgeEast');
    expect(map.getBarrierIdAt(10, 16)).toBeNull();
  });

  it('ignores a barrier id the map does not have', () => {
    const map = new TileMap(verdantHall);
    map.setBarrierState({ notAThing: true });
    expect(map.isBarrierClosed('notAThing')).toBe(false);
  });

  it('starts closed, so a map read for a spawn point never shows a way through', () => {
    // TileMap is built in several places without game state — a transition
    // reading a spawn point, a test. The safe default is "as declared".
    expect(new TileMap(verdantHall).isWalkable(10, 6)).toBe(false);
    expect(new TileMap(route1).isWalkable(10, 1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The Verdant Hall specifically: solvable, and never a trap
// ---------------------------------------------------------------------------

describe('the Verdant Hall can be solved and can never trap anyone', () => {
  const DOOR = '10,17';
  const FERN = '10,4';
  const START = { x: 10, y: 16 };
  const allShut = createBarrierState(verdantHall, { state: freshState() });

  it('starts with Fern unreachable — there would be no puzzle otherwise', () => {
    expect(floodFill(verdantHall, START, allShut).has(FERN)).toBe(false);
  });

  it('opens the way to Fern with the east and north hedges both back', () => {
    const solved = { hedgeWest: true, hedgeEast: false, hedgeNorth: false };
    expect(floodFill(verdantHall, START, solved).has(FERN)).toBe(true);
  });

  it('needs BOTH: neither hedge alone is enough', () => {
    expect(floodFill(verdantHall, START, {
      hedgeWest: true, hedgeEast: false, hedgeNorth: true,
    }).has(FERN)).toBe(false);

    expect(floodFill(verdantHall, START, {
      hedgeWest: true, hedgeEast: true, hedgeNorth: false,
    }).has(FERN)).toBe(false);
  });

  it('can be solved by pressing the west root and then the east root', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootWest', { state });
    pressSwitch(verdantHall, 'rootEast', { state });

    const closed = createBarrierState(verdantHall, { state });
    expect(floodFill(verdantHall, START, closed).has(FERN)).toBe(true);
  });

  it('is not solved by pressing them in the wrong order', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootEast', { state });
    pressSwitch(verdantHall, 'rootWest', { state });

    const closed = createBarrierState(verdantHall, { state });
    expect(floodFill(verdantHall, START, closed).has(FERN)).toBe(false);
  });

  it('opens the west pocket, and only the west pocket, with the porch root', () => {
    const state = freshState();
    pressSwitch(verdantHall, 'rootSouth', { state });

    const reachable = floodFill(verdantHall, START, createBarrierState(verdantHall, { state }));
    expect(reachable.has('6,13')).toBe(true);    // the Super Potion
    expect(reachable.has(FERN)).toBe(false);
  });

  // --- The proof ---------------------------------------------------------
  const states = explorePuzzleStates(verdantHall, START, allShut);

  it('reaches more than one configuration, so this proof is not vacuous', () => {
    expect(states.length).toBeGreaterThan(1);
  });

  it('can reach Fern from at least one reachable configuration', () => {
    expect(states.some(({ reachable }) => reachable.has(FERN))).toBe(true);
  });

  it('can ALWAYS reach the door, from every configuration the player can produce', () => {
    for (const { closed, reachable } of states) {
      expect(
        reachable.has(DOOR),
        `the door is unreachable with ${JSON.stringify(closed)}`
      ).toBe(true);
    }
  });

  it('can ALWAYS reach every root switch, so the puzzle is never stuck', () => {
    for (const { closed, reachable } of states) {
      for (const entry of getSwitches(verdantHall)) {
        expect(
          reachable.has(`${entry.x},${entry.y}`),
          `${entry.id} is unreachable with ${JSON.stringify(closed)}`
        ).toBe(true);
      }
    }
  });

  it('can always get back to a solved configuration, whatever has been pressed', () => {
    // The strongest statement of "never unsolvable": from EVERY situation the
    // player can reach, some further sequence of presses reaches Fern.
    for (const { closed } of states) {
      const onward = explorePuzzleStates(verdantHall, START, closed);
      expect(
        onward.some(({ reachable }) => reachable.has(FERN)),
        `no way on to Fern from ${JSON.stringify(closed)}`
      ).toBe(true);
    }
  });

  it('never lets a hedge close on a Gardener or the Leader', () => {
    // Every NPC tile, against every barrier tile. The occupancy guard in
    // pressSwitch is a safety net; this is what makes it never fire.
    const barrierTiles = new Set(
      getBarriers(verdantHall).flatMap((b) => b.tiles.map(([x, y]) => `${x},${y}`))
    );
    for (const npc of verdantHall.npcs) {
      expect(
        barrierTiles.has(`${npc.x},${npc.y}`),
        `${npc.id} stands where a hedge can grow`
      ).toBe(false);
    }
  });

  it('leaves every hedge open for good once the Sigil is won', () => {
    const state = freshState();
    const closed = createBarrierState(verdantHall, {
      conditions: { 'badge:verdantSigil': true },
      state,
    });
    const reachable = floodFill(verdantHall, START, closed);

    expect(reachable.has(FERN)).toBe(true);
    expect(reachable.has(DOOR)).toBe(true);
    expect(reachable.has('6,13')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Route 1's gate
// ---------------------------------------------------------------------------

describe('the Route 1 gate', () => {
  const SOUTH = { x: 10, y: 28 };
  const NORTH_EXIT = '10,0';

  it('blocks the way north until the flag is set', () => {
    const state = freshState();
    const shut = createBarrierState(route1, { conditions: {}, state });
    expect(floodFill(route1, SOUTH, shut).has(NORTH_EXIT)).toBe(false);
  });

  it('opens the way north once the flag is set', () => {
    const state = freshState();
    const open = createBarrierState(route1, { conditions: { route1GateOpen: true }, state });
    expect(floodFill(route1, SOUTH, open).has(NORTH_EXIT)).toBe(true);
  });

  it('stands on walkable path, so opening it really opens something', () => {
    const map = new TileMap(route1);
    for (const [x, y] of getBarrier(route1, 'route1Gate').tiles) {
      map.setBarrierState({ route1Gate: false });
      expect(map.isWalkable(x, y), `(${x}, ${y}) is solid underneath`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation, run over every map automatically
// ---------------------------------------------------------------------------

describe('every map\'s barriers and switches are sound', () => {
  for (const [id, definition] of Object.entries(MAPS)) {
    it(`${id} has no barrier or switch problems`, () => {
      expect(findPuzzleProblems(definition)).toEqual([]);
    });
  }
});

describe('puzzle validation catches mistakes', () => {
  const broken = (changes) => findPuzzleProblems({ ...testMap, ...changes }).join(' ');

  it('rejects a barrier standing on a solid tile', () => {
    expect(broken({
      barriers: [{ id: 'gateA', tile: '#', tiles: [[0, 0]] }],
      switches: [],
    })).toMatch(/solid in the map source/);
  });

  it('rejects a barrier drawn as a tile that is not solid', () => {
    expect(broken({
      barriers: [{ id: 'gateA', tile: '.', tiles: [[2, 2]] }],
      switches: [],
    })).toMatch(/not solid/);
  });

  it('rejects a barrier drawn as a character that does not exist', () => {
    expect(broken({
      barriers: [{ id: 'gateA', tile: 'Z', tiles: [[2, 2]] }],
      switches: [],
    })).toMatch(/not a known map character/);
  });

  it('rejects a barrier outside the map', () => {
    expect(broken({
      barriers: [{ id: 'gateA', tile: '#', tiles: [[99, 99]] }],
      switches: [],
    })).toMatch(/outside the map/);
  });

  it('rejects two barriers on the same tile', () => {
    expect(broken({
      barriers: [
        { id: 'gateA', tile: '#', tiles: [[2, 2]] },
        { id: 'gateB', tile: '#', tiles: [[2, 2]] },
      ],
      switches: [],
    })).toMatch(/also covered by/);
  });

  it('rejects duplicate barrier ids', () => {
    expect(broken({
      barriers: [
        { id: 'gateA', tile: '#', tiles: [[2, 2]] },
        { id: 'gateA', tile: '#', tiles: [[1, 2]] },
      ],
      switches: [],
    })).toMatch(/duplicate id/);
  });

  it('rejects a switch pointing at a barrier that does not exist', () => {
    expect(broken({
      switches: [{ id: 'lever', x: 1, y: 3, retract: 'ghost', extend: 'gateB' }],
    })).toMatch(/retracts unknown barrier/);
  });

  it('rejects a switch that does nothing', () => {
    expect(broken({ switches: [{ id: 'lever', x: 1, y: 3 }] })).toMatch(/does nothing/);
  });

  it('rejects a switch that retracts and extends the same barrier', () => {
    expect(broken({
      switches: [{ id: 'lever', x: 1, y: 3, retract: 'gateA', extend: 'gateA' }],
    })).toMatch(/retracts and extends the same/);
  });

  it('rejects a switch on a solid tile, which could never be stepped on', () => {
    expect(broken({
      switches: [{ id: 'lever', x: 0, y: 0, retract: 'gateA', extend: 'gateB' }],
    })).toMatch(/stands on a solid tile/);
  });

  it('rejects a switch standing under a barrier that could seal it away', () => {
    expect(broken({
      switches: [{ id: 'lever', x: 2, y: 2, retract: 'gateA', extend: 'gateB' }],
    })).toMatch(/stands on barrier/);
  });

  it('rejects an NPC living on a barrier tile', () => {
    expect(broken({
      npcs: [{ id: 'victim', x: 2, y: 2, dialogue: 'hello' }],
    })).toMatch(/stands on barrier/);
  });

  it('rejects a spawn point inside a barrier', () => {
    expect(broken({
      spawnPoints: { default: { x: 2, y: 2, facing: 'down' } },
    })).toMatch(/sits on barrier/);
  });

  it('passes a sound map', () => {
    expect(findPuzzleProblems(testMap)).toEqual([]);
  });
});
