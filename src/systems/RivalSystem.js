/**
 * RivalSystem.js
 * ----------------------------------------------------------------------------
 * The one genuinely new rule a rival brings: a party that depends on the
 * player's own choices.
 *
 * Everything else about a rival battle is an ordinary trainer battle — see
 * `src/data/trainers.js` and TrainerSystem. This file answers three questions:
 *
 *   which starter did the player take?          getPlayerStarter()
 *   so which starter did the rival take?        getRivalStarterBase()
 *   and what has it grown into by this level?   speciesAtLevel()
 *
 * Pure: no Phaser, no scenes. Every answer is worked out from GameState and the
 * species data, so it cannot drift from either.
 */

import { CREATURES, STARTER_IDS, STARTER_MET_AT, getPreEvolution } from '../data/creatures.js';
import { getRival } from '../data/rivals.js';
import { gameState } from '../core/GameState.js';

function speciesExists(id) {
  return typeof id === 'string' && Object.hasOwn(CREATURES, id);
}

/**
 * The first stage of a species' family: Cindraw -> Pyrret, Pyrret -> Pyrret.
 * @returns {string|null} null for an unknown species
 */
export function getFamilyBase(speciesId) {
  if (!speciesExists(speciesId)) return null;

  let current = speciesId;
  // A family is a handful of stages; the bound only guards against bad data.
  for (let i = 0; i < 10; i += 1) {
    const previous = getPreEvolution(current);
    if (!previous) return current;
    current = previous;
  }
  return current;
}

/**
 * The form a family member has reached by a level, by the species data's own
 * evolution levels: Pyrret at 15 is a Pyrret, at 16 a Cindraw, at 34 an Emberax.
 * This is what makes the rival's starter grow up between meetings without any
 * encounter having to name the evolved form.
 *
 * @returns {string|null} null for an unknown species
 */
export function speciesAtLevel(baseSpeciesId, level) {
  if (!speciesExists(baseSpeciesId)) return null;

  let current = baseSpeciesId;
  for (let i = 0; i < 10; i += 1) {
    const evolution = CREATURES[current].evolution;
    if (!evolution || evolution.method !== 'level' || level < evolution.level) return current;
    if (!speciesExists(evolution.to)) return current;
    current = evolution.to;
  }
  return current;
}

/**
 * Which starter a state's creatures say the player took: the family of the
 * creature met at the Warden's Lodge. Starters cannot be released or traded,
 * so it is always somewhere in the party or storage.
 *
 * Works on plain saved data too — the save migration uses it to fill in the
 * starter for saves made before the game recorded it.
 *
 * @returns {string|null} a starter id, or null if no creature says
 */
export function findLodgeStarter(state) {
  const creatures = [
    ...(Array.isArray(state?.party) ? state.party : []),
    ...(Array.isArray(state?.storage) ? state.storage : []),
  ];

  for (const creature of creatures) {
    if (!creature || creature.metAt !== STARTER_MET_AT) continue;
    const base = getFamilyBase(creature.speciesId);
    if (STARTER_IDS.includes(base)) return base;
  }
  return null;
}

/**
 * The starter the player took, as its base species id — or null.
 *
 * `state.starter` is the record (set by the Lodge's chooser). If it is missing
 * or not a starter, the creatures are asked instead, so an odd save still
 * gives the right answer when it can.
 */
export function getPlayerStarter(state = gameState) {
  if (STARTER_IDS.includes(state?.starter)) return state.starter;
  return findLodgeStarter(state);
}

/**
 * Which starter a rival took against this player, as a base species id.
 *
 * @returns {{ base: string|null, fallback: boolean }}
 *   `fallback` is true when the player's starter could not be determined and
 *   the rival's declared fallback was used instead (with a warning)
 */
export function getRivalStarterBase(rivalId, state = gameState) {
  const rival = getRival(rivalId);
  if (!rival) return { base: null, fallback: false };

  const playerStarter = getPlayerStarter(state);
  const chosen = playerStarter ? rival.starterFor[playerStarter] : null;
  if (chosen) return { base: chosen, fallback: false };

  console.warn(
    `[Rival] Could not tell which starter the player took, so ${rival.name} uses ` +
      `their fallback, ${rival.fallbackStarter}. The save's "starter" field is ` +
      'missing and no creature was met at the Warden\'s Lodge.'
  );
  return { base: rival.fallbackStarter, fallback: true };
}

/**
 * One trainer party entry, resolved to a concrete species and level.
 *
 * An ordinary entry passes straight through. A `{ rivalStarter: true, level }`
 * entry becomes the rival's starter family at that level — evolved if the
 * species data says it would be.
 *
 * @param {object} entry     a party entry from src/data/trainers.js
 * @param {object} trainer   the trainer it belongs to (for its `rival`)
 * @returns {{ species: string|null, level: number, nickname: string|null }}
 */
export function resolvePartyEntry(entry, trainer, state = gameState) {
  if (!entry.rivalStarter) {
    return { species: entry.species, level: entry.level, nickname: entry.nickname ?? null };
  }

  const { base } = getRivalStarterBase(trainer.rival, state);
  return {
    species: base ? speciesAtLevel(base, entry.level) : null,
    level: entry.level,
    nickname: entry.nickname ?? null,
  };
}
