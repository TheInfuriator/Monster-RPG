/**
 * StorageSystem.js
 * ----------------------------------------------------------------------------
 * Moving Aethers between the party and storage (Phase 13) — what a storage
 * terminal in a Mender's Hall does.
 *
 * Three moves, and nothing else:
 *
 *   deposit   a party member goes into storage
 *   withdraw  a stored Aether joins the party (only if there is room)
 *   swap      a party member and a stored Aether trade places — the way to
 *             bring one out when the party is already full
 *
 * THE RULES
 *   - At most `PARTY.maxSize` (six) travel with the player.
 *   - The party must always keep at least one Aether able to fight. You
 *     cannot deposit the last one, or swap it for a fainted one — a player
 *     with nobody to send out could not survive their next step in the grass.
 *   - A move is ATOMIC: every rule is checked first, and only then is anything
 *     changed. A refused move changes nothing at all.
 *   - The Aether that moves is the very same object — its id, nickname,
 *     level, experience, HP, PP, status and moves go with it untouched.
 *     Nothing is copied (so nothing can be duplicated) and nothing is
 *     dropped (so nothing can be lost). Storage does not heal.
 *
 * Pure: no Phaser, no scenes. The storage screen (MenuScene) only draws what
 * this says and asks it to act; the save carries `party` and `storage` as
 * the plain arrays they already were, so the save format does not change.
 */

import { PARTY } from '../config/balance.js';
import { isFainted } from './CreatureFactory.js';

/** Why a move was refused, in words a player reads on the storage screen. */
export const STORAGE_REFUSALS = {
  noSuchCreature: 'There is nobody in that slot.',
  lastUsable: 'That is the last Aether in your party able to fight. It has to stay with you.',
  partyFull: 'Your party is full. Swap one of them for it instead.',
};

const ok = () => ({ ok: true, reason: null, message: '' });
const refuse = (reason) => ({ ok: false, reason, message: STORAGE_REFUSALS[reason] });

function storageOf(state) {
  if (!Array.isArray(state.storage)) state.storage = [];
  return state.storage;
}

const isPartySlot = (state, index) => Number.isInteger(index) && index >= 0 && index < state.party.length;
const isStorageSlot = (state, index) => Number.isInteger(index) && index >= 0 && index < storageOf(state).length;

/** True if this party would still have someone able to fight. */
const hasUsable = (party) => party.some((creature) => !isFainted(creature));

/** Could this party member be deposited? `{ ok, reason, message }`. */
export function canDeposit(state, partyIndex) {
  if (!isPartySlot(state, partyIndex)) return refuse('noSuchCreature');
  const remaining = state.party.filter((_, i) => i !== partyIndex);
  if (!hasUsable(remaining)) return refuse('lastUsable');
  return ok();
}

/** Could this stored Aether be withdrawn into the party? */
export function canWithdraw(state, storageIndex) {
  if (!isStorageSlot(state, storageIndex)) return refuse('noSuchCreature');
  if (state.party.length >= PARTY.maxSize) return refuse('partyFull');
  return ok();
}

/** Could this party member and this stored Aether trade places? */
export function canSwap(state, partyIndex, storageIndex) {
  if (!isPartySlot(state, partyIndex) || !isStorageSlot(state, storageIndex)) return refuse('noSuchCreature');
  const after = state.party.map((creature, i) => (i === partyIndex ? storageOf(state)[storageIndex] : creature));
  if (!hasUsable(after)) return refuse('lastUsable');
  return ok();
}

/**
 * Put a party member into storage. It goes to the END of storage; the party
 * closes up behind it.
 *
 * @returns {{ ok: boolean, reason: string|null, message: string, creature?: object }}
 */
export function depositCreature(state, partyIndex) {
  const check = canDeposit(state, partyIndex);
  if (!check.ok) return check;
  const [creature] = state.party.splice(partyIndex, 1);
  storageOf(state).push(creature);
  return { ...check, creature };
}

/** Bring a stored Aether into the party. It joins at the END of the party. */
export function withdrawCreature(state, storageIndex) {
  const check = canWithdraw(state, storageIndex);
  if (!check.ok) return check;
  const [creature] = storageOf(state).splice(storageIndex, 1);
  state.party.push(creature);
  return { ...check, creature };
}

/**
 * Trade a party member for a stored Aether. Each takes the other's place —
 * the newcomer joins the party in the slot the other left — so nobody else
 * in either list moves.
 */
export function swapCreatures(state, partyIndex, storageIndex) {
  const check = canSwap(state, partyIndex, storageIndex);
  if (!check.ok) return check;
  const storage = storageOf(state);
  const out = state.party[partyIndex];
  const into = storage[storageIndex];
  state.party[partyIndex] = into;
  storage[storageIndex] = out;
  return { ...check, deposited: out, withdrawn: into };
}
