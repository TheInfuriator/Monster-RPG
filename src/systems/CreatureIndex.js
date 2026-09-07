/**
 * CreatureIndex.js
 * ----------------------------------------------------------------------------
 * The Aether Index: what the player has seen and what they have caught.
 *
 * The data itself is two plain lookups on GameState
 * (`creatureIndex: { seen: {}, caught: {} }`), so it serialises straight into a
 * save. Everything that changes it goes through this file — scenes never write
 * `gameState.creatureIndex.seen[id] = true` themselves, because a rule spread
 * across five scenes is a rule nobody can check.
 *
 * THE RULES
 *   SEEN     the moment a creature is sent out against you, in ANY battle —
 *            wild, trainer or practice. If it stood on the field, you saw it.
 *   CAUGHT   only by capturing it, or by being given it (your starter counts).
 *            Catching also marks it seen, so "caught but not seen" is
 *            impossible by construction.
 *
 * Defeating a creature does NOT mark it caught. Seen is not a promise of
 * anything more than having met it.
 */

import { gameState } from '../core/GameState.js';
import { CREATURES, CREATURE_IDS, getSpecies } from '../data/creatures.js';

/** Make sure the index lookups exist, even on an older save. */
function getIndex(state) {
  if (!state.creatureIndex) state.creatureIndex = { seen: {}, caught: {} };
  if (!state.creatureIndex.seen) state.creatureIndex.seen = {};
  if (!state.creatureIndex.caught) state.creatureIndex.caught = {};
  return state.creatureIndex;
}

/** Reject a species id that is not real, loudly but without throwing. */
function validate(speciesId) {
  if (speciesId && CREATURES[speciesId]) return true;

  console.warn(
    `[index] Cannot record unknown species "${speciesId}". ` +
      'Check the id against src/data/creatures.js.'
  );
  return false;
}

/**
 * Record that the player has met a species.
 * Repeat calls are harmless — the index is a set of facts, not a counter.
 *
 * @returns {boolean} true if it was recorded (false for an unknown species)
 */
export function markSeen(speciesId, state = gameState) {
  if (!validate(speciesId)) return false;

  getIndex(state).seen[speciesId] = true;
  return true;
}

/**
 * Record that the player has caught a species. Implies seen.
 * @returns {boolean} true if it was recorded
 */
export function markCaught(speciesId, state = gameState) {
  if (!validate(speciesId)) return false;

  const index = getIndex(state);
  index.seen[speciesId] = true;
  index.caught[speciesId] = true;
  return true;
}

export function isSeen(speciesId, state = gameState) {
  return Boolean(getIndex(state).seen[speciesId]);
}

export function isCaught(speciesId, state = gameState) {
  return Boolean(getIndex(state).caught[speciesId]);
}

export function countSeen(state = gameState) {
  return Object.keys(getIndex(state).seen).length;
}

export function countCaught(state = gameState) {
  return Object.keys(getIndex(state).caught).length;
}

/** How many species exist to find at all. */
export function countSpecies() {
  return CREATURE_IDS.length;
}

/**
 * Every species in index-number order, with only what the player has earned
 * the right to know.
 *
 * @returns {Array<{number, id, name, seen, caught, types, description}>}
 *   An unseen species keeps its number but hides its name, types and text.
 */
export function getIndexRows(state = gameState) {
  return CREATURE_IDS
    .map((id) => getSpecies(id))
    .filter(Boolean)
    .sort((a, b) => a.number - b.number)
    .map((species) => {
      const seen = isSeen(species.id, state);
      const caught = isCaught(species.id, state);

      return {
        number: species.number,
        id: species.id,
        seen,
        caught,
        // A species you have never met is a blank in the book.
        name: seen ? species.name : '-----',
        types: seen ? [...species.types] : [],
        // The write-up is the reward for actually catching one.
        description: caught ? species.description : null,
      };
    });
}
