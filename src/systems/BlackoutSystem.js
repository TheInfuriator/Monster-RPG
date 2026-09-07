/**
 * BlackoutSystem.js
 * ----------------------------------------------------------------------------
 * What happens when the whole party goes down.
 *
 * The rules — how much money is lost, who gets healed, where the player wakes
 * up — are all here, in one pure function. WorldScene does the fading and the
 * map change; it decides nothing.
 *
 * WHETHER a defeat blacks you out at all is a BATTLE CONFIGURATION
 * (`blackoutOnDefeat`), not a question about which NPC you were fighting. A
 * practice bout at the Lodge sets it false and costs you nothing; wild battles
 * and, later, real trainer battles leave it on. Phase 8 adds trainers by
 * setting a flag, not by editing this file.
 *
 * Pure: no Phaser, no scenes.
 */

import { getRecoveryPoint } from '../core/GameState.js';
import { calculateBlackoutLoss, spendMoney, getMoney } from './EconomySystem.js';
import { reviveParty } from './HealingSystem.js';

/**
 * Apply a blackout: lose some coins, wake up restored at your recovery point.
 *
 * Called exactly once per lost battle, by WorldScene, and it is the only thing
 * that takes the money — so the penalty cannot be applied twice by a retried
 * transition or a doubled event.
 *
 * @param {object} state GameState
 * @returns {{lost: number, moneyBefore: number, moneyAfter: number,
 *            recovery: {mapId: string, spawn: string}, revived: number,
 *            messages: string[]}}
 */
export function resolveBlackout(state) {
  const moneyBefore = getMoney(state);
  const lost = calculateBlackoutLoss(state);

  // A player with nothing loses nothing; the formula already gives 0, and
  // spendMoney would refuse a nonsense amount anyway.
  if (lost > 0) spendMoney(state, lost);

  const { revived } = reviveParty(state);
  const recovery = getRecoveryPoint(state);

  const messages = ['You have no Aethers left standing...', 'Everything goes dark.'];
  if (lost > 0) messages.push(`You dropped ${lost} coins in the scramble.`);

  return {
    lost,
    moneyBefore,
    moneyAfter: getMoney(state),
    recovery,
    revived,
    messages,
  };
}

/**
 * What the Mender says once you come round. Kept beside the rule so the words
 * and the recovery point cannot drift apart.
 */
export function getRecoveryMessages(playerName = 'Warden') {
  return [
    `You came round in the Mender's Hall.`,
    `"Easy now, ${playerName}. Your companions are patched up and rested."`,
  ];
}
