/**
 * TypeChart.js
 * ----------------------------------------------------------------------------
 * Answers one question: how much does a move of type X hurt a creature of
 * type(s) Y?
 *
 * Pure functions, no Phaser, fully unit tested. Battle code calls
 * `getEffectiveness()` and never looks at the chart itself.
 */

import { TYPE_CHART, TYPE_SET, TYPE_INFO } from '../data/types.js';

/** Multiplier categories, so UI and battle messages agree on the wording. */
export const EFFECTIVENESS = {
  IMMUNE: 'immune',
  VERY_RESISTED: 'veryResisted',
  RESISTED: 'resisted',
  NEUTRAL: 'neutral',
  SUPER: 'super',
  VERY_SUPER: 'verySuper',
};

/** The message shown in battle for each category. */
export const EFFECTIVENESS_MESSAGES = {
  [EFFECTIVENESS.IMMUNE]: 'It had no effect...',
  [EFFECTIVENESS.VERY_RESISTED]: "It's barely effective...",
  [EFFECTIVENESS.RESISTED]: "It's not very effective...",
  [EFFECTIVENESS.NEUTRAL]: null, // neutral hits say nothing extra
  [EFFECTIVENESS.SUPER]: "It's super effective!",
  [EFFECTIVENESS.VERY_SUPER]: "It's massively effective!",
};

/**
 * How effective one attacking type is against ONE defending type.
 * Unlisted matchups are neutral, so this returns 1 for anything not in the chart.
 *
 * @param {string} attackingType
 * @param {string} defendingType
 * @returns {number} 0, 0.5, 1 or 2
 */
export function getSingleEffectiveness(attackingType, defendingType) {
  if (!TYPE_SET.has(attackingType)) {
    console.warn(`[TypeChart] Unknown attacking type "${attackingType}". Treating as neutral.`);
    return 1;
  }
  if (!TYPE_SET.has(defendingType)) {
    console.warn(`[TypeChart] Unknown defending type "${defendingType}". Treating as neutral.`);
    return 1;
  }

  const row = TYPE_CHART[attackingType];
  if (!row) return 1;

  const multiplier = row[defendingType];
  return multiplier === undefined ? 1 : multiplier;
}

/**
 * How effective an attacking type is against a creature's full type list.
 * Multipliers for each defending type are MULTIPLIED together, which is what
 * makes 4x and 0.25x possible on dual-type creatures — and why one immunity
 * makes the whole attack fail.
 *
 * @param {string} attackingType
 * @param {string[]} defendingTypes  one or two types
 * @returns {number}
 */
export function getEffectiveness(attackingType, defendingTypes) {
  if (!Array.isArray(defendingTypes) || defendingTypes.length === 0) {
    console.warn('[TypeChart] A creature must have at least one type. Treating as neutral.');
    return 1;
  }

  return defendingTypes.reduce(
    (total, defendingType) => total * getSingleEffectiveness(attackingType, defendingType),
    1
  );
}

/**
 * Turn a multiplier into a category name, for messages and UI colouring.
 * @param {number} multiplier
 * @returns {string} one of EFFECTIVENESS
 */
export function describeEffectiveness(multiplier) {
  if (multiplier === 0) return EFFECTIVENESS.IMMUNE;
  if (multiplier < 0.5) return EFFECTIVENESS.VERY_RESISTED; // 0.25x
  if (multiplier < 1) return EFFECTIVENESS.RESISTED; // 0.5x
  if (multiplier === 1) return EFFECTIVENESS.NEUTRAL;
  if (multiplier <= 2) return EFFECTIVENESS.SUPER;
  return EFFECTIVENESS.VERY_SUPER; // 4x
}

/**
 * The battle message for a multiplier, or null when there is nothing to say.
 * @param {number} multiplier
 * @returns {string|null}
 */
export function getEffectivenessMessage(multiplier) {
  return EFFECTIVENESS_MESSAGES[describeEffectiveness(multiplier)];
}

/**
 * Same-type attack bonus check: does this move share a type with its user?
 * Kept here so the battle calculator does not need to know about type rules.
 */
export function hasSameTypeBonus(moveType, userTypes) {
  return Array.isArray(userTypes) && userTypes.includes(moveType);
}

/** The display colour for a type, for badges and generated artwork. */
export function getTypeColor(type) {
  return TYPE_INFO[type] ? TYPE_INFO[type].color : 0xa8a292;
}

export function getTypeDarkColor(type) {
  return TYPE_INFO[type] ? TYPE_INFO[type].dark : 0x847f72;
}
