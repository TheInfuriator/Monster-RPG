/**
 * tidalHall.test.js
 * ----------------------------------------------------------------------------
 * The Tidal Hall (Phase 12): one tide, three wheels, two kinds of floor that
 * move opposite ways — and Leader Ondine and the Tidal Sigil at the top.
 *
 * As with Mistvault, the safety claim is PROVED rather than spot-checked:
 * every tide times every patch of walkway the player could be standing on,
 * walked from the door (tests/helpers/leverProof.js).
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import {
  createBarrierState, findPuzzleProblems, getLeverPositions, getLevers, getLeverStateIds,
  pressLever,
} from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { TRAINERS } from '../src/data/trainers.js';
import { BADGES } from '../src/data/badges.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge, hasBadge, countBadges } from '../src/systems/BadgeSystem.js';
import { exploreSituations, situationsThatCannotReach, tileKey as key } from './helpers/leverProof.js';

const HALL = MAPS.tidalHall;
const ondine = HALL.npcs.find((n) => n.id === 'tidalLeaderOndine');
const DAIS = { x: ondine.x, y: ondine.y + 1 };   // where you stand to talk to the Leader

function hallState(tide = 'low') {
  const state = createNewGameState();
  state.puzzles.tidalHall = { tide: tide === 'high' };
  return state;
}

function built(state) {
  const map = new TileMap(HALL);
  map.setBarrierState(createBarrierState(HALL, { conditions: getWorldConditions(state), state }));
  return map;
}

/** Everywhere you can walk from a tile at a given tide, people as walls. */
function walkFrom(from, tide) {
  const map = built(hallState(tide));
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
const walkOf = (row) => ({ x: 10, y: row });   // a tile on each walk
const WALKS = { entrance: 17, lower: 11, upper: 7, dais: 4 };

describe('the Tidal Hall\'s tide', () => {
  it('is sound by the puzzle rules', () => {
    expect(findPuzzleProblems(HALL)).toEqual([]);
  });

  it('is ONE stored state shared by three wheels', () => {
    expect(getLevers(HALL).length).toBe(3);
    expect([...getLeverStateIds(HALL)]).toEqual(['tide']);
    expect(getLevers(HALL).every((l) => l.look === 'wheel')).toBe(true);
  });

  it('starts low, and any wheel turns it for all of them', () => {
    const state = createNewGameState();
    expect(getLeverPositions(HALL, state)).toEqual({ tide: 'low' });
    for (const lever of getLevers(HALL)) {
      const before = getLeverPositions(HALL, state).tide;
      pressLever(HALL, lever.id, { state });
      expect(getLeverPositions(HALL, state).tide).not.toBe(before);
    }
  });

  it('moves the causeways and the pontoons in opposite directions', () => {
    const low = createBarrierState(HALL, { state: hallState('low') });
    const high = createBarrierState(HALL, { state: hallState('high') });
    expect(low).toEqual({ lowerCauseway: false, pontoons: true, upperCauseway: false });
    expect(high).toEqual({ lowerCauseway: true, pontoons: false, upperCauseway: true });
  });

  it('needs low, then high, then low to climb: each step only at one tide', () => {
    const step = (from, to, tide) => walkFrom(walkOf(WALKS[from]), tide).has(key(walkOf(WALKS[to]).x, walkOf(WALKS[to]).y));
    expect(step('entrance', 'lower', 'low')).toBe(true);
    expect(step('entrance', 'lower', 'high')).toBe(false);
    expect(step('lower', 'upper', 'high')).toBe(true);
    expect(step('lower', 'upper', 'low')).toBe(false);
    expect(step('upper', 'dais', 'low')).toBe(true);
    expect(step('upper', 'dais', 'high')).toBe(false);
  });

  it('puts a wheel on every walk you change the tide from — and none beside the moving floor', () => {
    const wheelOn = (row) => getLevers(HALL).some((l) =>
      [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => l.y + dy === row && HALL.tiles[row][l.x + dx] === '['));
    expect(wheelOn(WALKS.lower)).toBe(true);
    expect(wheelOn(WALKS.upper)).toBe(true);
    expect(getLevers(HALL).some((l) => l.y >= 15)).toBe(true);    // the entrance walk
    const moving = new Set(HALL.barriers.flatMap((b) => b.tiles.map(([x, y]) => key(x, y))));
    for (const lever of getLevers(HALL)) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        expect(moving.has(key(lever.x + dx, lever.y + dy))).toBe(false);
      }
    }
  });

  it('refuses to flood a causeway under somebody', () => {
    const state = hallState('low');
    const outcome = pressLever(HALL, 'wheelEntrance', { state, occupants: [{ x: 13, y: 13 }] });
    expect(outcome).toMatchObject({ changed: false, reason: 'occupied' });
    expect(getLeverPositions(HALL, state).tide).toBe('low');
  });
});

