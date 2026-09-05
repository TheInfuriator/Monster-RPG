/**
 * StatStages.js
 * ----------------------------------------------------------------------------
 * The temporary buffs and debuffs that exist only inside a battle.
 *
 * A creature's Attack does not change when Sharpen Claws is used — instead the
 * battle remembers "Attack is at stage +1" and multiplies. That keeps the saved
 * creature clean: stages live in battle state and vanish when the battle ends.
 *
 * Stages run from -6 to +6. The multipliers are in `src/config/balance.js`.
 *
 * Pure functions, no Phaser.
 */

import { STAT_STAGES } from '../../config/balance.js';
import { MODIFIABLE_STATS, MODIFIABLE_STAT_SET } from '../../data/moveEffects.js';

/** Stats that use the gentler accuracy curve rather than the battle-stat curve. */
const ACCURACY_STYLE_STATS = new Set(['accuracy', 'evasion']);

/** A fresh set of stages, all neutral. */
export function createStages() {
  const stages = {};
  for (const stat of MODIFIABLE_STATS) stages[stat] = 0;
  return stages;
}

/** Force a stage into the legal -6..+6 range. */
export function clampStage(stage) {
  if (!Number.isFinite(stage)) return 0;
  return Math.min(Math.max(Math.round(stage), STAT_STAGES.min), STAT_STAGES.max);
}

/**
 * The multiplier a stage produces for a given stat.
 * Accuracy and evasion use a gentler curve, because a miss is much more
 * frustrating to a player than a slightly weaker hit.
 */
export function getStageMultiplier(stat, stage) {
  const safeStage = clampStage(stage);
  const table = ACCURACY_STYLE_STATS.has(stat)
    ? STAT_STAGES.accuracyMultipliers
    : STAT_STAGES.battleStatMultipliers;

  // Index 0 is stage -6, so shift by the minimum.
  return table[safeStage - STAT_STAGES.min];
}

/**
 * Change one stat's stage.
 *
 * Returns what actually happened, so the caller can write the right message
 * without repeating the clamping rules:
 *   applied  how many stages actually changed (0 if already at the limit)
 *   stage    the new stage
 *   atLimit  true if the change was refused because it was already maxed
 *
 * @param {object} stages a stage object from createStages()
 * @param {string} stat
 * @param {number} delta  positive to raise, negative to lower
 */
export function applyStageChange(stages, stat, delta) {
  if (!MODIFIABLE_STAT_SET.has(stat)) {
    console.warn(`[StatStages] "${stat}" is not a stat a move may change.`);
    return { applied: 0, stage: 0, atLimit: false };
  }

  const before = clampStage(stages[stat] ?? 0);
  const after = clampStage(before + delta);
  stages[stat] = after;

  return {
    applied: after - before,
    stage: after,
    atLimit: after === before && delta !== 0,
  };
}

/**
 * The message a stat change should print.
 * Kept beside the rules so wording and behaviour cannot drift apart.
 *
 * @param {string} name    the creature's display name
 * @param {string} stat
 * @param {{applied:number, atLimit:boolean}} result from applyStageChange
 * @param {number} requested the delta that was asked for
 */
export function describeStageChange(name, stat, result, requested) {
  const label = STAT_LABELS[stat] || stat;

  if (result.atLimit) {
    return requested > 0
      ? `${name}'s ${label} won't go any higher!`
      : `${name}'s ${label} won't go any lower!`;
  }

  const size = Math.abs(result.applied);
  if (size === 0) return null;

  const adverb = size >= 3 ? ' drastically' : size === 2 ? ' sharply' : '';
  return result.applied > 0
    ? `${name}'s ${label}${adverb} rose!`
    : `${name}'s ${label}${adverb} fell!`;
}

/** Display names for the stats a move can change. */
export const STAT_LABELS = {
  attack: 'Attack',
  defense: 'Defense',
  spAttack: 'Sp. Atk',
  spDefense: 'Sp. Def',
  speed: 'Speed',
  accuracy: 'accuracy',
  evasion: 'evasiveness',
};

/**
 * A creature's effective stat inside battle: its real stat, multiplied by its
 * stage, then by anything a status condition does to it.
 *
 * This is THE place battle stats are read. Nothing else should multiply stats.
 *
 * @param {object} battler a battler from BattleState
 * @param {string} stat    'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed'
 * @param {object} [options]
 * @param {boolean} [options.ignoreStages] true when a critical hit ignores
 *        the defender's defensive buffs
 */
export function getEffectiveStat(battler, stat, options = {}) {
  const base = battler.creature.stats[stat];
  const stage = options.ignoreStages ? 0 : battler.stages[stat] ?? 0;
  const multiplier = getStageMultiplier(stat, stage);

  return Math.max(1, Math.floor(base * multiplier));
}
