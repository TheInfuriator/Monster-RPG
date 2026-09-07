/**
 * TrainerSystem.js
 * ----------------------------------------------------------------------------
 * Turning a trainer definition into a battle, and remembering who has been
 * beaten.
 *
 * Pure: no Phaser, no scenes. WorldScene walks the trainer over and plays the
 * dialogue; everything about WHAT a trainer battle is decides itself here.
 *
 * WHY DEFEAT IS KEYED BY TRAINER ID
 * Not by NPC position, and not by map — a trainer who is moved in a later
 * update, or who walks over to challenge you, must stay beaten. `id` is the
 * only stable handle, and it is plain data so it saves with everything else.
 */

import { createCreature } from './CreatureFactory.js';
import { getTrainer, getTrainerDisplayName } from '../data/trainers.js';
import { gameState } from '../core/GameState.js';

/**
 * Build a fresh team for a trainer.
 *
 * Fresh every time: a trainer beaten, then fought again after a blackout,
 * starts at full health with full PP. Nothing here mutates the database — it
 * reads levels and species and lets CreatureFactory produce ordinary creatures
 * with the ordinary learnset rules, so a trainer's Aether is exactly as real as
 * a wild one.
 *
 * @param {string} trainerId
 * @returns {object[]} creatures in the declared order; empty if it cannot build
 */
export function createTrainerParty(trainerId) {
  const trainer = getTrainer(trainerId);
  if (!trainer) return [];

  const party = trainer.party
    .map((entry) => createCreature(entry.species, entry.level, {
      nickname: entry.nickname ?? null,
      metAt: null,
    }))
    .filter(Boolean);

  if (party.length !== trainer.party.length) {
    console.error(
      `[TrainerSystem] Trainer "${trainerId}" has entries that could not be built.`
    );
  }

  return party;
}

/**
 * The BattleEngine configuration for a trainer fight.
 *
 * Every rule that makes a trainer battle different lives in this one object:
 * you cannot run, you cannot throw an orb at someone's partner, you earn the
 * trainer experience multiplier and prize money, and losing blacks you out.
 * Nothing downstream checks a trainer's name to work any of that out.
 *
 * @param {string} trainerId
 * @param {object[]} playerParty the live party from GameState
 * @returns {object|null} an engine config, or null if it cannot be built
 */
export function createTrainerBattleConfig(trainerId, playerParty) {
  const trainer = getTrainer(trainerId);
  if (!trainer) return null;

  if (!playerParty || playerParty.length === 0) {
    console.warn('[TrainerSystem] Asked for a trainer battle with an empty party.');
    return null;
  }

  const opponentParty = createTrainerParty(trainerId);
  if (opponentParty.length === 0) return null;

  return {
    playerParty,
    opponentParty,
    battleType: 'trainer',
    opponentName: getTrainerDisplayName(trainer),
    /** You do not walk away from a person who challenged you. */
    canRun: false,
    /** Their Aethers are not yours to catch. */
    allowCapture: false,
    awardExperience: true,
    rewardMoney: trainer.rewardMoney,
    /** A real trainer loss carries the ordinary Phase 7 consequences. */
    blackoutOnDefeat: true,
    /** Carried through so the win handler knows who to mark. */
    trainerId: trainer.id,
  };
}

// ---------------------------------------------------------------------------
// Who has been beaten
// ---------------------------------------------------------------------------

function getDefeatedMap(state) {
  if (!state.defeatedTrainers) state.defeatedTrainers = {};
  return state.defeatedTrainers;
}

/**
 * Record a trainer as beaten. Only ever called after a real win.
 * Repeat calls are harmless: it is a fact, not a counter.
 *
 * @returns {boolean} false for an unknown trainer (nothing is recorded)
 */
export function markTrainerDefeated(trainerId, state = gameState) {
  if (!getTrainer(trainerId)) return false;

  getDefeatedMap(state)[trainerId] = true;
  return true;
}

export function isTrainerDefeated(trainerId, state = gameState) {
  return Boolean(getDefeatedMap(state)[trainerId]);
}

/** Undo a defeat. Debug only — nothing in the game calls it. */
export function clearTrainerDefeat(trainerId, state = gameState) {
  delete getDefeatedMap(state)[trainerId];
}

export function countDefeatedTrainers(state = gameState) {
  return Object.keys(getDefeatedMap(state)).length;
}

/**
 * The flags a dialogue branch may test, including who has been beaten.
 *
 * Story flags come through as themselves; every beaten trainer also appears as
 * `trainer:<id>`. That lets a map file write
 *
 *     { when: 'trainer:route1Scout', pages: [ ...what they say afterwards... ] }
 *
 * so post-defeat dialogue is ordinary conditional dialogue and no scene ever
 * writes `if (defeatedTrainers[id])`.
 *
 * @returns {Record<string, boolean>} a fresh object; callers may not keep it
 */
export function getDialogueConditions(state = gameState) {
  const conditions = { ...state.flags };

  for (const trainerId of Object.keys(getDefeatedMap(state))) {
    conditions[`trainer:${trainerId}`] = true;
  }

  return conditions;
}
