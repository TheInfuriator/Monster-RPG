/**
 * ItemEffects.js
 * ----------------------------------------------------------------------------
 * What using an item actually does.
 *
 * ONE implementation, shared by the battle bag and the overworld bag. Before
 * this file the healing formula lived inside BattleScene, which meant the
 * overworld would have needed its own copy — and two copies of a rule are two
 * rules waiting to disagree.
 *
 * Nothing here touches the inventory. It answers "what would this item do to
 * this creature?" and the caller decides whether to spend one, so a refusal can
 * never cost the player an item by accident.
 *
 * RESULT SHAPE
 *   { success, consumed, message, reason, healedHp, curedStatus }
 *
 *   success   the item did something
 *   consumed  whether the caller should spend one. Only ever true when the item
 *             actually took effect.
 *   reason    a machine-readable refusal ('fullHp', 'wrongStatus', ...), so a
 *             test can check WHY rather than matching English.
 *
 * Pure: no Phaser, no GameState, no scenes.
 */

import { getDisplayName } from './CreatureFactory.js';
import { getStatus } from '../data/statuses.js';

/**
 * Every effect type this file knows how to carry out.
 *
 * Exported so the data tests can check the item database against the
 * IMPLEMENTATION rather than against a list copied into a test, which is how a
 * new effect type gets shipped with nothing to run it.
 */
export const SUPPORTED_ITEM_EFFECTS = new Set([
  'heal',
  'cureStatus',
  'cureAllStatus',
  // Capture is real, but the battle engine carries it out, not this file.
  'capture',
]);

/** Why an item did nothing. */
export const ITEM_REFUSAL = {
  NO_ITEM: 'noItem',
  NO_TARGET: 'noTarget',
  FAINTED: 'fainted',
  FULL_HP: 'fullHp',
  WRONG_STATUS: 'wrongStatus',
  NO_STATUS: 'noStatus',
  NOT_HERE: 'notHere',
  UNUSABLE: 'unusable',
};

const refuse = (reason, message) => ({
  success: false, consumed: false, message, reason, healedHp: 0, curedStatus: null,
});

/**
 * Where an item can be used. Derived from its effect unless the item says
 * otherwise, so most items need no extra annotation.
 *
 * @returns {{battle: boolean, field: boolean}}
 */
export function getItemUsage(item) {
  if (!item || !item.effect) return { battle: false, field: false };

  const defaults = {
    // An orb is thrown at an opponent, so it only means anything in a battle.
    capture: { battle: true, field: false },
    heal: { battle: true, field: true },
    cureStatus: { battle: true, field: true },
    cureAllStatus: { battle: true, field: true },
  }[item.effect.type] || { battle: false, field: false };

  return {
    battle: item.usableInBattle ?? defaults.battle,
    field: item.usableInField ?? defaults.field,
  };
}

/** True when using this item means choosing one of your own creatures. */
export function needsCreatureTarget(item) {
  if (!item || !item.effect) return false;
  return ['heal', 'cureStatus', 'cureAllStatus'].includes(item.effect.type);
}

/**
 * Use an item on one of the player's creatures.
 *
 * @param {object} item    an entry from src/data/items.js
 * @param {object} target  the creature it is being used on
 * @param {object} [options]
 * @param {'battle'|'field'} [options.where] defaults to 'field'
 * @returns {object} the result shape documented at the top of this file
 */
export function applyItemToCreature(item, target, { where = 'field' } = {}) {
  if (!item || !item.effect) return refuse(ITEM_REFUSAL.NO_ITEM, 'This cannot be used.');
  if (!target) return refuse(ITEM_REFUSAL.NO_TARGET, 'There is nobody to use that on.');

  const usage = getItemUsage(item);
  if (where === 'field' && !usage.field) {
    return refuse(ITEM_REFUSAL.NOT_HERE, 'This can only be used in a battle.');
  }
  if (where === 'battle' && !usage.battle) {
    return refuse(ITEM_REFUSAL.NOT_HERE, 'This cannot be used in battle.');
  }

  const name = getDisplayName(target);

  // A fainted creature is beyond an ordinary potion. Reviving one is a
  // different item that does not exist yet; refusing plainly beats pretending.
  if (target.currentHp <= 0) {
    return refuse(ITEM_REFUSAL.FAINTED, `${name} has fainted. This will not help.`);
  }

  switch (item.effect.type) {
    case 'heal':
      return applyHeal(item, target, name);
    case 'cureStatus':
      return applyCureStatus(item, target, name);
    case 'cureAllStatus':
      return applyCureAllStatus(item, target, name);
    default:
      return refuse(ITEM_REFUSAL.UNUSABLE, 'It would have no effect right now.');
  }
}

function applyHeal(item, target, name) {
  if (target.currentHp >= target.stats.hp) {
    // Refusing WITHOUT consuming the item is the important part.
    return refuse(ITEM_REFUSAL.FULL_HP, `${name}'s HP is already full!`);
  }

  const before = target.currentHp;
  target.currentHp = Math.min(target.stats.hp, before + item.effect.amount);
  const healedHp = target.currentHp - before;

  return {
    success: true,
    consumed: true,
    message: `${name} recovered ${healedHp} HP!`,
    reason: null,
    healedHp,
    curedStatus: null,
  };
}

function applyCureStatus(item, target, name) {
  const wanted = item.effect.status;

  if (target.status !== wanted) {
    const label = getStatus(wanted)?.name ?? wanted;
    return refuse(ITEM_REFUSAL.WRONG_STATUS, `${name} is not ${label.toLowerCase()}.`);
  }

  target.status = null;
  return {
    success: true,
    consumed: true,
    message: `${name} was cured!`,
    reason: null,
    healedHp: 0,
    curedStatus: wanted,
  };
}

function applyCureAllStatus(item, target, name) {
  if (!target.status) {
    return refuse(ITEM_REFUSAL.NO_STATUS, `${name} is not suffering from anything.`);
  }

  const cured = target.status;
  target.status = null;
  return {
    success: true,
    consumed: true,
    message: `${name} was cured!`,
    reason: null,
    healedHp: 0,
    curedStatus: cured,
  };
}
