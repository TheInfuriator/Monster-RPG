/**
 * BattleEngine.js
 * ----------------------------------------------------------------------------
 * The battle itself: who is out, whose turn it is, and what happened.
 *
 * This file owns battle STATE and ORCHESTRATION. It does not own formulas —
 * those live in DamageCalculator, StatStages, StatusSystem, TurnResolver,
 * MoveEffectRunner and ExperienceSystem — and it contains no Phaser code, so
 * an entire battle can be played out in a unit test.
 *
 * HOW THE SCENE USES IT
 *   const battle = new BattleEngine(config);
 *   battle.start();                       -> events describing the opening
 *   battle.submitPlayerAction(action);    -> events for the whole turn
 *   battle.result                         -> null until the battle ends
 *
 * Everything it does is reported as EVENTS — small objects like
 * `{ type: 'message', text: '...' }` or `{ type: 'damage', side, amount }`.
 * The scene plays them back at reading speed. That separation is what keeps the
 * pacing logic out of the rules.
 *
 * BATTLE TYPES: 'wild' | 'trainer' | 'practice'. They differ only in whether
 * running is allowed, the experience multiplier, and the opening text — there
 * is no separate code path per type.
 */

import { BATTLE } from '../../config/balance.js';
import { getMove } from '../../data/moves.js';
import { MOVE_CATEGORIES } from '../../data/moveEffects.js';
import { getDisplayName, isFainted } from '../CreatureFactory.js';
import { getEffectivenessMessage } from '../TypeChart.js';
import { createStages } from './StatStages.js';
import { calculateDamage, rollAccuracy, rollCriticalHit } from './DamageCalculator.js';
import { checkCanAct, applyEndOfTurnStatus } from './StatusSystem.js';
import { resolveTurnOrder, getEffectiveSpeed } from './TurnResolver.js';
import { runEffect, rollHitCount, damageCreature } from './MoveEffectRunner.js';
import { calculateExperienceReward, distributeExperience } from './ExperienceSystem.js';
import { chooseAction } from './BattleAI.js';
import {
  attemptCapture, getCaptureModifier, describeShakes, CAPTURE_REFUSAL,
} from './CaptureCalculator.js';
import { getItem } from '../../data/items.js';
import { getItemCount, removeItem } from '../InventorySystem.js';

/** How a battle can finish. */
export const BATTLE_RESULT = {
  WIN: 'win',
  LOSS: 'loss',
  FLED: 'fled',
  CAPTURED: 'captured',
};

/** Wrap a creature in the per-battle state it needs. */
function createBattler(creature, side) {
  return {
    creature,
    side, // 'player' | 'opponent'
    stages: createStages(),
    sleepTurns: 0,
    isFlinching: false,
  };
}

export class BattleEngine {
  /**
   * @param {object} config
   * @param {object[]} config.playerParty
   * @param {object[]} config.opponentParty
   * @param {'wild'|'trainer'|'practice'} [config.battleType]
   * @param {string} [config.opponentName]
   * @param {boolean} [config.canRun]      defaults to true only for wild battles
   * @param {boolean} [config.awardExperience] defaults to true
   * @param {number} [config.rewardMoney]
   * @param {() => number} [config.random]
   */
  constructor(config) {
    this.battleType = config.battleType || 'wild';
    this.opponentName = config.opponentName || null;
    this.random = config.random || Math.random;

    this.playerParty = config.playerParty;
    this.opponentParty = config.opponentParty;

    this.canRun = config.canRun ?? this.battleType === 'wild';
    /**
     * Whether orbs may be thrown. Defaults to "wild battles only", and a
     * scripted battle can turn it off explicitly. This flag is the ONLY thing
     * that decides it — nothing checks an NPC, a map or a scene name.
     */
    this.allowCapture = config.allowCapture ?? this.battleType === 'wild';
    this.awardExperience = config.awardExperience ?? true;
    this.rewardMoney = config.rewardMoney ?? 0;
    /**
     * Whether losing this battle blacks the player out — coins lost, party
     * restored, wake up at the recovery point. Wild and trainer battles do;
     * a practice bout at the Lodge does not, so testing the battle system can
     * never cost anything. This is a CONFIGURATION, so Phase 8's trainers turn
     * it on by setting a flag rather than by editing the defeat code.
     */
    this.blackoutOnDefeat = config.blackoutOnDefeat ?? this.battleType !== 'practice';
    /**
     * The player's bag, as the plain `{ itemId: count }` object GameState
     * holds. The engine consumes orbs itself, because whether a throw was
     * legitimate is a battle rule, not a menu one. Defaults to an empty bag so
     * a test can build an engine without one.
     */
    this.inventory = config.inventory || {};

    this.player = createBattler(this.firstHealthy(this.playerParty), 'player');
    this.opponent = createBattler(this.firstHealthy(this.opponentParty), 'opponent');

    /** Creatures that were sent out, and so share the experience. */
    this.participants = new Set([this.player.creature]);

    this.turnCount = 0;
    this.result = null;
    /** Set when the player must choose a replacement before the battle continues. */
    this.awaitingPlayerSwitch = false;
    this.escapeAttempts = 0;
  }

