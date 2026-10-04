/**
 * hollow.test.js
 * ----------------------------------------------------------------------------
 * The Hollow Vane's last operation (Phase 14): the Works under the Aerie, the
 * three cell banks and the core door, the final Vane, Director Thale and the
 * Convergence — and the proof that nothing in the Works can trap a player.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TILE_DEFINITIONS } from '../src/data/tiles.js';
import { CREATURES } from '../src/data/creatures.js';
import { TRAINERS } from '../src/data/trainers.js';
import { FACTIONS } from '../src/data/factions.js';
import {
  createBarrierState, getLevers, getPuzzleSignals,
} from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory, createTrainerBattleConfig } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { exploreSituations, situationsThatCannotReach, tileKey as key } from './helpers/leverProof.js';

const WORKS = MAPS.hollowWorks;
const CORE = MAPS.convergenceCore;
const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const BANKS = ['earthBank', 'seaBank', 'stormBank'];
const KEEPERS = { earthBank: 'vaneVosslerHollow', seaBank: 'vaneBrack', stormBank: 'vaneCraleHollow' };
const HOLLOW_VANE = ['vaneOdile', 'vaneVosslerHollow', 'vaneBrack', 'vaneCraleHollow', 'vaneRusk', 'vaneDirector'];
const say = (entry, state) => resolveDialogue(entry.dialogue, getWorldConditions(state));
const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));

/** A player inside the Works: the gate open, the Convergence not yet stopped. */
function worksState({ keepersBeaten = false } = {}) {
  const state = createNewGameState();
  state.starter = 'drizzle';
  for (const sigil of ['verdantSigil', 'tidalSigil', 'stormSigil']) awardBadge(sigil, state);
  Object.assign(state.flags, { stormriseRelayStopped: true, aerieOpen: true });
  if (keepersBeaten) for (const id of Object.values(KEEPERS)) recordTrainerVictory(id, state);
  return state;
}

/** The Works as a player finds it in `state`: only the people who are there. */
function worksAsFound(state) {
  const conditions = getWorldConditions(state);
  return { ...WORKS, npcs: WORKS.npcs.filter((n) => isNpcPresent(n, conditions)) };
}

const touches = (tile) => (node) => node.region.has(key(tile.x, tile.y));
const VENTED = (bits) => Object.fromEntries(BANKS.map((id, i) => [id, Boolean(bits & (1 << i))]));

describe('the Works: where it is and what it is', () => {
  it('is entered from the Aerie, and leads on only to the Convergence', () => {
    expect([...new Set(WORKS.exits.map((e) => e.to))].sort()).toEqual(['aerie', 'convergenceCore']);
    expect(CORE.exits.every((e) => e.to === 'hollowWorks')).toBe(true);
    expect(MAPS.aerie.exits.filter((e) => e.to === 'hollowWorks')).toHaveLength(2);
  });

  it('holds three banks of cells — the earth\'s, the sea\'s and the storm\'s — each with a valve', () => {
    expect(getLevers(WORKS).map((l) => l.id).sort()).toEqual([...BANKS].sort());
    for (const lever of getLevers(WORKS)) {
      expect(lever.positions).toEqual(['primed', 'vented']);
      expect(lever.look).toBe('valve');
    }
    const boards = WORKS.interactables.filter((e) => e.type === 'sign').map((e) => JSON.stringify(e.dialogue));
    for (const survey of ['SURVEY 14', 'SURVEY 15', 'SURVEY 16']) expect(boards.some((b) => b.includes(survey)), survey).toBe(true);
  });

  it('says the objective in the Vane\'s own words: the core opens only with every bank vented', () => {
    const board = WORKS.interactables.find((e) => e.x === 24 && e.y === 19);
    expect(say(board, worksState()).pages.join(' ')).toMatch(/ALL THREE banks are vented/);
    const kestrel = WORKS.npcs.find((n) => n.id === 'kestrelHollow');
    expect(say(kestrel, worksState()).pages.join(' ')).toMatch(/vent all three/);
  });
});

