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

/**
 * Beat a trainer, retrying after a loss.
 *
 * A loss keeps whatever experience it earned, exactly as the game does: the
 * battle runs on the live party, so a creature that knocked out two of the
 * trainer's Aethers before the blackout keeps the levels — and the Mender
 * heals it for the next try. (Until Phase 12 this helper threw a lost
 * battle's experience away, which only ever made a retry harder than the
 * game's. Phase 11's walks almost never lose, so their numbers stand.)
 */
export function beatTrainer(team, trainerId, state, seedBase, { switching = false } = {}) {
  let current = team;
  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const copy = structuredClone(current);
    const outcome = runBattle(
      createTrainerBattleConfig(trainerId, copy, { state }), copy, seedBase + attempt, { switching }
    );
    settle(copy);
    heal(copy);
    if (outcome === BATTLE_RESULT.WIN) return { team: copy, tries: attempt + 1 };
    current = copy;
  }
  return { team: current, tries: Infinity };
}

/**
 * Walk through some wild encounters from a table, keeping what was won.
 *
 * `training` (Phase 14) leads each wild battle with the team's LOWEST-level
 * creature — what a player does to bring a team up together rather than
 * leaning on one — and puts the team back in its own order afterwards.
 */
function wildBattles(team, tableId, count, random, seedBase, { switching = false, training = false } = {}) {
  let current = team;
  for (let i = 0; i < count; i += 1) {
    const row = pickWeighted(ENCOUNTER_TABLES[tableId], random);
    const encounter = { species: row.species, level: randomInt(row.minLevel, row.maxLevel, random) };
    const copy = structuredClone(current);
    const order = training ? [...copy].sort((a, b) => a.level - b.level) : copy;
    const outcome = runBattle(createWildBattleConfig(encounter, order), order, seedBase + i, { potions: 1, switching });
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
  catchAnswer = true, wild = 6, fork = 'west', answer = ROUTE_2_ANSWER[starter], switching = false, training = false,
} = {}) {
  const state = { ...createNewGameState(), starter };
  const random = createSeededRandom(starter.length * 97 + wild);
  const tries = {};
  let team = [createCreature(starter, 14), createCreature('flittle', 13)];

  const trainer = (id, seedBase) => {
    const result = beatTrainer(team, id, state, seedBase, { switching });
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
  team = wildBattles(team, 'route2Thicket', wild, random, 200, { switching, training });
  trainer('route2Cutter', 300);
  trainer(fork === 'west' ? 'route2Forager' : 'route2Lookout', 400);
  maybeCatch('route2Scree');
  team = wildBattles(team, 'route2Scree', Math.ceil(wild / 2), random, 500, { switching, training });
  trainer('route2ScreeWalker', 600);

  return { team, tries, state };
}

/**
 * The Mistvault Aether a player is pointed at by Warden Ashby in the Mouth,
 * when their team needs one: Gloamite (Rock/Dark) and Corrodit
 * (Poison/Steel) both shrug off Fire, and a Delvit from the Mouth's rubble
 * cracks both. The Water and Grass players' Route 2 teams manage without
 * (Sproutle's already holds a Delvit) — measured, not assumed: see
 * tests/mistvaultBalance.test.js.
 */
export const MISTVAULT_ANSWER = {
  pyrret: { species: 'delvit', level: 16, habitat: 'mistvaultCave' },
};

/**
 * Walk on from the top of Route 2 through Mistvault Cavern (Phase 12):
 * Kestrel at the cordon, then the cave the way a player meets it — a few wild
 * Aethers in each part, every Vane trainer on the way to the breaker (Brede,
 * off the way north, only if `optional`), and the Draw Foreman last.
 *
 * @param {string} starter
 * @param {object} [options]  as walkRoute2, plus:
 * @param {boolean} [options.optional] also fight Brede in the east wing
 * @param {number} [options.caveWild] wild battles in each part of the cave
 * @param {boolean} [options.caveAnswer] catch the Aether Ashby points at
 * @returns {{ team: object[], tries: Record<string, number>, state: object }}
 */
export function walkMistvault(starter, {
  optional = true, caveWild = 4, caveAnswer = true, switching = false, training = false, ...route
} = {}) {
  const walked = walkRoute2(starter, { ...route, switching, training });
  let { team } = walked;
  const { state } = walked;
  const tries = { ...walked.tries };
  const random = createSeededRandom(starter.length * 131 + caveWild);

  const trainer = (id, seedBase) => {
    const result = beatTrainer(team, id, state, seedBase, { switching });
    tries[id] = result.tries;
    team = result.team;
  };

  trainer('kestrelRoute2', 700);
  const answer = MISTVAULT_ANSWER[starter];
  if (caveAnswer && answer) team.push(createCreature(answer.species, answer.level));
  team = wildBattles(team, 'mistvaultCave', caveWild, random, 800, { switching, training });
  trainer('vaneTallis', 900);
  team = wildBattles(team, 'mistvaultGalleries', caveWild, random, 1000, { switching, training });
  if (optional) trainer('vaneBrede', 1100);
  trainer('vaneQuill', 1200);
  team = wildBattles(team, 'mistvaultGalleries', Math.ceil(caveWild / 2), random, 1300, { switching, training });
  trainer('vaneTechnician', 1400);
  trainer('vaneForeman', 1500);

  return { team, tries, state };
}

/**
 * Walk on from the breaker in Mistvault to the Tidal Sigil (Phase 12): a few
 * wild Aethers in the Grotto's shallows on the way out, Kestrel beside the
 * Hall road, the Deckhand and the Diver, and Leader Ondine.
 *
 * @param {string} starter
 * @param {object} [options] as walkMistvault, plus:
 * @param {number} [options.shallowsWild] wild battles in the Grotto
 * @returns {{ team: object[], tries: Record<string, number>, state: object, before: object }}
 *   `before` holds the team as it stood in front of each Tidewatch fight
 */
export function walkToTidalSigil(starter, {
  shallowsWild = 3, switching = false, training = false, ...cave
} = {}) {
  const walked = walkMistvault(starter, { ...cave, switching, training });
  let { team } = walked;
  const { state } = walked;
  const tries = { ...walked.tries };
  const before = {};
  const random = createSeededRandom(starter.length * 173 + shallowsWild);

  const trainer = (id, seedBase) => {
    before[id] = structuredClone(team);
    const result = beatTrainer(team, id, state, seedBase, { switching });
    tries[id] = result.tries;
    team = result.team;
  };

  team = wildBattles(team, 'mistvaultShallows', shallowsWild, random, 1600, { switching, training });
  trainer('kestrelTidewatch', 1700);
  trainer('tidalDeckhand', 1800);
  trainer('tidalDiver', 1900);
  trainer('tidalLeaderOndine', 2000);

  return { team, tries, state, before };
}

/**
 * The Aether each starter's player is pointed at on the Frost Shelf, when
 * their team needs one (Phase 13). The Water player's team has nothing that
 * stands up to the Storm Hall's electrics, and the Frost Shelf's Rimelet —
 * Ice — hits Stormcrest and Burrzap hard. The Grass player's has nothing for
 * Kestrel's Cindraw, and a Pebblit off the same scree shrugs off Fire. The
 * Fire player's team (with its Route 2 Zaplet, a Voltmane by now) manages
 * without. Measured, not assumed: see tests/stormriseBalance.test.js. The
 * Mountaineer on the shelf says so in the game.
 */
export const STORMRISE_ANSWER = {
  drizzle: { species: 'rimelet', level: 22, habitat: 'stormriseScree' },
  sproutle: { species: 'pebblit', level: 22, habitat: 'stormriseScree' },
};

/**
 * Walk on from the Tidal Sigil up the Stormrise Climb (Phase 13): a few wild
 * Aethers on each of its three grounds, every route trainer on the road, the
 * Vane Surveyor and the Relay Overseer on the Frost Shelf, and Kestrel at the
 * top of the pass. The Stormchaser, a step off the road on the summit, is
 * fought only if `optional`.
 *
 * @param {string} starter
 * @param {object} [options] as walkToTidalSigil, plus:
 * @param {number} [options.climbWild] wild battles on each of the Climb's grounds
 * @param {boolean} [options.climbOptional] also fight the Stormchaser
 * @param {object|null} [options.climbCatch] an Aether caught on the way up
 *   ({ species, level, habitat }) — by default the one the shelf points at
 * @returns {{ team: object[], tries: Record<string, number>, state: object, before: object }}
 */
export function walkStormrise(starter, {
  climbWild = 3, climbOptional = true, climbCatch = STORMRISE_ANSWER[starter] || null, switching = false, training = false, ...below
} = {}) {
  const walked = walkToTidalSigil(starter, { ...below, switching, training });
  let { team } = walked;
  const { state } = walked;
  const tries = { ...walked.tries };
  const before = { ...walked.before };
  const random = createSeededRandom(starter.length * 211 + climbWild);

  const trainer = (id, seedBase) => {
    before[id] = structuredClone(team);
    const result = beatTrainer(team, id, state, seedBase, { switching });
    tries[id] = result.tries;
    team = result.team;
  };
  const maybeCatch = (habitat) => {
    if (climbCatch && climbCatch.habitat === habitat && team.length < 6) {
      team.push(createCreature(climbCatch.species, climbCatch.level));
    }
  };

  maybeCatch('stormriseHeath');
  team = wildBattles(team, 'stormriseHeath', climbWild, random, 2100, { switching, training });
  trainer('stormriseHerder', 2200);
  trainer('stormriseClimber', 2300);
  maybeCatch('stormriseScree');
  team = wildBattles(team, 'stormriseScree', climbWild, random, 2400, { switching, training });
  trainer('stormriseMountaineer', 2500);
  trainer('vaneMarl', 2600);
  trainer('vaneOverseer', 2700);
  maybeCatch('stormriseSummit');
  team = wildBattles(team, 'stormriseSummit', climbWild, random, 2800, { switching, training });
  trainer('stormriseSkyherd', 2900);
  if (climbOptional) trainer('stormriseStormchaser', 3000);
  trainer('kestrelStormrise', 3100);

  return { team, tries, state, before };
}

/**
 * ...and on through the Storm Hall to the Storm Sigil: the three
 * Stormwrights, then Leader Halcyon.
 */
export function walkToStormSigil(starter, options = {}) {
  const { switching = false } = options;
  const walked = walkStormrise(starter, options);
  let { team } = walked;
  const { state } = walked;
  const tries = { ...walked.tries };
  const before = { ...walked.before };

  const trainer = (id, seedBase) => {
    before[id] = structuredClone(team);
    const result = beatTrainer(team, id, state, seedBase, { switching });
    tries[id] = result.tries;
    team = result.team;
  };
  trainer('stormHallAda', 3200);
  trainer('stormHallFenn', 3300);
  trainer('stormHallInes', 3400);
  trainer('stormLeaderHalcyon', 3500);

  return { team, tries, state, before };
}

/**
 * The Aerie Road Aethers a player at the Aerie Lodge brings into the team
 * (Phase 14), in order, until it is six strong: first an answer to each of
 * the Trial's Wardens the team has none for — the earth (water and grass hit
 * it), the sea (electric and grass), the sky (rock and ice) — then whatever
 * else the road offers. Old Warden Pell in the Lodge says as much in the
 * game.
 */
export const AERIE_CATCHES = {
  pyrret: ['brambelle', 'rimelet', 'marlance', 'cragmaw', 'gustwing'],
  drizzle: ['voltmane', 'cragmaw', 'brambelle', 'rimelet', 'ironvole'],
  sproutle: ['voltmane', 'rimelet', 'marlance', 'ironvole', 'gustwing'],
};

/**
 * Walk on from the Storm Sigil to the top of the valley (Phase 14): a few
 * wild Aethers on the Aerie Road and its three trainers; a stop at the Aerie
 * Lodge; the Hollow — the Surveyor in the hall, the three bank bosses, the
 * Surveyor at the core door and the Director; Kestrel on the Circle's Walk;
 * and the Circle's Trial — three Wardens and the Champion, resting at the
 * Lodge between battles (the doors never lock), as a sensible player does.
 *
 * THE LODGE (`camp`). Every walk before this one leans on whatever leads the
 * team, and arrives at the Aerie with one strong Aether and three far behind
 * it (a Route 1 Flittle still at 14). Nobody takes that into a Trial of four
 * full teams. At the Lodge the simulated player does what a player does
 * before a championship: leaves anything ten levels behind the team's best in
 * storage, fills the team to six from the Aerie Road (AERIE_CATCHES), brings
 * the team up together with `campTraining` wild battles, each led by whoever
 * is lowest — and then puts the strongest in front.
 *
 * @param {string} starter
 * @param {object} [options] as walkToStormSigil, plus:
 * @param {number} [options.roadWild] wild battles on the Aerie Road
 * @param {boolean} [options.camp] stop at the Lodge (above)
 * @param {number} [options.campTraining] wild battles at the Lodge
 * @returns {{ team: object[], tries: Record<string, number>, state: object, before: object }}
 */
export function walkToChampion(starter, {
  roadWild = 4, switching = false, training = false, camp = true, campTraining = 10, ...below
} = {}) {
  const walked = walkToStormSigil(starter, { ...below, switching, training });
  let { team } = walked;
  const { state } = walked;
  const tries = { ...walked.tries };
  const before = { ...walked.before };
  const random = createSeededRandom(starter.length * 257 + roadWild);

  const trainer = (id, seedBase) => {
    before[id] = structuredClone(team);
    const result = beatTrainer(team, id, state, seedBase, { switching });
    tries[id] = result.tries;
    team = result.team;
  };

  team = wildBattles(team, 'aerieRoad', Math.ceil(roadWild / 2), random, 3600, { switching, training });
  trainer('aerieAce', 3700);
  trainer('aerieGuide', 3800);
  team = wildBattles(team, 'aerieRoad', Math.floor(roadWild / 2), random, 3900, { switching, training });
  trainer('aerieHopeful', 4000);
  before.atTheAerie = structuredClone(team);

  if (camp) {
    const best = Math.max(...team.map((c) => c.level));
    team = team.filter((c) => c.level >= best - 10);
    // Caught at 26, the middle of what the Aerie Road's table turns up.
    for (const species of AERIE_CATCHES[starter] || []) {
      if (team.length < 6) team.push(createCreature(species, 26));
    }
    team = wildBattles(team, 'aerieRoad', campTraining, random, 4050, { switching, training: true });
    // And into the Hollow with the strongest in front.
    team.sort((a, b) => b.level - a.level);
  }
  before.afterLodge = structuredClone(team);

  trainer('vaneOdile', 4100);
  trainer('vaneVosslerHollow', 4200);
  trainer('vaneBrack', 4300);
  trainer('vaneCraleHollow', 4400);
  trainer('vaneRusk', 4500);
  trainer('vaneDirector', 4600);
  state.flags.convergenceStopped = true;

  trainer('kestrelAerie', 4700);
  trainer('circleAshby', 4800);
  trainer('circleMerrow', 4900);
  trainer('circleHale', 5000);
  trainer('circleChampion', 5100);

  return { team, tries, state, before };
}
