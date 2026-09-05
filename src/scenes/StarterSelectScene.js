/**
 * StarterSelectScene.js
 * ----------------------------------------------------------------------------
 * Choosing your first Aether at the Warden's Lodge.
 *
 * Runs ON TOP of the overworld (launched, not started) so the Lodge stays
 * visible behind it and the player's position is never disturbed.
 *
 * FLOW
 *   browse  left/right to look at each of the three, confirm to pick one
 *   confirm a yes/no check, so nobody chooses by accident
 *   cancel  backs out of the confirm, and out of the whole scene from browsing
 *
 * The creature itself is built by CreatureFactory — this scene decides WHICH
 * species, and nothing more. It never contains creature stats or move lists.
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
import { creatureTextureKey } from '../config/assets.js';
import { InputManager } from '../core/InputManager.js';
import { STARTER_IDS, STARTER_LEVEL, getSpecies } from '../data/creatures.js';
import { getTypeName } from '../data/types.js';
import { getTypeColor } from '../systems/TypeChart.js';
import { createCreature } from '../systems/CreatureFactory.js';
import { addToParty } from '../systems/PartySystem.js';
import { gameState, setFlag, hasFlag } from '../core/GameState.js';

/** The flag that records the player already has a starter. */
export const STARTER_FLAG = 'gotStarter';

const CARD_WIDTH = 132;
const CARD_HEIGHT = 176;
const CARD_GAP = 14;

