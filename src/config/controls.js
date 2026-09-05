/**
 * controls.js
 * ----------------------------------------------------------------------------
 * All keyboard bindings in one place. Each action maps to a list of Phaser key
 * names, so several keys can trigger the same action (arrows *and* WASD).
 *
 * To rebind a key, change it here — no scene needs to know about it.
 */

export const KEY_BINDINGS = {
  up: ['UP', 'W'],
  down: ['DOWN', 'S'],
  left: ['LEFT', 'A'],
  right: ['RIGHT', 'D'],
  confirm: ['SPACE', 'ENTER', 'E'],
  cancel: ['ESC', 'X', 'BACKSPACE'],
  run: ['SHIFT'],
  debug: ['BACKTICK'],
};

/** The four movement directions, in the order menus should cycle through them. */
export const DIRECTIONS = ['up', 'down', 'left', 'right'];

/**
 * Direction name -> the tile offset moving that way applies.
 * Screen coordinates grow downward, so "up" is y - 1.
 */
export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Human-readable control list, shown on the title screen and in the README. */
export const CONTROL_HINTS = [
  ['Arrow keys / WASD', 'Move'],
  ['Shift (hold)', 'Run'],
  ['Space / Enter / E', 'Confirm, interact'],
  ['Esc / X', 'Menu, back'],
];
