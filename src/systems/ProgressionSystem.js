/**
 * ProgressionSystem.js
 * ----------------------------------------------------------------------------
 * Everything the world is allowed to ask about the player's progress, as one
 * flat set of true/false conditions.
 *
 * Three kinds of progress, one vocabulary:
 *
 *   gotStarter                a story flag
 *   trainer:route1Scout       a trainer who has been beaten
 *   badge:verdantSigil        a Sigil the player holds
 *
 * A map file writes `when: 'badge:verdantSigil'` on a dialogue branch, or
 * `openWhen: 'route1GateOpen'` on a barrier, and both go through here. That is
 * what keeps `if (gameState.badges.includes(...))` out of every scene, and it
 * is why the Verdant Sigil needs no story flag standing beside it saying the
 * same thing — one fact, one record, readable everywhere.
 *
 * Pure: no Phaser, no scenes. Returns a fresh object each call; callers may
 * read it but must not keep it, because progress moves.
 */

import { getDialogueConditions } from './TrainerSystem.js';
import { getBadgeConditions } from './BadgeSystem.js';
import { gameState } from '../core/GameState.js';

/**
 * Flags, beaten trainers and earned Sigils together.
 * @returns {Record<string, boolean>}
 */
export function getWorldConditions(state = gameState) {
  return {
    ...getDialogueConditions(state),
    ...getBadgeConditions(state),
  };
}

/**
 * True if one condition holds right now.
 * Handy for a single check where building the whole set would be noise.
 */
export function meetsCondition(condition, state = gameState) {
  if (!condition) return true;
  return Boolean(getWorldConditions(state)[condition]);
}
