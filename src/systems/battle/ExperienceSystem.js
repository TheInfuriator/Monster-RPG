/**
 * ExperienceSystem.js
 * ----------------------------------------------------------------------------
 * What happens after you win: experience, levels, new moves and evolution.
 *
 * THE REWARD FORMULA
 *   exp = floor(baseExp * defeatedLevel / 7) * typeMultiplier
 * where the multiplier is 1 for a wild creature and 1.5 for a trainer's
 * (`PROGRESSION.trainerExpMultiplier`).
 *
 * PARTICIPATION RULE (Phase 4)
 * Only creatures that were actually sent out during the battle share the
 * reward, and each participant receives the FULL amount rather than a split.
 * That keeps switching attractive instead of a tax. A more elaborate
 * experience-share item can come later without changing this file's shape.
 *
 * HP ON LEVEL-UP
 * Gaining a level raises max HP. The creature keeps the damage it had taken and
 * gains the extra max HP as real HP — so levelling up always feels like a gain,
 * but never silently heals a badly hurt creature. (See `recalculateStats`.)
 *
 * Pure logic, no Phaser. Everything returns a description of what happened so
 * the battle scene can narrate it at its own pace.
 */

import { PROGRESSION } from '../../config/balance.js';
import { EXPERIENCE } from '../../config/balance.js';
import { getSpecies } from '../../data/creatures.js';
import { getMove } from '../../data/moves.js';
import { PARTY } from '../../config/balance.js';
import {
  levelFromExperience,
  experienceForLevel,
} from '../StatCalculator.js';
import {
  recalculateStats,
  getDisplayName,
  getPendingEvolution,
  getCreatureSpecies,
} from '../CreatureFactory.js';

/**
 * Experience for defeating one creature.
 *
 * @param {object} defeated the creature that fainted
 * @param {'wild'|'trainer'|'practice'} battleType
 * @returns {number} never negative
 */
export function calculateExperienceReward(defeated, battleType = 'wild') {
  const species = getCreatureSpecies(defeated);
  if (!species) return 0;

  const multiplier = battleType === 'trainer' ? PROGRESSION.trainerExpMultiplier : 1;
  const base = Math.floor((species.baseExp * defeated.level) / EXPERIENCE.divisor);

  return Math.max(0, Math.floor(base * multiplier));
}

/**
 * Give a creature experience and work out everything that follows.
 *
 * @param {object} creature
 * @param {number} amount  experience to add; negative amounts are ignored
 * @returns {{
 *   gained: number,
 *   levelsGained: number,
 *   fromLevel: number, toLevel: number,
 *   statGains: object|null,
 *   movesToLearn: Array<{level:number, moveId:string}>,
 *   evolutionTo: string|null
 * }}
 */
export function grantExperience(creature, amount) {
  const species = getCreatureSpecies(creature);
  const fromLevel = creature.level;

  const result = {
    gained: 0,
    levelsGained: 0,
    fromLevel,
    toLevel: fromLevel,
    statGains: null,
    movesToLearn: [],
    evolutionTo: null,
  };

  // Experience never goes down, and a dead species reference cannot level.
  if (!species || !Number.isFinite(amount) || amount <= 0) return result;

  result.gained = Math.floor(amount);
  creature.experience += result.gained;

  const newLevel = levelFromExperience(creature.experience, species.growthRate);
  if (newLevel <= fromLevel) return result;

  const statsBefore = { ...creature.stats };

  creature.level = Math.min(newLevel, PROGRESSION.maxLevel);
  recalculateStats(creature);

  result.toLevel = creature.level;
  result.levelsGained = creature.level - fromLevel;
  result.statGains = diffStats(statsBefore, creature.stats);

  // Every move learned across ALL the levels crossed, in learn order. Gaining
  // three levels at once must not silently skip two moves.
  result.movesToLearn = species.learnset
    .filter((entry) => entry.level > fromLevel && entry.level <= creature.level)
    .map((entry) => ({ level: entry.level, moveId: entry.move }));

  result.evolutionTo = getPendingEvolution(creature);

  return result;
}

