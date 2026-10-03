/**
 * stormHall.test.js
 * ----------------------------------------------------------------------------
 * The Storm Hall (Phase 13): wired coils — touch one and its neighbours flip
 * too — in three chambers, each chamber's gate opening on a CIRCUIT; three
 * Stormwrights; Leader Halcyon; and the Storm Sigil, the third of three.
 *
 * As with Mistvault and the Tidal Hall, the safety claim is PROVED: every
 * coil pattern times every patch of floor the player could be standing on,
 * walked from the door (tests/helpers/leverProof.js).
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import {
  createBarrierState, findPuzzleProblems, getLeverPositions, getLevers, getPuzzleSignals,
  nextLeverState, pressLever,
} from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { TRAINERS } from '../src/data/trainers.js';
import { BADGES, getBadgesInOrder } from '../src/data/badges.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge, hasBadge, countBadges, getBadgeSlots } from '../src/systems/BadgeSystem.js';
import { exploreSituations, situationsThatCannotReach, tileKey as key } from './helpers/leverProof.js';

const HALL = MAPS.stormHall;
const halcyon = HALL.npcs.find((n) => n.id === 'stormLeaderHalcyon');
const DAIS = { x: halcyon.x, y: halcyon.y + 1 };   // where you stand to talk to the Leader
const DOOR = HALL.exits[0];
const coils = (room) => getLevers(HALL).filter((l) => l.id.startsWith(room));
/** The rows of each chamber (the dais is "room 4"). */
const CHAMBERS = { r1: [17, 22], r2: [12, 15], r3: [7, 10], dais: [3, 5] };
const GATE = { r1: 'gate1', r2: 'gate2', r3: 'gate3' };
const CIRCUIT = { r1: 'room1', r2: 'room2', r3: 'room3' };

const conditionsFor = (state) => getWorldConditions(state);
function built(state) {
  const map = new TileMap(HALL);
  map.setBarrierState(createBarrierState(HALL, { conditions: conditionsFor(state), state }));
  return map;
}

