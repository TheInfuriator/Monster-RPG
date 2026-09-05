/**
 * transitions.js
 * ----------------------------------------------------------------------------
 * One shared way to move between scenes, so every transition in the game looks
 * and feels the same: fade to black, swap scene, fade back in.
 *
 * Using a helper rather than calling `scene.start()` directly also prevents a
 * common bug — the player pressing a key twice during a fade and starting the
 * next scene twice.
 */

import { FADE_DURATION } from '../config/gameConfig.js';

/**
 * Fade out, then start another scene.
 *
 * @param {Phaser.Scene} scene      the scene we are leaving
 * @param {string} nextSceneKey     the scene to start
 * @param {object} [data]           data handed to the next scene's init()
 * @param {number} [duration]       fade length in ms
 */
export function fadeToScene(scene, nextSceneKey, data = {}, duration = FADE_DURATION) {
  // Guard against double-triggering while a fade is already running.
  if (scene.__isTransitioning) return;
  scene.__isTransitioning = true;

  scene.cameras.main.fadeOut(duration, 0, 0, 0);

  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.__isTransitioning = false;
    scene.scene.start(nextSceneKey, data);
  });
}

/**
 * Fade in from black. Call at the end of a scene's `create()`.
 *
 * @param {Phaser.Scene} scene
 * @param {number} [duration]
 */
export function fadeIn(scene, duration = FADE_DURATION) {
  scene.cameras.main.fadeIn(duration, 0, 0, 0);
}
