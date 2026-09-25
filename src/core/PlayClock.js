/**
 * PlayClock.js
 * ----------------------------------------------------------------------------
 * Counts how long the current playthrough has been played, for the save
 * slots on the Continue screen ("Play time 1:24").
 *
 * The clock runs while a playthrough is in progress, which is whenever the
 * overworld exists — walking about, or paused underneath a battle or a menu,
 * since that is still time spent playing. It does not run on the title screen.
 *
 * One listener on Phaser's game loop does the counting, so no scene needs to
 * remember to do it.
 */

import { gameState } from './GameState.js';
import { SCENES } from '../config/gameConfig.js';

/**
 * Phaser's game-loop event (`Phaser.Core.Events.STEP`). Written out rather
 * than imported so this file needs no Phaser, and its rules can be unit
 * tested on their own.
 */
const GAME_STEP_EVENT = 'step';

/**
 * The most one frame may add. A browser that suspends a background tab can
 * hand back one enormous frame when the player returns; that is not play.
 */
export const MAX_FRAME_MS = 250;

/** Add one frame's worth of play time to a state. */
export function addPlayTime(state, deltaMs) {
  if (typeof deltaMs === 'number' && deltaMs > 0) {
    state.playTimeMs += Math.min(deltaMs, MAX_FRAME_MS);
  }
  return state.playTimeMs;
}

/** "0:07", "1:24", "12:03" — hours and minutes, the way a save slot shows it. */
export function formatPlayTime(ms) {
  const totalMinutes = Math.floor(Math.max(0, ms || 0) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Start counting. Called once from main.js.
 * @returns {() => void} stops the clock
 */
export function startPlayClock(game) {
  const tick = (_time, delta) => {
    const world = game.scene.getScene(SCENES.WORLD);
    if (!world || !(world.sys.isActive() || world.sys.isPaused())) return;
    addPlayTime(gameState, delta);
  };

  game.events.on(GAME_STEP_EVENT, tick);
  return () => game.events.off(GAME_STEP_EVENT, tick);
}
