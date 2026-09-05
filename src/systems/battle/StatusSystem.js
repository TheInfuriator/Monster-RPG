/**
 * StatusSystem.js
 * ----------------------------------------------------------------------------
 * The four lasting conditions: poison, burn, paralysis and sleep.
 *
 * RULES CHOSEN
 * - A creature carries at most ONE major status. A second one fails cleanly
 *   rather than replacing the first, so a burned creature cannot be quietly
 *   "upgraded" to asleep and lose its damage penalty.
 * - Poison and burn deal residual damage at the END of the turn, after both
 *   sides have acted. That means a creature always gets its turn before the
 *   poison that might finish it.
 * - Paralysis halves Speed and costs the turn some of the time.
 * - Sleep stores a countdown when applied. The counter is read at the START of
 *   the sleeper's action and only then spent, so a sleep of N always costs the
 *   target exactly N turns — the shortest sleep still costs one.
 * - A fainted creature keeps its status until it is healed. That matters for
 *   the Mender's Hall later.
 *
 * Pure logic, injected randomness, no Phaser.
 */

import { STATUS } from '../../config/balance.js';
import { STATUS_SET, getStatus } from '../../data/statuses.js';
import { getDisplayName, isFainted } from '../CreatureFactory.js';
import { randomInt, chance } from '../../utils/rng.js';

/** Can this status be applied to this creature right now? */
export function canApplyStatus(creature, statusId) {
  if (!STATUS_SET.has(statusId)) return { ok: false, reason: 'unknown' };
  if (isFainted(creature)) return { ok: false, reason: 'fainted' };
  if (creature.status === statusId) return { ok: false, reason: 'already' };
  if (creature.status) return { ok: false, reason: 'other' };
  return { ok: true, reason: null };
}

/**
 * Give a creature a status condition.
 *
 * @returns {{applied: boolean, message: string|null, reason: string|null}}
 */
export function applyStatus(battler, statusId, random = Math.random) {
  const creature = battler.creature;
  const name = getDisplayName(creature);
  const check = canApplyStatus(creature, statusId);

  if (!check.ok) {
    const messages = {
      unknown: null,
      fainted: null,
      already: `${name} is already ${getStatus(statusId)?.name.toLowerCase()}!`,
      other: 'But it failed!',
    };
    return { applied: false, message: messages[check.reason] ?? 'But it failed!', reason: check.reason };
  }

  creature.status = statusId;

  // Sleep is the only status with a duration. Storing it on the BATTLER rather
  // than the creature means a creature never walks around the overworld with a
  // half-finished sleep counter.
  if (statusId === 'sleep') {
    battler.sleepTurns = randomInt(STATUS.sleepMinTurns, STATUS.sleepMaxTurns, random);
  }

  return { applied: true, message: getApplyMessage(name, statusId), reason: null };
}

/** The line printed when a status lands. */
function getApplyMessage(name, statusId) {
  switch (statusId) {
    case 'poison': return `${name} was poisoned!`;
    case 'burn': return `${name} was burned!`;
    case 'paralysis': return `${name} is paralysed! It may be unable to move!`;
    case 'sleep': return `${name} fell asleep!`;
    default: return null;
  }
}

/** Remove a creature's status, whatever it is. */
export function clearStatus(battler) {
  battler.creature.status = null;
  battler.sleepTurns = 0;
}

/**
 * Check whether a status stops a creature acting this turn.
 * Called at the START of that creature's action.
 *
 * @returns {{canAct: boolean, messages: string[]}}
 */
export function checkCanAct(battler, random = Math.random) {
  const creature = battler.creature;
  const name = getDisplayName(creature);
  const messages = [];

  // Flinching is not a status — it lasts only until the end of this turn — but
  // it is checked in the same place, so the rules stay together.
  if (battler.isFlinching) {
    battler.isFlinching = false;
    messages.push(`${name} flinched and couldn't move!`);
    return { canAct: false, messages };
  }

  if (creature.status === 'sleep') {
    // Check the counter BEFORE spending a turn on it. Decrementing first would
    // let the shortest sleep expire on the very action it was meant to stop,
    // so a one-turn sleep would cost the target nothing at all.
    if (battler.sleepTurns <= 0) {
      clearStatus(battler);
      messages.push(`${name} woke up!`);
      return { canAct: true, messages };
    }

    battler.sleepTurns -= 1;
    messages.push(`${name} is fast asleep.`);
    return { canAct: false, messages };
  }

  if (creature.status === 'paralysis' && chance(STATUS.paralysisSkipChance, random)) {
    messages.push(`${name} is paralysed! It can't move!`);
    return { canAct: false, messages };
  }

  return { canAct: true, messages };
}

/**
 * Residual damage at the end of a turn, from poison or burn.
 *
 * @returns {{damage: number, messages: string[], fainted: boolean}}
 */
export function applyEndOfTurnStatus(battler) {
  const creature = battler.creature;
  const name = getDisplayName(creature);
  const result = { damage: 0, messages: [], fainted: false };

  if (isFainted(creature) || !creature.status) return result;

  const fraction =
    creature.status === 'poison' ? STATUS.poisonDamageFraction
      : creature.status === 'burn' ? STATUS.burnDamageFraction
        : 0;

  if (fraction === 0) return result;

  // Always at least 1, so a very frail creature is not immune to poison.
  const damage = Math.max(1, Math.floor(creature.stats.hp * fraction));
  const actual = Math.min(damage, creature.currentHp);
  creature.currentHp -= actual;

  result.damage = actual;
  result.messages.push(
    creature.status === 'poison'
      ? `${name} is hurt by poison!`
      : `${name} is hurt by its burn!`
  );

  if (isFainted(creature)) {
    result.fainted = true;
    result.messages.push(`${name} fainted!`);
  }

  return result;
}

/**
 * The Speed multiplier a status imposes.
 * Read by the turn resolver; nothing else should apply status to speed.
 */
export function getStatusSpeedMultiplier(creature) {
  return creature.status === 'paralysis' ? STATUS.paralysisSpeedMultiplier : 1;
}
