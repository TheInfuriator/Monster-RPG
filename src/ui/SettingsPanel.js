/**
 * SettingsPanel.js
 * ----------------------------------------------------------------------------
 * The Settings screen: text speed and master volume.
 *
 * ONE panel, used by both the title screen and the pause menu, so the two can
 * never drift apart. It draws itself, reads the keyboard through whatever
 * InputManager its scene hands to `update()`, and calls `onClose` when the
 * player backs out. It owns no rules — every change goes through
 * `updateSettings()`, which checks it, stores it, and tells the game.
 *
 *   Up / Down      choose a row
 *   Left / Right   change the value
 *   Confirm        change the value (or leave, on Back)
 *   Cancel         leave
 *
 * Changes take effect and are stored the moment they are made; there is no
 * separate "apply". A sample line types itself out at the chosen text speed
 * so the player can see what they picked before any real dialogue.
 */

import {
  COLORS, CSS_COLORS, FONT_FAMILY,
} from '../config/gameConfig.js';
import {
  getSettings, getTypeDelay, updateSettings, TEXT_SPEED_IDS, TEXT_SPEED_LABELS, VOLUME,
} from '../core/Settings.js';

const ROWS = ['textSpeed', 'masterVolume', 'back'];
const SAMPLE_TEXT = 'Text will appear at this speed.';

/** One step through a list, wrapping at either end. */
function cycle(list, current, step) {
  const index = list.indexOf(current);
  return list[(index + step + list.length) % list.length];
}

