/**
 * InputManager.js
 * ----------------------------------------------------------------------------
 * Wraps Phaser's keyboard handling so the rest of the game asks about ACTIONS
 * ("is the player pressing confirm?") instead of KEYS ("is Enter down?").
 *
 * Benefits:
 *  - Rebinding is a one-line change in `src/config/controls.js`.
 *  - Several keys can share an action (arrows and WASD both move).
 *  - Every scene cleans up its keys the same way, so we never leak listeners.
 *
 * Create one per scene, and call `destroy()` when the scene shuts down.
 */

import Phaser from 'phaser';
import { KEY_BINDINGS, DIRECTIONS } from '../config/controls.js';

export class InputManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    /** action name -> array of Phaser Key objects */
    this.keys = {};

    for (const [action, keyNames] of Object.entries(KEY_BINDINGS)) {
      this.keys[action] = keyNames
        .map((name) => {
          const keyCode = Phaser.Input.Keyboard.KeyCodes[name];

          // A misspelled key name would otherwise create a key that simply never
          // fires — a silent bug that is very hard to track down. Complain loudly.
          if (keyCode === undefined) {
            console.error(
              `[InputManager] "${name}" (bound to the "${action}" action) is not a ` +
                `Phaser key name, so that key will never respond. Check the spelling ` +
                `in src/config/controls.js against Phaser.Input.Keyboard.KeyCodes.`
            );
            return null;
          }

          return scene.input.keyboard.addKey(keyCode, true, false);
        })
        .filter(Boolean);
    }

    // Tidy up automatically when the scene ends, so a scene restart cannot
    // stack up duplicate key objects.
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  /** True while any key bound to this action is held down. */
  isDown(action) {
    const keys = this.keys[action];
    if (!keys) return false;
    return keys.some((key) => key.isDown);
  }

  /**
   * True only on the single frame the action was first pressed.
   * Use this for menus and confirmations so one tap never counts twice.
   */
  justPressed(action) {
    const keys = this.keys[action];
    if (!keys) return false;
    // `some` short-circuits, but JustDown must run for every key to clear its
    // internal flag — otherwise a second bound key can fire a frame later.
    let pressed = false;
    for (const key of keys) {
      if (Phaser.Input.Keyboard.JustDown(key)) pressed = true;
    }
    return pressed;
  }

  /**
   * The direction the player is currently asking to move, or null.
   * If two directions are held we return the first in DIRECTIONS order, which
   * keeps diagonal presses predictable instead of jittering between the two.
   */
  getHeldDirection() {
    for (const direction of DIRECTIONS) {
      if (this.isDown(direction)) return direction;
    }
    return null;
  }

  /** Release every key this manager created. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    for (const keys of Object.values(this.keys)) {
      for (const key of keys) {
        this.scene.input.keyboard.removeKey(key, true);
      }
    }
    this.keys = {};
  }
}
