/**
 * BattleHud.js
 * ----------------------------------------------------------------------------
 * The status panel for one creature in battle: name, level, HP bar, and a tag
 * for any status condition. The player's own panel also shows numeric HP and an
 * experience bar.
 *
 * The HP bar SLIDES to its new value rather than jumping, so a big hit reads as
 * a big hit. `setHp()` returns the tween so the scene can wait for it.
 */

import {
  COLORS, CSS_COLORS, TEXT_STYLES, FONT_FAMILY, DEPTHS,
} from '../../config/gameConfig.js';
import { BATTLE_UI } from '../../config/balance.js';
import { getStatus } from '../../data/statuses.js';
import { getDisplayName, getCreatureSpecies } from '../../systems/CreatureFactory.js';
import { experienceProgress } from '../../systems/StatCalculator.js';

const PANEL_WIDTH = 186;
const BAR_WIDTH = 108;
const BAR_HEIGHT = 7;

export class BattleHud {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x top-left corner
   * @param {number} y
   * @param {boolean} isPlayer player panels show numeric HP and an EXP bar
   */
  constructor(scene, x, y, isPlayer) {
    this.scene = scene;
    this.isPlayer = isPlayer;
    this.creature = null;
    this.hpTween = null;

    const height = isPlayer ? 56 : 42;

    this.container = scene.add.container(x, y).setDepth(DEPTHS.ui).setScrollFactor(0);

    const border = scene.add
      .rectangle(0, 0, PANEL_WIDTH, height, COLORS.parchment)
      .setOrigin(0, 0);
    const fill = scene.add
      .rectangle(2, 2, PANEL_WIDTH - 4, height - 4, COLORS.ink)
      .setOrigin(0, 0);

    this.nameText = scene.add
      .text(10, 9, '', { ...TEXT_STYLES.body, fontSize: '13px', fontStyle: 'bold' })
      .setOrigin(0, 0.5);

    this.levelText = scene.add
      .text(PANEL_WIDTH - 10, 9, '', { ...TEXT_STYLES.small, fontSize: '11px', color: CSS_COLORS.parchment })
      .setOrigin(1, 0.5);

    // Status tag, hidden until there is something to show.
    this.statusBg = scene.add
      .rectangle(10, 20, 30, 12, COLORS.danger)
      .setOrigin(0, 0)
      .setVisible(false);
    this.statusText = scene.add
      .text(25, 26, '', {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setVisible(false);

    const barX = PANEL_WIDTH - BAR_WIDTH - 10;
    const barY = 24;

    scene.add.text(barX - 22, barY + 3, 'HP', {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.accent, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.barBack = scene.add
      .rectangle(barX, barY, BAR_WIDTH, BAR_HEIGHT, COLORS.inkLight)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLORS.parchmentDim);
    this.barFill = scene.add
      .rectangle(barX + 1, barY + 1, BAR_WIDTH - 2, BAR_HEIGHT - 2, COLORS.good)
      .setOrigin(0, 0);

    this.container.add([
      border, fill, this.nameText, this.levelText,
      this.barBack, this.barFill, this.statusBg, this.statusText,
    ]);

    if (isPlayer) {
      this.hpText = scene.add
        .text(PANEL_WIDTH - 10, 40, '', { ...TEXT_STYLES.small, fontSize: '11px', color: CSS_COLORS.parchment })
        .setOrigin(1, 0.5);

      // Experience bar, a thin strip along the bottom of the panel.
      this.expBack = scene.add
        .rectangle(10, 48, PANEL_WIDTH - 20, 4, COLORS.inkLight).setOrigin(0, 0);
      this.expFill = scene.add
        .rectangle(10, 48, 0, 4, 0x6ea8dc).setOrigin(0, 0);

      this.container.add([this.hpText, this.expBack, this.expFill]);
    }
  }

  /** Point the panel at a creature and redraw everything immediately. */
  setCreature(creature) {
    this.creature = creature;
    this.nameText.setText(getDisplayName(creature));
    this.levelText.setText(`Lv ${creature.level}`);
    this.refresh(true);
  }

  /** Redraw HP, status and experience. `instant` skips the slide. */
  refresh(instant = false) {
    if (!this.creature) return;
    this.setHp(this.creature.currentHp, instant);
    this.refreshStatus();
    this.refreshExperience();
  }

  /**
   * Slide the HP bar to a value.
   * @returns {Phaser.Tweens.Tween|null} so a caller can wait for it
   */
  setHp(value, instant = false) {
    if (!this.creature) return null;

    const fraction = Math.min(Math.max(value / this.creature.stats.hp, 0), 1);
    const width = Math.max(0, (BAR_WIDTH - 2) * fraction);

    if (this.hpText) {
      this.hpText.setText(`${Math.max(0, Math.round(value))}/${this.creature.stats.hp}`);
    }

    // Green while healthy, amber when it matters, red when it is urgent.
    const color = fraction > 0.5 ? COLORS.good : fraction > 0.2 ? COLORS.accent : COLORS.danger;
    this.barFill.setFillStyle(color);

    if (this.hpTween) {
      this.hpTween.stop();
      this.hpTween = null;
    }

    if (instant) {
      this.barFill.width = width;
      return null;
    }

    this.hpTween = this.scene.tweens.add({
      targets: this.barFill,
      width,
      duration: BATTLE_UI.hpBarDuration,
      ease: 'Sine.easeOut',
    });
    return this.hpTween;
  }

  refreshStatus() {
    const status = getStatus(this.creature.status);
    const show = Boolean(status);

    this.statusBg.setVisible(show);
    this.statusText.setVisible(show);

    if (show) {
      this.statusBg.setFillStyle(status.color);
      this.statusText.setText(status.tag);
    }
  }

  refreshExperience() {
    if (!this.expFill) return;

    const species = getCreatureSpecies(this.creature);
    if (!species) return;

    const progress = experienceProgress(
      this.creature.experience, this.creature.level, species.growthRate
    );
    this.expFill.width = (PANEL_WIDTH - 20) * progress;
  }

  setVisible(visible) {
    this.container.setVisible(visible);
    return this;
  }

  destroy() {
    if (this.hpTween) this.hpTween.stop();
    this.container.destroy(true);
  }
}