export class SettingsPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} options
   * @param {number} options.x        left edge of the panel
   * @param {number} options.y        top edge of the panel
   * @param {number} options.width
   * @param {number} options.height
   * @param {number} options.depth
   * @param {() => void} options.onClose
   */
  constructor(scene, options) {
    this.scene = scene;
    this.options = options;
    this.onClose = options.onClose || (() => {});
    this.index = 0;
    this.sampleEvent = null;
    this.closed = false;

    this.container = scene.add.container(0, 0).setDepth(options.depth).setScrollFactor(0);
    this.draw();
    this.typeSample();
  }

  text(x, y, value, style = {}) {
    const object = this.scene.add.text(x, y, value, {
      fontFamily: FONT_FAMILY, fontSize: '11px', color: CSS_COLORS.parchment, ...style,
    });
    this.container.add(object);
    return object;
  }

  box(x, y, width, height, colour, alpha = 1) {
    const object = this.scene.add.rectangle(x, y, width, height, colour, alpha).setOrigin(0, 0);
    this.container.add(object);
    return object;
  }

  /** Redraw everything except the sample line, which types itself. */
  draw() {
    const { x, y, width, height } = this.options;
    const settings = getSettings();

    // Keep the sample text object across redraws so its typing is not reset
    // by moving the cursor.
    const sample = this.sample;
    if (sample) this.container.remove(sample, false);
    this.container.removeAll(true);

    this.box(x, y, width, height, COLORS.parchment);
    this.box(x + 3, y + 3, width - 6, height - 6, COLORS.ink);
    this.text(x + 14, y + 12, 'SETTINGS', { fontSize: '14px' });

    const rowX = x + 20;
    const valueX = x + width - 150;
    const rowY = (i) => y + 48 + i * 34;

    ROWS.forEach((row, i) => {
      const selected = i === this.index;
      if (selected) this.box(rowX - 8, rowY(i) - 5, width - 24, 26, COLORS.inkLight);
      const colour = selected ? CSS_COLORS.accent : CSS_COLORS.parchment;

      if (row === 'textSpeed') {
        this.text(rowX, rowY(i), 'Text speed', { fontSize: '13px', color: colour });
        this.text(valueX, rowY(i), `<  ${TEXT_SPEED_LABELS[settings.textSpeed]}  >`, {
          fontSize: '13px', color: colour,
        });
      } else if (row === 'masterVolume') {
        this.text(rowX, rowY(i), 'Volume', { fontSize: '13px', color: colour });
        this.text(valueX, rowY(i), `<  ${settings.masterVolume}  >`, { fontSize: '13px', color: colour });
        this.drawVolumeBar(valueX + 72, rowY(i) + 4, settings.masterVolume);
      } else {
        this.text(rowX, rowY(i), 'Back', { fontSize: '13px', color: colour });
      }
    });

    // What the highlighted row does, in a sentence.
    const help = {
      textSpeed: 'How quickly dialogue and battle text appear.',
      masterVolume: `Overall loudness, ${VOLUME.min} to ${VOLUME.max}. There is no music or sound yet.`,
      back: 'Settings are kept for every game, including a New Game.',
    }[ROWS[this.index]];
    this.text(rowX, y + height - 64, help, {
      color: CSS_COLORS.parchmentDim, wordWrap: { width: width - 40 },
    });

    this.box(rowX - 8, y + height - 42, width - 24, 22, COLORS.inkLight, 0.6);
    if (sample) {
      this.container.add(sample);
    } else {
      this.sample = this.text(rowX, y + height - 38, '', { color: CSS_COLORS.parchment });
    }

    this.text(x + 14, y + height - 14, 'Up/Down choose   Left/Right change   Cancel back', {
      fontSize: '9px', color: CSS_COLORS.parchmentDim,
    });
  }

  drawVolumeBar(x, y, volume) {
    const segments = (VOLUME.max - VOLUME.min) / VOLUME.step;
    const filled = Math.round((volume - VOLUME.min) / VOLUME.step);
    for (let i = 0; i < segments; i += 1) {
      this.box(x + i * 5, y, 4, 8, i < filled ? COLORS.accent : COLORS.inkLight);
    }
  }

  /** Type the sample line out at the current speed, from the beginning. */
  typeSample() {
    if (this.sampleEvent) {
      this.sampleEvent.remove(false);
      this.sampleEvent = null;
    }

    const delay = getTypeDelay();
    if (delay <= 0) {
      this.sample.setText(SAMPLE_TEXT);
      return;
    }

    let shown = 0;
    this.sample.setText('');
    this.sampleEvent = this.scene.time.addEvent({
      delay,
      repeat: SAMPLE_TEXT.length - 1,
      callback: () => {
        shown += 1;
        this.sample.setText(SAMPLE_TEXT.slice(0, shown));
      },
    });
  }

  /** Change the highlighted row's value by one step. */
  change(step) {
    const settings = getSettings();
    const row = ROWS[this.index];

    if (row === 'textSpeed') {
      updateSettings({ textSpeed: cycle(TEXT_SPEED_IDS, settings.textSpeed, step) });
      this.draw();
      this.typeSample();
    } else if (row === 'masterVolume') {
      const next = Math.min(Math.max(settings.masterVolume + step * VOLUME.step, VOLUME.min), VOLUME.max);
      if (next !== settings.masterVolume) {
        updateSettings({ masterVolume: next });
        this.draw();
      }
    }
  }

  /**
   * Read the keyboard. Call once per frame while the panel is open.
   * @param {import('../core/InputManager.js').InputManager} input
   */
  update(input) {
    if (this.closed) return;

    if (input.justPressed('up')) {
      this.index = (this.index - 1 + ROWS.length) % ROWS.length;
      this.draw();
    }
    if (input.justPressed('down')) {
      this.index = (this.index + 1) % ROWS.length;
      this.draw();
    }
    if (input.justPressed('left')) this.change(-1);
    if (input.justPressed('right')) this.change(1);

    if (input.justPressed('confirm')) {
      if (ROWS[this.index] === 'back') this.close();
      else this.change(1);
      return;
    }
    if (input.justPressed('cancel')) this.close();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.destroy();
    this.onClose();
  }

  destroy() {
    if (this.sampleEvent) {
      this.sampleEvent.remove(false);
      this.sampleEvent = null;
    }
    if (this.container) {
      this.container.destroy(true);
      this.container = null;
    }
    this.sample = null;
  }
}
