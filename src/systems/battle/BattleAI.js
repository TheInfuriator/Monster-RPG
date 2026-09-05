/**
 * BattleAI.js
 * ----------------------------------------------------------------------------
 * How an opponent decides what to do.
 *
 * Deliberately simple, and deliberately not clever. A wild creature or an early
 * trainer that plays perfectly is not fun to fight, and a complicated AI is hard
 * to test. This one:
 *
 *   - never picks a move with no PP
 *   - scores each move by the damage it would roughly do, so it usually picks
 *     something sensible rather than something useless
 *   - keeps a little randomness so it is not perfectly predictable
 *
 * Randomness is injected, so a seeded test always gets the same decision.
 */

import { MOVE_CATEGORIES } from '../../data/moveEffects.js';
import { getMove } from '../../data/moves.js';
import { getEffectiveness } from '../TypeChart.js';
import { getCreatureTypes } from '../CreatureFactory.js';
import { pickWeighted } from '../../utils/rng.js';
import { BATTLE } from '../../config/balance.js';

/** Every move the battler can actually use right now. */
export function getUsableMoves(battler) {
  return battler.creature.moves.filter((move) => move.pp > 0);
}

/**
 * Roughly how good a move looks against this defender.
 * Not real damage — just enough to prefer a super-effective hit over a
 * resisted one, and an attack over a pointless status move.
 */
export function scoreMove(moveEntry, attacker, defender) {
  const move = getMove(moveEntry.id);
  if (!move) return 0;

  if (move.category === MOVE_CATEGORIES.STATUS) {
    // Status moves are worth considering, but never the obvious first choice.
    return 12;
  }

  const effectiveness = getEffectiveness(move.type, getCreatureTypes(defender.creature));
  if (effectiveness === 0) return 1; // all but ruled out, never quite impossible

  const stab = getCreatureTypes(attacker.creature).includes(move.type) ? BATTLE.stabMultiplier : 1;
  return Math.max(1, Math.round(move.power * effectiveness * stab) / 4);
}

/**
 * Choose the opponent's action for this turn.
 *
 * @returns {{type:'move', move: object, moveEntry: object}}
 *          or `{ type:'struggle' }` when nothing is usable
 */
export function chooseAction(battler, defender, random = Math.random) {
  const usable = getUsableMoves(battler);

  if (usable.length === 0) return { type: 'struggle' };

  const weighted = usable.map((moveEntry) => ({
    moveEntry,
    weight: scoreMove(moveEntry, battler, defender),
  }));

  const chosen = pickWeighted(weighted, random) ?? weighted[0];
  return {
    type: 'move',
    move: getMove(chosen.moveEntry.id),
    moveEntry: chosen.moveEntry,
  };
}
