/**
 * TitleScene.js
 * ----------------------------------------------------------------------------
 * The title screen: game logo, a keyboard menu, and the control hints.
 *
 * "Continue" is shown but disabled until the save system lands in Phase 10.
 * It is disabled rather than hidden so the menu layout does not jump around
 * once saving works.
 */

import Phaser from 'phaser';
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CSS_COLORS,
  TEXT_STYLES,
  FONT_FAMILY,
  DEPTHS,
} from '../config/gameConfig.js';
import { CONTROL_HINTS } from '../config/controls.js';
import { InputManager } from '../core/InputManager.js';
import { Menu } from '../ui/Menu.js';
import { startNewGame } from '../core/GameState.js';
import { fadeToScene, fadeIn } from '../utils/transitions.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.TITLE });
  }

  create() {
    // `this.controls` (our action wrapper) is deliberately NOT called `this.input`,
    // because Phaser already owns `scene.input` for its own keyboard/mouse plugin.
    this.controls = new InputManager(this);

    this.buildBackdrop();
    this.buildTitle();
    this.buildMenu();
    this.buildControlHints();

    fadeIn(this);
  }

  /** A simple layered backdrop: sky gradient bands and a rolling hill silhouette. */
  buildBackdrop() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    const bands = [
      { color: 0x243044, height: 0.55 },
      { color: 0x2c3a52, height: 0.62 },
      { color: 0x33455f, height: 0.7 },
    ];
    bands.forEach((band) => {
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT * band.height, band.color)
        .setOrigin(0, 0);
    });

    // Distant hills, drawn as overlapping ellipses.
    const hills = this.add.graphics();
    hills.fillStyle(0x2f5c2a, 1);
    hills.fillEllipse(90, 250, 320, 150);
    hills.fillEllipse(330, 262, 380, 160);
    hills.fillStyle(0x234420, 1);
    hills.fillEllipse(220, 292, 460, 130);

    // Foreground ground.
    this.add
      .rectangle(0, GAME_HEIGHT - 34, GAME_WIDTH, 34, COLORS.grassDark)
      .setOrigin(0, 0);

    // A few stars in the upper sky.
    const stars = this.add.graphics();
    stars.fillStyle(COLORS.parchment, 0.7);
    const positions = [
      [40, 30], [98, 58], [160, 24], [225, 46], [300, 28],
      [366, 60], [420, 34], [452, 72], [268, 74], [130, 88],
    ];
    positions.forEach(([x, y], i) => stars.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1));
  }

  buildTitle() {
    const centerX = GAME_WIDTH / 2;

    const title = this.add
      .text(centerX, 66, 'AETHERIA', {
        ...TEXT_STYLES.title,
        fontSize: '44px',
        color: CSS_COLORS.accent,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);
    title.setShadow(0, 3, '#000000', 0, true, true);

    this.add
      .text(centerX, 100, 'C H R O N I C L E S', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        color: CSS_COLORS.parchment,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);

    // A slow bob, so the screen is not completely static.
    this.tweens.add({
      targets: title,
      y: title.y - 4,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  buildMenu() {
    this.menu = new Menu(this, {
      x: GAME_WIDTH / 2 - 44,
      y: 150,
      spacing: 26,
      items: [
        { label: 'New Game', value: 'new' },
        // Enabled once the save system exists (Phase 10).
        { label: 'Continue', value: 'continue', enabled: false },
      ],
      onSelect: (item) => this.handleSelect(item),
    });
  }

  buildControlHints() {
    const startY = GAME_HEIGHT - 74;

    // A dark backing panel, so the hints stay readable over the light ground band.
    this.add
      .rectangle(GAME_WIDTH / 2, startY + 20, 250, 84, COLORS.ink, 0.72)
      .setOrigin(0.5)
      .setStrokeStyle(1, COLORS.accentDark, 0.6);

    this.add
      .text(GAME_WIDTH / 2, startY - 12, 'CONTROLS', {
        ...TEXT_STYLES.small,
        color: CSS_COLORS.accentDark,
      })
      .setOrigin(0.5);

    CONTROL_HINTS.forEach(([keys, action], i) => {
      const y = startY + 6 + i * 13;
      this.add.text(GAME_WIDTH / 2 - 112, y, keys, TEXT_STYLES.small).setOrigin(0, 0.5);
      this.add
        .text(GAME_WIDTH / 2 + 112, y, action, {
          ...TEXT_STYLES.small,
          color: CSS_COLORS.parchment,
        })
        .setOrigin(1, 0.5);
    });
  }

  handleSelect(item) {
    if (item.value !== 'new') return;

    // Wipe any in-memory progress and start fresh.
    // (Player naming arrives with the intro sequence in Phase 2.)
    startNewGame();

    this.menu.locked = true;
    fadeToScene(this, SCENES.WORLD);
  }

  update() {
    this.menu.update(this.controls);
  }
}
