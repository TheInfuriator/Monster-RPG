/**
 * BadgeSystem.js
 * ----------------------------------------------------------------------------
 * Earning and reading Sigils.
 *
 * Pure: no Phaser, no scenes. `gameState.badges` is a plain array of Sigil ids
 * in the order they were earned, which is as save-ready as data gets.
 *
 * WHY A SIGIL IS NOT THE SAME AS A BEATEN LEADER
 * Beating Fern and holding the Verdant Sigil are related but different facts.
 * A Leader could one day be fought again, or a Sigil awarded some other way,
 * and asking "is this trainer in defeatedTrainers?" to mean "does the player
 * have a Sigil?" would quietly tie those together forever. They are two records
 * and each says exactly what it means.
 */

import { BADGES, getBadge, getBadgesInOrder } from '../data/badges.js';
import { gameState } from '../core/GameState.js';

function getList(state) {
  if (!Array.isArray(state.badges)) state.badges = [];
  return state.badges;
}

/**
 * Award a Sigil.
 *
 * Awarding one the player already holds is HARMLESS and reports itself as
 * such, rather than adding a second copy — so a victory narrated twice, or a
 * dialogue re-read, can never double up.
 *
 * @returns {{awarded: boolean, alreadyHeld: boolean, badge: object|null, reason: string|null}}
 */
export function awardBadge(badgeId, state = gameState) {
  const badge = getBadge(badgeId);
  if (!badge) return { awarded: false, alreadyHeld: false, badge: null, reason: 'unknownBadge' };

  const list = getList(state);
  if (list.includes(badge.id)) {
    return { awarded: false, alreadyHeld: true, badge, reason: 'alreadyHeld' };
  }

  list.push(badge.id);
  return { awarded: true, alreadyHeld: false, badge, reason: null };
}

export function hasBadge(badgeId, state = gameState) {
  return getList(state).includes(badgeId);
}

export function countBadges(state = gameState) {
  return getList(state).filter((id) => Boolean(BADGES[id])).length;
}

/** Remove a Sigil. Debug and tests only — nothing in the game calls it. */
export function removeBadge(badgeId, state = gameState) {
  const list = getList(state);
  const at = list.indexOf(badgeId);
  if (at === -1) return false;
  list.splice(at, 1);
  return true;
}

/**
 * Every Sigil the player holds, as full definitions, in DISPLAY order.
 * Display order rather than the order they were earned, so the screen reads the
 * same way whatever route a player took.
 */
export function listEarnedBadges(state = gameState) {
  const held = new Set(getList(state));
  return getBadgesInOrder().filter((badge) => held.has(badge.id));
}

/**
 * Every planned Sigil with whether it has been earned — one row per slot.
 * This is what the Sigil screen draws, which is why an unbuilt Hall still has
 * an entry: three slots from the first game, two of them plainly waiting.
 *
 * @returns {Array<{badge: object, earned: boolean}>}
 */
export function getBadgeSlots(state = gameState) {
  const held = new Set(getList(state));
  return getBadgesInOrder().map((badge) => ({ badge, earned: held.has(badge.id) }));
}

/**
 * Sigils expressed as dialogue conditions: `badge:verdantSigil`.
 *
 * That lets a map file write
 *
 *     { when: 'badge:verdantSigil', pages: [ ...what they say afterwards... ] }
 *
 * exactly the way it writes `when: 'trainer:route1Scout'`, so post-Gym
 * reactions need no story flag of their own and no scene reads `badges`.
 *
 * @returns {Record<string, boolean>} a fresh object
 */
export function getBadgeConditions(state = gameState) {
  const conditions = {};
  for (const id of getList(state)) {
    if (BADGES[id]) conditions[`badge:${id}`] = true;
  }
  return conditions;
}
