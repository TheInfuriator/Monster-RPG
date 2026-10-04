/**
 * EndingScene.js
 * ----------------------------------------------------------------------------
 * The ending of the main story (Phase 14): a few pages of narration over a
 * picture drawn in code, shown once, after the Champion is beaten.
 *
 * Runs ON TOP of the paused overworld, like a battle. It draws; it decides
 * nothing — the pages come from EndingSystem, and WorldScene owns what
 * happens after (the credits, then free roam).
 *
 * CONTROLS
 *   Confirm   next page (each page shows for a moment before it will turn)
 *   Cancel    skip the rest of the ending, straight to the credits
 *
 * Only a FRESH press counts (InputManager ignores a key held down from the
 * Champion's last line), and nothing is accepted until the scene has faded
 * in, so one press can never turn two pages.
 */

import Phaser from 'phaser';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, CSS_COLORS, TEXT_STYLES, FONT_FAMILY,
} from '../config/gameConfig.js';
import { creatureTextureKey } from '../config/assets.js';
import { InputManager } from '../core/InputManager.js';

/** A page must be on screen this long before a press will turn it. */
const PAGE_HOLD_MS = 450;
const FADE_MS = 400;

/** Where the picture ends and the words begin. */
const PICTURE_HEIGHT = 214;

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.ENDING });
  }

  /**
   * @param {object} data
   * @param {Array<{scene: string, text: string}>} data.pages  from buildEndingPages()
   * @param {string|null} [data.partnerSpecies]  drawn on the 'partner' page
   * @param {() => void} data.onFinished
   */
  init(data) {
    this.pages = data?.pages || [];
    this.partnerSpecies = data?.partnerSpecies || null;
    this.onFinished = data?.onFinished || null;
    this.index = -1;
    this.readyAt = Infinity;
    this.finished = false;
  }

  create() {
    this.controls = new InputManager(this);
    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.picture = this.add.graphics();
    this.partner = null;
    this.text = this.add
      .text(GAME_WIDTH / 2, PICTURE_HEIGHT + 46, '', {
        ...TEXT_STYLES.body,
        fontSize: '14px',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: GAME_WIDTH - 56 },
      })
      .setOrigin(0.5);
    this.prompt = this.add
      .text(GAME_WIDTH - 16, GAME_HEIGHT - 12, 'Confirm ▸   Cancel: skip', {
        fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.parchmentDim,
      })
      .setOrigin(1, 1)
      .setAlpha(0);

    this.showPage(0);
    this.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
  }

  update(time) {
    if (this.finished) return;
    if (time >= this.readyAt && this.prompt.alpha === 0) this.prompt.setAlpha(1);

    const confirm = this.controls.justPressed('confirm');
    const cancel = this.controls.justPressed('cancel');
    if (time < this.readyAt) return;

    if (cancel) {
      this.finish();
      return;
    }
    if (confirm) {
      if (this.index + 1 < this.pages.length) this.showPage(this.index + 1);
      else this.finish();
    }
  }

  showPage(index) {
    this.index = index;
    const page = this.pages[index];
    if (!page) {
      this.finish();
      return;
    }
    this.drawPicture(page.scene);
    this.text.setText(page.text);
    this.text.setAlpha(0);
    this.tweens.add({ targets: this.text, alpha: 1, duration: 260 });
    this.prompt.setAlpha(0);
    this.readyAt = this.time.now + PAGE_HOLD_MS;
  }

  /** The picture behind a page, drawn in code like everything else. */
  drawPicture(kind) {
    const g = this.picture;
    g.clear();
    if (this.partner) {
      this.partner.destroy();
      this.partner = null;
    }

    const dawn = kind !== 'wellspring' && kind !== 'valley';
    // The sky, in bands.
    const sky = dawn
      ? [0x3b4f78, 0x5a6d96, 0x8d8fb0, 0xd7a98a]
      : [0x141a2a, 0x1c2438, 0x243046, 0x2c3a52];
    sky.forEach((colour, i) => {
      g.fillStyle(colour, 1);
      g.fillRect(0, i * (PICTURE_HEIGHT / sky.length), GAME_WIDTH, PICTURE_HEIGHT / sky.length + 1);
    });

    if (!dawn) {
      g.fillStyle(COLORS.parchment, 0.7);
      for (const [x, y] of [[30, 18], [90, 40], [150, 14], [230, 34], [310, 20], [380, 44], [440, 16], [270, 62]]) {
        g.fillRect(x, y, 2, 2);
      }
    }

    if (kind === 'valley') {
      // Hills going down to the harbour, and the city's lamps lit again.
      g.fillStyle(0x2a3a3a, 1);
      g.fillEllipse(120, 200, 340, 150);
      g.fillStyle(0x223030, 1);
      g.fillEllipse(360, 210, 380, 130);
      g.fillStyle(0x3a6a9c, 1);
      g.fillRect(0, 196, GAME_WIDTH, 18);
      g.fillStyle(0xf2d75c, 1);
      for (const [x, y] of [[300, 150], [312, 156], [326, 148], [340, 158], [352, 152], [120, 140], [132, 146]]) {
        g.fillRect(x, y, 3, 3);
      }
      return;
    }

    // The Aerie: snow, the mountains behind, the Circle Hall.
    g.fillStyle(0x6d7a92, 1);
    g.fillTriangle(0, 170, 110, 70, 230, 170);
    g.fillTriangle(180, 170, 320, 50, 470, 170);
    g.fillStyle(0xe6edf2, 1);
    g.fillTriangle(90, 88, 110, 70, 130, 88);
    g.fillTriangle(296, 70, 320, 50, 344, 70);
    g.fillStyle(0xdfe6ec, 1);
    g.fillRect(0, 168, GAME_WIDTH, PICTURE_HEIGHT - 168);

    if (kind === 'wellspring') {
      // The Wellspring, running high: three currents rising together.
      g.fillStyle(0xc9c4b8, 1);
      g.fillEllipse(GAME_WIDTH / 2, 190, 170, 42);
      g.fillStyle(0x3f8fb0, 1);
      g.fillEllipse(GAME_WIDTH / 2, 190, 150, 32);
      [[0xf2b64a, -26], [0x7fd8ff, 0], [0xffffff, 26]].forEach(([colour, dx]) => {
        g.fillStyle(colour, 0.85);
        g.fillRect(GAME_WIDTH / 2 + dx - 3, 40, 6, 150);
      });
      return;
    }

    // The Circle Hall on the ridge.
    g.fillStyle(0x3d4656, 1);
    g.fillRect(170, 128, 140, 44);
    g.fillStyle(0x56607a, 1);
    g.fillTriangle(160, 130, GAME_WIDTH / 2, 98, 320, 130);
    g.fillStyle(0xf2d75c, 1);
    g.fillRect(232, 150, 16, 22);

    if (kind === 'partner' && this.partnerSpecies) {
      this.partner = this.add
        .image(GAME_WIDTH / 2 + 96, 168, creatureTextureKey(this.partnerSpecies))
        .setOrigin(0.5, 1);
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.cameras.main.fadeOut(FADE_MS, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const done = this.onFinished;
      this.scene.stop();
      if (done) done();
    });
  }
}
