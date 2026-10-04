/**
 * battleSim.js — test helper
 * ----------------------------------------------------------------------------
 * Real battles through BattleEngine, seeded so they are reproducible, played
 * by a policy that stands in for a reasonable player: use the move that will
 * hurt most right now, send out the next creature when one faints, drink a
 * Super Potion when badly hurt. Not an expert, not a button-masher.
 *
 * Shared by the Hall, rival and Route 2 balance tests, so they all measure
 * the same player.
 *
 * TWO POLICIES (Phase 14). By default the player never switches of their own
 * accord: the lead fights until it faints and the next in line comes out —
 * pessimistic on purpose, and every number up to Phase 13 was measured that
 * way. `switching: true` plays a CONSERVATIVE switcher instead: when the
 * creature out is badly matched — the foe hits it super-effectively and it
 * cannot hit back well — and a healthy creature on the bench is clearly better
 * placed, it switches, at most once per foe; and after a faint it sends out
 * the best-placed creature rather than the next in line. A test-helper policy
 * only: nothing in the game plays this way.
 *
 * A creature's move entry is only { id, pp, maxPp }: the move itself lives in
 * the move database, so its power is read with getMove(). (The Phase 9 copy of
 * this driver read `entry.power`, found nothing, and always used the FIRST
 * move — fixed in Phase 11, and every number re-measured.)
 */

import { BattleEngine, BATTLE_RESULT } from '../../src/systems/battle/BattleEngine.js';
import { createTrainerBattleConfig } from '../../src/systems/TrainerSystem.js';
import { createCreature, getCreatureSpecies } from '../../src/systems/CreatureFactory.js';
import { getEffectiveness } from '../../src/systems/TypeChart.js';
import { createNewGameState } from '../../src/core/GameState.js';
import { ITEMS } from '../../src/data/items.js';
import { getMove } from '../../src/data/moves.js';
import { createSeededRandom } from '../../src/utils/rng.js';

/**
 * How hard `creature`'s best move hits something of `foeTypes`, and which
 * move that is. Power x same-type bonus x type effectiveness x accuracy.
 */
function scoreMoves(creature, foeTypes) {
  let best = null;
  let bestScore = -1;
  for (const entry of creature.moves) {
    if (entry.pp <= 0) continue;
    const move = getMove(entry.id);
    if (!move || !move.power) continue;

    const stab = getCreatureSpecies(creature).types.includes(move.type) ? 1.5 : 1;
    const score = move.power
      * stab
      * getEffectiveness(move.type, foeTypes)
      * ((move.accuracy ?? 100) / 100);

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return { best, score: bestScore };
}

/**
 * How well `mine` stands against `foe`: what it can do to the foe, divided by
 * what the foe can do to it. Above 1, it is winning the exchange.
 */
function matchup(mine, foe) {
  const attack = scoreMoves(mine, getCreatureSpecies(foe).types).score;
  const threat = scoreMoves(foe, getCreatureSpecies(mine).types).score;
  return Math.max(attack, 1) / Math.max(threat, 1);
}

/** The healthy benched creature best placed against `foe`, or -1. */
function bestPlaced(team, foe, { exclude = -1, minHealth = 0 } = {}) {
  let best = -1;
  let bestScore = -Infinity;
  team.forEach((creature, index) => {
    if (index === exclude || creature.currentHp <= 0) return;
    if (creature.currentHp < creature.stats.hp * minHealth) return;
    const score = matchup(creature, foe);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return { index: best, score: bestScore };
}

/** The move that will do the most damage to what is standing opposite. */
export function bestMove(engine) {
  const me = engine.player.creature;
  const { best } = scoreMoves(me, getCreatureSpecies(engine.opponent.creature).types);
  return best || me.moves.find((m) => m.pp > 0) || me.moves[0];
}

/**
 * Play one trainer battle to a decision.
 *
 * @param {string} trainerId
 * @param {Array<[string, number]|object>} party  [speciesId, level] pairs or
 *   creatures, lead first
 * @param {number} seed
 * @param {object} [options]
 * @param {number} [options.potions]  Super Potions the player is willing to spend
 * @param {string} [options.starter]  the player's starter, for a rival's party
 * @returns {string|undefined} the BATTLE_RESULT outcome
 */
export function playBattle(trainerId, party, seed, { potions = 3, starter = null, switching = false } = {}) {
  const state = { ...createNewGameState(), starter };
  const team = party.map((entry) => (Array.isArray(entry) ? createCreature(entry[0], entry[1]) : entry));
  return runBattle(createTrainerBattleConfig(trainerId, team, { state }), team, seed, { potions, switching });
}

/**
 * Drive any battle config to a decision with the sensible-player policy.
 * `team` must be the config's own playerParty: the engine changes it in
 * place — HP, and experience for every creature that took part.
 *
 * @returns {string|undefined} the BATTLE_RESULT outcome
 */
export function runBattle(config, team, seed, { potions = 3, switching = false } = {}) {
  const engine = new BattleEngine({ ...config, random: createSeededRandom(seed) });
  engine.start();

  let left = potions;
  // The switcher moves at most once per foe, so it can never ping-pong.
  let switchedAgainst = null;
  for (let i = 0; i < 400 && !engine.isOver(); i += 1) {
    if (engine.awaitingPlayerSwitch) {
      const next = switching
        ? bestPlaced(team, engine.opponent.creature).index
        : team.findIndex((c) => c.currentHp > 0);
      if (next === -1) break;
      engine.sendOutAfterFaint(next);
      continue;
    }

    const me = engine.player.creature;
    const foe = engine.opponent.creature;
    if (switching && switchedAgainst !== foe) {
      const here = matchup(me, foe);
      const mineIndex = team.indexOf(me);
      const option = bestPlaced(team, foe, { exclude: mineIndex, minHealth: 0.5 });
      // Only a clearly bad exchange, and only for a clearly better one.
      if (here < 0.5 && option.index !== -1 && option.score >= here * 3 && option.score >= 1) {
        switchedAgainst = foe;
        engine.submitPlayerAction({ type: 'switch', index: option.index });
        continue;
      }
    }

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

/**
 * How often this team beats this trainer, over a fixed set of seeds.
 *
 * `party` is [speciesId, level] pairs, or real creatures (from a simulated
 * walk) — those are copied for every seed, never spent.
 */
export function winRate(trainerId, party, {
  seeds = 30, potions = 3, starter = null, switching = false,
} = {}) {
  let wins = 0;
  for (let seed = 1; seed <= seeds; seed += 1) {
    const team = party.map((entry) => (Array.isArray(entry) ? entry : structuredClone(entry)));
    const outcome = playBattle(trainerId, team, seed, { potions, starter, switching });
    if (outcome === BATTLE_RESULT.WIN) wins += 1;
  }
  return wins / seeds;
}
