/**
 * stormrise.test.js
 * ----------------------------------------------------------------------------
 * Route 3, the Stormrise Climb (Phase 13): three maps up the mountain, their
 * three grounds and wild Aethers, the route's trainers, the Hollow Vane's
 * relay on the Frost Shelf (the phase's story event), and Kestrel at the top.
 *
 * Ledges get their own proof in tests/ledges.test.js (no map can strand
 * anyone); weather in tests/weather.test.js.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { TILE_DEFINITIONS } from '../src/data/tiles.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { chooseWeather } from '../src/systems/WeatherRenderer.js';
import { getEncounterConfig, ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { TRAINERS } from '../src/data/trainers.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { FACTIONS } from '../src/data/factions.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { resolvePartyEntry } from '../src/systems/RivalSystem.js';

const CLIMB = ['stormriseLower', 'stormriseHigh', 'stormriseSummit'].map((id) => MAPS[id]);
const [LOWER, HIGH, SUMMIT] = CLIMB;
const key = (x, y) => `${x},${y}`;
const npc = (map, id) => map.npcs.find((n) => n.id === id);
const say = (entry, state) => resolveDialogue(entry.dialogue, getWorldConditions(state));

/** A player standing at the foot of the Climb: Tidal Sigil won, rockslide lifted. */
function climbingState(starter = 'drizzle') {
  const state = createNewGameState();
  state.starter = starter;
  awardBadge('verdantSigil', state);
  awardBadge('tidalSigil', state);
  for (const id of ['kestrelThornway', 'kestrelRoute2', 'vaneForeman', 'kestrelTidewatch', 'tidalLeaderOndine']) {
    recordTrainerVictory(id, state);
  }
  Object.assign(state.flags, { mistvaultOpen: true, mistvaultSiphonStopped: true, stormriseOpen: true });
  return state;
}

/** Everywhere you can walk on a map from a spawn, with ledges, people as walls. */
function reachable(map, state, from) {
  const tiles = new TileMap(map);
  tiles.setBarrierState(createBarrierState(map, { conditions: getWorldConditions(state), state }));
  const conditions = getWorldConditions(state);
  const people = new Set(map.npcs.filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)));
  const items = new Set((map.interactables || []).map((e) => key(e.x, e.y)));
  const seen = new Set([key(from.x, from.y)]);
  const queue = [from];
  while (queue.length > 0) {
    const { x, y } = queue.pop();
    for (const [dx, dy, dir] of [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']]) {
      const hop = tiles.getLedgeHop(x, y, dir);
      for (const to of [{ x: x + dx, y: y + dy }, hop].filter(Boolean)) {
        const id = key(to.x, to.y);
        if (seen.has(id) || people.has(id) || items.has(id)) continue;
        if (!tiles.isWalkable(to.x, to.y)) continue;
        seen.add(id);
        queue.push(to);
      }
    }
  }
  return seen;
}
const nextTo = (seen, { x, y }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(key(x + dx, y + dy)));

describe('the Stormrise Climb: three maps up the mountain', () => {
  it('runs Tidewatch -> the Terraces -> the Frost Shelf -> the Saddle -> Voltspire, both ways', () => {
    const links = [['tidewatch', 'stormriseLower'], ['stormriseLower', 'stormriseHigh'],
      ['stormriseHigh', 'stormriseSummit'], ['stormriseSummit', 'voltspire']];
    for (const [a, b] of links) {
      expect(MAPS[a].exits.some((e) => e.to === b), `${a} -> ${b}`).toBe(true);
      expect(MAPS[b].exits.some((e) => e.to === a), `${b} -> ${a}`).toBe(true);
    }
  });

  it('is a route (no interiors), with a wild habitat of its own on every map', () => {
    const grounds = CLIMB.map((map) => {
      const found = new Set(map.tiles.flatMap((row) => [...row]).filter((c) => TILE_DEFINITIONS[c].encounter));
      return [...found].map((c) => TILE_DEFINITIONS[c].id);
    });
    expect(grounds).toEqual([['heath'], ['frost_scree'], ['stormgrass']]);
    for (const map of CLIMB) expect(map.interior).toBeFalsy();
  });

  it('has its OWN ground, not the Thornway\'s grass or the cavern\'s rubble', () => {
    const before = ['route1', 'route2', 'mistvaultMouth', 'mistvaultGalleries', 'mistvaultCore'];
    const old = new Set(before.flatMap((id) => MAPS[id].tiles.flatMap((row) => [...row])));
    for (const c of ['1', '2', '3', 'L', '5']) expect(old.has(c), c).toBe(false);
  });

  it('climbs: every map has ledges, and every ledge drops down the mountain (south)', () => {
    for (const map of CLIMB) {
      const ledges = map.tiles.flatMap((row) => [...row]).filter((c) => TILE_DEFINITIONS[c].ledge);
      expect(ledges.length, map.id).toBeGreaterThan(0);
      expect(new Set(ledges.map((c) => TILE_DEFINITIONS[c].ledge))).toEqual(new Set(['down']));
    }
  });

  it('has weather on every map — and the shelf\'s changes with the story', () => {
    const state = climbingState();
    expect(chooseWeather(LOWER.weather, getWorldConditions(state)).kind).toBe('wind');
    expect(chooseWeather(HIGH.weather, getWorldConditions(state)).kind).toBe('mist');
    expect(chooseWeather(SUMMIT.weather, getWorldConditions(state)).kind).toBe('snow');
    state.flags.stormriseRelayStopped = true;
    expect(chooseWeather(HIGH.weather, getWorldConditions(state)).kind).toBe('wind');
  });

  it('lets a player reach every person, sign and item on every map', () => {
    const state = climbingState();
    state.flags.stormriseRelayStopped = true;
    recordTrainerVictory('vaneOverseer', state);
    const conditions = getWorldConditions(state);
    for (const map of CLIMB) {
      const seen = new Set();
      for (const spawn of Object.values(map.spawnPoints)) for (const k of reachable(map, state, spawn)) seen.add(k);
      for (const exit of map.exits) expect(seen.has(key(exit.x, exit.y)), `${map.id} exit to ${exit.to}`).toBe(true);
      for (const entry of [...map.npcs.filter((n) => isNpcPresent(n, conditions)), ...map.interactables]) {
        expect(nextTo(seen, entry), `${map.id} ${entry.id || entry.item || `${entry.x},${entry.y}`}`).toBe(true);
      }
    }
  });
});

