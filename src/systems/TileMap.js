/**
 * TileMap.js
 * ----------------------------------------------------------------------------
 * Turns a map definition (an array of ASCII strings) into a grid we can query.
 *
 * This module contains NO Phaser code on purpose. It is pure JavaScript, which
 * means it can be unit tested without a browser, and the rendering code stays
 * separate from the rules about what is walkable.
 */

import { getTileByChar } from '../data/tiles.js';
import { getEncounterConfig } from '../data/encounters.js';
import { getBarriers } from './PuzzleSystem.js';
import { TILE_SIZE } from '../config/gameConfig.js';

export class TileMap {
  /**
   * @param {object} definition A map definition from src/data/maps/
   */
  constructor(definition) {
    validateMapDefinition(definition);

    this.id = definition.id;
    this.name = definition.name;
    this.definition = definition;

    /** Raw character rows. */
    this.rows = definition.tiles;

    this.height = this.rows.length;
    this.width = this.rows[0].length;

    /**
     * The parsed grid: grid[y][x] is a tile definition object.
     * Parsed once up front so movement checks are a cheap array lookup.
     */
    this.grid = this.rows.map((row) =>
      Array.from(row, (char) => getTileByChar(char))
    );

    /**
     * This map's wild-encounter settings, or null. Read once here so a step
     * check stays a cheap lookup rather than re-parsing the definition.
     */
    this.encounterConfig = getEncounterConfig(definition);

    /**
     * Barriers: tiles that are solid only some of the time — Route 1's gate,
     * the Verdant Hall's hedges.
     *
     * They live HERE rather than in the scene because everything already asks
     * the map whether a tile is walkable: the player, every NPC, the sight
     * lines and the interaction check. Putting the rule in one place means the
     * picture and the collision cannot disagree, and a trainer can no more see
     * through a closed hedge than the player can walk through it.
     *
     * Each map starts at its DECLARED state. WorldScene immediately replaces
     * that with the saved state via `setBarrierState()`; a TileMap built just
     * to read a spawn point never needs to.
     */
    this.barriers = getBarriers(definition);
    this.barrierTiles = new Map();
    for (const barrier of this.barriers) {
      for (const [x, y] of barrier.tiles || []) this.barrierTiles.set(`${x},${y}`, barrier.id);
    }
    this.barrierClosed = {};
    for (const barrier of this.barriers) {
      this.barrierClosed[barrier.id] = barrier.closed !== false;
    }
  }

  /**
   * Replace which barriers are closed.
   * @param {Record<string, boolean>} state barrierId -> closed?
   */
  setBarrierState(state = {}) {
    for (const barrier of this.barriers) {
      if (barrier.id in state) this.barrierClosed[barrier.id] = Boolean(state[barrier.id]);
    }
  }

  /** The id of the barrier covering a tile, or null. */
  getBarrierIdAt(x, y) {
    return this.barrierTiles.get(`${x},${y}`) || null;
  }

  isBarrierClosed(barrierId) {
    return Boolean(this.barrierClosed[barrierId]);
  }

  /** True if a CLOSED barrier is standing on this tile. */
  isBlockedByBarrier(x, y) {
    const id = this.getBarrierIdAt(x, y);
    return id !== null && this.isBarrierClosed(id);
  }

  /** Map width/height in pixels. Used to clamp the camera. */
  get pixelWidth() {
    return this.width * TILE_SIZE;
  }

  get pixelHeight() {
    return this.height * TILE_SIZE;
  }

  /** True if the given tile coordinate is inside the map. */
  isInBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /**
   * The tile definition at a coordinate.
   * Out-of-bounds returns null, which callers treat as "blocked".
   */
  getTile(x, y) {
    if (!this.isInBounds(x, y)) return null;
    return this.grid[y][x];
  }