/** How much each stat went up. */
function diffStats(before, after) {
  const gains = {};
  for (const key of Object.keys(after)) {
    gains[key] = after[key] - (before[key] ?? 0);
  }
  return gains;
}

/**
 * Try to teach a creature a move.
 *
 * @returns {{learned: boolean, needsChoice: boolean, message: string|null}}
 *   `needsChoice` means the creature already knows four moves and the player
 *   must decide what to forget.
 */
export function teachMove(creature, moveId) {
  const move = getMove(moveId);
  const name = getDisplayName(creature);

  if (!move) return { learned: false, needsChoice: false, message: null };

  if (creature.moves.some((m) => m.id === moveId)) {
    return { learned: false, needsChoice: false, message: null };
  }

  if (creature.moves.length < PARTY.maxMoves) {
    creature.moves.push({ id: move.id, pp: move.pp, maxPp: move.pp });
    return { learned: true, needsChoice: false, message: `${name} learned ${move.name}!` };
  }

  return {
    learned: false,
    needsChoice: true,
    message: `${name} wants to learn ${move.name}, but already knows four moves.`,
  };
}

/**
 * Swap a known move for a new one.
 *
 * @param {number} slot index of the move being forgotten
 * @returns {{replaced: boolean, message: string|null}}
 */
export function replaceMove(creature, slot, moveId) {
  const move = getMove(moveId);
  const name = getDisplayName(creature);

  if (!move) return { replaced: false, message: null };
  if (!Number.isInteger(slot) || slot < 0 || slot >= creature.moves.length) {
    return { replaced: false, message: null };
  }

  const forgotten = getMove(creature.moves[slot].id);
  creature.moves[slot] = { id: move.id, pp: move.pp, maxPp: move.pp };

  return {
    replaced: true,
    message: `${name} forgot ${forgotten ? forgotten.name : 'a move'} and learned ${move.name}!`,
  };
}

/**
 * Evolve a creature.
 *
 * Identity is preserved on purpose: the same `instanceId`, the same nickname,
 * the same experience and the same moves. Only the species, the stats and the
 * artwork change — it is the same creature, grown up.
 *
 * @returns {{evolved: boolean, fromName: string, toName: string, message: string|null}}
 */
export function evolveCreature(creature, targetSpeciesId) {
  const fromSpecies = getCreatureSpecies(creature);
  const toSpecies = getSpecies(targetSpeciesId);
  const fromName = getDisplayName(creature);

  if (!toSpecies) {
    return { evolved: false, fromName, toName: fromName, message: null };
  }

  creature.speciesId = toSpecies.id;
  recalculateStats(creature);

  // Experience is on a curve that belongs to the species. If the new form uses
  // a different curve, re-anchor to the bottom of the current level so the
  // creature never appears to lose or leap a level by evolving.
  if (fromSpecies && fromSpecies.growthRate !== toSpecies.growthRate) {
    creature.experience = Math.max(
      creature.experience,
      experienceForLevel(creature.level, toSpecies.growthRate)
    );
  }

  return {
    evolved: true,
    fromName,
    toName: getDisplayName(creature),
    message: `${fromName} evolved into ${toSpecies.name}!`,
  };
}

/**
 * Share a reward among the creatures that took part.
 *
 * @param {object[]} participants creatures that were sent out this battle
 * @param {number} amount
 * @returns {Array<{creature: object, result: object}>} only those that gained
 */
export function distributeExperience(participants, amount) {
  const results = [];

  for (const creature of participants) {
    // A fainted creature does not learn from a fight it lost.
    if (creature.currentHp <= 0) continue;

    const result = grantExperience(creature, amount);
    if (result.gained > 0) results.push({ creature, result });
  }

  return results;
}
