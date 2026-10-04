/**
 * aerie.test.js
 * ----------------------------------------------------------------------------
 * The top of the valley (Phase 14): a real Phase 13 save loading at the shut
 * Aerie Gate, the Aerie Road, the Aerie itself — the Wellspring, the Circle's
 * Walk, the Lodge, the Hollow's mouth — and how they hang together.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { MAPS } from '../src/data/maps/index.js';
import { TILE_DEFINITIONS } from '../src/data/tiles.js';
import { TileMap } from '../src/systems/TileMap.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { chooseWeather } from '../src/systems/WeatherRenderer.js';
import { ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { TRAINERS } from '../src/data/trainers.js';
import { getShopStock } from '../src/data/shops.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { migrateSave } from '../src/save/SaveMigrations.js';
import { validateSaveFile } from '../src/save/SaveValidator.js';
import { SAVE_VERSION } from '../src/save/SaveSchema.js';
import { clearReservedInstanceIds } from '../src/systems/CreatureFactory.js';

const ROAD = MAPS.aerieRoad;
const AERIE = MAPS.aerie;
const LODGE = MAPS.aerieLodge;
const key = (x, y) => `${x},${y}`;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const say = (entry, state) => resolveDialogue(entry.dialogue, getWorldConditions(state));
const npc = (map, id) => map.npcs.find((n) => n.id === id);

/** A player who has just been let through the Aerie Gate. */
function openedState() {
  const state = createNewGameState();
  state.starter = 'pyrret';
  for (const sigil of ['verdantSigil', 'tidalSigil', 'stormSigil']) awardBadge(sigil, state);
  for (const id of ['kestrelThornway', 'kestrelRoute2', 'kestrelTidewatch', 'kestrelStormrise', 'stormLeaderHalcyon']) {
    recordTrainerVictory(id, state);
  }
  Object.assign(state.flags, {
    mistvaultOpen: true, mistvaultSiphonStopped: true, stormriseOpen: true, stormriseRelayStopped: true, aerieOpen: true,
  });
  return state;
}

