/**
 * PartySystem.js
 * ----------------------------------------------------------------------------
 * The player's team.
 *
 * Up to `PARTY.maxSize` creatures travel with the player; anything caught beyond
 * that goes to storage. Everything here works on plain arrays of plain objects,
 * so the whole party serialises straight into a save file.
 *
 * STORAGE is the overflow: anything caught while six creatures are already
 * travelling is put there instead. It is a plain array on GameState, so it
 * serialises with everything else, and nothing is ever dropped or overwritten
 * to make room.
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
  if (!state.storage) state.storage = [];

  state.storage.push(creature);
  return true;
}

/** How many creatures are waiting in storage. */
export function getStorageCount(state) {
  return state.storage ? state.storage.length : 0;
}

/** Everything in storage, oldest first. A copy, so callers cannot reorder it. */
export function listStorage(state) {
  return state.storage ? [...state.storage] : [];
}

/** Find a stored creature by its instance id. */
export function findInStorage(state, instanceId) {
  if (!state.storage) return null;
  return state.storage.find((creature) => creature.instanceId === instanceId) || null;
}

/** Find a creature anywhere the player keeps them. */
export function findCreature(state, instanceId) {
  return findInParty(state, instanceId) || findInStorage(state, instanceId);
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
 *
 * Swapping rather than shuffling keeps the operation obvious: exactly two
 * slots change, everyone else stays put, and the creature objects themselves
 * are untouched — the same individuals, in a different order.
 *
 * @returns {boolean} false if either index is out of range, in which case
 *   NOTHING changes. An invalid reorder is a no-op, never a partial one.
 */
export function swapPartyMembers(state, indexA, indexB) {
  const { party } = state;
  if (!isValidPartyIndex(state, indexA)) return false;
  if (!isValidPartyIndex(state, indexB)) return false;
  if (indexA === indexB) return false;

  [party[indexA], party[indexB]] = [party[indexB], party[indexA]];
  return true;
}

/** True if this index names a real party slot. */
export function isValidPartyIndex(state, index) {
  return Number.isInteger(index) && index >= 0 && index < state.party.length;
}

/**
 * Take a creature out of the party.
 *
 * Refuses to remove the last one: a player with an empty party cannot battle,
 * and every caller so far would consider that a bug rather than a feature.
 *
 * @returns {object|null} the creature removed, or null if nothing was
 */
export function removeFromParty(state, index) {
  if (!isValidPartyIndex(state, index)) return null;
  if (state.party.length <= 1) return null;

  return state.party.splice(index, 1)[0];
}

/**
 * Move a party member to another slot, sliding everyone in between along.
 * Provided beside `swapPartyMembers` because "put this one first" is a
 * different intention from "trade these two places".
 *
 * @returns {boolean} false (changing nothing) if either index is invalid
 */
export function movePartyMember(state, from, to) {
  if (!isValidPartyIndex(state, from)) return false;
  if (!isValidPartyIndex(state, to)) return false;
  if (from === to) return false;

  const [creature] = state.party.splice(from, 1);
  state.party.splice(to, 0, creature);
  return true;
}

/** A short one-line summary of the party, for the debug overlay. */
export function describeParty(state) {
  if (state.party.length === 0) return 'empty';

  return state.party
    .map((c) => `${getDisplayName(c)} L${c.level} ${c.currentHp}/${c.stats.hp}`)
    .join(', ');
}
