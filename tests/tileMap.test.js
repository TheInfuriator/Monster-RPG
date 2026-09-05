/**
 * Tests for the map system: parsing, collision, bounds, spawn points, and the
 * validation that protects us from malformed map data.
 */

import { describe, it, expect, vi } from 'vitest';
import { TileMap, validateMapDefinition } from '../src/systems/TileMap.js';
import { TILE_SIZE } from '../src/config/gameConfig.js';

/** A tiny hand-made map: a walled room with grass, a path and tall grass. */
const testMap = {
  id: 'test',
  name: 'Test Room',
  tiles: [
    '#####',
    '#...#',
    '#."-#',
    '#...#',
    '#####',
  ],
  spawnPoints: {
    default: { x: 1, y: 1, facing: 'down' },
    side: { x: 3, y: 3, facing: 'left' },
  },
};

describe('TileMap parsing', () => {
  it('reads its width and height from the tile rows', () => {
    const map = new TileMap(testMap);
    expect(map.width).toBe(5);
    expect(map.height).toBe(5);
  });

  it('converts tile size into pixel dimensions', () => {
    const map = new TileMap(testMap);
    expect(map.pixelWidth).toBe(5 * TILE_SIZE);
    expect(map.pixelHeight).toBe(5 * TILE_SIZE);
  });

  it('maps each character to the right tile definition', () => {
    const map = new TileMap(testMap);
    expect(map.getTile(0, 0).id).toBe('stone_wall');
    expect(map.getTile(1, 1).id).toBe('grass');
    expect(map.getTile(2, 2).id).toBe('tall_grass');
    expect(map.getTile(3, 2).id).toBe('path');
  });
});

describe('TileMap collision', () => {
  const map = new TileMap(testMap);

  it('blocks solid tiles', () => {
    expect(map.isWalkable(0, 0)).toBe(false); // wall
    expect(map.isWalkable(2, 0)).toBe(false); // wall
  });

  it('allows open tiles', () => {
    expect(map.isWalkable(1, 1)).toBe(true);
    expect(map.isWalkable(3, 2)).toBe(true);
  });

  it('treats everything outside the map as blocked', () => {
    expect(map.isWalkable(-1, 1)).toBe(false);
    expect(map.isWalkable(1, -1)).toBe(false);
    expect(map.isWalkable(5, 1)).toBe(false);
    expect(map.isWalkable(1, 5)).toBe(false);
  });

  it('reports out-of-bounds tiles as null rather than throwing', () => {
    expect(map.getTile(-1, 0)).toBeNull();
    expect(map.getTile(99, 99)).toBeNull();
  });

  it('knows which tiles can trigger encounters', () => {
    expect(map.hasEncounters(2, 2)).toBe(true); // tall grass
    expect(map.hasEncounters(1, 1)).toBe(false); // plain grass
    expect(map.hasEncounters(0, 0)).toBe(false); // wall
    expect(map.hasEncounters(99, 99)).toBe(false); // off-map
  });
});

describe('TileMap spawn points', () => {
  const map = new TileMap(testMap);

  it('returns a named spawn point', () => {
    expect(map.getSpawnPoint('side')).toEqual({ x: 3, y: 3, facing: 'left' });
  });

  it('falls back to the default spawn for an unknown name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(map.getSpawnPoint('doesNotExist')).toEqual({ x: 1, y: 1, facing: 'down' });
    warn.mockRestore();
  });

  it('always returns a walkable tile even when no spawn points exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bare = new TileMap({ id: 'bare', tiles: ['##', '#.'] });
    const spawn = bare.getSpawnPoint();
    expect(bare.isWalkable(spawn.x, spawn.y)).toBe(true);
    warn.mockRestore();
  });

  it('defaults facing to down when a spawn point omits it', () => {
    const map2 = new TileMap({
      id: 'nofacing',
      tiles: ['...', '...'],
      spawnPoints: { default: { x: 1, y: 1 } },
    });
    expect(map2.getSpawnPoint().facing).toBe('down');
  });
});

describe('map validation', () => {
  it('accepts a well-formed map', () => {
    expect(validateMapDefinition(testMap)).toBe(true);
  });

  it('rejects a map with rows of differing lengths', () => {
    expect(() =>
      validateMapDefinition({ id: 'ragged', tiles: ['...', '..'] })
    ).toThrow(/same length/);
  });

  it('rejects a map with no id', () => {
    expect(() => validateMapDefinition({ tiles: ['..'] })).toThrow(/missing an "id"/);
  });

  it('rejects a map with no tiles', () => {
    expect(() => validateMapDefinition({ id: 'empty', tiles: [] })).toThrow(
      /non-empty "tiles"/
    );
  });

  it('rejects a non-object definition', () => {
    expect(() => validateMapDefinition(null)).toThrow(/must be an object/);
  });
});

describe('unknown tile characters', () => {
  it('falls back to a solid void tile and warns instead of crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const map = new TileMap({ id: 'typo', tiles: ['.Z.'] });

    expect(map.getTile(1, 0).id).toBe('void');
    expect(map.isWalkable(1, 0)).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
