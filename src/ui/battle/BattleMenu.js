/**
 * BattleMenu.js
 * ----------------------------------------------------------------------------
 * A two-column keyboard menu, used for the battle's action choice and its move
 * list. The overworld's vertical `Menu` is the wrong shape here — a battle wants
 * four options laid out in a square, and moves want a second line of detail
 * (type and PP) under each entry.
 *
 * Navigation matches the rest of the game: arrows move, confirm selects,
 * cancel backs out.
 */

import {
  COLORS, CSS_COLORS, TEXT_STYLES, FONT_FAMILY, DEPTHS,
} from '../../config/gameConfig.js';

export class BattleMenu {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} options
   * @param {number} options.x  top-left of the menu box
   * @param {number} options.y
   * @param {number} options.width
   * @param {number} options.height
   * @param {number} [options.columns]
   * @param {(item: object, index: number) => void} options.onSelect
   * @param {() => void} [options.onCancel]
   */
  constructor(scene, options) {
    this.scene = scene;
    this.columns = options.columns ?? 2;
    this.onSelect = options.onSelect;
    this.onCancel = options.onCancel || null;
    this.items = [];
    this.index = 0;
    this.locked = false;

    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;

    // Above the message box, not below it: battle menus are drawn over the
    // right-hand side of the message panel, so they must win the depth test.
    this.container = scene.add.container(this.x, this.y).setDepth(DEPTHS.dialogue + 10);

    this.border = scene.add
      .rectangle(0, 0, this.width, this.height, COLORS.parchment).setOrigin(0, 0);
    this.fill = scene.add
      .rectangle(3, 3, this.width - 6, this.height - 6, COLORS.ink).setOrigin(0, 0);

    this.container.add([this.border, this.fill]);

    this.entryObjects = [];
    this.hint = null;
  }

  /**
   * Replace the menu contents.
   * @param {Array<{label:string, detail?:string, accent?:number, enabled?:boolean, value:any}>} items
   */
  setItems(items) {
    for (const objects of this.entryObjects) {
      for (const object of objects) object.destroy();
    }
    this.entryObjects = [];
    this.items = items;
    this.index = this.firstEnabledIndex();

    const rows = Math.ceil(items.length / this.columns);
    const cellWidth = (this.width - 20) / this.columns;
    const cellHeight = (this.height - 18) / Math.max(1, rows);

    items.forEach((item, i) => {
      const column = i % this.columns;
      const row = Math.floor(i / this.columns);
      const cx = 12 + column * cellWidth;
      const cy = 11 + row * cellHeight;

      const label = this.scene.add
        .text(cx + 12, cy + (item.detail ? 8 : cellHeight / 2 - 2), item.label, {
          ...TEXT_STYLES.body, fontSize: '13px',
        })
        .setOrigin(0, 0.5);

      const objects = [label];

      if (item.detail) {
        const detail = this.scene.add
          .text(cx + 12, cy + 23, item.detail, {
            fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.parchmentDim,
          })
          .setOrigin(0, 0.5);
        objects.push(detail);
      }

      // A small coloured pip for a move's type.
      if (item.accent !== undefined) {
        const pip = this.scene.add
          .rectangle(cx + 4, cy + 8, 4, 12, item.accent).setOrigin(0, 0.5);
        objects.push(pip);
      }

      this.container.add(objects);
      this.entryObjects.push(objects);
    });

    // The selection arrow.
    if (!this.cursor) {
      this.cursor = this.scene.add.text(0, 0, '>', {
        ...TEXT_STYLES.body, fontSize: '14px', color: CSS_COLORS.accent, fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(this.cursor);
    }

    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.refresh();
  }

  /** An optional line of text under the menu, e.g. a move's description. */
  setHint(text) {
    if (!this.hint) {
      this.hint = this.scene.add
        .text(12, this.height - 12, '', {
          fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.accentDark,
        })
        .setOrigin(0, 0.5);
      this.container.add(this.hint);
    }
    this.hint.setText(text || '');
  }

  firstEnabledIndex() {
    const index = this.items.findIndex((item) => item.enabled !== false);
    return index === -1 ? 0 : index;
  }

  get selected() {
    return this.items[this.index];
  }

  refresh() {
    this.items.forEach((item, i) => {
      const objects = this.entryObjects[i];
      if (!objects) return;

      const disabled = item.enabled === false;
      const selected = i === this.index;

      objects[0].setColor(
        disabled ? CSS_COLORS.parchmentDim
          : selected ? CSS_COLORS.accent : CSS_COLORS.parchment
      );
      for (const object of objects) object.setAlpha(disabled ? 0.45 : 1);
    });

    const column = this.index % this.columns;
    const row = Math.floor(this.index / this.columns);
    this.cursor.setPosition(
      6 + column * this.cellWidth,
      11 + row * this.cellHeight + (this.selected?.detail ? 8 : this.cellHeight / 2 - 2)
    );

    if (this.hint) this.hint.setText(this.selected?.hint || '');
  }

  /** Move the highlight, skipping disabled entries. */
  move(deltaColumn, deltaRow) {
    const count = this.items.length;
    if (count === 0) return;

    const step = deltaColumn + deltaRow * this.columns;
    if (step === 0) return;

    let next = this.index;
    for (let attempts = 0; attempts < count; attempts += 1) {
      next = (next + step + count) % count;
      if (this.items[next].enabled !== false) break;
    }

    if (next === this.index) return;
    this.index = next;
    this.refresh();
  }

  /** @param {import('../../core/InputManager.js').InputManager} input */
  update(input) {
    if (this.locked) return;
    // A hidden menu must never react to keys. The scene's phase can still say
    // "party" or "learnMove" for a moment after the list has been put away
    // while the results are narrated, and a stray press must not re-run the
    // choice that was already made.
    if (!this.container.visible) return;

    if (input.justPressed('left')) this.move(-1, 0);
    if (input.justPressed('right')) this.move(1, 0);
    if (input.justPressed('up')) this.move(0, -1);
    if (input.justPressed('down')) this.move(0, 1);

    if (input.justPressed('confirm')) {
      const item = this.selected;
      if (item && item.enabled !== false) this.onSelect(item, this.index);
    }

    if (input.justPressed('cancel') && this.onCancel) this.onCancel();
  }

  setVisible(visible) {
    this.container.setVisible(visible);
    return this;
  }

  destroy() {
    this.container.destroy(true);
  }
}
