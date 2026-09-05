/**
 * assets.js
 * ----------------------------------------------------------------------------
 * Every texture in the game is referenced by a KEY, never by a file path.
 *
 * Right now all art is generated at runtime by `src/systems/TextureFactory.js`
 * (coloured shapes — no image files, no licensing worries). When real artwork
 * arrives, you only have to load the images under these same keys and delete the
 * matching generator; nothing else in the game changes.
 */

export const ASSET_KEYS = {
  // Characters. The player is a sprite sheet; see PLAYER_FRAMES below.
  player: 'player',

  // UI
  uiPanel: 'ui-panel',
  uiCursor: 'ui-cursor',
  logo: 'ui-logo',
};

/** Player sprite sheet geometry. Frames are taller than a tile so the character reads clearly. */
export const PLAYER_FRAME = {
  width: 32,
  height: 40,
  /**
   * Blank pixels below the character's feet inside each frame. The sprite is
   * drawn with its bottom edge this far below the tile's bottom edge, which puts
   * the feet exactly on the tile the player occupies.
   */
  footPadding: 4,
};

/**
 * Which sprite-sheet frame index belongs to which direction.
 * The sheet is laid out as 3 columns (idle, step A, step B) x 4 rows.
 */
export const PLAYER_FRAMES = {
  down: { idle: 0, stepA: 1, stepB: 2 },
  left: { idle: 3, stepA: 4, stepB: 5 },
  right: { idle: 6, stepA: 7, stepB: 8 },
  up: { idle: 9, stepA: 10, stepB: 11 },
};

/** Animation keys, one walk cycle per facing direction. */
export const PLAYER_ANIMS = {
  down: 'player-walk-down',
  left: 'player-walk-left',
  right: 'player-walk-right',
  up: 'player-walk-up',
};
