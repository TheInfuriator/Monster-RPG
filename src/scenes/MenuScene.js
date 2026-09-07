/**
 * MenuScene.js
 * ----------------------------------------------------------------------------
 * The pause menu, the party screen, a creature's summary, and the Aether Index.
 *
 * All four are ONE scene with a `view` state machine rather than four scenes
 * that launch each other. Nested overlay scenes each need their own pause,
 * resume and input handover, and every one of those is a chance to leak a key
 * press back into the overworld. One scene means one owner of the keyboard and
 * one place that hands control back.
 *
 *   root     Party / Index / Close
 *   party    the team, with Move for reordering
 *   summary  one creature in full
 *   index    what has been seen and caught
 *
 * Runs ON TOP of a paused overworld, so the map and the player's position are
 * exactly as they were left.
 *
 * It owns no rules. Party order changes go through PartySystem, index reads
 * through CreatureIndex, and creature facts through CreatureFactory — this file
 * only draws them and reads the keyboard.
 */

import Phaser from 'phaser';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, CSS_COLORS, TEXT_STYLES, FONT_FAMILY, DEPTHS,
} from '../config/gameConfig.js';
import { creatureTextureKey } from '../config/assets.js';
import { InputManager } from '../core/InputManager.js';
import { gameState } from '../core/GameState.js';
import {
  swapPartyMembers, getStorageCount, isValidPartyIndex,
} from '../systems/PartySystem.js';
import {
  getIndexRows, countSeen, countCaught, countSpecies,
} from '../systems/CreatureIndex.js';
import { getDisplayName, getHpFraction, getCreatureSpecies } from '../systems/CreatureFactory.js';
import { experienceForLevel } from '../systems/StatCalculator.js';
import { getTypeColor } from '../systems/TypeChart.js';
import { getTypeName } from '../data/types.js';
import { getStatus } from '../data/statuses.js';
import { getMove } from '../data/moves.js';
import { getSpecies } from '../data/creatures.js';

