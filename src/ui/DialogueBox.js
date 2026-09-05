/**
 * DialogueBox.js
 * ----------------------------------------------------------------------------
 * The box at the bottom of the screen that shows what people say.
 *
 * Features:
 *  - types text out one character at a time, at the player's chosen speed
 *  - pressing confirm while typing skips to the full page (never punishes an
 *    impatient player by making them wait)
 *  - pressing confirm on a finished page moves to the next one
 *  - a blinking arrow shows when a page is ready to advance
 *  - an optional name plate above the box for the speaker
 *
 * The box is fixed to the camera, so it stays put while the world scrolls.
 * It creates its objects once and hides them between conversations rather than
 * building and destroying them every time someone talks.
 */

import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CSS_COLORS,
  TEXT_STYLES,
  FONT_FAMILY,
  DEPTHS,
} from '../config/gameConfig.js';
import { TEXT_SPEEDS, DIALOGUE } from '../config/balance.js';
import { gameState } from '../core/GameState.js';

const BOX_HEIGHT = 78;
const BOX_MARGIN = 8;
const TEXT_PADDING_X = 14;
const TEXT_PADDING_Y = 12;

export class DialogueBox {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;

    this.isOpen = false;
    this.pages = [];
    this.pageIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;
    this.onComplete = null;
    this.typeTimer = null;
    this.advanceReadyAt = 0;

