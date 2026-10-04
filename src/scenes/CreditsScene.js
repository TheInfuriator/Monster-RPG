/**
 * CreditsScene.js
 * ----------------------------------------------------------------------------
 * The credits (Phase 14), rolled once after the ending. The words come from
 * EndingSystem.buildCredits() — honest attribution, and the player's own team
 * to close — and this scene only scrolls them.
 *
 * NEVER A TRAP
 *   - Confirm or Cancel at any point skips the roll to the end card.
 *   - At the end card, Confirm or Cancel carries on into the game.
 *   - Only FRESH presses count (a key held through the ending does nothing),
 *     and each step waits a moment before it listens, so one press can never
 *     both skip the roll and dismiss the end card.
 */

import Phaser from 'phaser';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, CSS_COLORS, TEXT_STYLES, FONT_FAMILY,
} from '../config/gameConfig.js';
import { InputManager } from '../core/InputManager.js';

/** How fast the roll climbs, in pixels a second. */
const SCROLL_SPEED = 30;
/** How long a step waits before it will take a press. */
const INPUT_GRACE_MS = 600;
const FADE_MS = 400;

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CREDITS });
  }

  /**
   * @param {object} data
   * @param {Array<{heading?: string, lines: string[]}>} data.credits
   * @param {() => void} data.onFinished
   */
  init(data) {
    this.credits = data?.credits || [];
    this.onFinished = data?.onFinished || null;
    this.stage = 'rolling'; // 'rolling' | 'endCard' | 'done'
    this.readyAt = Infinity;
  }

  create() {
    this.controls = new InputManager(this);
    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.roll = this.add.container(0, GAME_HEIGHT + 10);
    let y = 0;
    for (const block of this.credits) {
      if (block.heading) {
        this.roll.add(this.add.text(GAME_WIDTH / 2, y, block.heading, {
          ...TEXT_STYLES.heading, fontSize: '15px', color: CSS_COLORS.accent, align: 'center',
        }).setOrigin(0.5, 0));
        y += 24;
      }
      for (const line of block.lines) {
        const text = this.add.text(GAME_WIDTH / 2, y, line, {
          ...TEXT_STYLES.body, fontSize: '12px', align: 'center', wordWrap: { width: GAME_WIDTH - 60 },
        }).setOrigin(0.5, 0);
        this.roll.add(text);
        y += text.height + 4;
      }
      y += 22;
    }
    this.rollHeight = y;

    this.hint = this.add
      .text(GAME_WIDTH - 12, GAME_HEIGHT - 10, 'Confirm: skip', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.parchmentDim,
      })
      .setOrigin(1, 1);

    this.readyAt = this.time.now + INPUT_GRACE_MS;
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
  }

  update(time, delta) {
    // Both read every frame, so neither press is left latched for later.
    const confirm = this.controls.justPressed('confirm');
    const cancel = this.controls.justPressed('cancel');
    const pressed = confirm || cancel;

    if (this.stage === 'rolling') {
      this.roll.y -= (SCROLL_SPEED * delta) / 1000;
      // The roll has gone by: the end card.
      if (this.roll.y + this.rollHeight < GAME_HEIGHT * 0.25 || (pressed && time >= this.readyAt)) {
        this.showEndCard();
      }
      return;
    }

    if (this.stage === 'endCard' && pressed && time >= this.readyAt) this.finish();
  }

  showEndCard() {
    this.stage = 'endCard';
    this.roll.setVisible(false);
    this.hint.setVisible(false);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 'THE END', {
      ...TEXT_STYLES.title, fontSize: '30px', color: CSS_COLORS.accent,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 'The Aerie is open. Your adventure goes on.', {
      ...TEXT_STYLES.body, fontSize: '13px',
    }).setOrigin(0.5);
    this.endPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'Press Confirm to carry on', {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: CSS_COLORS.parchmentDim,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.endPrompt, alpha: 1, delay: INPUT_GRACE_MS, duration: 300 });

    // A fresh wait: the press that skipped the roll cannot also close the card.
    this.readyAt = this.time.now + INPUT_GRACE_MS;
  }

  finish() {
    if (this.stage === 'done') return;
    this.stage = 'done';
    this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const done = this.onFinished;
      this.scene.stop();
      if (done) done();
    });
  }
}
