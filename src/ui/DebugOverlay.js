/**
 * DebugOverlay.js
 * ----------------------------------------------------------------------------
 * A developer-only readout, toggled with the backtick (`) key.
 *
 * Deliberately isolated from gameplay: it only ever READS state, it is fixed to
 * the camera so it never interferes with the world, and it starts hidden. No
 * gameplay code should ever depend on it existing.
 *
 * Later phases add a full debug menu (teleport, give items, set levels) — this
 * is the display half of that system.
 */

import { DEPTHS, CSS_COLORS, FONT_FAMILY } from '../config/gameConfig.js';

export class DebugOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {() => string[]} getLines  called each frame; returns the text to show
   */
  constructor(scene, getLines) {
    this.scene = scene;
    this.getLines = getLines;
    this.visible = false;

    this.background = scene.add
      .rectangle(4, 4, 200, 74, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTHS.debug)
      .setVisible(false);

    this.text = scene.add
      .text(9, 8, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: CSS_COLORS.good,
        lineSpacing: 2,
      })
      .setScrollFactor(0)
      .setDepth(DEPTHS.debug + 1)
      .setVisible(false);
  }

  toggle() {
    this.visible = !this.visible;
    this.background.setVisible(this.visible);
    this.text.setVisible(this.visible);
  }

  /** Refresh the readout. Cheap, but skipped entirely while hidden. */
  update() {
    if (!this.visible) return;

    const lines = this.getLines();
    this.text.setText(lines);

    // Keep the panel snug around however many lines there are.
    this.background.setSize(
      Math.max(200, this.text.width + 10),
      this.text.height + 8
    );
  }
}