/** Everywhere you can walk from a tile, people as walls. */
function walkFrom(state, from) {
  const map = built(state);
  const blocked = new Set(HALL.npcs.map((n) => key(n.x, n.y)));
  const seen = new Set([key(from.x, from.y)]);
  const queue = [from];
  while (queue.length > 0) {
    const { x, y } = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const id = key(x + dx, y + dy);
      if (seen.has(id) || blocked.has(id) || !map.isWalkable(x + dx, y + dy)) continue;
      seen.add(id);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}

/** The fewest touches that complete a chamber's circuit, from where it starts. */
function fewestTouches(room) {
  const ids = coils(room).map((l) => l.id);
  const id = (stored) => ids.map((coil) => (stored[coil] ? '1' : '0')).join('');
  const holds = (stored) => getPuzzleSignals(HALL, { state: { puzzles: { stormHall: stored } } })
    .has(`circuit:${CIRCUIT[room]}`);
  const paths = new Map([[id({}), []]]);
  const queue = [{}];
  while (queue.length > 0) {
    const stored = queue.shift();
    const path = paths.get(id(stored));
    if (holds(stored)) return path;
    for (const coil of ids) {
      const next = nextLeverState(HALL, coil, stored);
      if (!paths.has(id(next))) {
        paths.set(id(next), [...path, coil]);
        queue.push(next);
      }
    }
  }
  return null;
}

describe('the Storm Hall\'s coils', () => {
  it('are sound by the puzzle rules', () => {
    expect(findPuzzleProblems(HALL)).toEqual([]);
  });

  it('are eleven coils in three chambers, each wired only within its chamber, both ways', () => {
    expect(getLevers(HALL).length).toBe(11);
    for (const lever of getLevers(HALL)) {
      expect(lever.look).toBe('coil');
      const room = lever.id.slice(0, 2);
      for (const other of lever.toggles) {
        expect(other.startsWith(room), `${lever.id} -> ${other}`).toBe(true);
        // Wired both ways: if A flips B, B flips A.
        expect(getLevers(HALL).find((l) => l.id === other).toggles).toContain(lever.id);
      }
    }
  });

  it('start as the guide describes: dark-LIT-dark, LIT-dark-LIT-dark, and a square', () => {
    const at = getLeverPositions(HALL, createNewGameState());
    expect(['r1a', 'r1b', 'r1c'].map((id) => at[id])).toEqual(['dark', 'lit', 'dark']);
    expect(['r2a', 'r2b', 'r2c', 'r2d'].map((id) => at[id])).toEqual(['lit', 'dark', 'lit', 'dark']);
    expect(['r3a', 'r3b', 'r3c', 'r3d'].map((id) => at[id])).toEqual(['lit', 'lit', 'dark', 'lit']);
  });

  it('draw the right picture whichever way round their positions are', () => {
    for (const lever of getLevers(HALL)) expect(lever.art).toEqual({ dark: 0, lit: 1 });
  });

  it('shut every gate to begin with', () => {
    expect(createBarrierState(HALL, { state: createNewGameState() })).toEqual({ gate1: true, gate2: true, gate3: true });
  });

  it('flip their neighbours: touching the middle of chamber 1 first puts the ends out of step', () => {
    const state = createNewGameState();
    pressLever(HALL, 'r1b', { state });
    const at = getLeverPositions(HALL, state);
    expect(['r1a', 'r1b', 'r1c'].map((id) => at[id])).toEqual(['lit', 'dark', 'lit']);
    expect(createBarrierState(HALL, { state }).gate1).toBe(true);
  });

  it('can be solved in every chamber — and never in one touch', () => {
    expect(fewestTouches('r1')).toEqual(['r1a', 'r1c']);
    expect(fewestTouches('r2').length).toBe(3);
    expect(fewestTouches('r3').length).toBe(3);
  });

  it('open each gate on its own chamber\'s circuit, and light its wire', () => {
    const state = createNewGameState();
    for (const id of fewestTouches('r1')) pressLever(HALL, id, { state });
    expect(createBarrierState(HALL, { state })).toEqual({ gate1: false, gate2: true, gate3: true });
    for (const id of fewestTouches('r2')) pressLever(HALL, id, { state });
    for (const id of fewestTouches('r3')) pressLever(HALL, id, { state });
    expect(createBarrierState(HALL, { state })).toEqual({ gate1: false, gate2: false, gate3: false });
    const signals = getPuzzleSignals(HALL, { state });
    expect(signals.has('circuit:hall')).toBe(true);    // the dais lights up
  });

  it('want the plate\'s pattern in chamber 3 — all four lit does NOT open it', () => {
    const allLit = { r3a: false, r3b: false, r3c: true, r3d: false };   // lit lit lit lit
    const state = { puzzles: { stormHall: allLit } };
    expect(getLeverPositions(HALL, state).r3c).toBe('lit');
    expect(createBarrierState(HALL, { state }).gate3).toBe(true);
    const plate = HALL.interactables.find((e) => e.x === 3 && e.y === 7);
    expect(plate.dialogue.join(' ')).toMatch(/top-left and bottom-right/);
  });

  it('stand inside their own chamber, none beside a gate', () => {
    const gates = new Set(HALL.barriers.flatMap((b) => b.tiles.map(([x, y]) => key(x, y))));
    for (const lever of getLevers(HALL)) {
      const [top, bottom] = CHAMBERS[lever.id.slice(0, 2)];
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        expect(gates.has(key(lever.x + dx, lever.y + dy)), lever.id).toBe(false);
        const ny = lever.y + dy;
        if (HALL.tiles[ny][lever.x + dx] !== '_') expect(ny >= top && ny <= bottom, lever.id).toBe(true);
      }
    }
  });

  it('stay open for a Sigil-holder, whatever the coils say', () => {
    const state = createNewGameState();
    pressLever(HALL, 'r1b', { state });
    awardBadge('stormSigil', state);
    expect(createBarrierState(HALL, { state, conditions: conditionsFor(state) }))
      .toEqual({ gate1: false, gate2: false, gate3: false });
  });
});

describe('the coils can never trap anyone (every pattern x every place to stand)', () => {
  const touches = (target) => (node) => node.region.has(key(target.x, target.y));
  let graph;
  const situations = () => {
    if (!graph) graph = exploreSituations(HALL, { starts: [HALL.spawnPoints.default] });
    return graph;
  };

  it('finds every pattern each chamber can make, and every chamber to stand in', () => {
    const nodes = situations().nodes;
    expect(nodes.length).toBeGreaterThan(64);
    const rows = new Set(nodes.flatMap((n) => [...n.region].map((k) => Number(k.split(',')[1]))));
    expect(rows.has(DAIS.y)).toBe(true);
  });

  it('from EVERY situation, the door can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches(DOOR))).toEqual([]);
  });

  it('from EVERY situation, the Leader can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches(DAIS))).toEqual([]);
  });

  it('holds for a Sigil-holder too: every gate open, whatever the coils say', () => {
    // With the Sigil the gates ignore the coils, so one walk per pattern of
    // the whole Hall settles it — every pattern of all eleven coils.
    for (let bits = 0; bits < 2 ** 11; bits += 97) {
      const state = createNewGameState();
      awardBadge('stormSigil', state);
      state.puzzles.stormHall = Object.fromEntries(getLevers(HALL).map((l, i) => [l.id, Boolean(bits & (1 << i))]));
      const seen = walkFrom(state, HALL.spawnPoints.default);
      expect(seen.has(key(DAIS.x, DAIS.y)) && seen.has(key(DOOR.x, DOOR.y))).toBe(true);
    }
  });

  it('cannot reach the Leader with any gate shut', () => {
    for (const node of situations().nodes) {
      if (!node.region.has(key(DAIS.x, DAIS.y))) continue;
      const state = { puzzles: { stormHall: node.stored } };
      expect(Object.values(createBarrierState(HALL, { state })).some(Boolean)).toBe(false);
    }
  });
});

