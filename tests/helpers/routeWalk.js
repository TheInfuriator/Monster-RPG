/**
 * routeWalk.js — test helper
 * ----------------------------------------------------------------------------
 * Walk Route 2 the way a player does, through the real battle engine, and
 * see what they arrive at the top with.
 *
 * Levels on a route are not a design wish — they are whatever the experience
 * economy hands out. So rather than GUESS "a player is about 18 by now", this
 * starts from a real post-Fern team, fights Kestrel at the Thornway gate,
 * some wild Aethers from the route's own tables, and every trainer on the way
 * up, with the engine awarding the experience. Moves are learned and
 * creatures evolve exactly when the species data says.
 *
 * A lost battle is retried from the same team (the real game sends you to a
 * Mender and you walk back), and the number of tries is reported — a trainer
 * that takes twenty tries is a wall, and the tests say so.
 */

import { BATTLE_RESULT } from '../../src/systems/battle/BattleEngine.js';
import { createTrainerBattleConfig } from '../../src/systems/TrainerSystem.js';
import { createWildBattleConfig } from '../../src/systems/WildBattle.js';
import { createCreature, getCreatureSpecies } from '../../src/systems/CreatureFactory.js';
import { evolveCreature, teachMove, replaceMove } from '../../src/systems/battle/ExperienceSystem.js';
import { getMove } from '../../src/data/moves.js';
import { ENCOUNTER_TABLES } from '../../src/data/encounters.js';
import { createNewGameState } from '../../src/core/GameState.js';
import { createSeededRandom, pickWeighted, randomInt } from '../../src/utils/rng.js';
import { runBattle } from './battleSim.js';

/**
 * The Route 2 Aether each starter's player is pointed at by the people on the
 * road: the answer to Kestrel's evolved starter, caught where it lives, at a
 * level the table really produces.
 */
export const ROUTE_2_ANSWER = {
  pyrret: { species: 'zaplet', level: 15, habitat: 'route2Thicket' },
  drizzle: { species: 'jabbit', level: 14, habitat: 'route2Thicket' },
  sproutle: { species: 'delvit', level: 15, habitat: 'route2Scree' },
};

const MAX_TRIES = 20;

function heal(team) {
  for (const creature of team) {
    creature.currentHp = creature.stats.hp;
    creature.status = null;
    for (const move of creature.moves) move.pp = move.maxPp;
  }
}

/**
 * What BattleScene does after a win: learn what was earned (replacing the
 * weakest move when full, as a sensible player would) and evolve.
 */
function settle(team) {
  for (const creature of team) {
    const species = getCreatureSpecies(creature);
    for (const entry of species.learnset) {
      if (entry.level > creature.level) continue;
      if (creature.moves.some((m) => m.id === entry.move)) continue;
      if ((creature.declined || []).includes(entry.move)) continue;

      if (!teachMove(creature, entry.move).needsChoice) continue;
      const power = (id) => getMove(id)?.power || 0;
      let weakest = 0;
      creature.moves.forEach((m, i) => {
        if (power(m.id) < power(creature.moves[weakest].id)) weakest = i;
      });
      if (power(entry.move) > power(creature.moves[weakest].id)) {
        replaceMove(creature, weakest, entry.move);
      } else {
        creature.declined = [...(creature.declined || []), entry.move];
      }
    }
    if (species.evolution && creature.level >= species.evolution.level) {
      evolveCreature(creature, species.evolution.to);
    }
  }
}

/** Beat a trainer, retrying from the same team after a loss. */
export function beatTrainer(team, trainerId, state, seedBase) {
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const copy = structuredClone(team);
    const outcome = runBattle(
      createTrainerBattleConfig(trainerId, copy, { state }), copy, seedBase + attempt
    );
    if (outcome === BATTLE_RESULT.WIN) {
      settle(copy);
      heal(copy);
      return { team: copy, tries: attempt + 1 };
    }
  }
  return { team, tries: Infinity };
}

/** Walk through some wild encounters from a table, keeping what was won. */
function wildBattles(team, tableId, count, random, seedBase) {
  let current = team;
  for (let i = 0; i < count; i += 1) {
    const row = pickWeighted(ENCOUNTER_TABLES[tableId], random);
    const encounter = { species: row.species, level: randomInt(row.minLevel, row.maxLevel, random) };
    const copy = structuredClone(current);
    const outcome = runBattle(createWildBattleConfig(encounter, copy), copy, seedBase + i, { potions: 1 });
    if (outcome === BATTLE_RESULT.WIN) {
      settle(copy);
      heal(copy);
      current = copy;
    }
  }
  return current;
}

/**
 * Walk Route 2 from Thistlewood's gate to the foot of Kestrel's gully.
 *
 * @param {string} starter
 * @param {object} [options]
 * @param {boolean} [options.catchAnswer] catch the Aether the road points at
 * @param {number} [options.wild] wild battles in the thickets (half as many
 *   again on the scree) — a player who sticks to the road meets a few
 * @param {'west'|'east'} [options.fork] which road round the bramble island
 * @param {object} [options.answer] a different catch to try (species, level, habitat)
 * @returns {{ team: object[], tries: Record<string, number>, state: object }}
 */
export function walkRoute2(starter, {
  catchAnswer = true, wild = 6, fork = 'west', answer = ROUTE_2_ANSWER[starter],
} = {}) {
  const state = { ...createNewGameState(), starter };
  const random = createSeededRandom(starter.length * 97 + wild);
  const tries = {};
  let team = [createCreature(starter, 14), createCreature('flittle', 13)];

  const trainer = (id, seedBase) => {
    const result = beatTrainer(team, id, state, seedBase);
    tries[id] = result.tries;
    team = result.team;
  };
  const maybeCatch = (habitat) => {
    if (catchAnswer && answer.habitat === habitat) {
      team.push(createCreature(answer.species, answer.level));
    }
  };

  trainer('kestrelThornway', 100);
  maybeCatch('route2Thicket');
  team = wildBattles(team, 'route2Thicket', wild, random, 200);
  trainer('route2Cutter', 300);
  trainer(fork === 'west' ? 'route2Forager' : 'route2Lookout', 400);
  maybeCatch('route2Scree');
  team = wildBattles(team, 'route2Scree', Math.ceil(wild / 2), random, 500);
  trainer('route2ScreeWalker', 600);

  return { team, tries, state };
}
