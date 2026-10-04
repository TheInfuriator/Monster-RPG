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
  // A one-way LEDGE (Phase 13): solid to walk onto, but stepping toward it in
  // its direction hops the player over it to the tile beyond — down only, so
  // a ledge is a shortcut back down a slope and never a way up. See
  // TileMap.getLedgeHop() and Player.startHop().
  'L': { id: 'ledge_down', solid: true, ledge: 'down', texture: 'tile-ledge' },

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
  // A hedge with pale roots woven through it, in the same colour as a root
  // switch. That is what tells the player WHICH hedges the coils can move —
  // a movable hedge that looked like a wall would make the puzzle a guess.
  'e': { id: 'hedge_gate', solid: true, texture: 'tile-hedge-gate' },
  'g': { id: 'garden_soil', solid: false, texture: 'tile-garden-soil' },
  // A root switch is stepped ON, so it must stay walkable. `object: true` draws
  // it over the map's objectBase floor, like any other piece of furniture.
  'x': { id: 'root_switch', solid: false, object: true, texture: 'tile-root-switch' },
  'p': { id: 'planter', solid: true, object: true, texture: 'tile-planter' },
  'k': { id: 'timber_wall', solid: true, texture: 'tile-timber-wall' },
  'K': { id: 'timber_roof', solid: true, texture: 'tile-timber-roof' },

  // --- Route 2, the Thornway (Phase 11) -----------------------------------
  //
  // Scree is the Thornway's SECOND encounter terrain. It has to read as
  // "wild creatures here" as plainly as tall grass does, so it is loose, busy
  // and darker than the plain gravel road beside it — and the route's map
  // gives it its own encounter table (encounters.byTerrain).
  '*': { id: 'scree', solid: false, encounter: true, texture: 'tile-scree' },
  '%': { id: 'rock_face', solid: true, texture: 'tile-rock-face' },
  '@': { id: 'boulder', solid: true, texture: 'tile-boulder' },
  '&': { id: 'bramble', solid: true, texture: 'tile-bramble' },
  // The dry spring: walkable, and wrong — this used to be water.
  'u': { id: 'cracked_earth', solid: false, texture: 'tile-cracked-earth' },
  // A surveyor's stake, driven into the ground by someone who did not ask.
  'j': { id: 'survey_stake', solid: true, texture: 'tile-survey-stake' },
  // Mistvault Cavern's mouth. Solid: Phase 11 ends here (see route2.js).
  'X': { id: 'cave_mouth', solid: true, texture: 'tile-cave-mouth' },
  // The Wardens' rope cordon across it — a barrier look, like `G` and `h`.
  '+': { id: 'cordon', solid: true, texture: 'tile-cordon' },
  // A signpost on rocky ground. Interactable like any sign.
  '$': { id: 'sign_stone', solid: true, texture: 'tile-sign-stone' },

  // --- Mistvault Cavern (Phase 12) ------------------------------------------
  //
  // A cave reads differently from a route: darker floor, darker walls, and
  // its encounter terrain — loose rubble, and shallows you wade through — is
  // as busy and obvious as tall grass. Everything the Hollow Vane brought in
  // (cables, machinery, storage cells, a notice board) is grey and steel so
  // it never looks like part of the cave.
  'c': { id: 'cave_floor', solid: false, texture: 'tile-cave-floor' },
  'Y': { id: 'cave_wall', solid: true, texture: 'tile-cave-wall' },
  ';': { id: 'cave_rubble', solid: false, encounter: true, texture: 'tile-cave-rubble' },
  'N': { id: 'shallows', solid: false, encounter: true, texture: 'tile-shallows' },
  'v': { id: 'chasm', solid: true, texture: 'tile-chasm' },
  // A mist bridge is walkable in the map source; a barrier draws the chasm
  // over it while no current runs beneath (see PuzzleSystem, openWhenSignal).
  'n': { id: 'mist_bridge', solid: false, texture: 'tile-mist-bridge' },
  // Current channels cut in the rock. Dark when dry; a `glows` entry draws the
  // lit version over them while the current flows. The spring is always lit.
  'q': { id: 'channel', solid: true, texture: 'tile-channel' },
  'Q': { id: 'channel_lit', solid: true, texture: 'tile-channel-lit' },
  'E': { id: 'vault_spring', solid: true, texture: 'tile-vault-spring' },
  'z': { id: 'vane_cables', solid: false, texture: 'tile-vane-cables' },
  'm': { id: 'vane_machinery', solid: true, texture: 'tile-vane-machinery' },
  'l': { id: 'storage_cells', solid: true, texture: 'tile-storage-cells' },
  'J': { id: 'vane_board', solid: true, texture: 'tile-vane-board' },
  // A valve's iron body. The handle drawn over it shows which way it is set.
  'y': { id: 'valve', solid: true, texture: 'tile-valve-0' },
  // The mist the siphon leaves behind: a barrier look, thick enough to stop you.
  'i': { id: 'thick_mist', solid: true, texture: 'tile-thick-mist' },

  // --- Tidewatch Harbor and the Tidal Hall (Phase 12) --------------------------
  '[': { id: 'boardwalk', solid: false, texture: 'tile-boardwalk' },
  'U': { id: 'moored_boat', solid: true, texture: 'tile-moored-boat' },
  'Z': { id: 'lighthouse', solid: true, texture: 'tile-lighthouse' },
  '9': { id: 'lighthouse_lamp', solid: true, texture: 'tile-lighthouse-lamp' },
  'a': { id: 'slate_roof', solid: true, texture: 'tile-slate-roof' },
  '^': { id: 'tide_wheel', solid: true, texture: 'tile-wheel-0' },
  // The Hall's lower floor (flooded at high tide) and its pontoons (sunk at
  // low tide). Both walkable in the map source; barriers draw the water.
  ')': { id: 'wet_stone', solid: false, texture: 'tile-wet-stone' },
  '(': { id: 'pontoon', solid: false, texture: 'tile-pontoon' },

  // --- The Stormrise Climb (Phase 13) ----------------------------------------
  //
  // Three encounter terrains, one per height, each with its own table on the
  // map that has it (encounters.byTerrain): heath in the foothills, frost
  // scree on the ridge, stormgrass on the summit meadow.
  '1': { id: 'heath', solid: false, encounter: true, texture: 'tile-heath' },
  '2': { id: 'frost_scree', solid: false, encounter: true, texture: 'tile-frost-scree' },
  '3': { id: 'stormgrass', solid: false, encounter: true, texture: 'tile-stormgrass' },
  '5': { id: 'snow', solid: false, texture: 'tile-snow' },
  // The Hollow Vane's relay mast, and the charged fence it powers (a barrier
  // look: drawn — and solid — only while the relay runs).
  '6': { id: 'relay_mast', solid: true, texture: 'tile-relay-mast' },
  '!': { id: 'charged_fence', solid: true, texture: 'tile-charged-fence' },

  // --- Voltspire City (Phase 13) ---------------------------------------------
  '8': { id: 'cobblestone', solid: false, texture: 'tile-cobble' },
  '0': { id: 'copper_roof', solid: true, texture: 'tile-copper-roof' },
  '7': { id: 'voltspire', solid: true, texture: 'tile-voltspire' },
  '>': { id: 'voltspire_top', solid: true, texture: 'tile-voltspire-top' },
  ':': { id: 'street_lamp', solid: true, texture: 'tile-street-lamp' },
  // The storage terminal in every Mender's Hall (an object, drawn on the floor).
  '?': { id: 'storage_terminal', solid: true, object: true, texture: 'tile-storage-terminal' },

  // --- The Storm Hall (Phase 13) ------------------------------------------------
  // A coil post's body; the lever sprite over it shows it dark or lit.
  '{': { id: 'coil', solid: true, texture: 'tile-coil-0' },
  ']': { id: 'grating', solid: false, texture: 'tile-grating' },
  // A wire run across the floor: dark, and the lit version a glow draws.
  'd': { id: 'wire', solid: false, texture: 'tile-wire' },
  '<': { id: 'wire_lit', solid: false, texture: 'tile-wire-lit' },

  // --- The Aerie and the Hollow (Phase 14) -----------------------------------
  //
  // The Wellspring, where the valley's three currents rise together — low
  // and dim while the Hollow Vane draw on it; a glow draws the bright version
  // over it once the Convergence is stopped.
  '4': { id: 'wellspring', solid: true, texture: 'tile-wellspring' },
  '}': { id: 'wellspring_bright', solid: true, texture: 'tile-wellspring-bright' },
  // The Convergence engine in the Hollow: lit while it runs, and the cold
  // version a glow draws over it once it is shut down.
  '`': { id: 'convergence_engine', solid: true, texture: 'tile-convergence-engine' },
  '/': { id: 'convergence_engine_cold', solid: true, texture: 'tile-convergence-engine-cold' },
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
  const tile = Object.hasOwn(TILE_DEFINITIONS, char) ? TILE_DEFINITIONS[char] : undefined;
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