    this.buildObjects();
  }

  buildObjects() {
    const boxWidth = GAME_WIDTH - BOX_MARGIN * 2;
    const boxTop = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;

    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTHS.dialogue)
      .setVisible(false);

    // Panel: light outer border, dark fill — matches the game's UI style.
    const border = this.scene.add
      .rectangle(BOX_MARGIN, boxTop, boxWidth, BOX_HEIGHT, COLORS.parchment)
      .setOrigin(0, 0);
    const fill = this.scene.add
      .rectangle(BOX_MARGIN + 3, boxTop + 3, boxWidth - 6, BOX_HEIGHT - 6, COLORS.ink)
      .setOrigin(0, 0);
    const inner = this.scene.add
      .rectangle(BOX_MARGIN + 5, boxTop + 5, boxWidth - 10, BOX_HEIGHT - 10, COLORS.inkLight)
      .setOrigin(0, 0);

    this.text = this.scene.add.text(
      BOX_MARGIN + TEXT_PADDING_X,
      boxTop + TEXT_PADDING_Y,
      '',
      {
        ...TEXT_STYLES.body,
        fontSize: '15px',
        lineSpacing: 6,
        // Wrap inside the box so long lines never run off the edge.
        wordWrap: { width: boxWidth - TEXT_PADDING_X * 2 },
      }
    );

    // The blinking "press to continue" arrow.
    this.advanceArrow = this.scene.add
      .triangle(
        GAME_WIDTH - BOX_MARGIN - 18,
        GAME_HEIGHT - BOX_MARGIN - 16,
        0, 0, 10, 0, 5, 7,
        COLORS.accent
      )
      .setVisible(false);

    // Speaker name plate, shown only when a speaker is given.
    this.nameBorder = this.scene.add
      .rectangle(BOX_MARGIN + 6, boxTop - 17, 90, 20, COLORS.parchment)
      .setOrigin(0, 0)
      .setVisible(false);
    this.nameFill = this.scene.add
      .rectangle(BOX_MARGIN + 8, boxTop - 15, 86, 16, COLORS.ink)
      .setOrigin(0, 0)
      .setVisible(false);
    this.nameText = this.scene.add
      .text(BOX_MARGIN + 14, boxTop - 7, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: CSS_COLORS.accent,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.container.add([
      border, fill, inner,
      this.nameBorder, this.nameFill, this.nameText,
      this.text, this.advanceArrow,
    ]);

    this.arrowTween = this.scene.tweens.add({
      targets: this.advanceArrow,
      y: this.advanceArrow.y + 3,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true,
    });
  }

  /** Milliseconds per character, from the player's settings. */
  get typeDelay() {
    const speed = gameState.settings?.textSpeed ?? DIALOGUE.defaultTextSpeed;
    return TEXT_SPEEDS[speed] ?? TEXT_SPEEDS.normal;
  }

  /**
   * Show a conversation.
   *
   * @param {string[]} pages
   * @param {object} [options]
   * @param {string|null} [options.speaker]
   * @param {() => void} [options.onComplete] called after the last page closes
   * @returns {boolean} false if there was nothing to show
   */
  show(pages, options = {}) {
    if (!pages || pages.length === 0) return false;

    this.pages = pages;
    this.pageIndex = 0;
    this.onComplete = options.onComplete || null;
    this.isOpen = true;

    this.setSpeaker(options.speaker || null);
    this.container.setVisible(true);
    this.startPage();
    return true;
  }

  setSpeaker(speaker) {
    const show = Boolean(speaker);
    if (show) {
      this.nameText.setText(speaker);
      // Size the plate to the name so it never crops or leaves a long gap.
      const width = this.nameText.width + 16;
      this.nameBorder.setSize(width + 4, 20);
      this.nameFill.setSize(width, 16);
    }
    this.nameBorder.setVisible(show);
    this.nameFill.setVisible(show);
    this.nameText.setVisible(show);
  }

  /** Begin typing out the current page. */
  startPage() {
    this.stopTyping();

    this.charIndex = 0;
    this.text.setText('');
    this.advanceArrow.setVisible(false);
    this.arrowTween.pause();

    const page = this.pages[this.pageIndex];
    const delay = this.typeDelay;

    if (delay <= 0) {
      this.finishPage();
      return;
    }

    this.isTyping = true;
    this.typeTimer = this.scene.time.addEvent({
      delay,
      repeat: page.length - 1,
      callback: () => {
        this.charIndex += 1;
        this.text.setText(page.slice(0, this.charIndex));
        if (this.charIndex >= page.length) this.finishPage();
      },
    });
  }

  /** Show the whole page at once and offer the advance arrow. */
  finishPage() {
    this.stopTyping();
    this.text.setText(this.pages[this.pageIndex]);
    this.isTyping = false;

    this.advanceArrow.setVisible(true);
    this.arrowTween.resume();

    // Brief lockout so a held key does not skip the page the instant it appears.
    this.advanceReadyAt = this.scene.time.now + DIALOGUE.advanceLockoutMs;
  }

  stopTyping() {
    if (this.typeTimer) {
      this.typeTimer.remove(false);
      this.typeTimer = null;
    }
    this.isTyping = false;
  }

  /**
   * React to a confirm press.
   * @returns {boolean} true if the press was consumed by the dialogue box
   */
  advance() {
    if (!this.isOpen) return false;

    // Still typing? Skip to the full page instead of waiting.
    if (this.isTyping) {
      this.finishPage();
      return true;
    }

    if (this.scene.time.now < this.advanceReadyAt) return true;

    if (this.pageIndex < this.pages.length - 1) {
      this.pageIndex += 1;
      this.startPage();
      return true;
    }

    this.close();
    return true;
  }

  close() {
    this.stopTyping();
    this.isOpen = false;
    this.container.setVisible(false);
    this.advanceArrow.setVisible(false);
    this.arrowTween.pause();

    const callback = this.onComplete;
    this.onComplete = null;
    // Fire last, so a callback that opens another dialogue works correctly.
    if (callback) callback();
  }

  /**
   * Handle input. Call once per frame from the scene's update().
   * @param {import('../core/InputManager.js').InputManager} input
   * @returns {boolean} true if the dialogue box used this frame's input
   */
  update(input) {
    if (!this.isOpen) return false;
    if (input.justPressed('confirm') || input.justPressed('cancel')) this.advance();
    return true;
  }

  destroy() {
    this.stopTyping();
    if (this.arrowTween) this.arrowTween.stop();
    this.container.destroy(true);
  }
}
