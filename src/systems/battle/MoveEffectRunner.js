/**
 * MoveEffectRunner.js
 * ----------------------------------------------------------------------------
 * Carries out the `effect` on a move.
 *
 * THE IMPORTANT RULE: this file switches on the effect KIND, never on a move id.
 * That is what lets 56 moves — and any number added later — share one
 * implementation. Adding `effect: { kind: 'drain', fraction: 0.5 }` to a new
 * move makes it drain, with no code change anywhere.
 *
 * TO ADD A NEW EFFECT KIND
 *   1. Add it to EFFECT_KINDS in src/data/moveEffects.js
 *   2. Add a case to `runEffect` below
 *   3. Add its required shape to the move test
 * A test checks that every kind the database uses has a case here, so a new
 * kind cannot ship half-implemented.
 */

import { EFFECT_KINDS } from '../../data/moveEffects.js';
import { getDisplayName, isFainted } from '../CreatureFactory.js';
import { chance, randomInt } from '../../utils/rng.js';
import { applyStatus } from './StatusSystem.js';
import { applyStageChange, describeStageChange } from './StatStages.js';

/** Every effect kind this runner can carry out. Checked by the test suite. */
export const SUPPORTED_EFFECT_KINDS = new Set([
  EFFECT_KINDS.STATUS,
  EFFECT_KINDS.STAT_CHANGE,
  EFFECT_KINDS.HEAL,
  EFFECT_KINDS.DRAIN,
  EFFECT_KINDS.RECOIL,
  EFFECT_KINDS.MULTI_HIT,
  EFFECT_KINDS.FLINCH,
]);

/**
 * Heal a creature, never past full.
 * @returns {number} how much HP was actually restored
 */
export function healCreature(creature, amount) {
  const before = creature.currentHp;
  creature.currentHp = Math.min(creature.stats.hp, creature.currentHp + Math.max(0, amount));
  return creature.currentHp - before;
}

/**
 * Damage a creature, never below zero.
 * @returns {number} how much HP was actually taken
 */
export function damageCreature(creature, amount) {
  const before = creature.currentHp;
  creature.currentHp = Math.max(0, creature.currentHp - Math.max(0, amount));
  return before - creature.currentHp;
}

/**
 * Run a move's effect.
 *
 * @param {object} context
 * @param {object} context.effect      the move's effect block
 * @param {object} context.user        the battler that used the move
 * @param {object} context.target      the battler on the receiving end
 * @param {number} [context.damageDealt] needed by drain and recoil
 * @param {() => number} [context.random]
 * @returns {{messages: string[], fainted: object[]}}
 *          `fainted` lists any battler that fainted as a result
 */
export function runEffect({ effect, user, target, damageDealt = 0, random = Math.random }) {
  const result = { messages: [], fainted: [] };
  if (!effect) return result;

  if (!SUPPORTED_EFFECT_KINDS.has(effect.kind)) {
    console.warn(
      `[MoveEffectRunner] Effect kind "${effect.kind}" has no implementation. ` +
        `Add a case to runEffect().`
    );
    return result;
  }

  // A chance below 1 means the effect only sometimes happens.
  if (effect.chance !== undefined && effect.chance < 1 && !chance(effect.chance, random)) {
    return result;
  }

  switch (effect.kind) {
    case EFFECT_KINDS.STATUS:
      return applyStatusEffect(effect, user, target, random);

    case EFFECT_KINDS.STAT_CHANGE:
      return applyStatChangeEffect(effect, user, target);

    case EFFECT_KINDS.HEAL:
      return applyHealEffect(effect, user);

    case EFFECT_KINDS.DRAIN:
      return applyDrainEffect(effect, user, damageDealt);

    case EFFECT_KINDS.RECOIL:
      return applyRecoilEffect(effect, user, damageDealt);

    case EFFECT_KINDS.FLINCH:
      return applyFlinchEffect(target);

    case EFFECT_KINDS.MULTI_HIT:
      // Multi-hit changes how many times the move is EXECUTED, so it is handled
      // by the engine before damage rather than as an after-effect.
      return result;

    default:
      return result;
  }
}

function applyStatusEffect(effect, user, target, random) {
  // A status move aimed at the foe still targets the foe; a self-inflicted
  // status would need `target: 'self'`, which no move currently uses.
  const recipient = effect.target === 'self' ? user : target;
  if (isFainted(recipient.creature)) return { messages: [], fainted: [] };

  const outcome = applyStatus(recipient, effect.status, random);
  return { messages: outcome.message ? [outcome.message] : [], fainted: [] };
}

function applyStatChangeEffect(effect, user, target) {
  const recipient = effect.target === 'self' ? user : target;
  if (isFainted(recipient.creature)) return { messages: [], fainted: [] };

  const name = getDisplayName(recipient.creature);
  const outcome = applyStageChange(recipient.stages, effect.stat, effect.stages);
  const message = describeStageChange(name, effect.stat, outcome, effect.stages);

  return { messages: message ? [message] : [], fainted: [] };
}

function applyHealEffect(effect, user) {
  const creature = user.creature;
  const name = getDisplayName(creature);

  if (creature.currentHp >= creature.stats.hp) {
    return { messages: [`${name}'s HP is already full!`], fainted: [] };
  }

  const restored = healCreature(creature, Math.floor(creature.stats.hp * effect.fraction));
  return { messages: [`${name} recovered ${restored} HP!`], fainted: [] };
}

function applyDrainEffect(effect, user, damageDealt) {
  if (damageDealt <= 0) return { messages: [], fainted: [] };

  const name = getDisplayName(user.creature);
  const restored = healCreature(user.creature, Math.max(1, Math.floor(damageDealt * effect.fraction)));

  return {
    messages: restored > 0 ? [`${name} drained ${restored} HP!`] : [],
    fainted: [],
  };
}

function applyRecoilEffect(effect, user, damageDealt) {
  if (damageDealt <= 0) return { messages: [], fainted: [] };

  const name = getDisplayName(user.creature);
  const taken = damageCreature(user.creature, Math.max(1, Math.floor(damageDealt * effect.fraction)));

  const result = { messages: [`${name} is hit by the recoil!`], fainted: [] };
  if (isFainted(user.creature)) {
    result.messages.push(`${name} fainted!`);
    result.fainted.push(user);
  }
  // Report the exact figure so the player can see recoil is proportional.
  if (taken > 0) result.messages[0] = `${name} took ${taken} recoil damage!`;

  return result;
}

function applyFlinchEffect(target) {
  if (isFainted(target.creature)) return { messages: [], fainted: [] };

  // Flinching only matters if the target has not moved yet this turn; the
  // engine clears the flag at the end of the turn either way.
  target.isFlinching = true;
  return { messages: [], fainted: [] };
}

/**
 * How many times a multi-hit move strikes.
 * Returns 1 for anything that is not a multi-hit move.
 */
export function rollHitCount(move, random = Math.random) {
  const effect = move.effect;
  if (!effect || effect.kind !== EFFECT_KINDS.MULTI_HIT) return 1;

  return randomInt(effect.min, effect.max, random);
}