export class StarterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.STARTER_SELECT });
  }

  /**
   * @param {object} data
   * @param {(speciesId: string|null) => void} [data.onFinished]
   *        called with the chosen species, or null if the player backed out
   */
  init(data) {
    this.onFinished = data?.onFinished || null;
    this.index = 0;
    this.mode = 'browse'; // 'browse' | 'confirm' | 'closing'
  }

  create() {
    this.controls = new InputManager(this);

    this.buildBackdrop();
    this.buildCards();
    this.buildDetailPanel();
    this.buildPrompt();

    this.refresh();

    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  // -------------------------------------------------------------------------
  // Building the screen
  // -------------------------------------------------------------------------

  buildBackdrop() {
    // Dim the Lodge behind us rather than hiding it, so the player keeps their
    // sense of place.
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.72)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overlay);

    this.add
      .text(GAME_WIDTH / 2, 18, 'CHOOSE YOUR PARTNER', {
        ...TEXT_STYLES.heading,
        fontSize: '16px',
        color: CSS_COLORS.accent,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 1);
  }

  /** One card per starter: sprite, name and type badges. */
  buildCards() {
    const totalWidth = CARD_WIDTH * 3 + CARD_GAP * 2;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const top = 36;

    this.cards = STARTER_IDS.map((speciesId, i) => {
      const species = getSpecies(speciesId);
      const x = startX + i * (CARD_WIDTH + CARD_GAP);

      const container = this.add
        .container(x, top)
        .setDepth(DEPTHS.overlay + 2);

      const border = this.add
        .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLORS.parchment)
        .setOrigin(0, 0);
      const fill = this.add
        .rectangle(3, 3, CARD_WIDTH - 6, CARD_HEIGHT - 6, COLORS.ink)
        .setOrigin(0, 0);

      const sprite = this.add
        .image(CARD_WIDTH / 2, 84, creatureTextureKey(speciesId))
        .setOrigin(0.5);

      const name = this.add
        .text(CARD_WIDTH / 2, 126, species.name, {
          ...TEXT_STYLES.heading,
          fontSize: '15px',
        })
        .setOrigin(0.5);

      const badges = this.buildTypeBadges(species.types, CARD_WIDTH / 2, 148);

      container.add([border, fill, sprite, name, ...badges]);

      return { container, border, fill, sprite, name, speciesId, species };
    });
  }

  /** Small coloured pills showing a creature's type or types. */
  buildTypeBadges(types, centerX, y) {
    const badgeWidth = 52;
    const gap = 4;
    const totalWidth = types.length * badgeWidth + (types.length - 1) * gap;
    let x = centerX - totalWidth / 2;

    const objects = [];
    for (const type of types) {
      objects.push(
        this.add
          .rectangle(x, y, badgeWidth, 16, getTypeColor(type))
          .setOrigin(0, 0.5)
      );
      objects.push(
        this.add
          .text(x + badgeWidth / 2, y, getTypeName(type).toUpperCase(), {
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
      );
      x += badgeWidth + gap;
    }
    return objects;
  }

  /** The description strip under the cards. */
  buildDetailPanel() {
    const top = GAME_HEIGHT - 66;

    this.add
      .rectangle(10, top, GAME_WIDTH - 20, 40, COLORS.ink, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.parchment)
      .setDepth(DEPTHS.overlay + 2);

    this.description = this.add
      .text(GAME_WIDTH / 2, top + 20, '', {
        ...TEXT_STYLES.small,
        fontSize: '11px',
        color: CSS_COLORS.parchment,
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 44 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 3);
  }

  buildPrompt() {
    this.prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 14, '', {
        ...TEXT_STYLES.small,
        fontSize: '11px',
        color: CSS_COLORS.accent,
      })
      .setOrigin(0.5)
      .setDepth(DEPTHS.overlay + 3);
  }

  // -------------------------------------------------------------------------
  // Presentation
  // -------------------------------------------------------------------------

  get selected() {
    return this.cards[this.index];
  }

  /** Redraw highlighting, description and prompt for the current state. */
  refresh() {
    this.cards.forEach((card, i) => {
      const isSelected = i === this.index;

      card.border.setFillStyle(isSelected ? COLORS.accent : COLORS.parchmentDim);
      card.fill.setFillStyle(isSelected ? COLORS.inkLight : COLORS.ink);
      card.name.setColor(isSelected ? CSS_COLORS.accent : CSS_COLORS.parchmentDim);
      card.container.setScale(isSelected ? 1 : 0.94);
      card.sprite.setAlpha(isSelected ? 1 : 0.62);
    });

    const { species } = this.selected;

    if (this.mode === 'confirm') {
      this.description.setText(`Take ${species.name} as your partner?`);
      this.prompt.setText('Space / Enter: yes      Esc / X: no');
    } else {
      this.description.setText(species.description);
      this.prompt.setText('Left / Right: look      Space: choose      Esc: not yet');
    }
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------

  update() {
    if (this.mode === 'closing') return;

    if (this.mode === 'browse') {
      if (this.controls.justPressed('left')) this.move(-1);
      if (this.controls.justPressed('right')) this.move(1);
      if (this.controls.justPressed('confirm')) this.askToConfirm();
      if (this.controls.justPressed('cancel')) this.close(null);
      return;
    }

    // mode === 'confirm'
    if (this.controls.justPressed('confirm')) this.chooseSelected();
    if (this.controls.justPressed('cancel')) {
      this.mode = 'browse';
      this.refresh();
    }
  }

  move(step) {
    const count = this.cards.length;
    this.index = (this.index + step + count) % count;
    this.refresh();

    // A small pop, so the change registers even at a glance.
    this.tweens.add({
      targets: this.selected.sprite,
      scale: 1.12,
      duration: 110,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  askToConfirm() {
    this.mode = 'confirm';
    this.refresh();
  }

  // -------------------------------------------------------------------------
  // Choosing
  // -------------------------------------------------------------------------

  chooseSelected() {
    const speciesId = this.selected.speciesId;

    // Belt and braces: the Lodge dialogue should never offer this twice, but a
    // second starter would be a real progression bug, so refuse it here too.
    if (hasFlag(STARTER_FLAG)) {
      console.warn('[StarterSelect] A starter was already chosen. Ignoring.');
      this.close(null);
      return;
    }

    const creature = createCreature(speciesId, STARTER_LEVEL, {
      metAt: "Warden's Lodge",
    });

    if (!creature) {
      console.error(`[StarterSelect] Could not create "${speciesId}".`);
      this.close(null);
      return;
    }

    const added = addToParty(gameState, creature);
    if (!added) {
      console.error('[StarterSelect] The party was full — this should be impossible.');
      this.close(null);
      return;
    }

    setFlag(STARTER_FLAG);
    console.info(
      `[StarterSelect] ${creature.speciesId} joined the party at level ${creature.level}.`
    );

    this.playChosenAnimation(() => this.close(speciesId));
  }

  /** A brief celebration so the choice lands before the scene closes. */
  playChosenAnimation(done) {
    this.mode = 'closing';
    this.prompt.setText('');
    this.description.setText(`${this.selected.species.name} is with you now!`);

    this.cards.forEach((card, i) => {
      if (i === this.index) return;
      this.tweens.add({ targets: card.container, alpha: 0, duration: 220 });
    });

    this.tweens.add({
      targets: this.selected.sprite,
      scale: 1.35,
      duration: 260,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => this.time.delayedCall(420, done),
    });
  }

  /**
   * Shut down and hand control back to whoever launched us.
   * @param {string|null} speciesId the chosen species, or null if cancelled
   */
  close(speciesId) {
    this.mode = 'closing';
    const finished = this.onFinished;

    this.cameras.main.fadeOut(180, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      if (finished) finished(speciesId);
    });
  }
}
