/**
 * main.js
 * ----------------------------------------------------------------------------
 * The entry point. Creates the Phaser game and registers every scene.
 *
 * Anything that needs to happen exactly once, before the game exists, belongs
 * here. Everything else belongs in a scene or a system.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/gameConfig.js';
import { gameState } from './core/GameState.js';
import { installDebugTools } from './systems/DebugTools.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { StarterSelectScene } from './scenes/StarterSelectScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { MenuScene } from './scenes/MenuScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.ink,

  // Crisp pixels: never smooth the art when the canvas is scaled up.
  pixelArt: true,
  roundPixels: true,

  scale: {
    // FIT keeps the aspect ratio and scales to the window; CENTER_BOTH centres it.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  // Arcade physics is not used yet (movement is grid-based and tween-driven),
  // but it costs nothing to leave off until a system actually needs it.

  scene: [BootScene, TitleScene, WorldScene, StarterSelectScene, BattleScene, MenuScene],
};

// Surface a boot failure on the page instead of leaving a black screen behind.
try {
  // Exposed for debugging in the browser console, e.g. `game.scene.keys`.
  window.game = new Phaser.Game(config);

  // A console handle on the current playthrough: `__gs()` in devtools shows
  // your flags, bag and position. Also what the browser test suite reads.
  window.__gs = () => gameState;

  // Developer tools. Nothing in the game imports these — they only reach in.
  installDebugTools(window.game);
} catch (error) {
  console.error('[main] The game failed to start:', error);

  const panel = document.getElementById('boot-error');
  const message = document.getElementById('boot-error-message');
  if (panel && message) {
    message.textContent = String(error && error.stack ? error.stack : error);
    panel.style.display = 'block';
  }
}