describe('the tide can never trap anyone (every tide x every place to stand)', () => {
  const door = HALL.exits[0];
  const touches = (target) => (node) => node.region.has(key(target.x, target.y));

  function situations() {
    // From the door, at either tide (the tide is saved, so a player can walk
    // back in to find it high).
    return exploreSituations(HALL, {
      starts: [
        { ...HALL.spawnPoints.default, stored: { tide: false } },
        { ...HALL.spawnPoints.default, stored: { tide: true } },
      ],
    });
  }

  it('finds both tides, and more than one place to stand', () => {
    const graph = situations();
    expect(new Set(graph.nodes.map((n) => n.stored.tide)).size).toBe(2);
    expect(graph.nodes.length).toBeGreaterThan(2);
  });

  it('from EVERY situation, the door can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches(door))).toEqual([]);
  });

  it('from EVERY situation, the Leader can still be reached', () => {
    expect(situationsThatCannotReach(situations(), touches(DAIS))).toEqual([]);
  });

  it('never leaves anyone on the dais at high tide', () => {
    for (const node of situations().nodes) {
      if (node.region.has(key(DAIS.x, DAIS.y))) expect(node.stored.tide).toBe(false);
    }
  });
});

describe('the Gym trainers', () => {
  const people = ['tidalDeckhand', 'tidalDiver'].map((id) => HALL.npcs.find((n) => n.trainer === id));

  it('each watch a walk the climb has to cross', () => {
    const [deckhand, diver] = people;
    // The lower walk: from the causeway (13..14) west to the pontoons (7..8).
    const lane = (p) => getSightTiles({ origin: p, facing: p.facing, range: p.sightRange });
    expect(lane(deckhand).map((t) => key(t.x, t.y))).toEqual(['10,11']);
    expect(lane(diver).map((t) => key(t.x, t.y))).toEqual(['12,7']);
    // ...and those tiles are the only way along each walk.
    for (const [p, row] of [[deckhand, WALKS.lower], [diver, WALKS.upper]]) {
      expect(HALL.tiles[row - 1][p.x] === '~' || HALL.tiles[row + 1][p.x] === '~').toBe(true);
    }
  });

  it('never stand in the way: each on a step off the walk', () => {
    for (const p of people) expect(HALL.tiles[p.y][p.x]).toBe('[');
    for (const p of people) {
      const onWalk = [WALKS.lower, WALKS.upper].includes(p.y);
      expect(onWalk).toBe(false);
    }
  });

  it('are Water trainers with the harbour\'s Aethers, below the Leader', () => {
    const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
    for (const p of people) {
      expect(top(p.trainer)).toBeLessThan(top('tidalLeaderOndine'));
      expect(TRAINERS[p.trainer].rewardMoney).toBeLessThan(TRAINERS.tidalLeaderOndine.rewardMoney);
    }
  });
});

describe('Leader Ondine and the Tidal Sigil', () => {
  const trainer = TRAINERS.tidalLeaderOndine;

  it('is a Leader with three Aethers and an ace, stronger than Fern', () => {
    expect(trainer.badge).toBe('tidalSigil');
    expect(trainer.party.length).toBe(3);
    const levels = trainer.party.map((e) => e.level);
    expect(levels[2]).toBe(Math.max(...levels));
    expect(levels[2]).toBeGreaterThan(levels[0]);
    const fern = TRAINERS.verdantLeaderFern.party.map((e) => e.level);
    expect(Math.min(...levels)).toBeGreaterThan(Math.max(...fern));
    expect(trainer.rewardMoney).toBeGreaterThan(TRAINERS.verdantLeaderFern.rewardMoney);
  });

  it('is the Sigil\'s Leader in the Sigil data, both ways', () => {
    expect(BADGES.tidalSigil.leaderTrainerId).toBe('tidalLeaderOndine');
    expect(BADGES.tidalSigil.leader).toBe('Ondine');
  });

  it('awards it exactly once, after the win', () => {
    const state = createNewGameState();
    awardBadge('verdantSigil', state);
    expect(hasBadge('tidalSigil', state)).toBe(false);
    expect(awardBadge('tidalSigil', state).awarded).toBe(true);
    expect(awardBadge('tidalSigil', state).awarded).toBe(false);
    expect(countBadges(state)).toBe(2);
  });

  it('offers no rematch once beaten, and says something new', () => {
    const state = createNewGameState();
    const talk = () => resolveDialogue(ondine.dialogue, getWorldConditions(state));
    expect(talk().action).toBe('trainer:tidalLeaderOndine');
    recordTrainerVictory('tidalLeaderOndine', state);
    expect(talk().action).toBeNull();
    expect(talk().pages.join(' ')).toMatch(/Stormrise/);
  });

  it('stands where the climb ends, reachable only from the dais', () => {
    expect(walkFrom(walkOf(WALKS.upper), 'low').has(key(DAIS.x, DAIS.y))).toBe(true);
  });
});
