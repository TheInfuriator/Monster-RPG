/**
 * Menu.js
 * ----------------------------------------------------------------------------
 * A reusable keyboard-driven vertical menu.
 *
 * Every menu in the game (title screen, battle actions, the pause menu, shops)
 * uses this one component, so navigation feels identical everywhere and there is
 * only one place to fix a navigation bug.
 *
 * Usage:
 *   const menu = new Menu(scene, {
 *     x: 100, y: 100,
 *     items: [{ label: 'New Game', value: 'new' }],
 *     onSelect: (item) => { ... },
 *   });
 *   // then, in the scene's update():
 *   menu.update(input);
 */

import { DEPTHS, TEXT_STYLES, CSS_COLORS } from '../config/gameConfig.js';
import { ASSET_KEYS } from '../config/assets.js';

export class Menu {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} options
   * @param {number} options.x                left edge of the menu text
   * @param {number} options.y                top of the first item
   * @param {Array<{label: string, value?: any, enabled?: boolean, hint?: string}>} options.items
   * @param {(item: object, index: number) => void} [options.onSelect]
   * @param {() => void} [options.onCancel]
   * @param {(item: object, index: number) => void} [options.onChange]
   * @param {number} [options.spacing]        vertical gap between items
   * @param {boolean} [options.wrap]          whether moving past the end loops around
   * @param {boolean} [options.fixedToCamera] true for HUD menus that must not scroll
   */
  constructor(scene, options) {
    this.scene = scene;
    this.items = options.items;
    this.onSelect = options.onSelect || (() => {});
    this.onCancel = options.onCancel || null;
    this.onChange = options.onChange || null;
    this.spacing = options.spacing ?? 24;
    this.wrap = options.wrap ?? true;
    this.x = options.x;
    this.y = options.y;

    /** Set to true to make the menu ignore input without destroying it. */
    this.locked = false;

    this.index = this.findFirstEnabledIndex();

    // --- Build the text objects ---
    this.texts = this.items.map((item, i) => {
      const text = scene.add
        .text(this.x, this.y + i * this.spacing, item.label, TEXT_STYLES.menuItem)
        .setOrigin(0, 0.5)
        .setDepth(DEPTHS.ui);

      if (item.enabled === false) text.setColor(CSS_COLORS.parchmentDim);
      if (options.fixedToCamera) text.setScrollFactor(0);
      return text;
    });

    // --- The selection arrow ---
    this.cursor = scene.add
      .image(this.x - 14, this.y, ASSET_KEYS.uiCursor)
      .setOrigin(0.5)
      .setDepth(DEPTHS.ui);
    if (options.fixedToCamera) this.cursor.setScrollFactor(0);

    // A gentle pulse so the cursor reads as "active" at a glance.
    this.cursorTween = scene.tweens.add({
      targets: this.cursor,
      x: this.cursor.x - 3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.refresh();
  }

  /** The first selectable item, so a menu never opens on a disabled entry. */
  findFirstEnabledIndex() {
    const index = this.items.findIndex((item) => item.enabled !== false);
    return index === -1 ? 0 : index;
  }

  /** The currently highlighted item. */
  get selected() {
    return this.items[this.index];
  }

  /**
   * Move the highlight, skipping disabled entries.
   * @param {number} step +1 for down, -1 for up
   */
  move(step) {
    const count = this.items.length;
    let next = this.index;

    // Walk at most `count` places looking for an enabled item.
    for (let attempts = 0; attempts < count; attempts += 1) {
      next += step;

      if (next < 0 || next >= count) {
        if (!this.wrap) return;
        next = (next + count) % count;
      }

      if (this.items[next].enabled !== false) {
        if (next === this.index) return;
        this.index = next;
        this.refresh();
        if (this.onChange) this.onChange(this.selected, this.index);
        return;
      }
    }
    // Every item is disabled: leave the highlight where it is.
  }

  /** Redraw highlight colours and move the cursor to the current row. */
  refresh() {
    this.texts.forEach((text, i) => {
      const item = this.items[i];
      if (item.enabled === false) {
        text.setColor(CSS_COLORS.parchmentDim);
      } else {
        text.setColor(i === this.index ? CSS_COLORS.accent : CSS_COLORS.parchment);
      }
    });

    const targetY = this.y + this.index * this.spacing;
    this.cursor.setY(targetY);

    // Re-anchor the pulse tween to the new row.
    if (this.cursorTween) {
      this.cursorTween.stop();
      this.cursor.setX(this.x - 14);
      this.cursorTween = this.scene.tweens.add({
        targets: this.cursor,
        x: this.x - 17,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Handle input. Call once per frame from the scene's update().
   * @param {import('../core/InputManager.js').InputManager} input
   */
  update(input) {
    if (this.locked) return;

    if (input.justPressed('up')) this.move(-1);
    if (input.justPressed('down')) this.move(1);

    if (input.justPressed('confirm')) {
      const item = this.selected;
      if (item && item.enabled !== false) this.onSelect(item, this.index);
    }

    if (input.justPressed('cancel') && this.onCancel) {
      this.onCancel();
    }
  }

  /** Remove every game object this menu created. */
  destroy() {
    if (this.cursorTween) this.cursorTween.stop();
    this.texts.forEach((text) => text.destroy());
    this.cursor.destroy();
    this.texts = [];
  }
}
