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
import {
  PLAYER_FRAMES,
  PLAYER_ANIMS,
  CHARACTER_PALETTES,
  characterTextureKey,
} from '../src/config/assets.js';
import { ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { ITEMS } from '../src/data/items.js';
import { collectAllPages, resolveDialogue } from '../src/systems/DialogueResolver.js';
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

      it('places every NPC on a walkable tile', () => {
        for (const npc of definition.npcs || []) {
          expect(
            map.isWalkable(npc.x, npc.y),
            `NPC "${npc.id}" at (${npc.x}, ${npc.y}) is standing inside a wall`
          ).toBe(true);
        }
      });

      it('gives every NPC a unique id and a sprite that exists', () => {
        const seen = new Set();
        for (const npc of definition.npcs || []) {
          expect(npc.id, 'every NPC needs an id').toBeTruthy();
          expect(seen.has(npc.id), `duplicate NPC id "${npc.id}"`).toBe(false);
          seen.add(npc.id);

          const sprite = npc.sprite || 'villager';
          expect(
            CHARACTER_PALETTES[sprite],
            `NPC "${npc.id}" uses sprite "${sprite}", which is not in CHARACTER_PALETTES`
          ).toBeDefined();
        }
      });

      it('never puts two NPCs on the same tile', () => {
        const occupied = new Set();
        for (const npc of definition.npcs || []) {
          const key = `${npc.x},${npc.y}`;
          expect(occupied.has(key), `two NPCs both stand at (${key})`).toBe(false);
          occupied.add(key);
        }
      });

      it('never starts an NPC on an exit tile', () => {
        for (const npc of definition.npcs || []) {
          expect(
            map.getExitAt(npc.x, npc.y),
            `NPC "${npc.id}" is standing on a map exit and would block it`
          ).toBeNull();
        }
      });

      it('keeps every spawn point clear of NPCs and exits', () => {
        for (const [name, spawn] of Object.entries(definition.spawnPoints || {})) {
          const blocking = (definition.npcs || []).find(
            (npc) => npc.x === spawn.x && npc.y === spawn.y
          );
          expect(
            blocking,
            `spawn "${name}" is on top of NPC "${blocking && blocking.id}"`
          ).toBeUndefined();

          // Arriving directly on an exit tile would be safe today (only moving
          // fires an exit), but it is fragile — keep spawns off exits.
          expect(
            map.getExitAt(spawn.x, spawn.y),
            `spawn "${name}" sits on an exit tile`
          ).toBeNull();
        }
      });

      it('gives every interactable a position inside the map and something to say', () => {
        for (const item of definition.interactables || []) {
          expect(
            map.isInBounds(item.x, item.y),
            `interactable at (${item.x}, ${item.y}) is outside the map`
          ).toBe(true);

          if (item.type === 'item') {
            expect(ITEMS[item.item], `unknown item "${item.item}"`).toBeDefined();
            expect(item.flag, 'a ground item needs a flag so it stays picked up').toBeTruthy();
            expect(
              map.isWalkable(item.x, item.y),
              `ground item at (${item.x}, ${item.y}) is unreachable`
            ).toBe(true);
          } else {
            expect(
              collectAllPages(item.dialogue).length,
              `interactable at (${item.x}, ${item.y}) has no dialogue`
            ).toBeGreaterThan(0);
          }
        }
      });

      it('never puts two interactables on the same tile', () => {
        const seen = new Set();
        for (const item of definition.interactables || []) {
          const key = `${item.x},${item.y}`;
          expect(seen.has(key), `two interactables at (${key})`).toBe(false);
          seen.add(key);
        }
      });

      it('points every exit at a real map and a real spawn point there', () => {
        for (const exit of definition.exits || []) {
          const target = MAPS[exit.to];
          expect(target, `exit leads to unknown map "${exit.to}"`).toBeDefined();

          const spawnName = exit.spawn || 'default';
          expect(
            target.spawnPoints && target.spawnPoints[spawnName],
            `exit to "${exit.to}" wants spawn "${spawnName}", which that map does not define`
          ).toBeDefined();
        }
      });

      it('gives every NPC dialogue that resolves to something with no flags set', () => {
        for (const npc of definition.npcs || []) {
          const result = resolveDialogue(npc.dialogue, {});
          expect(
            result.pages.length,
            `NPC "${npc.id}" says nothing to a brand new player — add a fallback branch`
          ).toBeGreaterThan(0);
        }
      });

      it('uses an encounter table that exists, if it declares one', () => {
        if (definition.encounterTable) {
          expect(
            ENCOUNTER_TABLES[definition.encounterTable],
            `map "${id}" wants encounter table "${definition.encounterTable}"`
          ).toBeDefined();
        }
      });

      it('only has tall grass on maps that define an encounter table', () => {
        const hasTallGrass = definition.tiles.some((row) => row.includes('"'));
        if (hasTallGrass) {
          expect(
            definition.encounterTable,
            `map "${id}" has tall grass but no encounterTable, so it would never spawn anything`
          ).toBeTruthy();
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

  it('gives every character palette a full set of colours', () => {
    const required = [
      'hair', 'skin', 'skinShade', 'tunic', 'tunicShade', 'trousers', 'boots', 'accent',
    ];
    for (const [name, palette] of Object.entries(CHARACTER_PALETTES)) {
      for (const key of required) {
        expect(typeof palette[key], `palette "${name}" is missing "${key}"`).toBe('number');
      }
    }
  });

  it('keeps the player texture key stable so Phase 1 art still resolves', () => {
    expect(characterTextureKey('player')).toBe('player');
    expect(characterTextureKey('elder')).toBe('char-elder');
  });
});