describe('the Climb\'s wild Aethers', () => {
  it('rolls a different table on each ground', () => {
    expect(getEncounterConfig(LOWER).tableId).toBe('stormriseHeath');
    expect(getEncounterConfig(HIGH).tableId).toBe('stormriseScree');
    expect(getEncounterConfig(SUMMIT).tableId).toBe('stormriseSummit');
  });

  it('rises a little each map, starting where the Tidal Sigil leaves a player (about 20-22)', () => {
    const range = (id) => {
      const table = ENCOUNTER_TABLES[id];
      return [Math.min(...table.map((e) => e.minLevel)), Math.max(...table.map((e) => e.maxLevel))];
    };
    expect(range('stormriseHeath')).toEqual([20, 23]);
    expect(range('stormriseScree')[0]).toBe(21);
    expect(range('stormriseSummit')[0]).toBe(22);
    expect(range('stormriseSummit')[1]).toBeLessThanOrEqual(25);
  });

  it('brings in four new species, each where it is useful', () => {
    expect(CREATURES.cirrup.types).toEqual(['electric', 'flying']);
    expect(CREATURES.cirrup.evolution.to).toBe('stormcrest');
    expect(CREATURES.rimelet.types).toEqual(['ice']);           // the first Ice type
    expect(CREATURES.thundrel.types).toEqual(['electric', 'dragon']);
    const all = Object.values(ENCOUNTER_TABLES).flat().map((e) => e.species);
    for (const id of ['cirrup', 'rimelet', 'thundrel']) expect(all, id).toContain(id);
    // Stormcrest is the Leader's ace, met grown — not found wild here.
    expect(all).not.toContain('stormcrest');
  });

  it('teaches the new moves only to the species that need them', () => {
    const learners = (move) => Object.values(CREATURES).filter((c) => c.learnset.some((l) => l.move === move)).map((c) => c.id);
    expect(learners('rimeShard')).toEqual(['rimelet']);
    expect(learners('drakePulse')).toEqual(['thundrel']);
    expect(MOVES.rimeShard.type).toBe('ice');
    expect(MOVES.drakePulse.type).toBe('dragon');
  });

  it('makes Thundrel rare but fair: only on the summit, about 1 in 23, at a catchable level', () => {
    const where = Object.entries(ENCOUNTER_TABLES).filter(([, t]) => t.some((e) => e.species === 'thundrel')).map(([id]) => id);
    expect(where).toEqual(['stormriseSummit']);
    const table = ENCOUNTER_TABLES.stormriseSummit;
    const total = table.reduce((sum, e) => sum + e.weight, 0);
    const chance = table.find((e) => e.species === 'thundrel').weight / total;
    expect(chance).toBeGreaterThan(0.03);
    expect(chance).toBeLessThan(0.06);
    expect(table.find((e) => e.species === 'thundrel').maxLevel).toBeLessThanOrEqual(24);
    // Stormgrass covers much of the summit either side of the road, so
    // nobody has to go looking far for it.
    expect(SUMMIT.tiles.flatMap((row) => [...row]).filter((c) => c === '3').length).toBeGreaterThan(60);
  });
});