describe('the mechanic: the game\'s puzzles, once each', () => {
  const closed = (bits, conditions = {}) => createBarrierState(WORKS, {
    conditions, state: { puzzles: { hollowWorks: VENTED(bits) } },
  });

  it('opens the core door only while ALL THREE banks are vented — the circuit', () => {
    for (let bits = 0; bits < 8; bits += 1) {
      expect(closed(bits).coreDoor, `banks ${bits.toString(2)}`).toBe(bits !== 7);
    }
    expect(WORKS.circuits).toEqual([{ id: 'core', needs: ['earthBank:vented', 'seaBank:vented', 'stormBank:vented'] }]);
  });

  it('gives each bank its own way on, and nothing else', () => {
    for (let bits = 0; bits < 8; bits += 1) {
      const vented = VENTED(bits);
      const state = closed(bits);
      expect(state.mistBridge).toBe(!vented.earthBank);     // Mistvault's bridge
      expect(state.pontoons).toBe(!vented.seaBank);         // the Tidal Hall's floating floor
      expect(state.stormShutter).toBe(!vented.stormBank);   // the Storm Hall's wired gate
    }
  });

  it('shows where each vented current goes', () => {
    for (const bank of BANKS) {
      const signals = getPuzzleSignals(WORKS, { state: { puzzles: { hollowWorks: { [bank]: true } } } });
      expect(signals.has(`${bank}:vented`)).toBe(true);
      expect(WORKS.glows.some((g) => g.signal === `${bank}:vented`), bank).toBe(true);
    }
  });

  it('stands every barrier open for good once the Convergence is stopped, whatever the valves say', () => {
    for (let bits = 0; bits < 8; bits += 1) {
      const state = closed(bits, { convergenceStopped: true });
      expect(Object.values(state).every((isClosed) => !isClosed)).toBe(true);
    }
  });
});

describe('the bank keepers', () => {
  it('stand on the only open tile in front of their bank\'s valve', () => {
    for (const lever of getLevers(WORKS)) {
      const stands = SIDES.map(([dx, dy]) => [lever.x + dx, lever.y + dy])
        .filter(([x, y]) => !TILE_DEFINITIONS[WORKS.tiles[y][x]].solid);
      const keeper = WORKS.npcs.find((n) => n.trainer === KEEPERS[lever.id]);
      expect(stands, lever.id).toEqual([[keeper.x, keeper.y]]);
    }
  });

  it('walk off for good once beaten, leaving the valve free', () => {
    for (const id of Object.values(KEEPERS)) {
      const entry = WORKS.npcs.find((n) => n.trainer === id);
      expect(entry.absentWhen).toBe(`trainer:${id}`);
      expect(entry.exitAfterDefeat).toBeDefined();
    }
  });

  it('are the only way to the core: with them still there, no valve can be touched', () => {
    const graph = exploreSituations(worksAsFound(worksState()), { starts: [WORKS.spawnPoints.fromAerie] });
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].region.has(key(35, 21))).toBe(false);
  });
});

describe('never a trap (the lever proof, with the keepers beaten)', () => {
  let graph;
  const situations = () => {
    graph ??= exploreSituations(worksAsFound(worksState({ keepersBeaten: true })), {
      starts: [WORKS.spawnPoints.fromAerie],
    });
    return graph;
  };

  it('finds every setting of the three valves, and every part of the Works to stand in', () => {
    const settings = new Set(situations().nodes.map((n) => BANKS.map((id) => (n.stored[id] ? 1 : 0)).join('')));
    expect(settings.size).toBe(8);
  });

  it('from EVERY situation, the way out to the Aerie can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches({ x: 0, y: 21 }))).toEqual([]);
  });

  it('from EVERY situation, the core can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches({ x: 35, y: 21 }))).toEqual([]);
  });

  it('from EVERY situation, every valve can still be reached', () => {
    for (const lever of getLevers(WORKS)) {
      const stand = { x: lever.x, y: lever.y + 1 };
      expect(situationsThatCannotReach(situations(), touches(stand)), lever.id).toEqual([]);
    }
  });

  it('can be solved from where it starts: earth, then sea, then storm', () => {
    const solved = situations().nodes.filter((n) => BANKS.every((id) => n.stored[id]) && n.region.has(key(35, 21)));
    expect(solved.length).toBeGreaterThan(0);
  });
});

describe('the final Hollow Vane', () => {
  const placed = [...WORKS.npcs, ...CORE.npcs].filter((n) => n.trainer && TRAINERS[n.trainer].faction === 'hollowVane');

  it('are six ordinary trainers: two Surveyors, two Foremen, the Overseer — and the Director', () => {
    expect(placed.map((n) => n.trainer).sort()).toEqual([...HOLLOW_VANE].sort());
    const ranks = placed.map((n) => TRAINERS[n.trainer].rank).sort();
    expect(ranks).toEqual(['director', 'foreman', 'foreman', 'overseer', 'surveyor', 'surveyor']);
    expect(FACTIONS.hollowVane.ranks.director.title).toBe('Vane Director');
  });

  it('wear the Vane\'s look, and each brings a Vane-typed Aether', () => {
    for (const entry of placed) {
      expect(FACTIONS.hollowVane.sprites).toContain(entry.sprite);
      const types = TRAINERS[entry.trainer].party.flatMap((p) => CREATURES[p.species].types);
      expect(types.some((t) => FACTIONS.hollowVane.types.includes(t)), entry.trainer).toBe(true);
    }
  });

  it('are stronger than any Vane the player met before', () => {
    const earlier = Object.values(TRAINERS).filter((t) => t.faction === 'hollowVane' && !HOLLOW_VANE.includes(t.id));
    const strongestBefore = Math.max(...earlier.map((t) => top(t.id)));
    for (const id of HOLLOW_VANE) expect(top(id), id).toBeGreaterThan(strongestBefore);
  });

  it('bring Vossler and Crale back, stronger, and put the Director above them all', () => {
    expect(TRAINERS.vaneVosslerHollow.name).toBe(TRAINERS.vaneForeman.name);
    expect(TRAINERS.vaneCraleHollow.name).toBe(TRAINERS.vaneOverseer.name);
    expect(top('vaneVosslerHollow')).toBeGreaterThan(top('vaneForeman'));
    expect(top('vaneCraleHollow')).toBeGreaterThan(top('vaneOverseer'));
    for (const id of HOLLOW_VANE.filter((x) => x !== 'vaneDirector')) expect(top('vaneDirector')).toBeGreaterThan(top(id));
  });
});

