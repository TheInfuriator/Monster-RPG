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

    /**
     * Actions whose key went down during this frame.
     *
     * WHY THIS EXISTS: Phaser's own `JustDown` reads a flag that `Key.onUp`
     * clears. If a key is pressed AND released inside a single frame — a very
     * fast tap, or a stutter that makes one frame run long — that flag is gone
     * before anything reads it, and the press is silently lost.
     *
     * Latching the `down` event guarantees every press is visible for exactly
     * one update. It is cleared again after the scene updates, so a press that
     * nothing consumed (because a transition was running, say) is discarded
     * rather than firing unexpectedly later.
     */
    this.pressLatch = new Set();

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

          const key = scene.input.keyboard.addKey(keyCode, true, false);
          key.on('down', () => this.pressLatch.add(action));
          return key;
        })
        .filter(Boolean);
    }

    // Clear the latch once the scene has had its chance to read it.
    this.clearLatch = () => this.pressLatch.clear();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.clearLatch);

    // A paused scene stops updating, so anything latched at the moment it
    // paused would still be sitting there when it woke up and would fire as a
    // phantom key press. Clear it on the way back in.
    scene.events.on(Phaser.Scenes.Events.RESUME, this.clearLatch);

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

    let pressed = this.pressLatch.has(action);

    // JustDown must still run for every key so it clears its own internal flag,
    // otherwise a second bound key can fire again a frame later.
    for (const key of keys) {
      if (Phaser.Input.Keyboard.JustDown(key)) pressed = true;
    }

    // Consume the press, so one tap can never be read twice in a frame.
    if (pressed) this.pressLatch.delete(action);
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

  /**
   * Throw away any press that has been latched but not yet read.
   *
   * Used when control comes back from an overlay scene (a battle, the starter
   * chooser). The key press that dismissed the overlay's last message must not
   * also count as an overworld action — otherwise closing a battle in front of
   * an NPC instantly re-opens their dialogue.
   */
  clearPending() {
    this.pressLatch.clear();

    // Reading JustDown is what clears Phaser's own flag, so this consumes any
    // press it is still holding on to.
    for (const keys of Object.values(this.keys)) {
      for (const key of keys) Phaser.Input.Keyboard.JustDown(key);
    }
  }

  /** Release every key this manager created. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;

    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.clearLatch);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.clearLatch);

    for (const keys of Object.values(this.keys)) {
      for (const key of keys) {
        key.removeAllListeners();
        this.scene.input.keyboard.removeKey(key, true);
      }
    }
    this.keys = {};
    this.pressLatch.clear();
  }
}
