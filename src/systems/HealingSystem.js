/**
 * HealingSystem.js
 * ----------------------------------------------------------------------------
 * Putting creatures back together.
 *
 * One implementation, used by the Mender's Hall, by blackout recovery, and by
 * any scripted healing event later. Without this they would drift: the Mender
 * would restore PP and the blackout would forget to, and nobody would notice
 * for weeks.
 *
 * Everything here works on the EXISTING creature objects. Nothing is rebuilt,
 * so instance ids, nicknames, levels, experience, learned moves and met
 * locations all survive a full heal untouched — the creature is repaired, not
 * replaced.
 *
 * Pure: no Phaser, no scenes.
 */

import { fullyHeal, getDisplayName } from './CreatureFactory.js';

/** True if this creature has anything at all worth healing. */
export function needsHealing(creature) {
  if (!creature) return false;
  if (creature.currentHp < creature.stats.hp) return true;
  if (creature.status) return true;
  return creature.moves.some((move) => move.pp < move.maxPp);
}

/**
 * Fully restore one creature: HP, every move's PP, and any major status.
 *
 * @returns {{healed: boolean, restoredHp: number, restoredPp: number,
 *            clearedStatus: string|null}}
 *   `healed` is false when there was nothing to do, so a caller can say so.
 */
export function healCreatureFully(creature) {
  const nothing = { healed: false, restoredHp: 0, restoredPp: 0, clearedStatus: null };
  if (!creature) return nothing;
  if (!needsHealing(creature)) return nothing;

  const restoredHp = creature.stats.hp - creature.currentHp;
  const restoredPp = creature.moves.reduce((sum, move) => sum + (move.maxPp - move.pp), 0);
  const clearedStatus = creature.status;

  // CreatureFactory owns what "fully healed" means, so there is one definition.
  fullyHeal(creature);

  return { healed: true, restoredHp, restoredPp, clearedStatus };
}

/**
 * Fully restore everyone travelling with the player.
 *
 * Storage is deliberately untouched: creatures waiting there are not on the
 * journey, and quietly healing them would make storage a free hospital.
 *
 * @param {object} state GameState
 * @returns {{healed: number, considered: number, names: string[]}}
 */
export function healParty(state) {
  const party = state.party || [];
  const names = [];

  for (const creature of party) {
    if (healCreatureFully(creature).healed) names.push(getDisplayName(creature));
  }

  return { healed: names.length, considered: party.length, names };
}

/**
 * Restore a party far enough that the player can carry on — used after a
 * blackout, where a fainted team is the whole reason we are here.
 *
 * This is a full heal today. It is a separate name because "recover from a
 * defeat" and "the Mender helped you" are different events, and a later phase
 * may want them to differ.
 */
export function reviveParty(state) {
  const party = state.party || [];
  for (const creature of party) fullyHeal(creature);

  return { revived: party.length };
}
