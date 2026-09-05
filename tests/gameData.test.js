/**
 * Data integrity tests.
 *
 * These are the cheapest bugs to prevent: a map with a typo, a tile with no
 * artwork, a spawn point inside a wall. Catching them here means they can never
 * reach the running game.
 */

import { describe, it, expect } from 'vitest';
import { MAPS, getMapDefinition, STARTING_MAP_ID } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { TILE_DEFINITIONS, FALLBACK_TILE, getAllTileTextureKeys } from '../src/data/tiles.js';
import { TILE_TEXTURE_KEYS } from '../src/systems/TextureFactory.js';
import { PLAYER_FRAMES, PLAYER_ANIMS } from '../src/config/assets.js';
import { KEY_BINDINGS, DIRECTION_VECTORS, DIRECTIONS } from '../src/config/controls.js';

describe('map registry', () => {
  it('registers at least one map', () => {
    expect(Object.keys(MAPS).length).toBeGreaterThan(0);
  });

  it('has a starting map that is registered', () => {
    expect(MAPS[STARTING_MAP_ID]).toBeDefined();
  });

  it('gives a helpful error for an unknown map id', () => {
    expect(() => getMapDefinition('nope')).toThrow(/Unknown map id/);
  });

  it('uses each map key as that map definition\'s own id', () => {
    for (const [key, definition] of Object.entries(MAPS)) {
      expect(definition.id).toBe(key);
    }
  });
});

describe('every registered map is well-formed', () => {
  for (const [id, definition] of Object.entries(MAPS)) {
    describe(`map "${id}"`, () => {
      const map = new TileMap(definition);

      it('loads without errors', () => {
        expect(map.width).toBeGreaterThan(0);
        expect(map.height).toBeGreaterThan(0);
      });

      it('uses only known tile characters', () => {
        const unknown = new Set();
        for (const row of definition.tiles) {
          for (const char of row) {
            if (!TILE_DEFINITIONS[char]) unknown.add(char);
          }
        }
        expect([...unknown]).toEqual([]);
      });

      it('has every spawn point on a walkable tile', () => {
        for (const [name, spawn] of Object.entries(definition.spawnPoints || {})) {
          expect(
            map.isWalkable(spawn.x, spawn.y),
            `spawn "${name}" at (${spawn.x}, ${spawn.y}) is not walkable`
          ).toBe(true);
        }
      });

      it('has every exit on a walkable tile inside the map', () => {
        for (const exit of definition.exits || []) {
          expect(
            map.isInBounds(exit.x, exit.y),
            `exit to "${exit.to}" at (${exit.x}, ${exit.y}) is outside the map`
          ).toBe(true);
          expect(
            map.isWalkable(exit.x, exit.y),
            `exit to "${exit.to}" at (${exit.x}, ${exit.y}) sits on a solid tile`
          ).toBe(true);
        }
      });

      it('is fully enclosed, so the player cannot walk off the edge', () => {
        const escapes = [];
        for (let x = 0; x < map.width; x += 1) {
          if (map.isWalkable(x, 0)) escapes.push(`top (${x}, 0)`);
          if (map.isWalkable(x, map.height - 1)) escapes.push(`bottom (${x}, ${map.height - 1})`);
        }
        for (let y = 0; y < map.height; y += 1) {
          if (map.isWalkable(0, y)) escapes.push(`left (0, ${y})`);
          if (map.isWalkable(map.width - 1, y)) escapes.push(`right (${map.width - 1}, ${y})`);
        }

        // Walkable border tiles are allowed ONLY where a map exit is defined —
        // that is how you leave a map. Anything else is a hole in the wall.
        const exitKeys = new Set((definition.exits || []).map((e) => `${e.x},${e.y}`));
        const holes = escapes.filter((label) => {
          const match = label.match(/\((\d+), (\d+)\)/);
          return !exitKeys.has(`${match[1]},${match[2]}`);
        });

        expect(holes).toEqual([]);
      });
    });
  }
});

describe('tile artwork', () => {
  it('has a texture generator for every tile character', () => {
    const generators = new Set(TILE_TEXTURE_KEYS);
    const missing = getAllTileTextureKeys().filter((key) => !generators.has(key));
    expect(missing).toEqual([]);
  });

  it('gives every tile definition a unique, non-empty id', () => {
    const ids = Object.values(TILE_DEFINITIONS).map((t) => t.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps the fallback tile solid so a typo never opens a hole in a wall', () => {
    expect(FALLBACK_TILE.solid).toBe(true);
  });
});

describe('controls configuration', () => {
  it('binds all four movement directions plus confirm and cancel', () => {
    for (const action of [...DIRECTIONS, 'confirm', 'cancel']) {
      expect(KEY_BINDINGS[action], `missing binding for "${action}"`).toBeDefined();
      expect(KEY_BINDINGS[action].length).toBeGreaterThan(0);
    }
  });

  it('has a movement vector for every direction', () => {
    for (const direction of DIRECTIONS) {
      expect(DIRECTION_VECTORS[direction]).toBeDefined();
    }
  });

  it('uses screen coordinates, where up is negative Y', () => {
    expect(DIRECTION_VECTORS.up).toEqual({ x: 0, y: -1 });
    expect(DIRECTION_VECTORS.down).toEqual({ x: 0, y: 1 });
    expect(DIRECTION_VECTORS.left).toEqual({ x: -1, y: 0 });
    expect(DIRECTION_VECTORS.right).toEqual({ x: 1, y: 0 });
  });
});

describe('player asset configuration', () => {
  it('defines idle and both step frames for every direction', () => {
    for (const direction of DIRECTIONS) {
      const frames = PLAYER_FRAMES[direction];
      expect(frames, `missing frames for "${direction}"`).toBeDefined();
      expect(typeof frames.idle).toBe('number');
      expect(typeof frames.stepA).toBe('number');
      expect(typeof frames.stepB).toBe('number');
    }
  });

  it('gives every frame a unique index in the sprite sheet', () => {
    const indices = Object.values(PLAYER_FRAMES).flatMap((f) => [f.idle, f.stepA, f.stepB]);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it('has a walk animation key for every direction', () => {
    for (const direction of DIRECTIONS) {
      expect(PLAYER_ANIMS[direction]).toBeTruthy();
    }
  });
});
