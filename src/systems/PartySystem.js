/**
 * PartySystem.js
 * ----------------------------------------------------------------------------
 * The player's team.
 *
 * Up to `PARTY.maxSize` creatures travel with the player; anything caught beyond
 * that goes to storage. Everything here works on plain arrays of plain objects,
 * so the whole party serialises straight into a save file.
 *
 * Phase 3 needs only the data foundation. The party MENU arrives in Phase 6.
 */

import { PARTY } from '../config/balance.js';
import { isFainted, getDisplayName } from './CreatureFactory.js';

/** How many creatures are travelling with the player. */
export function getPartySize(state) {
  return state.party.length;
}

/** True when the party cannot take another creature. */
export function isPartyFull(state) {
  return state.party.length >= PARTY.maxSize;
}

/** True when the player has no creatures at all yet. */
export function isPartyEmpty(state) {
  return state.party.length === 0;
}

/**
 * Put a creature in the party.
 *
 * @returns {boolean} false if the party was already full (nothing is added)
 */
export function addToParty(state, creature) {
  if (!creature) return false;
  if (isPartyFull(state)) return false;

  state.party.push(creature);
  return true;
}

/** Put a creature in storage, for when the party is full. */
export function addToStorage(state, creature) {
  if (!creature) return false;
  state.storage.push(creature);
  return true;
}

/**
 * Give a creature to the player: into the party if there is room, otherwise
 * into storage. This is what capture and gift events should call.
 *
 * @returns {{ added: boolean, destination: 'party'|'storage' }}
 */
export function giveCreature(state, creature) {
  if (!creature) return { added: false, destination: null };

  if (!isPartyFull(state)) {
    addToParty(state, creature);
    return { added: true, destination: 'party' };
  }

  addToStorage(state, creature);
  return { added: true, destination: 'storage' };
}

/**
 * The creature that leads the party — the first one still standing.
 * Falls back to the first creature so this never returns null for a non-empty
 * party, which keeps callers simple.
 */
export function getActiveCreature(state) {
  if (state.party.length === 0) return null;
  return state.party.find((creature) => !isFainted(creature)) || state.party[0];
}

/** Every party member that can still fight. */
export function getHealthyCreatures(state) {
  return state.party.filter((creature) => !isFainted(creature));
}

/** True when every party member has fainted — the lose condition in battle. */
export function isPartyDefeated(state) {
  return state.party.length > 0 && getHealthyCreatures(state).length === 0;
}

/** Find a party member by its instance id. */
export function findInParty(state, instanceId) {
  return state.party.find((creature) => creature.instanceId === instanceId) || null;
}

/**
 * Swap two party members, for reordering in the party menu.
 * @returns {boolean} false if either index is out of range
 */
export function swapPartyMembers(state, indexA, indexB) {
  const { party } = state;
  const valid = (i) => Number.isInteger(i) && i >= 0 && i < party.length;
  if (!valid(indexA) || !valid(indexB) || indexA === indexB) return false;

  [party[indexA], party[indexB]] = [party[indexB], party[indexA]];
  return true;
}

/** A short one-line summary of the party, for the debug overlay. */
export function describeParty(state) {
  if (state.party.length === 0) return 'empty';

  return state.party
    .map((c) => `${getDisplayName(c)} L${c.level} ${c.currentHp}/${c.stats.hp}`)
    .join(', ');
}
