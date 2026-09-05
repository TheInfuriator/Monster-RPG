/**
 * DamageCalculator.js
 * ----------------------------------------------------------------------------
 * How much a move hurts. The single source of damage truth.
 *
 * THE FORMULA
 *   base   = floor(floor(floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2
 *   damage = floor(base * STAB * effectiveness * critical * burn * variance)
 *
 * Nested flooring at each step is deliberate: it keeps the numbers whole and
 * predictable, which makes damage reproducible in tests and easy to reason about
 * when balancing.
 *
 * WHICH STATS
 *   physical moves use Attack against Defense
 *   special moves use Sp. Atk against Sp. Def
 *   status moves never come here at all
 *
 * Every constant lives in `src/config/balance.js`. Randomness is injected, so
 * every rule below is exactly testable.
 */

import { BATTLE, STATUS } from '../../config/balance.js';
import { MOVE_CATEGORIES } from '../../data/moveEffects.js';
import { getEffectiveness, hasSameTypeBonus, describeEffectiveness } from '../TypeChart.js';
import { getCreatureTypes } from '../CreatureFactory.js';
import { getEffectiveStat, getStageMultiplier } from './StatStages.js';
import { randomFloat, chance } from '../../utils/rng.js';

/** Which attack/defence pair a move category uses. */
function getStatPair(category) {
  return category === MOVE_CATEGORIES.PHYSICAL
    ? { attack: 'attack', defense: 'defense' }
    : { attack: 'spAttack', defense: 'spDefense' };
}

/**
 * Did this move land a critical hit?
 * Kept separate so tests and the engine can decide it once and pass it in.
 */
export function rollCriticalHit(random = Math.random) {
  return chance(BATTLE.critChance, random);
}

/**
 * Work out the damage a move does.
 *
 * @param {object} params
 * @param {object} params.attacker  battler using the move
 * @param {object} params.defender  battler being hit
 * @param {object} params.move      a move definition
 * @param {boolean} [params.isCritical]
 * @param {() => number} [params.random]
 * @returns {{
 *   damage: number, effectiveness: number, effectivenessLabel: string,
 *   isCritical: boolean, hasStab: boolean, isImmune: boolean
 * }}
 */
export function calculateDamage({ attacker, defender, move, isCritical = false, random = Math.random }) {
  const defenderTypes = getCreatureTypes(defender.creature);
  const effectiveness = getEffectiveness(move.type, defenderTypes);

  const result = {
    damage: 0,
    effectiveness,
    effectivenessLabel: describeEffectiveness(effectiveness),
    isCritical,
    hasStab: false,
    isImmune: effectiveness === 0,
  };

  // Status moves do no damage; they should never have reached this function.
  if (move.category === MOVE_CATEGORIES.STATUS || !move.power) return result;

  // An immune defender takes nothing at all, and no minimum applies.
  if (effectiveness === 0) return result;

  const { attack: attackStat, defense: defenseStat } = getStatPair(move.category);

  // A critical hit ignores the defender's defensive buffs, so a wall of
  // Harden Shell cannot make a lucky hit worthless.
  const attackValue = getEffectiveStat(attacker, attackStat);
  const defenseValue = getEffectiveStat(defender, defenseStat, { ignoreStages: isCritical });

  const level = attacker.creature.level;
  const levelFactor = Math.floor((2 * level) / 5) + 2;
  const base =
    Math.floor(Math.floor((levelFactor * move.power * attackValue) / defenseValue) / 50) + 2;

  const hasStab = hasSameTypeBonus(move.type, getCreatureTypes(attacker.creature));
  result.hasStab = hasStab;

  let damage = base;
  if (hasStab) damage = Math.floor(damage * BATTLE.stabMultiplier);
  damage = Math.floor(damage * effectiveness);
  if (isCritical) damage = Math.floor(damage * BATTLE.critMultiplier);

  // A burn saps physical strength. Special moves are unaffected — the burn is
  // in the body, not the mind.
  if (attacker.creature.status === 'burn' && move.category === MOVE_CATEGORIES.PHYSICAL) {
    damage = Math.floor(damage * STATUS.burnAttackMultiplier);
  }

  const variance = randomFloat(BATTLE.damageVarianceMin, BATTLE.damageVarianceMax, random);
  damage = Math.floor(damage * variance);

  // A move that connects always does something, however badly outmatched.
  result.damage = Math.max(BATTLE.minimumDamage, damage);
  return result;
}

/**
 * Did the move hit?
 *
 * Chance = move accuracy x (accuracy stage / evasion stage).
 * A move with `accuracy: null` never misses — that is how the data expresses a
 * guaranteed hit, and it must bypass stages entirely.
 *
 * @returns {boolean}
 */
export function rollAccuracy({ attacker, defender, move, random = Math.random }) {
  if (move.accuracy === null || move.accuracy === undefined) return true;

  const accuracyMultiplier = getEffectiveAccuracy(attacker, defender);
  const chanceToHit = (move.accuracy / 100) * accuracyMultiplier;

  // Always leave a sliver of hope in both directions.
  const clamped = Math.min(Math.max(chanceToHit, 0), 1);
  return random() < clamped;
}

/**
 * The combined accuracy/evasion multiplier between two battlers.
 * Exposed so tests can check the stage interaction without rolling dice.
 */
export function getEffectiveAccuracy(attacker, defender) {
  const accuracy = getStageMultiplier('accuracy', attacker.stages.accuracy ?? 0);
  const evasion = getStageMultiplier('evasion', defender.stages.evasion ?? 0);

  return accuracy / evasion;
}
