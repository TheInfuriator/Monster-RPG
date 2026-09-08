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

  // --- Interior tiles (houses, the lodge, the Mender's Hall, the shop) ---
  //
  // Tiles marked `object: true` are FURNITURE: they are drawn with a see-through
  // background, on top of whichever floor the map names in its `objectBase`
  // field. That is what lets the same table look right on floorboards in a house
  // and on tiles in the shop, without needing two versions of every object.
  '_': { id: 'interior_wall', solid: true, texture: 'tile-interior-wall' },
  '|': { id: 'interior_wall_trim', solid: true, texture: 'tile-interior-trim' },
  'O': { id: 'floor_tiled', solid: false, texture: 'tile-floor-tiled' },
  'M': { id: 'door_mat', solid: false, object: true, texture: 'tile-door-mat' },
  // `counter: true` lets the player talk to whoever stands on the far side,
  // which is how you reach a shopkeeper or a nurse across their desk.
  'C': { id: 'counter', solid: true, counter: true, object: true, texture: 'tile-counter' },
  'B': { id: 'bookshelf', solid: true, object: true, texture: 'tile-bookshelf' },
  'b': { id: 'bed', solid: true, object: true, texture: 'tile-bed' },
  'A': { id: 'table', solid: true, object: true, texture: 'tile-table' },
  'P': { id: 'plant', solid: true, object: true, texture: 'tile-plant' },
  'H': { id: 'healing_machine', solid: true, object: true, texture: 'tile-healing-machine' },
  'V': { id: 'shop_shelf', solid: true, object: true, texture: 'tile-shop-shelf' },
  'I': { id: 'interior_window', solid: true, texture: 'tile-interior-window' },

  // --- Thistlewood and the Verdant Hall (Phase 9) -------------------------
  //
  // `G` and `h` are the two BARRIER looks. A barrier is a set of tiles that a
  // map can open and close at runtime (see src/systems/PuzzleSystem.js); it
  // names one of these characters and the barrier is drawn — and blocks — as
  // that tile while it is closed. They are ordinary tiles, so a map may also
  // just write one in and get a permanent gate or hedge.
  'G': { id: 'gate', solid: true, texture: 'tile-gate' },
  'h': { id: 'hedge', solid: true, texture: 'tile-hedge' },
  'g': { id: 'garden_soil', solid: false, texture: 'tile-garden-soil' },
  // A root switch is stepped ON, so it must stay walkable. `object: true` draws
  // it over the map's objectBase floor, like any other piece of furniture.
  'x': { id: 'root_switch', solid: false, object: true, texture: 'tile-root-switch' },
  'p': { id: 'planter', solid: true, object: true, texture: 'tile-planter' },
  'k': { id: 'timber_wall', solid: true, texture: 'tile-timber-wall' },
  'K': { id: 'timber_roof', solid: true, texture: 'tile-timber-roof' },
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