describe('Director Thale and the Convergence', () => {
  const director = CORE.npcs.find((n) => n.trainer === 'vaneDirector');
  const trainer = TRAINERS.vaneDirector;

  it('is an ordinary trainer battle: no boosts, no new species, a blackout on a loss', () => {
    for (const entry of trainer.party) expect(Object.keys(entry).sort()).toEqual(['level', 'species']);
    // Every species the Director brings is one the player can meet elsewhere.
    const elsewhere = new Set(Object.values(TRAINERS).filter((t) => t.id !== 'vaneDirector')
      .flatMap((t) => t.party.map((p) => p.species)));
    for (const entry of trainer.party) expect(elsewhere.has(entry.species), entry.species).toBe(true);
    const config = createTrainerBattleConfig('vaneDirector', [createCreature('drizzle', 30)]);
    expect(config.blackoutOnDefeat).toBe(true);
    expect(config.canRun).toBe(false);
    expect(trainer.victoryLines.length).toBeGreaterThan(0);
  });

  it('is below the climax: weaker than Kestrel\'s last team and the Champion', () => {
    expect(top('vaneDirector')).toBeLessThan(top('kestrelAerie'));
    expect(top('vaneDirector')).toBeLessThan(top('circleChampion'));
  });

  it('gives a reason, not a cackle: the dark months, and a steady light paid for', () => {
    const intro = trainer.intro.join(' ');
    expect(intro).toMatch(/Voltspire/);
    expect(intro).toMatch(/dark/);
    expect(trainer.outro.join(' ')).toMatch(/engine is down/);
  });

  it('stops the Convergence by the win, once — and nothing else does', () => {
    expect(trainer.setFlags).toEqual(['convergenceStopped']);
    const setters = [];
    for (const map of Object.values(MAPS)) {
      for (const entry of [...(map.npcs || []), ...(map.interactables || [])]) {
        for (const branch of Array.isArray(entry.dialogue) ? entry.dialogue : []) {
          if (branch && (branch.setFlags || []).includes('convergenceStopped')) setters.push(entry.id);
        }
      }
    }
    expect(setters).toEqual([]);
    const others = Object.values(TRAINERS).filter((t) => (t.setFlags || []).includes('convergenceStopped')).map((t) => t.id);
    expect(others).toEqual(['vaneDirector']);
  });

  it('walks off once beaten; the engine goes cold; the Circle comes in', () => {
    expect(director.absentWhen).toBe('trainer:vaneDirector');
    expect(director.exitAfterDefeat).toBeDefined();
    const glow = CORE.glows.find((g) => g.tile === '/');
    expect(glow.when).toBe('convergenceStopped');
    for (const [x, y] of glow.tiles) expect(CORE.tiles[y][x]).toBe('`');
    const state = worksState({ keepersBeaten: true });
    const warden = CORE.npcs.find((n) => n.id === 'coreWarden');
    expect(isNpcPresent(warden, getWorldConditions(state))).toBe(false);
    recordTrainerVictory('vaneDirector', state);
    expect(isNpcPresent(warden, getWorldConditions(state))).toBe(true);
    expect(isNpcPresent(director, getWorldConditions(state))).toBe(false);
  });

  it('explains the Convergence on its own boards', () => {
    const text = CORE.interactables.map((e) => JSON.stringify(e.dialogue)).join(' ');
    expect(text).toMatch(/meeting place/);
    expect(text).toMatch(/WELLSPRING/);
    expect(text).toMatch(/WILD AETHERS/);
  });
});

describe('Kestrel in the Hollow — a cameo, not a fight', () => {
  const kestrel = WORKS.npcs.find((n) => n.id === 'kestrelHollow');

  it('is there once the gate is open, and gone once the Convergence is stopped', () => {
    expect(kestrel.trainer).toBeUndefined();
    const state = worksState();
    expect(isNpcPresent(kestrel, getWorldConditions(state))).toBe(true);
    state.flags.convergenceStopped = true;
    expect(isNpcPresent(kestrel, getWorldConditions(state))).toBe(false);
  });
});