  firstHealthy(party) {
    return party.find((creature) => !isFainted(creature)) || party[0];
  }

  // -------------------------------------------------------------------------
  // Queries the UI needs
  // -------------------------------------------------------------------------

  /** Party members that could still be switched to. */
  getSwitchableCreatures() {
    return this.playerParty.filter(
      (creature) => !isFainted(creature) && creature !== this.player.creature
    );
  }

  /** True if the player has anything left to send out. */
  hasHealthyReserves() {
    return this.getSwitchableCreatures().length > 0;
  }

  /** Moves the active player creature can actually pick. */
  getUsablePlayerMoves() {
    return this.player.creature.moves.filter((move) => move.pp > 0);
  }

  isOver() {
    return this.result !== null;
  }

  // -------------------------------------------------------------------------
  // Starting
  // -------------------------------------------------------------------------

  start() {
    const events = [];
    const foe = getDisplayName(this.opponent.creature);

    if (this.battleType === 'wild') {
      events.push({ type: 'message', text: `A wild ${foe} appeared!` });
    } else {
      const who = this.opponentName || 'The opponent';
      events.push({ type: 'message', text: `${who} wants to battle!` });
      events.push({ type: 'message', text: `${who} sent out ${foe}!` });
    }

    events.push({ type: 'message', text: `Go, ${getDisplayName(this.player.creature)}!` });
    return events;
  }

  // -------------------------------------------------------------------------
  // A turn
  // -------------------------------------------------------------------------

  /**
   * Play out one turn from the player's chosen action.
   *
   * @param {object} playerAction one of:
   *   { type: 'move', moveEntry }
   *   { type: 'switch', index }   index into the player's party
   *   { type: 'item', itemId }
   *   { type: 'run' }
   * @returns {object[]} events describing everything that happened
   */
  submitPlayerAction(playerAction) {
    if (this.isOver()) return [];
    if (this.awaitingPlayerSwitch) {
      console.warn('[BattleEngine] A replacement is still needed before the next turn.');
      return [];
    }

    this.turnCount += 1;
    const events = [];

    // Running is resolved before anything else: you either get away or you have
    // wasted your turn, and either way no attack of yours happens.
    if (playerAction.type === 'run') {
      return this.resolveRun();
    }

    // Throwing an orb works the same way: it IS the player's action for the
    // turn. Catch it and the battle ends there; miss and the opponent hits back.
    if (playerAction.type === 'capture') {
      return this.resolveCapture(playerAction);
    }

    const opponentAction = this.chooseOpponentAction();

    const order = resolveTurnOrder(
      [
        { battler: this.player, action: this.decorateAction(playerAction) },
        { battler: this.opponent, action: opponentAction },
      ],
      this.random
    );

    for (const entry of order) {
      if (this.isOver()) break;

      // A creature that fainted earlier in the turn does not get to act.
      if (isFainted(entry.battler.creature)) continue;

      events.push(...this.performAction(entry.battler, entry.action));

      if (this.checkForEnd(events)) return events;
    }

    events.push(...this.endOfTurn());
    this.checkForEnd(events);

    return events;
  }