  /**
   * Can the player stand on this tile?
   * Anything outside the map, and any tile marked solid, is blocked.
   */
  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    // A closed barrier is as solid as a wall — to the player, to NPCs, and to
    // a trainer trying to see past it.
    if (this.isBlockedByBarrier(x, y)) return false;
    return !tile.solid;
  }

  /**
   * True if stepping on this tile can start a wild encounter.
   *
   * Two things have to agree: the TILE has to be encounter terrain (tall grass
   * is, in src/data/tiles.js), and the MAP has to allow encounters. A map may
   * also narrow which encounter tiles count with `encounters.terrain`, so a
   * future cave can have wild creatures in its floor but not its puddles.
   */
  hasEncounters(x, y) {
    const tile = this.getTile(x, y);
    if (!tile || !tile.encounter) return false;

    const terrain = this.encounterConfig?.terrain;
    if (terrain) return terrain.includes(tile.id);

    return true;
  }

  /**
   * The exit at a tile, or null. Stepping onto an exit tile moves the player to
   * another map — see WorldScene.
   */
  getExitAt(x, y) {
    const exits = this.definition.exits || [];
    return exits.find((exit) => exit.x === x && exit.y === y) || null;
  }

  /**
   * The interactable object at a tile, or null. These are the signs, shelves and
   * ground items the player presses the confirm key at.
   */
  getInteractableAt(x, y) {
    const items = this.definition.interactables || [];
    return items.find((item) => item.x === x && item.y === y) || null;
  }

  /** The id of this map's wild-encounter table, or null if it has none. */
  get encounterTableId() {
    return this.encounterConfig?.tableId || null;
  }

  /** True if this map is indoors (no wild encounters, different music later). */
  get isInterior() {
    return Boolean(this.definition.interior);
  }

  /**
   * The texture drawn underneath furniture tiles, or null.
   * A map names a floor CHARACTER (`objectBase: 'o'`) and we look up its texture,
   * so map files stay written in the same tile alphabet as everything else.
   */
  get objectBaseTexture() {
    const char = this.definition.objectBase;
    if (!char) return null;

    const tile = getTileByChar(char);
    return tile ? tile.texture : null;
  }

  /** Every tile that should render above the player, as {x, y, tile} objects. */
  getOverheadTiles() {
    const result = [];
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const tile = this.grid[y][x];
        if (tile.overhead) result.push({ x, y, tile });
      }
    }
    return result;
  }

  /**
   * A named spawn point, e.g. where the player appears when entering this map.
   * Falls back to the map's "default" spawn, then to the first walkable tile,
   * so a missing spawn point can never strand the player inside a wall.
   */
  getSpawnPoint(name = 'default') {
    const spawns = this.definition.spawnPoints || {};
    const spawn = spawns[name] || spawns.default;
    if (spawn) return { facing: 'down', ...spawn };

    console.warn(
      `[TileMap] Map "${this.id}" has no spawn point "${name}". ` +
        `Falling back to the first walkable tile.`
    );
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.isWalkable(x, y)) return { x, y, facing: 'down' };
      }
    }
    // A map with no walkable tile at all is a broken map, but never crash.
    return { x: 0, y: 0, facing: 'down' };
  }
}

/**
 * Fails loudly and clearly on a malformed map, because a silent bad map produces
 * confusing bugs much later (a player stuck in a wall, a crash on render).
 */
export function validateMapDefinition(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('[TileMap] Map definition must be an object.');
  }
  if (!definition.id) {
    throw new Error('[TileMap] Map definition is missing an "id".');
  }
  if (!Array.isArray(definition.tiles) || definition.tiles.length === 0) {
    throw new Error(
      `[TileMap] Map "${definition.id}" must have a non-empty "tiles" array.`
    );
  }

  const width = definition.tiles[0].length;
  definition.tiles.forEach((row, index) => {
    if (typeof row !== 'string') {
      throw new Error(
        `[TileMap] Map "${definition.id}" row ${index} is not a string.`
      );
    }
    if (row.length !== width) {
      throw new Error(
        `[TileMap] Map "${definition.id}" row ${index} is ${row.length} characters ` +
          `but row 0 is ${width}. Every row must be the same length.`
      );
    }
  });

  return true;
}