describe('the route\'s trainers', () => {
  const ROUTE = ['stormriseClimber', 'stormriseHerder', 'stormriseMountaineer', 'stormriseStormchaser', 'stormriseSkyherd'];

  it('are five, spread over all three maps, each on a map', () => {
    const placed = CLIMB.flatMap((map) => map.npcs.filter((n) => n.trainer).map((n) => [map.id, n.trainer]));
    for (const id of ROUTE) expect(placed.map(([, t]) => t), id).toContain(id);
    for (const map of CLIMB) expect(map.npcs.filter((n) => ROUTE.includes(n.trainer)).length, map.id).toBeGreaterThan(0);
  });

  it('sit between the Tidal Hall and the Storm Hall in level', () => {
    const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
    for (const id of ROUTE) {
      expect(top(id)).toBeGreaterThanOrEqual(21);
      expect(top(id)).toBeLessThan(Math.max(...TRAINERS.stormLeaderHalcyon.party.map((e) => e.level)));
    }
  });

  it('each watch a stretch of the road', () => {
    for (const map of CLIMB) {
      for (const person of map.npcs.filter((n) => ROUTE.includes(n.trainer))) {
        const lane = getSightTiles({ origin: person, facing: person.facing, range: person.sightRange });
        expect(lane.some(({ x, y }) => map.tiles[y][x] === '-'), person.id).toBe(true);
      }
    }
  });
});

describe('the Hollow Vane\'s relay (the Phase 13 story event)', () => {
  const overseer = npc(HIGH, 'vaneOverseer');
  const console_ = HIGH.interactables.find((e) => e.x === 23 && e.y === 13);
  const board = HIGH.interactables.find((e) => e.x === 21 && e.y === 13);

  it('is two Vane on the ordinary trainer pipeline: a Surveyor and the Relay Overseer', () => {
    const vane = HIGH.npcs.filter((n) => n.trainer && TRAINERS[n.trainer].faction === 'hollowVane');
    expect(vane.map((n) => n.trainer).sort()).toEqual(['vaneMarl', 'vaneOverseer']);
    expect(TRAINERS.vaneOverseer.rank).toBe('overseer');
    expect(TRAINERS.vaneOverseer.title).toBe(FACTIONS.hollowVane.ranks.overseer.title);
    for (const n of vane) expect(FACTIONS.hollowVane.sprites).toContain(n.sprite);
    const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
    expect(top('vaneOverseer')).toBeGreaterThan(top('vaneMarl'));
    expect(top('vaneOverseer')).toBeGreaterThan(top('vaneForeman'));
  });

  it('puts the console where only the Overseer\'s tile reaches it', () => {
    const stands = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => [console_.x + dx, console_.y + dy])
      .filter(([x, y]) => !TILE_DEFINITIONS[HIGH.tiles[y][x]].solid);
    expect(stands).toEqual([[overseer.x, overseer.y]]);
  });

  it('cannot be grounded until the Overseer is beaten — then once, for good', () => {
    const state = climbingState();
    expect(say(console_, state).setFlags).toEqual([]);
    recordTrainerVictory('vaneOverseer', state);
    expect(say(console_, state).setFlags).toEqual(['stormriseRelayStopped']);
    state.flags.stormriseRelayStopped = true;
    expect(say(console_, state).setFlags).toEqual([]);
    expect(isNpcPresent(overseer, getWorldConditions(state))).toBe(false);
  });

  it('is the only thing that sets stormriseRelayStopped', () => {
    const setters = Object.values(MAPS).flatMap((map) => [...(map.npcs || []), ...(map.interactables || [])]
      .filter((e) => (Array.isArray(e.dialogue) ? e.dialogue : []).some((b) => b && (b.setFlags || []).includes('stormriseRelayStopped')))
      .map(() => map.id));
    expect(setters).toEqual(['stormriseHigh']);
    expect(Object.values(TRAINERS).some((t) => (t.setFlags || []).includes('stormriseRelayStopped'))).toBe(false);
  });

  it('visibly changes the shelf: the fence drops, the wire goes dark, the wind comes back', () => {
    const state = climbingState();
    const fence = HIGH.barriers.find((b) => b.id === 'relayFence');
    expect(createBarrierState(HIGH, { state, conditions: getWorldConditions(state) }).relayFence).toBe(true);
    state.flags.stormriseRelayStopped = true;
    expect(createBarrierState(HIGH, { state, conditions: getWorldConditions(state) }).relayFence).toBe(false);
    const [wire] = HIGH.glows;
    expect(wire.when).toBe('stormriseRelayStopped');
    const lit = HIGH.tiles.flatMap((row, y) => [...row].map((c, x) => (c === '<' ? key(x, y) : null))).filter(Boolean);
    expect(wire.tiles.map(([x, y]) => key(x, y)).sort()).toEqual(lit.sort());
    expect(fence.tiles).toEqual([[14, 11], [15, 11]]);
  });

  it('blocks the road north until then: the summit is out of reach', () => {
    const state = climbingState();
    const up = HIGH.exits.filter((e) => e.to === 'stormriseSummit');
    const before = reachable(HIGH, state, HIGH.spawnPoints.fromLower);
    for (const exit of up) expect(before.has(key(exit.x, exit.y))).toBe(false);
    recordTrainerVictory('vaneOverseer', state);
    recordTrainerVictory('vaneMarl', state);
    state.flags.stormriseRelayStopped = true;
    const after = reachable(HIGH, state, HIGH.spawnPoints.fromLower);
    for (const exit of up) expect(after.has(key(exit.x, exit.y))).toBe(true);
  });

  it('tells why Stormrise mattered — the third current, the Convergence — and not what the Vane want it for', () => {
    const text = [...board.dialogue, ...TRAINERS.vaneOverseer.intro, ...TRAINERS.vaneOverseer.outro].join(' ');
    expect(text).toMatch(/SURVEY 16/);
    expect(text).toMatch(/CONVERGENCE/i);
    expect(text).not.toMatch(/Champion|weapon|control the/i);
  });

  it('changes what people say afterwards — and moves Hale up the mountain', () => {
    const before = climbingState();
    const after = climbingState();
    after.flags.stormriseRelayStopped = true;
    for (const [map, id] of [[LOWER, 'stormriseClimber'], [HIGH, 'stormriseMountaineer']]) {
      recordTrainerVictory(id, before);
      recordTrainerVictory(id, after);
      expect(say(npc(map, id), after).pages.join(' '), id).not.toBe(say(npc(map, id), before).pages.join(' '));
    }
    expect(isNpcPresent(npc(HIGH, 'haleShelf'), getWorldConditions(before))).toBe(false);
    expect(isNpcPresent(npc(HIGH, 'haleShelf'), getWorldConditions(after))).toBe(true);
    expect(isNpcPresent(npc(HIGH, 'vaneMarl'), getWorldConditions(after))).toBe(false);
    expect(npc(HIGH, 'vaneMarl').leaveBy).toBeDefined();
  });
});

