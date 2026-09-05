/**
 * gameConfig.js
 * ----------------------------------------------------------------------------
 * The single source of truth for how the game looks and how big things are.
 * If you want to change the resolution, the tile size, or the UI colours,
 * this is the only file you need to touch.
 */

/** Width/height of one map tile, in pixels. Every map coordinate is a multiple of this. */
export const TILE_SIZE = 32;

/**
 * The game's internal resolution. The canvas is rendered at exactly this size
 * and then scaled up to fit the window, which keeps pixel art crisp.
 * 480x320 = 15 tiles wide by 10 tiles tall.
 */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 320;

/** How many tiles fit on screen. Handy for camera and map maths. */
export const VIEW_TILES_X = GAME_WIDTH / TILE_SIZE;
export const VIEW_TILES_Y = GAME_HEIGHT / TILE_SIZE;

/** Scene keys, kept in one place so a typo becomes an obvious import error. */
export const SCENES = {
  BOOT: 'BootScene',
  TITLE: 'TitleScene',
  WORLD: 'WorldScene',
  STARTER_SELECT: 'StarterSelectScene',
};

/**
 * The game's colour palette. Every colour used anywhere should come from here
 * so the whole game stays visually cohesive.
 * Values are 0xRRGGBB numbers because that is what Phaser expects.
 */
export const COLORS = {
  // UI chrome
  ink: 0x1b2028,
  inkLight: 0x2b3240,
  parchment: 0xf4ecd8,
  parchmentDim: 0xa9a291,
  accent: 0xe8a33d,
  accentDark: 0x9c6a1e,
  danger: 0xe6685f,
  good: 0x6fbf73,

  // Terrain
  grass: 0x5d9a4e,
  grassDark: 0x4a7d3f,
  tallGrass: 0x3f7a35,
  tallGrassDark: 0x33632b,
  path: 0xc2ab7f,
  pathDark: 0xa88f66,
  water: 0x4a86c4,
  waterDark: 0x3a6a9c,
  sand: 0xd8c48d,
  stone: 0x8a8f98,
  stoneDark: 0x6b7078,
  tree: 0x2f5c2a,
  treeDark: 0x234420,
  treeTrunk: 0x5a4028,
  roof: 0xb5533f,
  roofDark: 0x8e3f2f,
  wall: 0xe0d3b8,
  wallDark: 0xbfae8f,
  door: 0x6b4a2c,
  floor: 0xcbb999,
  ledge: 0x9a7f55,
};

/** Same palette as CSS strings, for text styles and HTML overlays. */
export const CSS_COLORS = Object.fromEntries(
  Object.entries(COLORS).map(([name, value]) => [
    name,
    `#${value.toString(16).padStart(6, '0')}`,
  ])
);

/** Shared text styles so every bit of text in the game matches. */
export const FONT_FAMILY = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

export const TEXT_STYLES = {
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: '34px',
    color: CSS_COLORS.parchment,
    fontStyle: 'bold',
  },
  heading: {
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
    color: CSS_COLORS.parchment,
    fontStyle: 'bold',
  },
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: '14px',
    color: CSS_COLORS.parchment,
  },
  small: {
    fontFamily: FONT_FAMILY,
    fontSize: '11px',
    color: CSS_COLORS.parchmentDim,
  },
  menuItem: {
    fontFamily: FONT_FAMILY,
    fontSize: '16px',
    color: CSS_COLORS.parchment,
  },
};

/** Depth layers. Higher numbers draw on top. */
export const DEPTHS = {
  ground: 0,
  decoration: 5,
  ledges: 8,
  entities: 10,
  overhead: 20,
  weather: 30,
  ui: 100,
  dialogue: 110,
  overlay: 200,
  debug: 500,
};

/** Screen-fade duration in milliseconds, used by every scene transition. */
export const FADE_DURATION = 300;