  /** Attach the resolved move object so the turn resolver can read its priority. */
  decorateAction(action) {
    if (action.type !== 'move') return action;

    const move = getMove(action.moveEntry.id);
    return { ...action, move };
  }

  chooseOpponentAction() {
    const decision = chooseAction(this.opponent, this.player, this.random);

    if (decision.type === 'struggle') {
      return { type: 'move', move: BATTLE.struggle, moveEntry: null, isStruggle: true };
    }
    return { type: 'move', move: decision.move, moveEntry: decision.moveEntry };
  }

  // -------------------------------------------------------------------------
  // Performing one action
  // -------------------------------------------------------------------------

  performAction(battler, action) {
    switch (action.type) {
      case 'switch':
        return this.performSwitch(action.index);
      case 'item':
        return this.performItem(battler, action);
      case 'move':
        return this.performMove(battler, action);
      default:
        return [];
    }
  }

  performMove(battler, action) {
    const events = [];
    const defender = battler === this.player ? this.opponent : this.player;
    const name = getDisplayName(battler.creature);

    // Sleep, paralysis and flinching are all checked in one place.
    const canAct = checkCanAct(battler, this.random);
    events.push(...canAct.messages.map((text) => ({ type: 'message', text })));
    if (!canAct.canAct) return events;

    // No usable moves at all: fall back to Struggle so a battle cannot deadlock.
    let move = action.move;
    let moveEntry = action.moveEntry;
    let isStruggle = Boolean(action.isStruggle);

    if (!isStruggle && (!moveEntry || moveEntry.pp <= 0)) {
      if (this.getUsableMovesFor(battler).length === 0) {
        move = BATTLE.struggle;
        moveEntry = null;
        isStruggle = true;
      } else if (!moveEntry) {
        return events;
      }
    }

    // PP RULE: one point is spent when the move is USED, whether or not it hits.
    // Missing still costs you the attempt, which is what makes accuracy matter.
    if (moveEntry) moveEntry.pp = Math.max(0, moveEntry.pp - 1);

    events.push({ type: 'message', text: `${name} used ${move.name}!` });

    if (!rollAccuracy({ attacker: battler, defender, move, random: this.random })) {
      events.push({ type: 'message', text: `${name}'s attack missed!` });
      return events;
    }

    if (move.category === MOVE_CATEGORIES.STATUS) {
      events.push(...this.applyMoveEffect(move, battler, defender, 0));
      return events;
    }

    events.push(...this.performDamagingMove({ move, battler, defender, isStruggle }));
    return events;
  }

  performDamagingMove({ move, battler, defender, isStruggle }) {
    const events = [];
    const hits = rollHitCount(move, this.random);
    let totalDamage = 0;
    let lastResult = null;

    for (let hit = 0; hit < hits; hit += 1) {
      if (isFainted(defender.creature)) break;

      const isCritical = rollCriticalHit(this.random);
      const outcome = calculateDamage({
        attacker: battler,
        defender,
        move,
        isCritical,
        random: this.random,
      });
      lastResult = outcome;

      if (outcome.isImmune) {
        events.push({ type: 'message', text: 'It had no effect...' });
        return events;
      }

      const dealt = damageCreature(defender.creature, outcome.damage);
      totalDamage += dealt;

      events.push({
        type: 'damage',
        side: defender.side,
        amount: dealt,
        isCritical,
      });

      if (isCritical) events.push({ type: 'message', text: 'A critical hit!' });
    }

    if (hits > 1) {
      events.push({ type: 'message', text: `Hit ${hits} times!` });
    }

    // Effectiveness is announced once, after the damage, however many hits.
    if (lastResult) {
      const message = getEffectivenessMessage(lastResult.effectiveness);
      if (message) events.push({ type: 'message', text: message });
    }

    // Struggle's recoil is defined on the move itself, not in the database.
    if (isStruggle) {
      const recoil = Math.max(1, Math.floor(totalDamage * BATTLE.struggle.recoilFraction));
      damageCreature(battler.creature, recoil);
      events.push({ type: 'damage', side: battler.side, amount: recoil });
      events.push({
        type: 'message',
        text: `${getDisplayName(battler.creature)} is hurt by recoil!`,
      });
    } else {
      events.push(...this.applyMoveEffect(move, battler, defender, totalDamage));
    }

    events.push(...this.checkFaint(defender));
    events.push(...this.checkFaint(battler));

    return events;
  }

