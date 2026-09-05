/**
 * TurnResolver.js
 * ----------------------------------------------------------------------------
 * Who goes first.
 *
 * THE ORDER OF QUESTIONS, highest wins:
 *   1. ACTION priority — running, switching and using an item all happen before
 *      anyone attacks. Committing to a switch should not cost you the turn.
 *   2. MOVE priority — Quick Jab and Shadow Sneak go before ordinary moves.
 *   3. Effective SPEED — the creature's Speed stat, adjusted by its Speed stage
 *      and halved if it is paralysed.
 *   4. A coin flip, so a true tie is not always won by the same side.
 *
 * All four live here. Nothing else in the battle system decides order.
 */

import { BATTLE } from '../../config/balance.js';
import { getEffectiveStat } from './StatStages.js';
import { getStatusSpeedMultiplier } from './StatusSystem.js';

/** A battler's Speed as the turn order sees it. */
export function getEffectiveSpeed(battler) {
  const staged = getEffectiveStat(battler, 'speed');
  const multiplier = getStatusSpeedMultiplier(battler.creature);
  return Math.max(1, Math.floor(staged * multiplier));
}

/** The priority number for a chosen action. */
export function getActionPriority(action) {
  const base = BATTLE.actionPriority[action.type] ?? 0;

  // Only a move carries its own extra priority on top of the action's.
  if (action.type === 'move' && action.move) {
    return base + (action.move.priority ?? 0);
  }
  return base;
}

/**
 * Sort the turn's actions into the order they resolve in.
 *
 * @param {Array<{battler: object, action: object}>} entries
 * @param {() => number} [random] used only to break exact ties
 * @returns {Array} the same entries, ordered
 */
export function resolveTurnOrder(entries, random = Math.random) {
  // Decide every tie-break up front so the sort comparator stays pure — a
  // comparator that calls random() can produce an inconsistent ordering.
  const decorated = entries.map((entry, index) => ({
    entry,
    index,
    priority: getActionPriority(entry.action),
    speed: getEffectiveSpeed(entry.battler),
    coin: random(),
  }));

  decorated.sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.speed !== b.speed) return b.speed - a.speed;
    if (a.coin !== b.coin) return a.coin - b.coin;
    return a.index - b.index;
  });

  return decorated.map((d) => d.entry);
}
