/**
 * RestorePosition.js
 * ----------------------------------------------------------------------------
 * Where a loaded player is allowed to stand.
 *
 * A save remembers the exact tile and facing, and normally that is exactly
 * where the player comes back. But "the tile was fine when I saved" is not
 * the same as "the tile is fine now", because some of what decides it is not
 * in the save — it is rebuilt when the map loads:
 *
 *   - hedges and gates, rebuilt from flags, Sigils and switch positions
 *   - every NPC, who always starts on their own tile when a map loads —
 *     including a trainer who had walked over to challenge you, and a
 *     villager who had wandered off. Standing on their home tile when you
 *     saved would put you INSIDE them on load.
 *   - ground items, which block their tile until picked up
 *   - the map itself, which a later version of the game may have redrawn
 *
 * So the saved tile is checked against the world EXACTLY as it will be built,
 * and if it fails, the player is placed at the first safe choice of:
 *
 *   1. the saved tile              (the normal case)
 *   2. that map's own spawn point  (its recovery spawn, if it is the recovery map)
 *   3. the recovery point          (the Mender's Hall they last healed at)
 *   4. the start of the game       (Emberhollow — always valid, tested)
 *
 * Each fallback is reported. Nothing here can place a player in a wall.
 */

import { MAPS, STARTING_MAP_ID } from '../data/maps/index.js';
import { TileMap } from '../systems/TileMap.js';
import { createBarrierState } from '../systems/PuzzleSystem.js';
import { getWorldConditions } from '../systems/ProgressionSystem.js';
import { DIRECTIONS } from '../config/controls.js';

function getMap(mapId) {
  return typeof mapId === 'string' && Object.hasOwn(MAPS, mapId) ? MAPS[mapId] : null;
}

/**
 * A TileMap with its gates and hedges set exactly as `state` says — the same
 * two calls WorldScene makes before it places anyone.
 */
export function buildMapAsSaved(mapId, state) {
  const map = new TileMap(getMap(mapId));
  if (map.barriers.length > 0) {
    map.setBarrierState(createBarrierState(map.definition, {
      conditions: getWorldConditions(state),
      state,
    }));
  }
  return map;
}

/**
 * Could the player stand on this tile the moment the map finishes loading?
 *
 * @param {TileMap} map   with its barriers already set (see buildMapAsSaved)
 * @param {object} state  for which ground items have been picked up
 */
export function isSafeStandingTile(map, x, y, state) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;

  // Walls, water, the map's edge — and any gate or hedge that is shut.
  if (!map.isWalkable(x, y)) return false;

  // Every NPC is placed on their own tile when a map loads, wherever they
  // had walked to before.
  const npcs = map.definition.npcs || [];
  if (npcs.some((npc) => npc.x === x && npc.y === y)) return false;

  // An item still on the ground blocks its tile.
  const items = (map.definition.interactables || []).filter((entry) => entry.type === 'item');
  if (items.some((item) => item.x === x && item.y === y && !state.flags?.[item.flag])) return false;

  return true;
}

/** A named spawn point, falling back to the map's default. */
function findSpawn(definition, name) {
  const spawns = definition.spawnPoints || {};
  if (Object.hasOwn(spawns, name)) return spawns[name];
  return spawns.default || null;
}

/**
 * Where to put a loaded player.
 *
 * @param {object} state a validated GameState
 * @returns {{ mapId: string, x: number, y: number, facing: string,
 *             source: 'saved'|'spawn'|'recovery'|'start', warnings: string[] }}
 */
export function resolveRestorePosition(state) {
  const warnings = [];
  const { location, respawn } = state;
  const savedMap = getMap(location.mapId);

  const trySpawn = (mapId, spawnName) => {
    const definition = getMap(mapId);
    if (!definition) return null;
    const spawn = findSpawn(definition, spawnName);
    if (!spawn) return null;

    const map = buildMapAsSaved(mapId, state);
    if (!isSafeStandingTile(map, spawn.x, spawn.y, state)) return null;
    return { mapId, x: spawn.x, y: spawn.y, facing: spawn.facing || 'down' };
  };

  // 1. Exactly where they saved.
  if (savedMap && location.x !== null && location.y !== null) {
    const map = buildMapAsSaved(location.mapId, state);
    if (isSafeStandingTile(map, location.x, location.y, state)) {
      const facing = DIRECTIONS.includes(location.facing) ? location.facing : 'down';
      return { mapId: location.mapId, x: location.x, y: location.y, facing, source: 'saved', warnings };
    }
    warnings.push(
      `(${location.x}, ${location.y}) on ${savedMap.name} cannot be stood on now; ` +
        'using the nearest safe spawn point instead.'
    );
  }

  // 2. That map's own spawn point. A save with no coordinates at all lands
  // here by design: it means "wherever this map puts an arriving player".
  if (savedMap) {
    const spawnName = location.mapId === respawn.mapId ? respawn.spawn : 'default';
    const spawn = trySpawn(location.mapId, spawnName);
    if (spawn) return { ...spawn, source: 'spawn', warnings };
    warnings.push(`${savedMap.name} has no safe spawn point; waking at the recovery point.`);
  }

  // 3. The recovery point.
  const recovery = trySpawn(respawn.mapId, respawn.spawn);
  if (recovery) return { ...recovery, source: 'recovery', warnings };
  warnings.push('The recovery point is not safe either; starting in Emberhollow.');

  // 4. The start of the game. The map tests guarantee this spawn is sound.
  const start = findSpawn(MAPS[STARTING_MAP_ID], 'default');
  return {
    mapId: STARTING_MAP_ID,
    x: start.x,
    y: start.y,
    facing: start.facing || 'down',
    source: 'start',
    warnings,
  };
}