  applyMoveEffect(move, user, target, damageDealt) {
    if (!move.effect) return [];

    const outcome = runEffect({
      effect: move.effect,
      user,
      target,
      damageDealt,
      random: this.random,
    });

    const events = outcome.messages.map((text) => ({ type: 'message', text }));
    events.push({ type: 'refresh' });
    return events;
  }

  getUsableMovesFor(battler) {
    return battler.creature.moves.filter((move) => move.pp > 0);
  }

  // -------------------------------------------------------------------------
  // Switching
  // -------------------------------------------------------------------------

  /**
   * Can the player switch to this party slot?
   * @returns {{ok: boolean, reason: string|null}}
   */
  canSwitchTo(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.playerParty.length) {
      return { ok: false, reason: 'invalid' };
    }
    const creature = this.playerParty[index];
    if (creature === this.player.creature) return { ok: false, reason: 'active' };
    if (isFainted(creature)) return { ok: false, reason: 'fainted' };
    return { ok: true, reason: null };
  }

  /**
   * Swap the active creature.
   *
   * STAGE RESET RULE: switching clears all stat stages. Buffs belong to the
   * creature that earned them, so you cannot stack Sharpen Claws and then pass
   * the benefit to a fresh creature.
   */
  performSwitch(index) {
    const check = this.canSwitchTo(index);
    if (!check.ok) return [];

    const events = [];
    const leaving = getDisplayName(this.player.creature);
    const incoming = this.playerParty[index];

    if (!isFainted(this.player.creature)) {
      events.push({ type: 'message', text: `Come back, ${leaving}!` });
    }

    this.player.creature = incoming;
    this.player.stages = createStages();
    this.player.sleepTurns = 0;
    this.player.isFlinching = false;
    this.participants.add(incoming);

    events.push({ type: 'switch', side: 'player' });
    events.push({ type: 'message', text: `Go, ${getDisplayName(incoming)}!` });

    return events;
  }

  /**
   * Replace a fainted player creature. Used after the forced-switch prompt.
   * @returns {object[]} events, or [] if the choice was invalid
   */
  sendOutAfterFaint(index) {
    const check = this.canSwitchTo(index);
    if (!check.ok) return [];

    const events = this.performSwitch(index);
    this.awaitingPlayerSwitch = false;
    return events;
  }

  // -------------------------------------------------------------------------
  // Items
  // -------------------------------------------------------------------------

  /**
   * Use an item from the bag.
   * The engine only applies the EFFECT; the bag itself is the caller's business,
   * so this stays usable from a test with no GameState.
   */
  performItem(battler, action) {
    const events = [];
    const outcome = action.apply ? action.apply() : { messages: [], ok: false };

    for (const text of outcome.messages || []) events.push({ type: 'message', text });
    events.push({ type: 'refresh' });
    return events;
  }

  // -------------------------------------------------------------------------
  // Capture
  // -------------------------------------------------------------------------

  /**
   * Can an orb be thrown at all right now, and if not, why not?
   *
   * Separated from the throw so the bag can grey an orb out with the same
   * reasoning that would have refused it, rather than a second guess at it.
   *
   * @returns {{ok: boolean, reason: string|null, item: object|null,
   *            modifier: number}}
   */
  canCapture(itemId) {
    const refuse = (reason, item = null) => ({ ok: false, reason, item, modifier: 0 });

    if (!this.allowCapture) return refuse(CAPTURE_REFUSAL.NOT_WILD);

    const item = getItem(itemId);
    if (!item) return refuse(CAPTURE_REFUSAL.NO_ITEM);

    const modifier = getCaptureModifier(item);
    if (modifier === null) return refuse(CAPTURE_REFUSAL.NO_ITEM, item);

    if (getItemCount(this.inventory, itemId) <= 0) {
      return refuse(CAPTURE_REFUSAL.NONE_LEFT, item);
    }

    const target = this.opponent?.creature;
    if (!target) return refuse(CAPTURE_REFUSAL.NO_TARGET, item);
    if (isFainted(target)) return refuse(CAPTURE_REFUSAL.FAINTED, item);

    return { ok: true, reason: null, item, modifier };
  }

  /**
   * Throw an orb at the wild creature.
   *
   * TURN RULE: a legitimate throw IS the player's action for the turn. Catch it
   * and the battle ends immediately — the opponent never gets to answer. Fail
   * and the opponent attacks, exactly as a failed escape works.
   *
   * The orb is consumed only for a throw that actually happens. A refusal — the
   * wrong kind of battle, an empty bag, a fainted target — costs nothing at all,
   * not the item and not the turn.
   */
  resolveCapture(action) {
    const events = [];
    const check = this.canCapture(action.itemId);

    if (!check.ok) {
      events.push({ type: 'message', text: check.reason });
      return events;
    }

    const target = this.opponent.creature;
    const name = getDisplayName(target);

    // Consume exactly one orb, now that the throw is definitely happening.
    removeItem(this.inventory, action.itemId, 1);

    events.push({ type: 'message', text: `You threw the ${check.item.name}!` });

    const outcome = attemptCapture({
      target,
      modifier: check.modifier,
      random: this.random,
    });

    // One event per shake, so the scene can animate exactly what was rolled.
    events.push({
      type: 'captureThrow',
      itemId: action.itemId,
      shakes: outcome.shakes,
      captured: outcome.captured,
      chance: outcome.chance,
    });

    if (!outcome.captured) {
      events.push({ type: 'message', text: describeShakes(outcome.shakes) });

      // A failed throw costs the turn. The opponent answers, then end-of-turn
      // effects run — the same shape as a failed escape.
      const opponentAction = this.chooseOpponentAction();
      if (!isFainted(this.opponent.creature)) {
        events.push(...this.performAction(this.opponent, opponentAction));
      }
      events.push(...this.endOfTurn());
      this.checkForEnd(events);
      return events;
    }

    events.push({ type: 'message', text: `Gotcha! ${name} was captured!` });

    // The captured creature is THE creature that was fought — the same object,
    // with its level, HP, PP, status and instance id intact. Nothing rebuilds
    // it, so what the player receives is what they weakened.
    this.result = {
      outcome: BATTLE_RESULT.CAPTURED,
      experience: [],
      money: 0,
      captured: target,
    };
    events.push({ type: 'end', result: this.result });
    return events;
  }

  // -------------------------------------------------------------------------
  // Running
  // -------------------------------------------------------------------------

  resolveRun() {
    const events = [];

    if (!this.canRun) {
      events.push({ type: 'message', text: 'There is no running from this battle!' });
      return events;
    }

    this.escapeAttempts += 1;

    const playerSpeed = getEffectiveSpeed(this.player);
    const foeSpeed = getEffectiveSpeed(this.opponent);

    // Faster creatures escape more easily, and repeated attempts help a little,
    // so a slow creature is never permanently trapped.
    const speedBonus = ((playerSpeed - foeSpeed) / Math.max(1, foeSpeed)) * BATTLE.escapeSpeedFactor;
    const chanceToFlee = Math.min(
      0.95,
      Math.max(0.15, BATTLE.baseEscapeChance + speedBonus + this.escapeAttempts * 0.1)
    );

    if (this.random() < chanceToFlee) {
      events.push({ type: 'message', text: 'Got away safely!' });
      this.result = { outcome: BATTLE_RESULT.FLED, experience: [], money: 0 };
      events.push({ type: 'end', result: this.result });
      return events;
    }

    events.push({ type: 'message', text: "Couldn't get away!" });

    // A failed escape costs the turn, so the opponent still attacks.
    const opponentAction = this.chooseOpponentAction();
    if (!isFainted(this.opponent.creature)) {
      events.push(...this.performAction(this.opponent, opponentAction));
    }
    events.push(...this.endOfTurn());
    this.checkForEnd(events);

    return events;
  }

  // -------------------------------------------------------------------------
  // End of turn and fainting
  // -------------------------------------------------------------------------

  endOfTurn() {
    const events = [];

    for (const battler of [this.player, this.opponent]) {
      // Flinching only ever lasts one turn.
      battler.isFlinching = false;

      if (isFainted(battler.creature)) continue;

      const outcome = applyEndOfTurnStatus(battler);
      if (outcome.damage > 0) {
        events.push({ type: 'damage', side: battler.side, amount: outcome.damage });
      }
      for (const text of outcome.messages) events.push({ type: 'message', text });
      if (outcome.fainted) events.push({ type: 'faint', side: battler.side });
    }

    return events;
  }

  /** Announce a faint if one has just happened. */
  checkFaint(battler) {
    if (!isFainted(battler.creature)) return [];
    if (battler.hasAnnouncedFaint) return [];

    battler.hasAnnouncedFaint = true;
    return [
      { type: 'message', text: `${getDisplayName(battler.creature)} fainted!` },
      { type: 'faint', side: battler.side },
    ];
  }

  /**
   * Decide whether the battle is over, or whether someone needs replacing.
   * Appends any resulting events. Returns true if the battle has ended.
   */
  checkForEnd(events) {
    if (this.isOver()) return true;

    // --- Opponent down ---
    if (isFainted(this.opponent.creature)) {
      const next = this.opponentParty.find((c) => !isFainted(c));

      if (next) {
        this.opponent.creature = next;
        this.opponent.stages = createStages();
        this.opponent.sleepTurns = 0;
        this.opponent.hasAnnouncedFaint = false;
        events.push({ type: 'switch', side: 'opponent' });
        events.push({
          type: 'message',
          text: `${this.opponentName || 'The opponent'} sent out ${getDisplayName(next)}!`,
        });
        return false;
      }

      events.push(...this.finishBattle(BATTLE_RESULT.WIN));
      return true;
    }

    // --- Player down ---
    if (isFainted(this.player.creature)) {
      if (this.hasHealthyReserves()) {
        // Ask ONCE. This runs again after end-of-turn effects, and a second
        // request would re-open the prompt on top of itself and eat the key
        // press the player made on the first one.
        if (!this.awaitingPlayerSwitch) {
          this.awaitingPlayerSwitch = true;
          events.push({ type: 'requestSwitch' });
        }
        return false;
      }

      events.push(...this.finishBattle(BATTLE_RESULT.LOSS));
      return true;
    }

    return false;
  }

  // -------------------------------------------------------------------------
  // Finishing
  // -------------------------------------------------------------------------

  finishBattle(outcome) {
    const events = [];

    if (outcome === BATTLE_RESULT.WIN) {
      events.push({
        type: 'message',
        text: this.battleType === 'wild'
          ? 'You won the battle!'
          : `You defeated ${this.opponentName || 'the opponent'}!`,
      });
    } else {
      events.push({ type: 'message', text: 'You have no creatures left...' });
    }

    const experience = outcome === BATTLE_RESULT.WIN ? this.awardBattleExperience() : [];

    this.result = {
      outcome,
      experience,
      money: outcome === BATTLE_RESULT.WIN ? this.rewardMoney : 0,
      // Carried on the result so the overworld reads the battle's own rule
      // rather than guessing from the battle type.
      blackoutOnDefeat: this.blackoutOnDefeat,
    };

    events.push({ type: 'end', result: this.result });
    return events;
  }

  /**
   * Hand out experience for every opponent creature that fainted.
   * Returns the per-creature results so the scene can narrate level-ups.
   */
  awardBattleExperience() {
    if (!this.awardExperience) return [];

    const defeated = this.opponentParty.filter((creature) => isFainted(creature));
    const total = defeated.reduce(
      (sum, creature) => sum + calculateExperienceReward(creature, this.battleType),
      0
    );

    if (total <= 0) return [];

    return distributeExperience([...this.participants], total);
  }
}
