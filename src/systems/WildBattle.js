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
 * PHASE NOTE: capture belongs to Phase 6. Nothing here mentions it — capture
 * orbs are refused by the battle bag on the item's own category, so adding
 * catching later needs no change to this pipeline.
 */

import { createCreature } from './CreatureFactory.js';

/**
 * Build the battle configuration for a wild encounter.
 *
 * @param {{species: string, level: number}} encounter from EncounterSystem
 * @param {object[]} playerParty the live party from GameState — passed through,
 *   never copied, so experience, damage and evolution land on the real team
 * @returns {object|null} a BattleEngine config, or null if it cannot be built
 */
export function createWildBattleConfig(encounter, playerParty) {
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
  const opponent = createCreature(encounter.species, encounter.level);
  if (!opponent) return null;

  return {
    playerParty,
    opponentParty: [opponent],
    battleType: 'wild',
    opponentName: null,
    /** Running is allowed, and uses the engine's existing escape formula. */
    canRun: true,
    awardExperience: true,
    /** A wild creature carries no coins. Money comes from trainers. */
    rewardMoney: 0,
  };
}
