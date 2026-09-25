/**
 * restorePosition.test.js
 * ----------------------------------------------------------------------------
 * Where a loaded player is allowed to stand.
 *
 * The saved tile is checked against the world exactly as it will be rebuilt
 * — hedges and gates from flags, Sigils and switches; every NPC back on their
 * home tile; ground items still lying where they were — and when it fails,
 * the player is placed by a fixed chain of fallbacks. Never in a wall, never
 * inside a person, never on a shut hedge.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { createNewGameState } from '../src/core/GameState.js';
import {
  resolveRestorePosition, isSafeStandingTile, buildMapAsSaved,
} from '../src/save/RestorePosition.js';
import { MAPS, STARTING_MAP_ID } from '../src/data/maps/index.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';

function stateAt(mapId, x, y, facing = 'left') {
  const state = createNewGameState();
  state.location = { mapId, x, y, facing };
  return state;
}

describe('the normal case', () => {
  it('puts the player exactly where they saved, facing the same way', () => {
    const result = resolveRestorePosition(stateAt('route1', 10, 20, 'right'));
    expect(result).toEqual({ mapId: 'route1', x: 10, y: 20, facing: 'right', source: 'saved', warnings: [] });
  });

  it('uses a map\'s own spawn when no tile was saved', () => {
    const result = resolveRestorePosition(stateAt('route1', null, null));
    const spawn = MAPS.route1.spawnPoints.default;
    expect(result).toMatchObject({ mapId: 'route1', x: spawn.x, y: spawn.y, facing: spawn.facing, source: 'spawn' });
    expect(result.warnings).toEqual([]);
  });

  it('uses the recovery spawn when the saved map IS the recovery map', () => {
    const state = stateAt('thistlewoodMendersHall', null, null);
    state.respawn = { mapId: 'thistlewoodMendersHall', spawn: 'default' };
    const result = resolveRestorePosition(state);
    expect(result.source).toBe('spawn');
    expect(result.mapId).toBe('thistlewoodMendersHall');
  });
});

describe('the world as it will be rebuilt', () => {
  it('refuses a wall', () => {
    const state = stateAt('verdantHall', 5, 2); // solid hedge
    const result = resolveRestorePosition(state);
    expect(result.source).toBe('spawn');
    expect(result.warnings[0]).toMatch(/cannot be stood on/);
  });

  it('refuses an NPC\'s home tile: they will be standing there after the load', () => {
    // A villager who wandered off, or a trainer who walked over to challenge
    // the player, is put back on their own tile when the map loads.
    for (const [mapId, npcId] of [['route1', 'route1Treader'], ['route1', 'wanderingKid'], ['emberhollow', 'townChild']]) {
      const npc = MAPS[mapId].npcs.find((entry) => entry.id === npcId);
      const result = resolveRestorePosition(stateAt(mapId, npc.x, npc.y));
      expect(result.source, `${npcId}'s tile was accepted`).not.toBe('saved');
      expect(result.x === npc.x && result.y === npc.y).toBe(false);
    }
  });

  it('refuses the tile of an item still on the ground, allows it once picked up', () => {
    const item = MAPS.route1.interactables.find((entry) => entry.type === 'item');
    const state = stateAt('route1', item.x, item.y);
    expect(resolveRestorePosition(state).source).not.toBe('saved');

    state.flags[item.flag] = true;
    expect(resolveRestorePosition(state).source).toBe('saved');
  });

  it('refuses Route 1\'s gate while it is shut, allows it once it is open', () => {
    const gate = MAPS.route1.barriers.find((b) => b.id === 'route1Gate');
    const [x, y] = gate.tiles[0];
    const state = stateAt('route1', x, y);
    expect(resolveRestorePosition(state).source).not.toBe('saved');

    state.flags.route1GateOpen = true;
    expect(resolveRestorePosition(state).source).toBe('saved');
  });

  describe('the Verdant Hall: puzzle state is applied before the player is placed', () => {
    const hedge = (id) => MAPS.verdantHall.barriers.find((b) => b.id === id).tiles[0];

    it('a hedge that is shut in the save cannot be stood on', () => {
      const [x, y] = hedge('hedgeEast');
      const state = stateAt('verdantHall', x, y);
      state.puzzles.verdantHall = { hedgeEast: true };
      const result = resolveRestorePosition(state);
      expect(result.source).toBe('spawn');
      expect(buildMapAsSaved('verdantHall', state).isWalkable(result.x, result.y)).toBe(true);
    });

    it('a hedge the switches opened can', () => {
      const [x, y] = hedge('hedgeEast');
      const state = stateAt('verdantHall', x, y);
      state.puzzles.verdantHall = { hedgeEast: false };
      expect(resolveRestorePosition(state).source).toBe('saved');
    });

    it('with the Sigil every hedge stands open, whatever the switches say', () => {
      const [x, y] = hedge('hedgeNorth');
      const state = stateAt('verdantHall', x, y);
      state.puzzles.verdantHall = { hedgeNorth: true };
      expect(resolveRestorePosition(state).source).toBe('spawn');

      awardBadge('verdantSigil', state);
      expect(resolveRestorePosition(state).source).toBe('saved');
    });

    it('no reachable standing tile in the Hall is ever refused for a sound save', () => {
      // Every walkable, unoccupied tile with every hedge open.
      const state = createNewGameState();
      awardBadge('verdantSigil', state);
      state.flags.pickedUpVerdantPotion = true;
      const map = buildMapAsSaved('verdantHall', state);
      for (let y = 0; y < map.height; y += 1) {
        for (let x = 0; x < map.width; x += 1) {
          const safe = isSafeStandingTile(map, x, y, state);
          const npc = MAPS.verdantHall.npcs.some((n) => n.x === x && n.y === y);
          expect(safe).toBe(map.isWalkable(x, y) && !npc);
        }
      }
    });
  });
});

describe('the fallback chain', () => {
  afterEach(() => {
    delete MAPS.brokenForTest;
  });

  // A map whose every spawn point is inside a wall, so step 2 must fail.
  const addBrokenMap = () => {
    MAPS.brokenForTest = {
      id: 'brokenForTest',
      name: 'Broken',
      tiles: ['___', '_._', '___'],
      spawnPoints: { default: { x: 0, y: 0, facing: 'down' } },
      exits: [],
      npcs: [],
      interactables: [],
    };
  };

  it('falls to the recovery point when the saved map has no safe spawn', () => {
    addBrokenMap();
    const state = stateAt('brokenForTest', 0, 0);
    state.respawn = { mapId: 'thistlewoodMendersHall', spawn: 'default' };
    const result = resolveRestorePosition(state);
    expect(result.source).toBe('recovery');
    expect(result.mapId).toBe('thistlewoodMendersHall');
    expect(result.warnings).toHaveLength(2);
  });

  it('falls to the start of the game when even the recovery point fails', () => {
    addBrokenMap();
    const state = stateAt('brokenForTest', 0, 0);
    state.respawn = { mapId: 'brokenForTest', spawn: 'default' };
    const result = resolveRestorePosition(state);
    expect(result.source).toBe('start');
    expect(result.mapId).toBe(STARTING_MAP_ID);
  });

  it('the start of the game is itself always a safe tile', () => {
    const state = createNewGameState();
    const spawn = MAPS[STARTING_MAP_ID].spawnPoints.default;
    expect(isSafeStandingTile(buildMapAsSaved(STARTING_MAP_ID, state), spawn.x, spawn.y, state)).toBe(true);
  });

  it('every map\'s default spawn is safe on a new game', () => {
    const state = createNewGameState();
    for (const [id, definition] of Object.entries(MAPS)) {
      const spawn = definition.spawnPoints.default;
      expect(isSafeStandingTile(buildMapAsSaved(id, state), spawn.x, spawn.y, state), id).toBe(true);
    }
  });

  it('an unknown map (already caught by validation) still resolves safely', () => {
    const state = stateAt('atlantis', 3, 3);
    expect(resolveRestorePosition(state).source).toBe('recovery');
  });

  it('never returns a tile that cannot be stood on', () => {
    for (const [mapId, x, y] of [['route1', 0, 0], ['verdantHall', 3, 13], ['thistlewood', -1, 5], ['emberhollow', 9, 10]]) {
      const state = stateAt(mapId, x, y);
      const result = resolveRestorePosition(state);
      const map = buildMapAsSaved(result.mapId, state);
      expect(isSafeStandingTile(map, result.x, result.y, state), `${mapId} ${x},${y}`).toBe(true);
    }
  });
});