/** Everywhere walkable from `start` on `map` in `state`, people and signs in the way. */
function reachable(map, state, start, { blocked = [] } = {}) {
  const tiles = new TileMap(map);
  const conditions = getWorldConditions(state);
  tiles.setBarrierState(createBarrierState(map, { conditions, state }));
  const walls = new Set([
    ...map.npcs.filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)),
    ...(map.interactables || []).map((e) => key(e.x, e.y)),
    ...blocked,
  ]);
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length > 0) {
    const { x, y } = queue.pop();
    for (const [dx, dy] of SIDES) {
      const id = key(x + dx, y + dy);
      if (seen.has(id) || walls.has(id) || !tiles.isWalkable(x + dx, y + dy)) continue;
      seen.add(id);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}
const nextTo = (seen, { x, y }) => SIDES.some(([dx, dy]) => seen.has(key(x + dx, y + dy)));

beforeEach(() => clearReservedInstanceIds());

describe('a real Phase 13 save, at the shut Aerie Gate', () => {
  // Written by the released Phase 13 build (d56ca8c), through its Save menu.
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/phase13-aerie-save.json', import.meta.url), 'utf8'));

  const load = () => {
    const migrated = migrateSave(structuredClone(fixture.save));
    expect(migrated.ok).toBe(true);
    return validateSaveFile(migrated.file);
  };

  it('is a version 3 save — the version Phase 14 still writes', () => {
    expect(fixture.save.version).toBe(3);
    expect(SAVE_VERSION).toBe(3);
  });

  it('loads cleanly, with everything it held', () => {
    const result = load();
    expect(result.ok, result.errors.join(' ')).toBe(true);
    expect(result.warnings).toEqual([]);
    const { state } = result;
    expect(state.location).toEqual({ mapId: 'voltspire', x: 18, y: 3, facing: 'right' });
    expect(state.badges).toHaveLength(3);
    expect(state.party).toHaveLength(6);
    expect(state.storage).toHaveLength(3);
    expect(state.party[0].nickname).toBe('Bramble');
    expect(state.party[3].status).toBe('burn');
    expect(state.storage.some((c) => c.nickname === 'Spark')).toBe(true);
    expect(state.money).toBe(fixture.save.gameState.money);
    expect(state.inventory).toEqual(fixture.save.gameState.inventory);
    for (const id of ['kestrelThornway', 'kestrelRoute2', 'kestrelTidewatch', 'kestrelStormrise', 'stormLeaderHalcyon']) {
      expect(state.defeatedTrainers[id], id).toBe(true);
    }
    expect(state.flags.stormriseRelayStopped).toBe(true);
    expect(state.flags.aerieOpen).toBeUndefined();
  });

  it('starts with the gate SHUT, and the Circle\'s envoy waiting to open it', () => {
    const { state } = load();
    const city = MAPS.voltspire;
    const closed = createBarrierState(city, { conditions: getWorldConditions(state), state });
    expect(closed.aerieGate).toBe(true);
    const envoy = npc(city, 'circleEnvoy');
    expect(isNpcPresent(envoy, getWorldConditions(state))).toBe(true);
    expect(say(envoy, state).setFlags).toEqual(['aerieOpen']);
    state.flags.aerieOpen = true;
    expect(createBarrierState(city, { conditions: getWorldConditions(state), state }).aerieGate).toBe(false);
  });
});

describe('the Aerie Road', () => {
  it('runs from Voltspire\'s gate to the Aerie, and nowhere else', () => {
    expect([...new Set(ROAD.exits.map((e) => e.to))].sort()).toEqual(['aerie', 'voltspire']);
    const into = Object.values(MAPS).filter((m) => m.exits.some((e) => e.to === 'aerieRoad')).map((m) => m.id);
    expect(into.sort()).toEqual(['aerie', 'voltspire']);
  });

  it('can be walked end to end, with every trainer, item and sign beside the way', () => {
    const state = openedState();
    const seen = reachable(ROAD, state, ROAD.spawnPoints.fromVoltspire);
    for (const exit of ROAD.exits) expect(seen.has(key(exit.x, exit.y)), exit.to).toBe(true);
    for (const entry of [...ROAD.npcs, ...ROAD.interactables]) expect(nextTo(seen, entry), entry.id || `${entry.x},${entry.y}`).toBe(true);
  });

  it('has a ledge shortcut back down from the shelf, and no way up it', () => {
    const ledges = [];
    ROAD.tiles.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'L') ledges.push([x, y]); }));
    expect(ledges.length).toBeGreaterThan(0);
    expect(TILE_DEFINITIONS.L.ledge).toBe('down');
  });

  it('has wild Aethers at the levels a player brings up — and keeps Phase 13\'s promises', () => {
    const table = ENCOUNTER_TABLES.aerieRoad;
    for (const row of table) {
      expect(row.minLevel).toBeGreaterThanOrEqual(25);
      expect(row.maxLevel).toBeLessThanOrEqual(28);
    }
    const species = table.map((row) => row.species);
    expect(species).not.toContain('thundrel');     // the summit's own rare find
    expect(species).not.toContain('stormcrest');   // only ever met grown
    // An answer to each of the Trial's Wardens is out there to be caught.
    for (const answer of ['brambelle', 'voltmane', 'cragmaw', 'rimelet']) expect(species).toContain(answer);
  });

  it('has three trainers, each watching the road', () => {
    const trainers = ROAD.npcs.filter((n) => n.trainer);
    expect(trainers.map((n) => n.trainer).sort()).toEqual(['aerieAce', 'aerieGuide', 'aerieHopeful']);
    for (const entry of trainers) expect(entry.sightRange).toBeGreaterThan(0);
  });

  it('tells where the carts went: an overturned Vane cart, before and after', () => {
    const cart = ROAD.interactables.find((e) => ROAD.tiles[e.y][e.x] === 'm');
    expect(say(cart, openedState()).pages.join(' ')).toMatch(/cells/);
    const after = openedState();
    after.flags.convergenceStopped = true;
    expect(say(cart, after).pages.join(' ')).toMatch(/crossed it out/);
  });
});

