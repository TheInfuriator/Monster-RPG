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
 *   root      Party / Bag / Index / Storage / Close
 *   party     the team, with Move for reordering
 *   summary   one creature in full
 *   bag       what you are carrying, by category
 *   bagTarget who to use the selected item on
 *   index     what has been seen and caught
 *   sigils    the Beacon Hall Sigils, earned and still to come
 *   storage   what is waiting back home
 *   shop      buying and selling, opened straight into by a shopkeeper
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
import { badgeTextureKey, creatureTextureKey } from '../config/assets.js';
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
import { getItem } from '../data/items.js';
import { getShop } from '../data/shops.js';
import { getBadgeSlots, countBadges } from '../systems/BadgeSystem.js';
import { getItemCount, removeItem, listInventory } from '../systems/InventorySystem.js';
import {
  applyItemToCreature, getItemUsage, needsCreatureTarget,
} from '../systems/ItemEffects.js';
import { getMoney } from '../systems/EconomySystem.js';
import {
  getBuyList, getSellList, buyItem, sellItem, getBuyTotal, getSellTotal,
  getMaxAffordable,
} from '../systems/ShopSystem.js';

const PANEL = { x: 8, y: 8, width: GAME_WIDTH - 16, height: GAME_HEIGHT - 16 };
const ROW = { x: 18, y: 44, height: 40, width: GAME_WIDTH - 36 };
const INDEX_ROWS_PER_PAGE = 8;
/**
 * How many shop rows fit above the quantity selector.
 *
 * A shelf longer than this SCROLLS. It used to simply draw the first seven and
 * stop, which meant a longer shelf silently hid its last items — the eighth
 * thing a shop sold could never be seen or bought.
 */