describe('the Stormwrights', () => {
  const people = ['stormHallAda', 'stormHallFenn', 'stormHallInes'].map((id) => HALL.npcs.find((n) => n.trainer === id));

  it('wait one past each gate', () => {
    const start = HALL.spawnPoints.default;
    const shut = walkFrom(createNewGameState(), start);
    for (const p of people) {
      const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => shut.has(key(p.x + dx, p.y + dy)));
      expect(next, p.id).toBe(false);
    }
    const [top] = [CHAMBERS.r2, CHAMBERS.r3, CHAMBERS.dais];
    expect(people[0].y >= top[0] && people[0].y <= top[1]).toBe(true);
  });

  it('each watch the tile you step onto through their gate', () => {
    const lane = (p) => getSightTiles({ origin: p, facing: p.facing, range: p.sightRange }).map((t) => key(t.x, t.y));
    const [ada, fenn, ines] = people;
    expect(lane(ada)).toContain('16,15');   // through gate 1
    expect(lane(fenn)).toContain('4,10');   // through gate 2
    expect(lane(ines)).toContain('10,4');   // in front of Halcyon
  });

  it('are Electric trainers, below the Leader', () => {
    const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
    for (const p of people) {
      expect(top(p.trainer)).toBeLessThan(top('stormLeaderHalcyon'));
      expect(TRAINERS[p.trainer].rewardMoney).toBeLessThan(TRAINERS.stormLeaderHalcyon.rewardMoney);
    }
  });
});

describe('Leader Halcyon and the Storm Sigil', () => {
  const trainer = TRAINERS.stormLeaderHalcyon;

  it('is a Leader with three Aethers and a Stormcrest ace, stronger than Ondine', () => {
    expect(trainer.badge).toBe('stormSigil');
    expect(trainer.party.length).toBe(3);
    const levels = trainer.party.map((e) => e.level);
    expect(trainer.party[2].species).toBe('stormcrest');
    expect(levels[2]).toBe(Math.max(...levels));
    const ondine = TRAINERS.tidalLeaderOndine.party.map((e) => e.level);
    expect(Math.min(...levels)).toBeGreaterThan(Math.max(...ondine));
    expect(trainer.rewardMoney).toBeGreaterThan(TRAINERS.tidalLeaderOndine.rewardMoney);
  });

  it('is the Sigil\'s Leader in the Sigil data, both ways', () => {
    expect(BADGES.stormSigil.leaderTrainerId).toBe('stormLeaderHalcyon');
    expect(BADGES.stormSigil.leader).toBe('Halcyon');
  });

  it('completes the set: three of three, awarded once each', () => {
    const state = createNewGameState();
    awardBadge('verdantSigil', state);
    awardBadge('tidalSigil', state);
    expect(hasBadge('stormSigil', state)).toBe(false);
    expect(awardBadge('stormSigil', state).awarded).toBe(true);
    expect(awardBadge('stormSigil', state).awarded).toBe(false);
    expect(countBadges(state)).toBe(3);
    expect(getBadgeSlots(state).length).toBe(3);
    expect(getBadgesInOrder().every((b) => b.leaderTrainerId)).toBe(true);
  });

  it('offers no rematch once beaten, and says the Vane are not finished', () => {
    const state = createNewGameState();
    const talk = () => resolveDialogue(halcyon.dialogue, getWorldConditions(state));
    expect(talk().action).toBe('trainer:stormLeaderHalcyon');
    recordTrainerVictory('stormLeaderHalcyon', state);
    awardBadge('stormSigil', state);
    expect(talk().action).toBeNull();
    expect(talk().pages.join(' ')).toMatch(/Vane/);
  });

  it('stands where the climb ends, reached only once every gate is open', () => {
    const solved = createNewGameState();
    for (const room of ['r1', 'r2', 'r3']) for (const id of fewestTouches(room)) pressLever(HALL, id, { state: solved });
    expect(walkFrom(solved, HALL.spawnPoints.default).has(key(DAIS.x, DAIS.y))).toBe(true);
    expect(walkFrom(createNewGameState(), HALL.spawnPoints.default).has(key(DAIS.x, DAIS.y))).toBe(false);
  });
});

describe('the Hall\'s gates follow the chambers', () => {
  it('each gate follows exactly its own circuit', () => {
    for (const [room, gate] of Object.entries(GATE)) {
      const barrier = HALL.barriers.find((b) => b.id === gate);
      expect(barrier.openWhenSignal).toBe(`circuit:${CIRCUIT[room]}`);
      expect(barrier.openWhen).toBe('badge:stormSigil');
    }
  });
});
