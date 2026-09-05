/**
 * tiles.js
 * ----------------------------------------------------------------------------
 * The tile vocabulary. Every map is written as a grid of single characters, and
 * this file says what each character means.
 *
 * WHY ASCII MAPS?
 * Maps are plain text you can read and edit in any editor — no Tiled, no binary
 * files, no import pipeline. A map's shape is visible at a glance in the source.
 *
 * Each tile definition supports:
 *   char        the character used in map strings (must be unique)
 *   id          a readable name used in code and in save data
 *   solid       true if the player cannot walk onto it
 *   encounter   true if walking on it can trigger a wild encounter
 *   overhead    true if it should draw ON TOP of the player (e.g. tree canopy)
 *   ledge       a direction name if this tile is a one-way hop ledge
 *   texture     the generated texture key used to draw it (see TextureFactory)
 */

/** @type {Record<string, object>} */
export const TILE_DEFINITIONS = {
  '.': { id: 'grass', solid: false, texture: 'tile-grass' },
  ',': { id: 'grass_alt', solid: false, texture: 'tile-grass-alt' },
  '"': { id: 'tall_grass', solid: false, encounter: true, texture: 'tile-tall-grass' },
  '-': { id: 'path', solid: false, texture: 'tile-path' },
  '=': { id: 'path_alt', solid: false, texture: 'tile-path-alt' },
  'T': { id: 'tree', solid: true, texture: 'tile-tree' },
  't': { id: 'tree_top', solid: true, overhead: true, texture: 'tile-tree-top' },
  '#': { id: 'stone_wall', solid: true, texture: 'tile-stone-wall' },
  '~': { id: 'water', solid: true, texture: 'tile-water' },
  's': { id: 'sand', solid: false, texture: 'tile-sand' },
  'f': { id: 'flowers', solid: false, texture: 'tile-flowers' },
  'R': { id: 'roof', solid: true, texture: 'tile-roof' },
  'r': { id: 'roof_dark', solid: true, texture: 'tile-roof-dark' },
  'W': { id: 'building_wall', solid: true, texture: 'tile-building-wall' },
  'w': { id: 'window', solid: true, texture: 'tile-window' },
  'D': { id: 'door', solid: false, texture: 'tile-door' },
  'S': { id: 'sign', solid: true, texture: 'tile-sign' },
  'F': { id: 'fence', solid: true, texture: 'tile-fence' },
  'o': { id: 'floor', solid: false, texture: 'tile-floor' },
  'L': { id: 'ledge_down', solid: false, ledge: 'down', texture: 'tile-ledge' },
};

/** The tile used when a map contains a character this file does not define. */
export const FALLBACK_TILE = {
  id: 'void',
  solid: true,
  texture: 'tile-void',
};

/**
 * Look up a tile definition by its map character.
 * Unknown characters fall back to a solid "void" tile and warn once, so a typo in
 * a map produces a visible magenta square instead of crashing the game.
 */
const warnedChars = new Set();

export function getTileByChar(char) {
  const tile = TILE_DEFINITIONS[char];
  if (tile) return tile;

  if (!warnedChars.has(char)) {
    warnedChars.add(char);
    console.warn(
      `[tiles] Unknown map character "${char}". ` +
        `Add it to TILE_DEFINITIONS in src/data/tiles.js. Using a solid void tile.`
    );
  }
  return FALLBACK_TILE;
}

/** Every distinct texture key the tile set needs. Used by the TextureFactory. */
export function getAllTileTextureKeys() {
  const keys = Object.values(TILE_DEFINITIONS).map((t) => t.texture);
  keys.push(FALLBACK_TILE.texture);
  return [...new Set(keys)];
}
