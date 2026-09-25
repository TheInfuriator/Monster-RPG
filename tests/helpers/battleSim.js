/**
 * battleSim.js — test helper
 * ----------------------------------------------------------------------------
 * Real battles through BattleEngine, seeded so they are reproducible, played
 * by a policy that stands in for a reasonable player: use the move that will
 * hurt most right now, send out the next creature when one faints, drink a
 * Super Potion when badly hurt. Not an expert, not a button-masher.
 *
 * The same idea as tests/gymBalance.test.js, shared so the rival and Route 2
 * balance tests measure things the same way.
 */

import { BattleEngine, BATTLE_RESULT } from '../../src/systems/battle/BattleEngine.js';
import { createTrainerBattleConfig } from '../../src/systems/TrainerSystem.js';
import { createCreature, getCreatureSpecies } from '../../src/systems/CreatureFactory.js';
import { getEffectiveness } from '../../src/systems/TypeChart.js';
import { createNewGameState } from '../../src/core/GameState.js';
import { ITEMS } from '../../src/data/items.js';
import { createSeededRandom } from '../../src/utils/rng.js';

/** The move that will do the most damage to what is standing opposite. */
export function bestMove(engine) {
  const me = engine.player.creature;
  const foeTypes = getCreatureSpecies(engine.opponent.creature).types;

  let best = null;
  let bestScore = -1;
  for (const entry of me.moves) {
    if (entry.pp <= 0) continue;
    const move = entry.move || entry;
    if (!move.power) continue;

    const stab = getCreatureSpecies(me).types.includes(move.type) ? 1.5 : 1;
    const score = move.power
      * stab
      * getEffectiveness(move.type, foeTypes)
      * ((move.accuracy ?? 100) / 100);

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best || me.moves.find((m) => m.pp > 0) || me.moves[0];
}

/**
 * Play one trainer battle to a decision.
 *
 * @param {string} trainerId
 * @param {Array<[string, number]>} party  [speciesId, level] pairs, lead first
 * @param {number} seed
 * @param {object} [options]
 * @param {number} [options.potions]  Super Potions the player is willing to spend
 * @param {string} [options.starter]  the player's starter, for a rival's party
 * @returns {string|undefined} the BATTLE_RESULT outcome
 */
export function playBattle(trainerId, party, seed, { potions = 3, starter = null } = {}) {
  const state = { ...createNewGameState(), starter };
  const team = party.map(([id, level]) => createCreature(id, level));
  const engine = new BattleEngine({
    ...createTrainerBattleConfig(trainerId, team, { state }),
    random: createSeededRandom(seed),
  });
  engine.start();

  let left = potions;
  for (let i = 0; i < 400 && !engine.isOver(); i += 1) {
    if (engine.awaitingPlayerSwitch) {
      const next = team.findIndex((c) => c.currentHp > 0);
      if (next === -1) break;
      engine.sendOutAfterFaint(next);
      continue;
    }

    const me = engine.player.creature;
    if (left > 0 && me.currentHp < me.stats.hp * 0.4) {
      left -= 1;
      me.currentHp = Math.min(me.stats.hp, me.currentHp + ITEMS.superPotion.effect.amount);
      engine.submitPlayerAction({ type: 'item', itemId: 'superPotion' });
      continue;
    }

    engine.submitPlayerAction({ type: 'move', moveEntry: bestMove(engine) });
  }

  return engine.result?.outcome;
}

/** How often this team beats this trainer, over a fixed set of seeds. */
export function winRate(trainerId, party, { seeds = 30, potions = 3, starter = null } = {}) {
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed += 1) {
    if (playBattle(trainerId, party, seed, { potions, starter }) === BATTLE_RESULT.WIN) wins += 1;
  }
  return wins / seeds;
}