describe('Kestrel, fourth meeting: the top of the Climb', () => {
  const kestrel = npc(SUMMIT, 'kestrelSummit');
  const trainer = TRAINERS.kestrelStormrise;

  it('is meeting 4 on the ordinary trainer pipeline, after meeting 3', () => {
    expect(trainer.rival).toBe('kestrel');
    expect(trainer.stage).toBe(4);
    expect(trainer.requires).toBe('trainer:kestrelTidewatch');
    expect(kestrel.presentWhen).toBe(trainer.requires);
    expect(kestrel.trainer).toBe('kestrelStormrise');
    expect(kestrel.returnAfterDefeat).toBe(true);
  });

  it('grows the team to four, with the starter strongest', () => {
    expect(trainer.party.length).toBe(4);
    const starter = trainer.party.find((e) => e.rivalStarter);
    expect(starter.level).toBe(Math.max(...trainer.party.map((e) => e.level)));
    expect(starter.level).toBeGreaterThan(TRAINERS.kestrelTidewatch.party.find((e) => e.rivalStarter).level);
  });

  it('takes the starter strong against the player\'s, for every starter', () => {
    for (const [player, rival] of [['pyrret', 'puddlurk'], ['drizzle', 'bramblit'], ['sproutle', 'cindraw']]) {
      const state = climbingState(player);
      const starter = trainer.party.find((e) => e.rivalStarter);
      expect(resolvePartyEntry(starter, trainer, state).species, player).toBe(rival);
      const intro = say(kestrel, state);
      expect(intro.action).toBe('trainer:kestrelStormrise');
      expect(intro.pages.join(' ')).toMatch(new RegExp(CREATURES[rival].name));
    }
  });

  it('stands beside the only road into Voltspire', () => {
    const lane = getSightTiles({ origin: kestrel, facing: kestrel.facing, range: kestrel.sightRange }).map((t) => key(t.x, t.y));
    expect(lane).toEqual(['15,6', '14,6']);
    // The pass north is one road wide: anyone going to Voltspire crosses row 6 there.
    expect(SUMMIT.tiles[5].replace(/%/g, '')).toBe('--');
  });

  it('shows Kestrel changing: the Vane matter to them now', () => {
    const outro = trainer.outro.join(' ');
    expect(outro).toMatch(/Sigils were the whole point/);
    const state = climbingState();
    recordTrainerVictory('kestrelStormrise', state);
    expect(say(kestrel, state).action).toBeNull();
    awardBadge('stormSigil', state);
    expect(say(kestrel, state).pages.join(' ')).toMatch(/Aerie/);
  });
});
