/**
 * BattleScene.js
 * ----------------------------------------------------------------------------
 * Everything you SEE and press during a battle.
 *
 * The scene owns no rules. `BattleEngine` decides what happens and hands back a
 * list of events; this scene plays them back at reading speed and collects the
 * player's choices. If you are looking for a formula, it is in
 * `src/systems/battle/`, not here.
 *
 * HOW A TURN FLOWS
 *   action menu -> player picks -> engine.submitPlayerAction() -> events
 *   -> playEvents() narrates them one at a time -> back to the action menu
 *
 * The scene is a small state machine. `this.phase` says who owns the input:
 *   'intro' | 'action' | 'move' | 'party' | 'bag' | 'busy'
 *   | 'forcedSwitch' | 'learnMove' | 'done'
 * Only one phase reads the keyboard at a time, which is what stops a keypress
 * leaking from a menu into the message log.
 */

import Phaser from 'phaser';
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, COLORS, TEXT_STYLES, DEPTHS,
} from '../config/gameConfig.js';
import { BATTLE_UI, CAPTURE_UI, TEXT_SPEEDS, DIALOGUE } from '../config/balance.js';
import { creatureTextureKey } from '../config/assets.js';
import { InputManager } from '../core/InputManager.js';
import { gameState } from '../core/GameState.js';
import { BattleEngine, BATTLE_RESULT } from '../systems/battle/BattleEngine.js';
import {
  teachMove, replaceMove, evolveCreature,
} from '../systems/battle/ExperienceSystem.js';
import { getDisplayName, getHpFraction } from '../systems/CreatureFactory.js';
import { getMove } from '../data/moves.js';
import { getItem } from '../data/items.js';
import { getTypeColor } from '../systems/TypeChart.js';
import { getStatus } from '../data/statuses.js';
import { removeItem, getItemCount } from '../systems/InventorySystem.js';
import { applyItemToCreature } from '../systems/ItemEffects.js';
import { addMoney } from '../systems/EconomySystem.js';
import { isItemUsableInBattle, isCaptureItem } from '../systems/battle/BattleItems.js';
import { receiveCapturedCreature } from '../systems/WildBattle.js';
import { markSeen } from '../systems/CreatureIndex.js';
import { BattleHud } from '../ui/battle/BattleHud.js';
import { BattleMenu } from '../ui/battle/BattleMenu.js';