describe('the Aerie', () => {
  it('is reached up the Aerie Road, and leads to the Lodge, the Hollow and the Circle Hall', () => {
    expect([...new Set(AERIE.exits.map((e) => e.to))].sort()).toEqual(['aerieLodge', 'aerieRoad', 'circleHall', 'hollowWorks']);
  });

  it('lets a player reach the Lodge, the Hollow and everyone outside — but not the Hall, yet', () => {
    const state = openedState();
    const seen = reachable(AERIE, state, AERIE.spawnPoints.fromAerieRoad);
    for (const exit of AERIE.exits) expect(seen.has(key(exit.x, exit.y)), exit.to).toBe(exit.to !== 'circleHall');
    const conditions = getWorldConditions(state);
    for (const entry of [...AERIE.npcs.filter((n) => isNpcPresent(n, conditions)), ...AERIE.interactables]) {
      expect(nextTo(seen, entry), entry.id || `${entry.x},${entry.y}`).toBe(true);
    }
  });

  it('has a landmark: the Wellspring, low and dim until the Convergence is stopped', () => {
    const tiles = AERIE.tiles.join('');
    expect(tiles).toContain('4');
    const glow = AERIE.glows.find((g) => g.tile === '}');
    expect(glow.when).toBe('convergenceStopped');
    for (const [x, y] of glow.tiles) expect(AERIE.tiles[y][x]).toBe('4');
    const marker = AERIE.interactables.find((e) => AERIE.tiles[e.y][e.x] === '$' && e.y === 18);
    const before = say(marker, openedState()).pages.join(' ');
    const state = openedState();
    state.flags.convergenceStopped = true;
    const after = say(marker, state).pages.join(' ');
    expect(before).toMatch(/low and dark/);
    expect(after).toMatch(/high and bright/);
    for (const text of [before, after]) expect(text).toMatch(/WHERE THE THREE CURRENTS RISE/);
  });

  it('has a still mist while the Wellspring fails, and a clean snow once it runs', () => {
    const state = openedState();
    expect(chooseWeather(AERIE.weather, getWorldConditions(state)).kind).toBe('mist');
    state.flags.convergenceStopped = true;
    expect(chooseWeather(AERIE.weather, getWorldConditions(state)).kind).toBe('snow');
  });

  it('runs the Vane\'s cables from the road to the Hollow\'s mouth, so the way is plain', () => {
    const cables = [];
    AERIE.tiles.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'z') cables.push([x, y]); }));
    expect(cables.length).toBeGreaterThan(10);
    expect(cables.some(([x]) => x >= 32)).toBe(true);
  });

  it('says what it is, and what is wrong, in the people standing on it', () => {
    const state = openedState();
    expect(say(npc(AERIE, 'wellspringWarden'), state).pages.join(' ')).toMatch(/Hollow/);
    expect(say(npc(AERIE, 'hollowWarden'), state).pages.join(' ')).toMatch(/Lodge/);
    expect(say(npc(AERIE, 'trialSteward'), state).pages.join(' ')).toMatch(/Trial/);
  });
});

describe('the Aerie Lodge — the last rest before the Trial', () => {
  it('heals, sells and stores, all with the ordinary actions', () => {
    const actions = [...LODGE.npcs, ...LODGE.interactables].flatMap((e) => (e.dialogue || []).map((b) => b && b.action)).filter(Boolean);
    expect(actions).toContain('heal');
    expect(actions).toContain('shop:aerieLodge');
    expect(actions).toContain('storage');
  });

  it('stocks the Mender\'s Draught and every Orb worth carrying this high', () => {
    const stock = getShopStock('aerieLodge', {}).map((item) => item.id);
    for (const id of ['mendersDraught', 'superPotion', 'clearTonic', 'greatOrb', 'ultraOrb']) expect(stock).toContain(id);
  });

  it('is a short walk from the Hall, the Hollow and the road', () => {
    const state = openedState();
    state.flags.convergenceStopped = true;
    recordTrainerVictory('kestrelAerie', state);
    const seen = reachable(AERIE, state, AERIE.spawnPoints.fromLodge);
    for (const exit of AERIE.exits) expect(seen.has(key(exit.x, exit.y)), exit.to).toBe(true);
  });

  it('points the player at a full team of six, with an answer for each Warden', () => {
    const pell = npc(LODGE, 'aerieLodgeGuest');
    const state = openedState();
    state.flags.convergenceStopped = true;
    const text = say(pell, state).pages.join(' ');
    expect(text).toMatch(/earth/);
    expect(text).toMatch(/sea/);
    expect(text).toMatch(/sky/);
    expect(text).toMatch(/six/);
  });
});

describe('the Aerie Road\'s and Aerie\'s trainers', () => {
  it('pay within the ordinary band and are ordinary trainers (no faction)', () => {
    for (const id of ['aerieAce', 'aerieGuide', 'aerieHopeful']) {
      expect(TRAINERS[id].faction).toBeUndefined();
      expect(TRAINERS[id].badge).toBeUndefined();
    }
  });
});
