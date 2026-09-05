/**
 * CreatureFactory.js
 * ----------------------------------------------------------------------------
 * Builds an individual creature from a species and a level.
 *
 * A SPECIES is shared data — Pyrret's base stats, its learnset, its artwork.
 * An INSTANCE is one particular creature the player owns or is fighting: its
 * level, its current HP, the moves it happens to know, its nickname.
 *
 * WHAT AN INSTANCE STORES
 *   instanceId   unique to this creature, so two Pyrrets are never confused
 *   speciesId    which species it is; everything shared is looked up from that
 *   nickname     null unless the player named it
 *   level        1..100
 *   experience   total experience, matching its species' growth curve
 *   stats        a CACHE of the calculated stats (see the note below)
 *   currentHp    the only truly per-creature number that cannot be derived
 *   moves        [{ id, pp, maxPp }] — at most PARTY.maxMoves
 *   status       null, or a status id from src/data/statuses.js
 *   metAt        where and at what level it joined the party
 *
 * WHY `stats` IS STORED
 * Stats are derived from species + level, so storing them is technically
 * redundant. We keep them anyway because a save file should be enough to show a
 * creature without recomputing anything, and because the battle system reads
 * them constantly. `recalculateStats()` refreshes the cache and is called on
 * every level-up and evolution — and can be called after a balance change to
 * bring an old save back in line.
 */

import { getSpecies, getMovesAtLevel } from '../data/creatures.js';
import { getMove } from '../data/moves.js';
import { calculateStats, experienceForLevel, clampLevel } from './StatCalculator.js';
import { PARTY } from '../config/balance.js';

/**
 * Counter used to keep generated ids unique within a session.
 * Combined with a timestamp and a random suffix so ids stay unique across
 * sessions too, once saving exists.
 */
let instanceCounter = 0;

/** A short, unique id for one creature. */
export function generateInstanceId() {
  instanceCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `c${Date.now().toString(36)}${instanceCounter.toString(36)}${random}`;
}

/** Reset the counter. Only used by tests that check id determinism. */
export function _resetInstanceCounter() {
  instanceCounter = 0;
}

/**
 * Build a move entry with full PP.
 * Returns null for an unknown move id, so a typo in a learnset drops one move
 * rather than producing a creature that crashes the battle screen.
 */
function buildMoveEntry(moveId) {
  const move = getMove(moveId);
  if (!move) return null;
  return { id: move.id, pp: move.pp, maxPp: move.pp };
}

/**
 * Create an individual creature.
 *
 * @param {string} speciesId
 * @param {number} level
 * @param {object} [options]
 * @param {string} [options.nickname]
 * @param {string[]} [options.moves]  override the natural learnset moves
 * @param {string} [options.metAt]    where it was obtained, for the summary screen
 * @returns {object|null} the creature, or null if the species does not exist
 */
export function createCreature(speciesId, level, options = {}) {
  const species = getSpecies(speciesId);
  if (!species) {
    console.error(
      `[CreatureFactory] Cannot create "${speciesId}" — no such species. ` +
        `Check src/data/creatures.js.`
    );
    return null;
  }

  const safeLevel = clampLevel(level);
  const stats = calculateStats(species, safeLevel);

  // Either the caller's move list, or whatever the species would know naturally.
  const moveIds = options.moves ?? getMovesAtLevel(species, safeLevel, PARTY.maxMoves);
  const moves = moveIds
    .slice(0, PARTY.maxMoves)
    .map(buildMoveEntry)
    .filter(Boolean);

  if (moves.length === 0) {
    console.warn(
      `[CreatureFactory] "${speciesId}" at level ${safeLevel} knows no moves. ` +
        `Give it a level 1 entry in its learnset.`
    );
  }

  return {
    instanceId: generateInstanceId(),
    speciesId: species.id,
    nickname: options.nickname ?? null,
    level: safeLevel,
    experience: experienceForLevel(safeLevel, species.growthRate),
    stats,
    currentHp: stats.hp,
    moves,
    status: null,
    metAt: options.metAt ?? null,
  };
}

/**
 * Recompute a creature's cached stats, keeping its damage proportional.
 * Called after a level-up or evolution: if it was on half health before, it is
 * on half health after, rather than gaining or losing HP for free.
 */
export function recalculateStats(creature) {
  const species = getSpecies(creature.speciesId);
  if (!species) return creature;

  const previousMaxHp = creature.stats ? creature.stats.hp : null;
  const nextStats = calculateStats(species, creature.level);

  if (previousMaxHp && previousMaxHp > 0) {
    const gained = nextStats.hp - previousMaxHp;
    // A level-up should feel like a gain, so extra max HP is granted as real HP.
    creature.currentHp = Math.min(nextStats.hp, creature.currentHp + Math.max(0, gained));
  } else {
    creature.currentHp = nextStats.hp;
  }

  creature.stats = nextStats;
  creature.currentHp = Math.min(creature.currentHp, nextStats.hp);
  return creature;
}

/** The species record for a creature instance. */
export function getCreatureSpecies(creature) {
  return getSpecies(creature.speciesId);
}

/** What to call a creature: its nickname, or its species name. */
export function getDisplayName(creature) {
  if (creature.nickname) return creature.nickname;
  const species = getSpecies(creature.speciesId);
  return species ? species.name : 'Unknown';
}

/** A creature's types, read from its species. */
export function getCreatureTypes(creature) {
  const species = getSpecies(creature.speciesId);
  return species ? species.types : ['normal'];
}

/** True if the creature has fainted. */
export function isFainted(creature) {
  return creature.currentHp <= 0;
}

/** Current HP as a 0..1 fraction, for drawing HP bars. */
export function getHpFraction(creature) {
  if (!creature.stats || creature.stats.hp <= 0) return 0;
  return Math.min(Math.max(creature.currentHp / creature.stats.hp, 0), 1);
}

/** Restore a creature to full health, PP and clear its status. */
export function fullyHeal(creature) {
  creature.currentHp = creature.stats.hp;
  creature.status = null;
  for (const move of creature.moves) move.pp = move.maxPp;
  return creature;
}

/**
 * Which species this creature would become at its current level, if any.
 * Returns null when it cannot evolve yet or has no evolution.
 */
export function getPendingEvolution(creature) {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolution) return null;

  const { method, level, to } = species.evolution;
  if (method === 'level' && creature.level >= level) return to;

  return null;
}