/** Where things sit on the 480x320 battle screen. */
const LAYOUT = {
  opponentSprite: { x: 350, y: 108 },
  playerSprite: { x: 132, y: 196 },
  opponentHud: { x: 14, y: 26 },
  playerHud: { x: GAME_WIDTH - 200, y: 150 },
  messageBox: { x: 8, y: 236, width: GAME_WIDTH - 16, height: 76 },
  menu: { x: 246, y: 236, width: GAME_WIDTH - 254, height: 76 },
  creatureScale: 1.7,
};

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BATTLE });
  }

  /**
   * @param {object} data
   * @param {object} data.config    BattleEngine configuration
   * @param {(result: object) => void} [data.onFinished]
   */
  init(data) {
    this.battleConfig = data.config;
    this.onFinished = data.onFinished || null;

    this.phase = 'intro';
    this.eventQueue = [];
    this.pendingLevelUps = [];
    this.moveLearnQueue = [];
    this.messageResolve = null;
    this.finishCurrentMessage = null;
    this.typeTimer = null;
    this.isTyping = false;
  }

  create() {
    this.controls = new InputManager(this);
    // The bag goes in first so the engine can spend an orb itself; a config may
    // still override it, which is what the unit tests do.
    this.engine = new BattleEngine({
      inventory: gameState.inventory,
      ...this.battleConfig,
    });

    // Anything that stands on the field has been met, whatever kind of battle
    // this is. The index API owns the rule; this is just the one place that
    // knows a creature has appeared.
    markSeen(this.engine.opponent.creature.speciesId);

    this.buildBackdrop();
    this.buildCreatures();
    this.buildHuds();
    this.buildMessageBox();
    this.buildMenus();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());

    this.cameras.main.fadeIn(260, 0, 0, 0);
    this.playEvents(this.engine.start()).then(() => this.openActionMenu());
  }

  // -------------------------------------------------------------------------
  // Building the screen
  // -------------------------------------------------------------------------

  buildBackdrop() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    // Sky, distant ground, and two platforms so the creatures stand on something.
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x8fb8d8).setOrigin(0, 0);
    this.add.rectangle(0, 120, GAME_WIDTH, GAME_HEIGHT - 120, 0x7aa45c).setOrigin(0, 0);
    this.add.rectangle(0, 120, GAME_WIDTH, 6, 0x5d8445).setOrigin(0, 0);

    this.add.ellipse(LAYOUT.opponentSprite.x, LAYOUT.opponentSprite.y + 44, 130, 34, 0x6b9350);
    this.add.ellipse(LAYOUT.opponentSprite.x, LAYOUT.opponentSprite.y + 44, 130, 34)
      .setStrokeStyle(2, 0x54763f);
    this.add.ellipse(LAYOUT.playerSprite.x, LAYOUT.playerSprite.y + 48, 160, 40, 0x6b9350);
    this.add.ellipse(LAYOUT.playerSprite.x, LAYOUT.playerSprite.y + 48, 160, 40)
      .setStrokeStyle(2, 0x54763f);
  }

  buildCreatures() {
    this.opponentSprite = this.add
      .image(LAYOUT.opponentSprite.x, LAYOUT.opponentSprite.y, creatureTextureKey(this.engine.opponent.creature.speciesId))
      .setScale(LAYOUT.creatureScale)
      .setDepth(DEPTHS.entities);

    this.playerSprite = this.add
      .image(LAYOUT.playerSprite.x, LAYOUT.playerSprite.y, creatureTextureKey(this.engine.player.creature.speciesId))
      .setScale(LAYOUT.creatureScale)
      // The player's creature faces away, so flip it.
      .setFlipX(true)
      .setDepth(DEPTHS.entities);
  }

  buildHuds() {
    this.opponentHud = new BattleHud(this, LAYOUT.opponentHud.x, LAYOUT.opponentHud.y, false);
    this.opponentHud.setCreature(this.engine.opponent.creature);

    this.playerHud = new BattleHud(this, LAYOUT.playerHud.x, LAYOUT.playerHud.y, true);
    this.playerHud.setCreature(this.engine.player.creature);
  }

  buildMessageBox() {
    const { x, y, width, height } = LAYOUT.messageBox;

    this.messageContainer = this.add.container(0, 0).setDepth(DEPTHS.dialogue);
    const border = this.add.rectangle(x, y, width, height, COLORS.parchment).setOrigin(0, 0);
    const fill = this.add.rectangle(x + 3, y + 3, width - 6, height - 6, COLORS.ink).setOrigin(0, 0);

    this.messageText = this.add
      .text(x + 14, y + 16, '', {
        ...TEXT_STYLES.body, fontSize: '14px', lineSpacing: 5,
        wordWrap: { width: width - 30 },
      })
      .setOrigin(0, 0);

    this.advanceArrow = this.add
      .triangle(x + width - 18, y + height - 14, 0, 0, 10, 0, 5, 7, COLORS.accent)
      .setVisible(false);

    this.messageContainer.add([border, fill, this.messageText, this.advanceArrow]);

    this.arrowTween = this.tweens.add({
      targets: this.advanceArrow, y: this.advanceArrow.y + 3,
      duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', paused: true,
    });
  }

  buildMenus() {
    const { x, y, width, height } = LAYOUT.menu;

    this.actionMenu = new BattleMenu(this, {
      x, y, width, height, columns: 2,
      onSelect: (item) => this.handleAction(item.value),
    });
    this.actionMenu.setVisible(false);

    this.moveMenu = new BattleMenu(this, {
      x: LAYOUT.messageBox.x, y, width: LAYOUT.messageBox.width, height, columns: 2,
      onSelect: (item) => this.handleMoveChosen(item.value),
      onCancel: () => this.openActionMenu(),
    });
    this.moveMenu.setVisible(false);

    this.listMenu = new BattleMenu(this, {
      x: LAYOUT.messageBox.x, y, width: LAYOUT.messageBox.width, height, columns: 2,
      onSelect: (item) => this.handleListChosen(item),
      onCancel: () => this.handleListCancel(),
    });
    this.listMenu.setVisible(false);
  }

  // -------------------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------------------

  get typeDelay() {
    const speed = gameState.settings?.textSpeed ?? DIALOGUE.defaultTextSpeed;
    return TEXT_SPEEDS[speed] ?? TEXT_SPEEDS.normal;
  }

  /**
   * Show one line and wait for the player to acknowledge it.
   * @returns {Promise<void>}
   */
  showMessage(text, { waitForInput = true } = {}) {
    return new Promise((resolve) => {
      this.stopTyping();
      this.messageText.setText('');
      this.advanceArrow.setVisible(false);
      this.arrowTween.pause();

      let finished = false;

      /**
       * Show the whole line and either wait for a key or move on.
       * Stored on the scene so the "skip the typewriter" path can call the
       * SAME function — stopping the timer without finishing would leave the
       * promise unresolved and hang the entire battle.
       */
      const finish = () => {
        if (finished) return;
        finished = true;

        this.stopTyping();
        this.finishCurrentMessage = null;
        this.messageText.setText(text);

        if (!waitForInput) {
          this.time.delayedCall(BATTLE_UI.messagePause, resolve);
          return;
        }

        this.advanceArrow.setVisible(true);
        this.arrowTween.resume();
        this.messageResolve = () => {
          this.advanceArrow.setVisible(false);
          this.arrowTween.pause();
          this.messageResolve = null;
          resolve();
        };
      };

      this.finishCurrentMessage = finish;

      const delay = this.typeDelay;
      if (delay <= 0) {
        finish();
        return;
      }

      this.isTyping = true;
      let index = 0;
      this.typeTimer = this.time.addEvent({
        delay,
        repeat: text.length - 1,
        callback: () => {
          index += 1;
          this.messageText.setText(text.slice(0, index));
          if (index >= text.length) finish();
        },
      });
    });
  }

  stopTyping() {
    if (this.typeTimer) {
      this.typeTimer.remove(false);
      this.typeTimer = null;
    }
    this.isTyping = false;
  }

  // -------------------------------------------------------------------------
  // Playing back engine events
  // -------------------------------------------------------------------------

  /**
   * Narrate a list of engine events in order, animating as it goes.
   * @returns {Promise<void>}
   */
  async playEvents(events) {
    this.phase = 'busy';

    for (const event of events) {
      switch (event.type) {
        case 'message':
          await this.showMessage(event.text);
          break;

        case 'damage':
          await this.animateDamage(event);
          break;

        case 'faint':
          await this.animateFaint(event.side);
          break;

        case 'switch':
          this.refreshSide(event.side);
          break;

        case 'refresh':
          this.refreshHuds();
          break;

        case 'captureThrow':
          await this.animateCaptureThrow(event);
          break;

        case 'requestSwitch':
          await this.promptForcedSwitch();
          break;

        case 'end':
          await this.finishBattle(event.result);
          return;

        default:
          break;
      }
    }
  }

  async animateDamage({ side, amount }) {
    const hud = side === 'player' ? this.playerHud : this.opponentHud;
    const sprite = side === 'player' ? this.playerSprite : this.opponentSprite;
    const battler = side === 'player' ? this.engine.player : this.engine.opponent;

    // A short shake so a hit is felt, not just read.
    if (amount > 0) {
      this.tweens.add({
        targets: sprite,
        x: sprite.x + (side === 'player' ? -8 : 8),
        duration: BATTLE_UI.hitShakeDuration / 2,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }

    const tween = hud.setHp(battler.creature.currentHp);
    hud.refreshStatus();

    // Wait for the bar to finish sliding, so damage never outruns the message.
    if (tween) {
      await new Promise((resolve) => tween.once('complete', resolve));
    }
  }

  async animateFaint(side) {
    const sprite = side === 'player' ? this.playerSprite : this.opponentSprite;

    await new Promise((resolve) => {
      this.tweens.add({
        targets: sprite,
        y: sprite.y + 26,
        alpha: 0,
        duration: BATTLE_UI.faintDuration,
        ease: 'Sine.easeIn',
        onComplete: resolve,
      });
    });
  }

  /**
   * The orb: thrown, the creature drawn into it, then one wobble per shake the
   * engine actually rolled. Nothing here decides anything — `event.shakes` and
   * `event.captured` came out of the capture roll, so what the player watches is
   * literally what happened.
   */
  async animateCaptureThrow(event) {
    const sprite = this.opponentSprite;
    const home = { x: sprite.x, y: sprite.y };

    const orb = this.add
      .circle(LAYOUT.playerSprite.x, LAYOUT.playerSprite.y - 20, 9, COLORS.accent)
      .setStrokeStyle(2, COLORS.ink)
      .setDepth(DEPTHS.entities + 1);

    // Arc the orb across the screen.
    await new Promise((resolve) => {
      this.tweens.add({
        targets: orb,
        x: home.x,
        y: home.y,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: resolve,
      });
    });

    // The creature is drawn in.
    await new Promise((resolve) => {
      this.tweens.add({
        targets: sprite,
        scale: 0,
        alpha: 0,
        duration: 260,
        ease: 'Quad.easeIn',
        onComplete: resolve,
      });
    });

    // One wobble per shake that was rolled.
    for (let i = 0; i < event.shakes; i += 1) {
      await new Promise((resolve) => {
        this.tweens.add({
          targets: orb,
          angle: { from: -22, to: 22 },
          duration: CAPTURE_UI.shakeDuration,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            orb.setAngle(0);
            resolve();
          },
        });
      });
      await this.pause(CAPTURE_UI.shakeGap);
    }

    if (event.captured) {
      // A short settle, then the orb stays shut.
      await this.pause(CAPTURE_UI.clickPause);
      this.tweens.add({ targets: orb, alpha: 0.85, duration: 160 });
      return;
    }

    // It broke out: the orb pops and the creature comes back.
    orb.destroy();
    sprite.setScale(0).setAlpha(1);
    await new Promise((resolve) => {
      this.tweens.add({
        targets: sprite,
        scale: LAYOUT.creatureScale,
        duration: 260,
        ease: 'Back.easeOut',
        onComplete: resolve,
      });
    });
  }

  /** A plain wait that respects the scene's own clock. */
  pause(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  /** Point a side's sprite and panel at whatever creature is now out. */
  refreshSide(side) {
    const battler = side === 'player' ? this.engine.player : this.engine.opponent;
    const sprite = side === 'player' ? this.playerSprite : this.opponentSprite;
    const hud = side === 'player' ? this.playerHud : this.opponentHud;
    const home = side === 'player' ? LAYOUT.playerSprite : LAYOUT.opponentSprite;

    sprite.setTexture(creatureTextureKey(battler.creature.speciesId));
    sprite.setPosition(home.x, home.y);
    sprite.setAlpha(1);
    hud.setCreature(battler.creature);

    // A small entrance pop, so a switch is obvious.
    sprite.setScale(LAYOUT.creatureScale * 0.6);
    this.tweens.add({
      targets: sprite, scale: LAYOUT.creatureScale, duration: 220, ease: 'Back.easeOut',
    });
  }

  refreshHuds() {
    this.playerHud.refresh();
    this.opponentHud.refresh();
  }

  // -------------------------------------------------------------------------
  // Menus
  // -------------------------------------------------------------------------

  openActionMenu() {
    if (this.engine.isOver()) return;

    this.phase = 'action';
    this.hideMenus();
    this.messageText.setText(`What will ${getDisplayName(this.engine.player.creature)} do?`);
    this.advanceArrow.setVisible(false);
    this.arrowTween.pause();

    // Party is disabled when there is nobody to swap to. Opening a list where
    // every entry is greyed out is a dead end the player has to guess their way
    // out of, so it is better to say so up front — the same treatment Run gets.
    const canSwitch = this.engine.hasHealthyReserves();

    this.actionMenu.setItems([
      { label: 'Fight', value: 'fight' },
      {
        label: 'Party',
        value: 'party',
        enabled: canSwitch,
        hint: canSwitch ? '' : 'No one else to send out',
      },
      { label: 'Bag', value: 'bag' },
      {
        label: 'Run',
        value: 'run',
        enabled: this.engine.canRun,
        hint: this.engine.canRun ? '' : 'No running from this battle',
      },
    ]);
    this.actionMenu.setVisible(true);
  }

  hideMenus() {
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(false);
    this.listMenu.setVisible(false);
  }

  handleAction(action) {
    switch (action) {
      case 'fight': this.openMoveMenu(); break;
      case 'party': this.openPartyMenu(); break;
      case 'bag': this.openBagMenu(); break;
      case 'run': this.submit({ type: 'run' }); break;
      default: break;
    }
  }

  openMoveMenu() {
    this.phase = 'move';
    this.hideMenus();

    const creature = this.engine.player.creature;
    const items = creature.moves.map((entry) => {
      const move = getMove(entry.id);
      return {
        label: move ? move.name : entry.id,
        detail: move ? `${move.type.toUpperCase()}  ${entry.pp}/${entry.maxPp}` : '',
        accent: move ? getTypeColor(move.type) : COLORS.parchmentDim,
        // A move with no PP left cannot be chosen.
        enabled: entry.pp > 0,
        hint: move ? move.description : '',
        value: entry,
      };
    });

    // Every move exhausted: offer Struggle so the battle cannot deadlock.
    if (items.every((item) => item.enabled === false)) {
      items.push({
        label: 'Struggle', detail: 'NORMAL  --',
        hint: 'No moves left. This will hurt.',
        value: { struggle: true },
      });
    }

    this.moveMenu.setItems(items);
    this.moveMenu.setHint('');
    this.moveMenu.setVisible(true);
    this.messageText.setText('');
  }

  handleMoveChosen(value) {
    if (value.struggle) {
      this.submit({ type: 'move', moveEntry: this.engine.player.creature.moves[0], isStruggle: true });
      return;
    }
    this.submit({ type: 'move', moveEntry: value });
  }

  // --- Party -------------------------------------------------------------

  openPartyMenu(forced = false) {
    this.phase = forced ? 'forcedSwitch' : 'party';
    this.hideMenus();

    const items = this.engine.playerParty.map((creature, index) => {
      const check = this.engine.canSwitchTo(index);
      const status = getStatus(creature.status);
      const hp = `${creature.currentHp}/${creature.stats.hp}`;

      return {
        label: getDisplayName(creature),
        detail: `Lv ${creature.level}  ${hp}${status ? '  ' + status.tag : ''}`,
        accent: this.hpColour(creature),
        enabled: check.ok,
        hint: check.ok ? 'Send this one out' : this.switchHint(check.reason),
        value: { kind: 'switch', index },
      };
    });

    this.listMenu.setItems(items);
    this.listMenu.setVisible(true);
    this.messageText.setText(
      forced ? 'Choose your next creature!' : 'Which creature will you send out?'
    );
    // A forced switch has no way out — you must pick someone.
    this.listMenu.onCancel = forced ? null : () => this.openActionMenu();
  }

  hpColour(creature) {
    const fraction = getHpFraction(creature);
    return fraction > 0.5 ? COLORS.good : fraction > 0.2 ? COLORS.accent : COLORS.danger;
  }

  switchHint(reason) {
    if (reason === 'active') return 'Already in battle';
    if (reason === 'fainted') return 'This one has fainted';
    return 'Cannot send this one out';
  }

  // --- Bag ---------------------------------------------------------------

  openBagMenu() {
    this.phase = 'bag';
    this.hideMenus();

    const entries = Object.entries(gameState.inventory)
      .map(([id, quantity]) => ({ item: getItem(id), quantity }))
      .filter((entry) => entry.item && entry.quantity > 0);

    const items = entries.map(({ item, quantity }) => {
      const usable = isItemUsableInBattle(item, {
        allowCapture: this.engine.allowCapture,
      });
      return {
        label: item.name,
        detail: `x${quantity}`,
        enabled: usable.ok,
        hint: usable.ok ? item.description : usable.reason,
        value: { kind: 'item', itemId: item.id },
      };
    });

    if (items.length === 0) {
      items.push({ label: 'No items', detail: '', enabled: false, hint: 'Your bag is empty.', value: null });
    }

    this.listMenu.setItems(items);
    this.listMenu.setVisible(true);
    this.listMenu.onCancel = () => this.openActionMenu();
    this.messageText.setText('Use which item?');
  }


  handleListCancel() {
    if (this.phase === 'forcedSwitch') return; // no backing out of a forced switch
    this.openActionMenu();
  }

  handleListChosen(item) {
    if (!item.value) return;

    if (item.value.kind === 'switch') {
      if (this.phase === 'forcedSwitch') {
        this.hideMenus();
        // The choice is made; the replacement arriving is narration, not a menu.
        this.phase = 'busy';
        this.playEvents(this.engine.sendOutAfterFaint(item.value.index))
          .then(() => this.resolveForcedSwitch());
        return;
      }
      this.submit({ type: 'switch', index: item.value.index });
      return;
    }

    if (item.value.kind === 'item') {
      // An orb is thrown at the opponent; everything else is used on your own
      // creature. The engine owns the throw, so capture is a battle action
      // rather than something the menu does behind its back.
      if (isCaptureItem(getItem(item.value.itemId))) {
        this.submit({ type: 'capture', itemId: item.value.itemId });
        return;
      }
      this.submit(this.buildItemAction(item.value.itemId));
    }
  }

  /**
   * Turn an item choice into an engine action.
   * The engine applies whatever `apply()` returns, so the bag rules — quantity,
   * valid target, no overhealing — stay here with the bag.
   */
  buildItemAction(itemId) {
    const item = getItem(itemId);
    const target = this.engine.player.creature;

    return {
      type: 'item',
      itemId,
      apply: () => {
        if (getItemCount(gameState.inventory, itemId) <= 0) {
          return { ok: false, messages: ['You have none of those!'] };
        }

        // ItemEffects decides what the item does — the same function the
        // overworld bag calls — so the two can never disagree about how much a
        // Potion heals or when one would be wasted.
        const result = applyItemToCreature(item, target, { where: 'battle' });
        if (!result.success) return { ok: false, messages: [result.message] };

        // A cure has to clear the battle-only sleep counter too; the creature's
        // own status is ItemEffects' business, this counter is the engine's.
        if (result.curedStatus === 'sleep') this.engine.player.sleepTurns = 0;

        removeItem(gameState.inventory, itemId, 1);
        return { ok: true, messages: [`You used the ${item.name}.`, result.message] };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Turn submission
  // -------------------------------------------------------------------------

  submit(action) {
    this.hideMenus();
    this.phase = 'busy';

    const events = this.engine.submitPlayerAction(action);
    this.playEvents(events).then(() => {
      if (this.engine.isOver()) return;
      if (this.engine.awaitingPlayerSwitch) return; // the prompt is already open
      this.openActionMenu();
    });
  }

  /** Called after a forced switch resolves, to hand control back. */
  resolveForcedSwitch() {
    if (this.engine.isOver()) return;
    this.openActionMenu();
  }

  async promptForcedSwitch() {
    await this.showMessage('Choose your next creature!', { waitForInput: false });
    this.openPartyMenu(true);
  }

  // -------------------------------------------------------------------------
  // Finishing
  // -------------------------------------------------------------------------

  async finishBattle(result) {
    this.phase = 'busy';
    this.hideMenus();

    if (result.outcome === BATTLE_RESULT.WIN) {
      await this.narrateRewards(result);
    }

    if (result.outcome === BATTLE_RESULT.CAPTURED) {
      await this.narrateCapture(result);
    }

    this.phase = 'done';
    await this.showMessage('...', { waitForInput: false });

    // Leave the outcome where the console (and the browser test suite) can see
    // it after this scene has stopped. Read-only; nothing in the game uses it.
    if (typeof window !== 'undefined') window.__lastBattleResult = result;

    const finished = this.onFinished;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      if (finished) finished(result);
    });
  }

  /**
   * Hand the caught creature over and say where it went.
   *
   * A capture awards no experience: the creature IS the reward, and paying out
   * both would make catching strictly better than fighting.
   */
  async narrateCapture(result) {
    const { messages } = receiveCapturedCreature(result.captured);
    for (const text of messages) await this.showMessage(text);
  }

  /** Experience, level-ups, new moves and evolutions, narrated in order. */
  async narrateRewards(result) {
    if (result.money > 0) {
      // Through EconomySystem, so prize money obeys the same rules as every
      // other coin the player earns.
      addMoney(gameState, result.money);
      await this.showMessage(`You got ${result.money} coins!`);
    }

    for (const { creature, result: gain } of result.experience) {
      const name = getDisplayName(creature);
      await this.showMessage(`${name} gained ${gain.gained} EXP!`);

      if (gain.levelsGained > 0) {
        this.playerHud.refresh();
        await this.showMessage(`${name} grew to Lv. ${gain.toLevel}!`);
      }

      for (const entry of gain.movesToLearn) {
        await this.handleMoveLearning(creature, entry.moveId);
      }

      if (gain.evolutionTo) {
        await this.handleEvolution(creature, gain.evolutionTo);
      }

      this.playerHud.refresh();
    }
  }

  /**
   * Teach a move, asking the player what to forget if the creature is full.
   * Always resolves — there is no way to get stuck in this prompt.
   */
  async handleMoveLearning(creature, moveId) {
    const outcome = teachMove(creature, moveId);

    if (outcome.learned) {
      await this.showMessage(outcome.message);
      return;
    }
    if (!outcome.needsChoice) return;

    await this.showMessage(outcome.message);

    const move = getMove(moveId);
    const choice = await this.askMoveToForget(creature, move);

    if (choice === null) {
      await this.showMessage(`${getDisplayName(creature)} did not learn ${move.name}.`);
      return;
    }

    const replaced = replaceMove(creature, choice, moveId);
    if (replaced.message) await this.showMessage(replaced.message);
  }

  /**
   * Ask which move to forget.
   * @returns {Promise<number|null>} the slot, or null to decline
   */
  askMoveToForget(creature, newMove) {
    return new Promise((resolve) => {
      this.phase = 'learnMove';
      this.hideMenus();
      this.messageText.setText(`Forget a move to learn ${newMove.name}?`);

      const items = creature.moves.map((entry, index) => {
        const move = getMove(entry.id);
        return {
          label: move ? move.name : entry.id,
          detail: move ? `${move.type.toUpperCase()}  ${entry.pp}/${entry.maxPp}` : '',
          accent: move ? getTypeColor(move.type) : COLORS.parchmentDim,
          hint: `Forget this to learn ${newMove.name}`,
          value: { slot: index },
        };
      });

      items.push({
        label: `Don't learn`, detail: newMove.name,
        hint: `Give up on ${newMove.name}`,
        value: { slot: null },
      });

      this.listMenu.setItems(items);
      this.listMenu.setVisible(true);

      // Closing the prompt must ALWAYS put the shared list menu back the way it
      // was and hand the phase back, whichever way the player leaves. Leaving
      // the phase on 'learnMove' would keep feeding key presses to a hidden
      // menu while the rest of the level-up is still being narrated.
      const close = (slot) => {
        this.listMenu.setVisible(false);
        this.restoreListHandlers();
        this.phase = 'busy';
        resolve(slot);
      };

      // Cancelling is the same as declining, so the player can never be stuck.
      this.listMenu.onCancel = () => close(null);
      this.listMenu.onSelect = (item) => close(item.value.slot);
    });
  }

  /** Put the shared list menu back to its normal handlers. */
  restoreListHandlers() {
    this.listMenu.onSelect = (item) => this.handleListChosen(item);
    this.listMenu.onCancel = () => this.handleListCancel();
  }

  async handleEvolution(creature, targetSpeciesId) {
    const before = getDisplayName(creature);
    await this.showMessage(`What? ${before} is evolving!`);

    const outcome = evolveCreature(creature, targetSpeciesId);
    if (!outcome.evolved) return;

    // Experience is shared, so the creature that evolves is not always the one
    // standing on the field. Only redraw the field for the creature that is
    // actually there — otherwise a benched party member would hijack the
    // sprite and the HP bar.
    const onField = creature === this.engine.player.creature;

    if (onField) {
      // A brief flash and a swap, so evolution is something you watch happen.
      this.playerSprite.setTexture(creatureTextureKey(creature.speciesId));
      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.playerSprite,
          scale: LAYOUT.creatureScale * 1.35,
          alpha: 0.25,
          duration: 320,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.playerSprite.setScale(LAYOUT.creatureScale).setAlpha(1);
            resolve();
          },
        });
      });

      this.playerHud.setCreature(creature);
    }

    await this.showMessage(outcome.message);
  }

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  update() {
    // A message owns the input while it is showing.
    if (this.messageResolve || this.isTyping) {
      if (this.controls.justPressed('confirm') || this.controls.justPressed('cancel')) {
        if (this.isTyping) {
          // Skip the typewriter by COMPLETING the line, not by cancelling it.
          // Merely stopping the timer would leave the message promise pending
          // and the battle would hang.
          if (this.finishCurrentMessage) this.finishCurrentMessage();
          return;
        }
        if (this.messageResolve) this.messageResolve();
      }
      return;
    }

    switch (this.phase) {
      case 'action': this.actionMenu.update(this.controls); break;
      case 'move': this.moveMenu.update(this.controls); break;
      case 'party':
      case 'bag':
      case 'forcedSwitch':
      case 'learnMove':
        this.listMenu.update(this.controls);
        break;
      default: break;
    }
  }

  cleanup() {
    this.stopTyping();
    if (this.arrowTween) this.arrowTween.stop();
    if (this.playerHud) this.playerHud.destroy();
    if (this.opponentHud) this.opponentHud.destroy();
    if (this.actionMenu) this.actionMenu.destroy();
    if (this.moveMenu) this.moveMenu.destroy();
    if (this.listMenu) this.listMenu.destroy();
    this.messageResolve = null;
    this.finishCurrentMessage = null;
    this.eventQueue = [];
  }
}