const SHOP_ROWS_PER_PAGE = 7;

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

    /**
     * 'menu' is the pause menu; 'shop' is a shopkeeper's counter, opened
     * straight into the shop and closing back to the world rather than to a
     * menu the player never asked for.
     */
    this.mode = data?.mode === 'shop' ? 'shop' : 'menu';
    this.shopId = data?.shopId || null;

    this.view = this.mode === 'shop' ? 'shop' : 'root';
    this.rootIndex = 0;
    this.partyIndex = 0;
    /** The slot being moved, or null when not reordering. */
    this.movingFrom = null;
    this.indexOffset = 0;
    this.indexCursor = 0;

    // Bag
    this.bagCategory = 0;
    this.bagIndex = 0;
    this.bagTargetIndex = 0;
    this.pendingItemId = null;
    this.bagMessage = '';

    // Shop
    this.shopRootIndex = 0;
    this.shopListIndex = 0;
    /** First row drawn — a shelf longer than one page scrolls. */
    this.shopOffset = 0;
    this.shopQuantity = 1;
    this.shopMessage = '';

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

    if (this.mode === 'shop') this.showShop();
    else this.showRoot();
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
        label: 'Bag',
        detail: `${getMoney(gameState)} coins`,
        action: () => this.showBag(),
      },
      {
        label: 'Index',
        detail: `${countCaught()} caught of ${countSpecies()}`,
        action: () => this.showIndex(),
      },
      {
        label: 'Sigils',
        detail: `${countBadges(gameState)} of ${getBadgeSlots(gameState).length}`,
        action: () => this.showSigils(),
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
  // The bag
  // -------------------------------------------------------------------------

  /**
   * The bag, one category at a time.
   *
   * Categories are tabs rather than one long list so that orbs never get in the
   * way of finding a Potion mid-crisis. The order matches the battle bag.
   */
  showBag() {
    this.view = 'bag';
    this.bagMessage = '';
    this.pendingItemId = null;
    this.drawBag();
  }

  /** The categories that exist, and what is in each of them right now. */
  bagCategories() {
    const held = listInventory(gameState.inventory);
    const order = [
      { id: 'healing', label: 'Medicine' },
      { id: 'capture', label: 'Orbs' },
      { id: 'battle', label: 'Battle' },
      { id: 'key', label: 'Key' },
    ];

    return order.map((category) => ({
      ...category,
      entries: held.filter((entry) => entry.item.category === category.id),
    }));
  }

  drawBag() {
    this.clearBody();
    this.title.setText(`BAG                                   ${getMoney(gameState)} coins`);
    this.hint.setText('Left/Right  category      Up/Down  choose      Confirm  use      Cancel  back');

    const categories = this.bagCategories();
    this.bagCategory = Math.max(0, Math.min(this.bagCategory, categories.length - 1));
    const current = categories[this.bagCategory];

    // --- Category tabs ---
    let tabX = ROW.x;
    categories.forEach((category, i) => {
      const selected = i === this.bagCategory;
      const width = 74;
      this.box(tabX, 36, width, 16, selected ? COLORS.accentDark : COLORS.inkLight);
      this.text(tabX + width / 2, 39, `${category.label} ${category.entries.length}`, {
        fontSize: '9px',
        color: selected ? CSS_COLORS.parchment : CSS_COLORS.parchmentDim,
      }).setOrigin(0.5, 0);
      tabX += width + 4;
    });

    const entries = current.entries;
    this.bagIndex = entries.length === 0 ? 0 : Math.min(this.bagIndex, entries.length - 1);

    if (entries.length === 0) {
      this.text(ROW.x, 74, `No ${current.label.toLowerCase()} in the bag.`, { fontSize: '11px' });
      if (this.bagMessage) {
        this.text(ROW.x, 250, this.bagMessage, { color: CSS_COLORS.accent, fontSize: '11px' });
      }
      return;
    }

    entries.slice(0, 7).forEach((entry, i) => {
      const y = 66 + i * 22;
      const selected = i === this.bagIndex;
      const usable = this.canUseHere(entry.item);

      if (selected) this.box(ROW.x - 6, y - 3, ROW.width, 20, COLORS.inkLight);

      this.text(ROW.x, y, entry.item.name, {
        fontSize: '11px',
        color: selected ? CSS_COLORS.accent
          : usable.ok ? CSS_COLORS.parchment : CSS_COLORS.parchmentDim,
      });
      this.text(ROW.x + 190, y + 1, `x${entry.quantity}`, { color: CSS_COLORS.parchmentDim });

      if (!usable.ok) {
        this.text(ROW.x + 240, y + 1, usable.reason, {
          fontSize: '9px', color: CSS_COLORS.parchmentDim,
        });
      }
    });

    // --- The selected item, in full ---
    const chosen = entries[this.bagIndex];
    if (chosen) {
      this.box(ROW.x - 6, 232, ROW.width, 44, COLORS.inkLight, 0.4);
      this.text(ROW.x, 236, chosen.item.description, {
        fontSize: '10px', wordWrap: { width: ROW.width - 20 },
      });
    }
    if (this.bagMessage) {
      this.text(ROW.x, 262, this.bagMessage, { color: CSS_COLORS.accent, fontSize: '10px' });
    }
  }

  /**
   * Whether an item can be used from the overworld bag, and why not.
   * ItemEffects owns the rule; this only phrases the refusal for a menu.
   */
  canUseHere(item) {
    const usage = getItemUsage(item);
    if (usage.field) return { ok: true, reason: '' };
    if (usage.battle) return { ok: false, reason: 'in battle only' };
    return { ok: false, reason: 'cannot be used' };
  }

  updateBag() {
    const categories = this.bagCategories();
    const entries = categories[this.bagCategory].entries;

    if (this.controls.justPressed('cancel')) {
      if (this.mode === 'shop') this.showShop();
      else this.showRoot();
      return;
    }

    if (this.controls.justPressed('left')) {
      this.bagCategory = (this.bagCategory - 1 + categories.length) % categories.length;
      this.bagIndex = 0;
      this.bagMessage = '';
      this.drawBag();
      return;
    }
    if (this.controls.justPressed('right')) {
      this.bagCategory = (this.bagCategory + 1) % categories.length;
      this.bagIndex = 0;
      this.bagMessage = '';
      this.drawBag();
      return;
    }

    if (entries.length === 0) return;

    if (this.controls.justPressed('up')) {
      this.bagIndex = (this.bagIndex - 1 + entries.length) % entries.length;
      this.drawBag();
    }
    if (this.controls.justPressed('down')) {
      this.bagIndex = (this.bagIndex + 1) % entries.length;
      this.drawBag();
    }

    if (this.controls.justPressed('confirm')) {
      const chosen = entries[this.bagIndex];
      const usable = this.canUseHere(chosen.item);

      if (!usable.ok) {
        // Say why, and do NOT spend anything.
        this.bagMessage = usable.reason === 'in battle only'
          ? `The ${chosen.item.name} is only any use in a battle.`
          : `The ${chosen.item.name} cannot be used here.`;
        this.drawBag();
        return;
      }

      if (needsCreatureTarget(chosen.item)) {
        this.pendingItemId = chosen.item.id;
        this.showBagTarget();
        return;
      }

      this.bagMessage = `Nothing happened.`;
      this.drawBag();
    }
  }

  // --- Choosing who to use it on -------------------------------------------

  showBagTarget() {
    this.view = 'bagTarget';
    this.bagTargetIndex = 0;
    this.drawBagTarget();
  }

  drawBagTarget() {
    this.clearBody();

    const item = getItem(this.pendingItemId);
    this.title.setText(`USE ${item ? item.name.toUpperCase() : 'ITEM'}`);
    this.hint.setText('Up/Down  choose      Confirm  use it      Cancel  back to the bag');

    if (gameState.party.length === 0) {
      this.text(ROW.x, ROW.y, 'You have no Aethers with you.', { fontSize: '12px' });
      return;
    }

    // Deliberately the same shape as the party list, so choosing a target reads
    // like the screen the player already knows.
    gameState.party.forEach((creature, i) => {
      const y = ROW.y + i * 34;
      const selected = i === this.bagTargetIndex;
      if (selected) this.box(ROW.x - 6, y - 4, ROW.width, 30, COLORS.inkLight);

      this.body.add(
        this.add.image(ROW.x + 16, y + 12, creatureTextureKey(creature.speciesId)).setScale(0.36)
      );
      this.text(ROW.x + 36, y, getDisplayName(creature), {
        fontSize: '11px', color: selected ? CSS_COLORS.accent : CSS_COLORS.parchment,
      });
      this.text(ROW.x + 36, y + 13, `Lv ${creature.level}`, { color: CSS_COLORS.parchmentDim });

      this.text(ROW.x + 150, y, `${creature.currentHp}/${creature.stats.hp}`, { fontSize: '10px' });
      this.hpBar(ROW.x + 150, y + 14, 100, creature);

      const status = getStatus(creature.status);
      if (status) {
        this.box(ROW.x + 270, y, 34, 12, COLORS.danger);
        this.text(ROW.x + 287, y + 2, status.tag, { fontSize: '8px', color: CSS_COLORS.ink })
          .setOrigin(0.5, 0);
      }
    });

    if (this.bagMessage) {
      this.text(ROW.x, 262, this.bagMessage, { color: CSS_COLORS.accent, fontSize: '11px' });
    }
  }

  updateBagTarget() {
    const count = gameState.party.length;

    if (this.controls.justPressed('cancel')) {
      this.pendingItemId = null;
      this.bagMessage = '';
      this.showBag();
      return;
    }
    if (count === 0) return;

    if (this.controls.justPressed('up')) {
      this.bagTargetIndex = (this.bagTargetIndex - 1 + count) % count;
      this.drawBagTarget();
    }
    if (this.controls.justPressed('down')) {
      this.bagTargetIndex = (this.bagTargetIndex + 1) % count;
      this.drawBagTarget();
    }

    if (this.controls.justPressed('confirm')) this.useHeldItem();
  }

  /**
   * Use the held item on the highlighted creature.
   *
   * ItemEffects decides what happens; this only spends the item when it says
   * the item was actually consumed, so a refusal costs nothing.
   */
  useHeldItem() {
    const item = getItem(this.pendingItemId);
    const target = gameState.party[this.bagTargetIndex];

    if (!item || getItemCount(gameState.inventory, item.id) <= 0) {
      this.bagMessage = 'You have none of those!';
      this.pendingItemId = null;
      this.showBag();
      return;
    }

    const result = applyItemToCreature(item, target, { where: 'field' });

    if (result.consumed) removeItem(gameState.inventory, item.id, 1);
    this.bagMessage = result.message;

    // Stay on the target list after a use, so a player patching up a whole
    // party does not have to walk back in for every Potion. If the last one is
    // gone there is nothing to stay for.
    if (getItemCount(gameState.inventory, item.id) <= 0) {
      this.pendingItemId = null;
      this.showBag();
      return;
    }
    this.drawBagTarget();
  }

  // -------------------------------------------------------------------------
  // The shop
  // -------------------------------------------------------------------------

  showShop() {
    this.view = 'shop';
    this.shopMessage = '';
    this.drawShop();
  }

  drawShop() {
    this.clearBody();

    const shop = getShop(this.shopId);
    this.title.setText(`${(shop?.name || 'SHOP').toUpperCase()}                     ${getMoney(gameState)} coins`);
    this.hint.setText('Up/Down  choose      Confirm  open      Cancel  leave');

    if (shop?.greeting) {
      this.text(ROW.x, 36, `"${shop.greeting}"`, { color: CSS_COLORS.parchmentDim });
    }

    this.shopRootItems = [
      { label: 'Buy', action: () => this.showShopList('buy') },
      { label: 'Sell', action: () => this.showShopList('sell') },
      { label: 'Bag', action: () => this.showBag() },
      { label: 'Exit', action: () => this.close() },
    ];

    this.shopRootIndex = Math.min(this.shopRootIndex, this.shopRootItems.length - 1);

    this.shopRootItems.forEach((entry, i) => {
      const y = 68 + i * 30;
      const selected = i === this.shopRootIndex;
      if (selected) this.box(ROW.x - 6, y - 4, ROW.width, 24, COLORS.inkLight);
      this.text(ROW.x, y, entry.label, {
        fontSize: '13px',
        color: selected ? CSS_COLORS.accent : CSS_COLORS.parchment,
      });
    });

    if (this.shopMessage) {
      this.text(ROW.x, 250, this.shopMessage, { color: CSS_COLORS.accent, fontSize: '11px' });
    }
  }

  updateShop() {
    const count = this.shopRootItems.length;

    if (this.controls.justPressed('up')) {
      this.shopRootIndex = (this.shopRootIndex - 1 + count) % count;
      this.drawShop();
    }
    if (this.controls.justPressed('down')) {
      this.shopRootIndex = (this.shopRootIndex + 1) % count;
      this.drawShop();
    }
    if (this.controls.justPressed('confirm')) this.shopRootItems[this.shopRootIndex].action();
    if (this.controls.justPressed('cancel')) this.close();
  }

  // --- Buying and selling ---------------------------------------------------

  showShopList(kind) {
    this.view = 'shopList';
    this.shopKind = kind;
    this.shopListIndex = 0;
    this.shopOffset = 0;
    this.shopQuantity = 1;
    this.shopMessage = '';
    this.drawShopList();
  }

  shopRows() {
    return this.shopKind === 'buy'
      ? getBuyList(this.shopId, gameState)
      : getSellList(gameState);
  }

  drawShopList() {
    this.clearBody();

    const rows = this.shopRows();
    this.shopListIndex = rows.length === 0 ? 0 : Math.min(this.shopListIndex, rows.length - 1);

    const buying = this.shopKind === 'buy';
    this.title.setText(
      `${buying ? 'BUY' : 'SELL'}                                  ${getMoney(gameState)} coins`
    );
    this.hint.setText(
      'Up/Down  choose      Left/Right  how many      Confirm  agree      Cancel  back'
    );

    if (rows.length === 0) {
      this.text(ROW.x, 74, buying ? 'The shelves are bare today.' : 'You have nothing I could take.', {
        fontSize: '11px',
      });
      return;
    }

    // Keep the highlighted row on screen, exactly like the Aether Index does.
    if (this.shopListIndex < this.shopOffset) this.shopOffset = this.shopListIndex;
    if (this.shopListIndex >= this.shopOffset + SHOP_ROWS_PER_PAGE) {
      this.shopOffset = this.shopListIndex - SHOP_ROWS_PER_PAGE + 1;
    }
    this.shopOffset = Math.max(0, Math.min(this.shopOffset, rows.length - SHOP_ROWS_PER_PAGE));

    const page = rows.slice(this.shopOffset, this.shopOffset + SHOP_ROWS_PER_PAGE);

    page.forEach((row, i) => {
      const y = 60 + i * 22;
      const selected = this.shopOffset + i === this.shopListIndex;
      if (selected) this.box(ROW.x - 6, y - 3, ROW.width, 20, COLORS.inkLight);

      this.text(ROW.x, y, row.item.name, {
        fontSize: '11px', color: selected ? CSS_COLORS.accent : CSS_COLORS.parchment,
      });
      this.text(ROW.x + 180, y + 1, `${row.price} coins`, { color: CSS_COLORS.parchmentDim });
      this.text(ROW.x + 280, y + 1, `have ${row.owned}`, { color: CSS_COLORS.parchmentDim });
    });

    // --- The deal on the table ---
    const chosen = rows[this.shopListIndex];
    const max = this.maxQuantity(chosen);
    this.shopQuantity = Math.max(1, Math.min(this.shopQuantity, Math.max(1, max)));

    const total = buying
      ? getBuyTotal(chosen.item, this.shopQuantity)
      : getSellTotal(chosen.item, this.shopQuantity);

    this.box(ROW.x - 6, 226, ROW.width, 50, COLORS.inkLight, 0.4);
    this.text(ROW.x, 230, chosen.item.description, {
      fontSize: '9px', color: CSS_COLORS.parchmentDim, wordWrap: { width: ROW.width - 20 },
    });

    const affordable = !buying || total <= getMoney(gameState);
    this.text(ROW.x, 252, `Quantity  ${this.shopQuantity}`, { fontSize: '12px' });
    this.text(ROW.x + 130, 252, `${buying ? 'Total' : 'Value'}  ${total} coins`, {
      fontSize: '12px',
      color: affordable ? CSS_COLORS.parchment : CSS_COLORS.danger,
    });

    if (max === 0) {
      this.text(ROW.x + 300, 252, buying ? 'too dear' : 'none held', {
        fontSize: '10px', color: CSS_COLORS.danger,
      });
    }

    if (this.shopMessage) {
      this.text(ROW.x, 266, this.shopMessage, { fontSize: '10px', color: CSS_COLORS.accent });
    }
  }

  /** The most of this the player could actually trade right now. */
  maxQuantity(row) {
    if (!row) return 0;
    return this.shopKind === 'buy'
      ? getMaxAffordable(row.item, gameState)
      : row.owned;
  }

  updateShopList() {
    const rows = this.shopRows();

    if (this.controls.justPressed('cancel')) {
      this.showShop();
      return;
    }
    if (rows.length === 0) return;

    if (this.controls.justPressed('up')) {
      this.shopListIndex = (this.shopListIndex - 1 + rows.length) % rows.length;
      this.shopQuantity = 1;
      this.shopMessage = '';
      this.drawShopList();
    }
    if (this.controls.justPressed('down')) {
      this.shopListIndex = (this.shopListIndex + 1) % rows.length;
      this.shopQuantity = 1;
      this.shopMessage = '';
      this.drawShopList();
    }

    const max = this.maxQuantity(rows[this.shopListIndex]);
    if (this.controls.justPressed('left') && this.shopQuantity > 1) {
      this.shopQuantity -= 1;
      this.drawShopList();
    }
    if (this.controls.justPressed('right') && this.shopQuantity < max) {
      this.shopQuantity += 1;
      this.drawShopList();
    }

    if (this.controls.justPressed('confirm')) this.confirmTransaction(rows[this.shopListIndex]);
  }

  /**
   * Do the deal.
   *
   * ShopSystem is atomic, so there is no half-finished state to guard against
   * here. `justPressed` means one press is one transaction — holding Confirm
   * cannot buy a shelf-full.
   */
  confirmTransaction(row) {
    if (!row) return;

    const result = this.shopKind === 'buy'
      ? buyItem(gameState, this.shopId, row.item.id, this.shopQuantity)
      : sellItem(gameState, row.item.id, this.shopQuantity);

    this.shopMessage = result.message;
    // Back to one after any deal, so a second press cannot repeat a big order
    // the player has already paid for.
    this.shopQuantity = 1;
    this.drawShopList();
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
  // Sigils
  // -------------------------------------------------------------------------

  /**
   * One slot per Beacon Hall, earned or not.
   *
   * The empty slots are the point: three from the very first game, so a player
   * can see how far the road goes. `getBadgeSlots()` decides what those slots
   * are from src/data/badges.js, so a fourth Hall would appear here on its own.
   */
  showSigils() {
    this.view = 'sigils';
    this.drawSigils();
  }

  drawSigils() {
    this.clearBody();

    const slots = getBadgeSlots(gameState);
    const earned = countBadges(gameState);
    this.title.setText(`SIGILS      ${earned} of ${slots.length}`);
    this.hint.setText('Cancel  back');

    slots.forEach((slot, i) => {
      const { badge } = slot;
      // Tall enough for a wrapped two-line description to sit inside its own
      // row rather than on the seam between two.
      const y = ROW.y + i * 64;

      this.box(ROW.x - 6, y - 6, ROW.width, 58, COLORS.inkLight, slot.earned ? 1 : 0.4);

      const icon = this.add.image(ROW.x + 26, y + 20, badgeTextureKey(badge.id)).setOrigin(0.5);
      // An unearned Sigil is drawn as a shadow of itself rather than hidden, so
      // its shape is a promise instead of a surprise.
      if (!slot.earned) icon.setTint(COLORS.inkLight).setAlpha(0.55);
      this.body.add(icon);

      this.text(ROW.x + 56, y, slot.earned ? badge.name : '- - - -', {
        fontSize: '13px',
        color: slot.earned ? CSS_COLORS.accent : CSS_COLORS.parchmentDim,
      });

      this.text(ROW.x + 56, y + 20, `${badge.hall}, ${badge.town}`, {
        color: slot.earned ? CSS_COLORS.parchment : CSS_COLORS.parchmentDim,
      });

      this.text(ROW.x + 56, y + 34, slot.earned ? badge.description : 'Not yet earned.', {
        fontSize: '9px',
        color: CSS_COLORS.parchmentDim,
        // Wrapped, because a Sigil's description is a sentence and a sentence
        // that runs off the panel is worse than no sentence.
        wordWrap: { width: ROW.width - 70 },
      });
    });
  }

  updateSigils() {
    if (this.controls.justPressed('cancel')) this.showRoot();
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
      case 'bag': this.updateBag(); break;
      case 'bagTarget': this.updateBagTarget(); break;
      case 'shop': this.updateShop(); break;
      case 'shopList': this.updateShopList(); break;
      case 'index': this.updateIndex(); break;
      case 'sigils': this.updateSigils(); break;
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
    this.shopRootItems = null;
  }
}