const PANEL = { x: 8, y: 8, width: GAME_WIDTH - 16, height: GAME_HEIGHT - 16 };
const ROW = { x: 18, y: 44, height: 40, width: GAME_WIDTH - 36 };
const INDEX_ROWS_PER_PAGE = 8;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU });
  }

  /**
   * @param {object} data
   * @param {() => void} [data.onFinished] called once the menu has closed
   */
  init(data) {
    this.onFinished = data?.onFinished || null;

    this.view = 'root';
    this.rootIndex = 0;
    this.partyIndex = 0;
    /** The slot being moved, or null when not reordering. */
    this.movingFrom = null;
    this.indexOffset = 0;
    this.indexCursor = 0;
    this.closing = false;
  }

  create() {
    this.controls = new InputManager(this);

    // A dim wash over the paused world, so it reads as "on top of" rather than
    // "instead of".
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.82)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overlay);

    this.add
      .rectangle(PANEL.x, PANEL.y, PANEL.width, PANEL.height, COLORS.parchment)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overlay);
    this.add
      .rectangle(PANEL.x + 3, PANEL.y + 3, PANEL.width - 6, PANEL.height - 6, COLORS.ink)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.overlay);

    this.title = this.add
      .text(PANEL.x + 12, PANEL.y + 12, '', { ...TEXT_STYLES.body, fontSize: '14px' })
      .setDepth(DEPTHS.overlay + 1);

    this.hint = this.add
      .text(PANEL.x + 12, PANEL.y + PANEL.height - 20, '', {
        fontFamily: FONT_FAMILY, fontSize: '9px', color: CSS_COLORS.parchmentDim,
      })
      .setDepth(DEPTHS.overlay + 1);

    /** Everything the current view drew. Cleared on every view change. */
    this.body = this.add.container(0, 0).setDepth(DEPTHS.overlay + 1);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.showRoot();
  }

  // -------------------------------------------------------------------------
  // Drawing helpers
  // -------------------------------------------------------------------------

  /** Throw away the current view's objects. Every view starts from here. */
  clearBody() {
    this.body.removeAll(true);
  }

  text(x, y, value, style = {}) {
    const object = this.add.text(x, y, value, {
      fontFamily: FONT_FAMILY, fontSize: '10px', color: CSS_COLORS.parchment, ...style,
    });
    this.body.add(object);
    return object;
  }

  box(x, y, width, height, colour, alpha = 1) {
    const object = this.add.rectangle(x, y, width, height, colour, alpha).setOrigin(0, 0);
    this.body.add(object);
    return object;
  }

  /** A small coloured type badge, the same everywhere it appears. */
  typeBadge(x, y, typeId) {
    this.box(x, y, 44, 12, getTypeColor(typeId));
    this.text(x + 22, y + 2, getTypeName(typeId).toUpperCase(), {
      fontSize: '8px', color: CSS_COLORS.ink,
    }).setOrigin(0.5, 0);
    return 48;
  }

  hpBar(x, y, width, creature) {
    const fraction = getHpFraction(creature);
    const colour = fraction > 0.5 ? COLORS.good : fraction > 0.2 ? COLORS.accent : COLORS.danger;

    this.box(x, y, width, 6, COLORS.inkLight);
    if (fraction > 0) this.box(x + 1, y + 1, Math.max(1, (width - 2) * fraction), 4, colour);
  }

  // -------------------------------------------------------------------------
  // The root menu
  // -------------------------------------------------------------------------

  showRoot() {
    this.view = 'root';
    this.clearBody();
    this.title.setText('MENU');
    this.hint.setText('Up/Down  choose      Confirm  open      Cancel  back to the world');

    const stored = getStorageCount(gameState);
    this.rootItems = [
      { label: 'Party', detail: `${gameState.party.length} with you`, action: () => this.showParty() },
      {
        label: 'Index',
        detail: `${countCaught()} caught of ${countSpecies()}`,
        action: () => this.showIndex(),
      },
      {
        label: 'Storage',
        detail: stored === 1 ? '1 waiting' : `${stored} waiting`,
        action: () => this.showStorage(),
      },
      { label: 'Close', detail: '', action: () => this.close() },
    ];

    this.rootIndex = Math.min(this.rootIndex, this.rootItems.length - 1);
    this.drawRoot();
  }

  drawRoot() {
    this.clearBody();

    this.rootItems.forEach((item, i) => {
      const y = ROW.y + i * 34;
      const selected = i === this.rootIndex;

      if (selected) this.box(ROW.x - 6, y - 4, ROW.width, 26, COLORS.inkLight);

      this.text(ROW.x, y, item.label, {
        fontSize: '13px',
        color: selected ? CSS_COLORS.accent : CSS_COLORS.parchment,
      });
      this.text(ROW.x + 120, y + 3, item.detail, { color: CSS_COLORS.parchmentDim });
    });
  }

  updateRoot() {
    const count = this.rootItems.length;
    if (this.controls.justPressed('up')) {
      this.rootIndex = (this.rootIndex - 1 + count) % count;
      this.drawRoot();
    }
    if (this.controls.justPressed('down')) {
      this.rootIndex = (this.rootIndex + 1) % count;
      this.drawRoot();
    }
    if (this.controls.justPressed('confirm')) this.rootItems[this.rootIndex].action();
    if (this.controls.justPressed('cancel')) this.close();
  }

  // -------------------------------------------------------------------------
  // The party
  // -------------------------------------------------------------------------

  showParty() {
    this.view = 'party';
    this.movingFrom = null;
    this.partyIndex = Math.min(this.partyIndex, Math.max(0, gameState.party.length - 1));
    this.drawParty();
  }

  drawParty() {
    this.clearBody();
    this.title.setText('PARTY');
    this.hint.setText(
      this.movingFrom === null
        ? 'Up/Down  choose      Confirm  summary      Run  move      Cancel  back'
        : 'Up/Down  pick a slot      Confirm  swap      Cancel  stop moving'
    );

    if (gameState.party.length === 0) {
      this.text(ROW.x, ROW.y, 'You have no Aethers with you.', { fontSize: '12px' });
      return;
    }

    gameState.party.forEach((creature, i) => {
      const y = ROW.y + i * ROW.height;
      const selected = i === this.partyIndex;
      const moving = i === this.movingFrom;
      const species = getCreatureSpecies(creature);

      // The slot being moved stays highlighted so it is obvious what is in hand.
      if (moving) this.box(ROW.x - 6, y - 4, ROW.width, ROW.height - 4, COLORS.accentDark);
      else if (selected) this.box(ROW.x - 6, y - 4, ROW.width, ROW.height - 4, COLORS.inkLight);

      // The lead slot is the one that goes out first, so it is labelled.
      if (i === 0) {
        this.text(ROW.x - 2, y + 22, 'LEAD', { fontSize: '7px', color: CSS_COLORS.accent });
      }

      this.body.add(
        this.add.image(ROW.x + 18, y + 15, creatureTextureKey(creature.speciesId)).setScale(0.42)
      );

      this.text(ROW.x + 40, y, getDisplayName(creature), {
        fontSize: '12px',
        color: selected || moving ? CSS_COLORS.accent : CSS_COLORS.parchment,
      });
      this.text(ROW.x + 40, y + 15, `Lv ${creature.level}`, { color: CSS_COLORS.parchmentDim });

      let badgeX = ROW.x + 92;
      for (const typeId of species?.types || []) badgeX += this.typeBadge(badgeX, y + 15, typeId);

      const hpText = `${creature.currentHp}/${creature.stats.hp}`;
      this.text(ROW.x + 250, y, `HP ${hpText}`, { fontSize: '10px' });
      this.hpBar(ROW.x + 250, y + 15, 110, creature);

      const status = getStatus(creature.status);
      if (status) {
        this.box(ROW.x + 370, y, 34, 12, COLORS.danger);
        this.text(ROW.x + 387, y + 2, status.tag, { fontSize: '8px', color: CSS_COLORS.ink })
          .setOrigin(0.5, 0);
      }
    });
  }

  updateParty() {
    const count = gameState.party.length;

    if (this.controls.justPressed('cancel')) {
      // Cancelling a move puts nothing back — nothing has changed yet.
      if (this.movingFrom !== null) {
        this.movingFrom = null;
        this.drawParty();
        return;
      }
      this.showRoot();
      return;
    }

    if (count === 0) return;

    if (this.controls.justPressed('up')) {
      this.partyIndex = (this.partyIndex - 1 + count) % count;
      this.drawParty();
    }
    if (this.controls.justPressed('down')) {
      this.partyIndex = (this.partyIndex + 1) % count;
      this.drawParty();
    }

    // "Move" is a mode: pick one up, pick a slot, they trade places.
    if (this.controls.justPressed('run') && this.movingFrom === null && count > 1) {
      this.movingFrom = this.partyIndex;
      this.drawParty();
      return;
    }

    if (this.controls.justPressed('confirm')) {
      if (this.movingFrom === null) {
        this.showSummary(this.partyIndex);
        return;
      }
      // PartySystem owns the rule; an invalid swap simply does nothing.
      swapPartyMembers(gameState, this.movingFrom, this.partyIndex);
      this.movingFrom = null;
      this.drawParty();
    }
  }

  // -------------------------------------------------------------------------
  // One creature in full
  // -------------------------------------------------------------------------

  showSummary(partyIndex) {
    if (!isValidPartyIndex(gameState, partyIndex)) return;

    this.view = 'summary';
    this.summaryIndex = partyIndex;
    this.drawSummary();
  }

  drawSummary() {
    this.clearBody();

    const creature = gameState.party[this.summaryIndex];
    if (!creature) {
      this.showParty();
      return;
    }

    const species = getCreatureSpecies(creature);
    this.title.setText('SUMMARY');
    this.hint.setText('Left/Right  another Aether      Cancel  back to the party');

    // --- Identity ---
    this.body.add(
      this.add.image(52, 74, creatureTextureKey(creature.speciesId)).setScale(1.05)
    );

    this.text(96, 34, getDisplayName(creature), { fontSize: '14px', color: CSS_COLORS.accent });
    if (creature.nickname) {
      this.text(96, 50, species.name, { color: CSS_COLORS.parchmentDim });
    }
    this.text(96, 62, `No. ${String(species.number).padStart(3, '0')}   Lv ${creature.level}`, {
      fontSize: '11px',
    });

    let badgeX = 96;
    for (const typeId of species.types) badgeX += this.typeBadge(badgeX, 78, typeId);

    // --- Condition ---
    this.text(96, 96, `HP  ${creature.currentHp}/${creature.stats.hp}`, { fontSize: '11px' });
    this.hpBar(96, 110, 120, creature);

    const status = getStatus(creature.status);
    this.text(224, 96, status ? `Status  ${status.name}` : 'Status  Healthy', {
      color: status ? CSS_COLORS.danger : CSS_COLORS.parchmentDim,
    });

    // --- Experience ---
    const thisLevel = experienceForLevel(creature.level, species.growthRate);
    const nextLevel = experienceForLevel(creature.level + 1, species.growthRate);
    const span = Math.max(1, nextLevel - thisLevel);
    const into = Math.min(span, Math.max(0, creature.experience - thisLevel));

    this.text(224, 110, `EXP  ${creature.experience}`, { color: CSS_COLORS.parchmentDim });
    this.text(224, 122, `Next  ${Math.max(0, nextLevel - creature.experience)} to go`, {
      color: CSS_COLORS.parchmentDim,
    });
    this.box(320, 112, 120, 6, COLORS.inkLight);
    this.box(321, 113, Math.max(1, 118 * (into / span)), 4, COLORS.accent);

    // --- Stats ---
    const stats = [
      ['Attack', creature.stats.attack],
      ['Defense', creature.stats.defense],
      ['Sp. Atk', creature.stats.spAttack],
      ['Sp. Def', creature.stats.spDefense],
      ['Speed', creature.stats.speed],
    ];
    stats.forEach(([label, value], i) => {
      const y = 140 + i * 13;
      this.text(18, y, label, { color: CSS_COLORS.parchmentDim });
      this.text(84, y, String(value), { color: CSS_COLORS.parchment });
    });

    // --- Moves ---
    this.text(124, 140, 'MOVES', { color: CSS_COLORS.accent });
    creature.moves.forEach((entry, i) => {
      const move = getMove(entry.id);
      const y = 154 + i * 22;
      if (!move) return;

      this.typeBadge(124, y + 1, move.type);
      this.text(174, y, move.name, { fontSize: '11px' });
      this.text(174, y + 11, move.description, { fontSize: '8px', color: CSS_COLORS.parchmentDim });

      const power = move.power ? `Pow ${move.power}` : 'Pow  -';
      const accuracy = move.accuracy === null ? 'Acc  -' : `Acc ${Math.round(move.accuracy * 100)}`;
      this.text(342, y, `${move.category.slice(0, 3).toUpperCase()}  ${power}  ${accuracy}`, {
        fontSize: '8px', color: CSS_COLORS.parchmentDim,
      });
      this.text(342, y + 11, `PP ${entry.pp}/${entry.maxPp}`, { fontSize: '9px' });
    });

    // --- Where it came from, and where it is going ---
    const met = creature.metAt ? `Met at ${creature.metAt}` : 'Origin unrecorded';
    const evolution = species.evolution
      ? `Evolves into ${getSpecies(species.evolution.to)?.name ?? '???'} at Lv ${species.evolution.level}`
      : 'Does not evolve';
    this.text(18, 250, met, { fontSize: '9px', color: CSS_COLORS.parchmentDim });
    this.text(18, 262, evolution, { fontSize: '9px', color: CSS_COLORS.parchmentDim });
  }

  updateSummary() {
    const count = gameState.party.length;

    if (this.controls.justPressed('cancel')) {
      this.partyIndex = this.summaryIndex;
      this.showParty();
      return;
    }
    if (this.controls.justPressed('left')) {
      this.summaryIndex = (this.summaryIndex - 1 + count) % count;
      this.drawSummary();
    }
    if (this.controls.justPressed('right')) {
      this.summaryIndex = (this.summaryIndex + 1) % count;
      this.drawSummary();
    }
  }

  // -------------------------------------------------------------------------
  // The Aether Index
  // -------------------------------------------------------------------------

  showIndex() {
    this.view = 'index';
    this.rows = getIndexRows();
    this.indexCursor = Math.min(this.indexCursor, this.rows.length - 1);
    this.drawIndex();
  }

  drawIndex() {
    this.clearBody();
    this.title.setText(
      `AETHER INDEX      seen ${countSeen()}   caught ${countCaught()}   of ${countSpecies()}`
    );
    this.hint.setText('Up/Down  scroll      Cancel  back');

    // Keep the cursor on screen.
    if (this.indexCursor < this.indexOffset) this.indexOffset = this.indexCursor;
    if (this.indexCursor >= this.indexOffset + INDEX_ROWS_PER_PAGE) {
      this.indexOffset = this.indexCursor - INDEX_ROWS_PER_PAGE + 1;
    }

    const page = this.rows.slice(this.indexOffset, this.indexOffset + INDEX_ROWS_PER_PAGE);

    page.forEach((row, i) => {
      const y = ROW.y + i * 24;
      const selected = this.indexOffset + i === this.indexCursor;
      if (selected) this.box(ROW.x - 6, y - 3, ROW.width, 22, COLORS.inkLight);

      this.text(ROW.x, y + 2, String(row.number).padStart(3, '0'), {
        color: CSS_COLORS.parchmentDim,
      });

      // A creature never met is a blank in the book, but its slot still shows.
      this.text(ROW.x + 34, y + 2, row.name, {
        fontSize: '11px',
        color: row.seen ? CSS_COLORS.parchment : CSS_COLORS.parchmentDim,
      });

      let badgeX = ROW.x + 130;
      for (const typeId of row.types) badgeX += this.typeBadge(badgeX, y + 3, typeId);

      if (row.caught) {
        this.text(ROW.x + 244, y + 2, 'CAUGHT', { fontSize: '9px', color: CSS_COLORS.accent });
      } else if (row.seen) {
        this.text(ROW.x + 244, y + 2, 'seen', { fontSize: '9px', color: CSS_COLORS.parchmentDim });
      }
    });

    const current = this.rows[this.indexCursor];
    if (current?.description) {
      this.text(ROW.x, PANEL.y + PANEL.height - 46, current.description, {
        fontSize: '9px', color: CSS_COLORS.parchmentDim,
        wordWrap: { width: PANEL.width - 30 },
      });
    }
  }

  updateIndex() {
    const count = this.rows.length;

    if (this.controls.justPressed('cancel')) {
      this.showRoot();
      return;
    }
    if (this.controls.justPressed('up')) {
      this.indexCursor = (this.indexCursor - 1 + count) % count;
      this.drawIndex();
    }
    if (this.controls.justPressed('down')) {
      this.indexCursor = (this.indexCursor + 1) % count;
      this.drawIndex();
    }
  }

  // -------------------------------------------------------------------------
  // Storage (a summary, not a management screen — see TODO.md)
  // -------------------------------------------------------------------------

  showStorage() {
    this.view = 'storage';
    this.drawStorage();
  }

  drawStorage() {
    this.clearBody();
    this.title.setText(`STORAGE      ${getStorageCount(gameState)} waiting`);
    this.hint.setText('Cancel  back');

    const stored = gameState.storage || [];
    if (stored.length === 0) {
      this.text(ROW.x, ROW.y, 'Nothing in storage.', { fontSize: '12px' });
      this.text(ROW.x, ROW.y + 18, 'Aethers caught with a full party wait here.', {
        color: CSS_COLORS.parchmentDim,
      });
      return;
    }

    stored.slice(0, INDEX_ROWS_PER_PAGE).forEach((creature, i) => {
      const y = ROW.y + i * 24;
      const species = getCreatureSpecies(creature);

      this.body.add(
        this.add.image(ROW.x + 10, y + 8, creatureTextureKey(creature.speciesId)).setScale(0.3)
      );
      this.text(ROW.x + 30, y + 2, getDisplayName(creature), { fontSize: '11px' });
      this.text(ROW.x + 150, y + 3, `Lv ${creature.level}`, { color: CSS_COLORS.parchmentDim });
      this.text(ROW.x + 200, y + 3, `${creature.currentHp}/${creature.stats.hp} HP`, {
        color: CSS_COLORS.parchmentDim,
      });

      let badgeX = ROW.x + 280;
      for (const typeId of species?.types || []) badgeX += this.typeBadge(badgeX, y + 3, typeId);
    });

    if (stored.length > INDEX_ROWS_PER_PAGE) {
      this.text(ROW.x, ROW.y + INDEX_ROWS_PER_PAGE * 24, `...and ${stored.length - INDEX_ROWS_PER_PAGE} more`, {
        color: CSS_COLORS.parchmentDim,
      });
    }
  }

  updateStorage() {
    if (this.controls.justPressed('cancel')) this.showRoot();
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  close() {
    if (this.closing) return;
    this.closing = true;

    const finished = this.onFinished;
    this.scene.stop();
    if (finished) finished();
  }

  update() {
    if (this.closing) return;

    switch (this.view) {
      case 'root': this.updateRoot(); break;
      case 'party': this.updateParty(); break;
      case 'summary': this.updateSummary(); break;
      case 'index': this.updateIndex(); break;
      case 'storage': this.updateStorage(); break;
      default: break;
    }
  }

  cleanup() {
    if (this.body) {
      this.body.destroy(true);
      this.body = null;
    }
    this.rows = null;
    this.rootItems = null;
  }
}
