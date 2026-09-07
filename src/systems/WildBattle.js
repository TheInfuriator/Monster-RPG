/**
 * WildBattle.js
 * ----------------------------------------------------------------------------
 * Turns a rolled encounter into a BattleEngine configuration.
 *
 * This is the join between the encounter pipeline and the battle engine, and it
 * is deliberately a plain function with no Phaser in it: the rules of a wild
 * battle (you may run, you earn experience, you win no money) are then testable
 * without opening a browser, and WorldScene has nothing to decide.
 *
 * Wild, trainer and practice battles all build one of these and hand it to the
 * SAME BattleEngine. The only difference between them is the values below.
 *
 * It also handles the other end: what happens to a creature the player
 * actually catches.
 */

import { createCreature, getDisplayName } from './CreatureFactory.js';
import { giveCreature } from './PartySystem.js';
import { markCaught } from './CreatureIndex.js';
import { gameState } from '../core/GameState.js';

/**
 * Build the battle configuration for a wild encounter.
 *
 * @param {{species: string, level: number}} encounter from EncounterSystem
 * @param {object[]} playerParty the live party from GameState — passed through,
 *   never copied, so experience, damage and evolution land on the real team
 * @param {object} [options]
 * @param {string} [options.metAt] where this is happening, recorded on the
 *   creature now so it is already right if the player catches it
 * @returns {object|null} a BattleEngine config, or null if it cannot be built
 */
export function createWildBattleConfig(encounter, playerParty, options = {}) {
  if (!encounter || !encounter.species) {
    console.warn('[WildBattle] Asked for a battle with no encounter.');
    return null;
  }

  if (!playerParty || playerParty.length === 0) {
    console.warn('[WildBattle] Asked for a battle with an empty party.');
    return null;
  }

  // CreatureFactory is the only thing that builds creatures — a wild Aether is
  // an ordinary creature with real stats, moves and artwork, not a battle-only
  // stand-in. It also clamps a silly level rather than trusting the caller.
  const opponent = createCreature(encounter.species, encounter.level, {
    metAt: options.metAt ?? null,
  });
  if (!opponent) return null;

  return {
    playerParty,
    opponentParty: [opponent],
    battleType: 'wild',
    opponentName: null,
    /** Running is allowed, and uses the engine's existing escape formula. */
    canRun: true,
    /** Orbs may be thrown. This is the only thing that decides it. */
    allowCapture: true,
    awardExperience: true,
    /** A wild creature carries no coins. Money comes from trainers. */
    rewardMoney: 0,
  };
}

/**
 * Take delivery of a creature the player just caught.
 *
 * The creature handed in is the SAME object that was fought — its level,
 * experience, current HP, moves, PP, status, nickname field and instance id are
 * whatever the battle left them as. Nothing here rebuilds it, because a rebuilt
 * creature would quietly undo the work of weakening the one you wanted.
 *
 * @param {object} creature the captured creature, from `result.captured`
 * @param {object} [state]  defaults to the live GameState
 * @returns {{destination: 'party'|'storage'|null, messages: string[]}}
 */
export function receiveCapturedCreature(creature, state = gameState) {
  if (!creature) return { destination: null, messages: [] };

  const name = getDisplayName(creature);

  // Caught implies seen, and the index API enforces that for us.
  markCaught(creature.speciesId, state);

  const { destination } = giveCreature(state, creature);

  // A full party never costs the player the creature, and never asks them to
  // throw one away mid-battle. It simply goes to storage, and says so.
  const messages = destination === 'party'
    ? [`${name} joined your party!`]
    : ['Your party is full.', `${name} was sent to storage.`];

  return { destination, messages };
}
