/**
 * route2.test.js
 * ----------------------------------------------------------------------------
 * Route 2, the Thornway: the map, its two habitats, its people, its end — and
 * whether a real player can walk it.
 *
 * The map checks are geometry: every tile a player could want is reachable,
 * the road really forks, every trainer really watches the road, the gully
 * really runs through Kestrel's sight, and the cordon really holds.
 *
 * The walk is the real battle engine: a post-Fern team fights Kestrel, some
 * wild Aethers from the route's own tables and every trainer on the way up,
 * with experience awarded by the engine (tests/helpers/routeWalk.js). That is
 * where the "levels a player really has" behind the route's numbers come
 * from.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { EncounterSystem } from '../src/systems/EncounterSystem.js';
import { ENCOUNTER_TABLES, getEncounterConfig } from '../src/data/encounters.js';
import { CREATURES, STARTER_IDS, getPreEvolution } from '../src/data/creatures.js';
import { TRAINERS } from '../src/data/trainers.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { createSeededRandom } from '../src/utils/rng.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { walkRoute2 } from './helpers/routeWalk.js';

const ROUTE = MAPS.route2;
const at = (x, y) => ({ x, y });
const key = (x, y) => `${x},${y}`;

/** Route 2 as a player standing on it after beating Kestrel at the gate sees it. */
function builtRoute(state = arrivedState()) {
  const map = new TileMap(ROUTE);
  map.setBarrierState(createBarrierState(ROUTE, { conditions: getWorldConditions(state), state }));
  return map;
}

function arrivedState() {
  const state = createNewGameState();
  state.starter = 'pyrret';
  awardBadge('verdantSigil', state);
  recordTrainerVictory('kestrelThornway', state);
  return state;
}

/** Everything a player can stand on, walking from the entrance. */
function reachable(map, { without = [] } = {}) {
  const blocked = new Set([
    ...(ROUTE.npcs || []).map((npc) => key(npc.x, npc.y)),
    ...(ROUTE.interactables || []).map((entry) => key(entry.x, entry.y)),
    ...without.map(([x, y]) => key(x, y)),
  ]);
  const start = ROUTE.spawnPoints.fromThistlewood;
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: x + dx, y: y + dy };
      const id = key(next.x, next.y);
      if (seen.has(id) || blocked.has(id) || !map.isWalkable(next.x, next.y)) continue;
      seen.add(id);
      queue.push(next);
    }
  }
  return seen;
}

const nextTo = (seen, { x, y }) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(key(x + dx, y + dy)));

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------

describe('the Thornway\'s shape', () => {
  it('is bigger than Route 1, but not enormous', () => {
    const area = (map) => map.tiles.length * map.tiles[0].length;
    expect(area(ROUTE)).toBeGreaterThan(area(MAPS.route1));
    expect(area(ROUTE)).toBeLessThan(area(MAPS.route1) * 3);
  });

  it('connects to Thistlewood and to Mistvault Cavern, both ways', () => {
    for (const exit of ROUTE.exits) {
      expect(['thistlewood', 'mistvaultMouth']).toContain(exit.to);
      expect(MAPS[exit.to].spawnPoints[exit.spawn]).toBeDefined();
    }
    for (const other of ['thistlewood', 'mistvaultMouth']) {
      const back = MAPS[other].exits.filter((exit) => exit.to === 'route2');
      expect(back.length).toBeGreaterThan(0);
      for (const exit of back) expect(ROUTE.spawnPoints[exit.spawn]).toBeDefined();
    }
  });

  it('can only be reached through the Thornway gate', () => {
    // Thistlewood's exits to Route 2 lie beyond the gate, so with it shut
    // they cannot be walked to.
    const state = createNewGameState();
    awardBadge('verdantSigil', state);
    const town = new TileMap(MAPS.thistlewood);
    town.setBarrierState(createBarrierState(MAPS.thistlewood, { conditions: getWorldConditions(state), state }));
    for (const [x, y] of MAPS.thistlewood.barriers.find((b) => b.id === 'thornwayGate').tiles) {
      expect(town.isWalkable(x, y)).toBe(false);
    }
    const gateRow = MAPS.thistlewood.barriers.find((b) => b.id === 'thornwayGate').tiles[0][1];
    for (const exit of MAPS.thistlewood.exits.filter((e) => e.to === 'route2')) {
      expect(exit.y).toBeLessThan(gateRow);
    }
  });

  it('lets a player reach every tile they can stand on — the cave mouth once the cordon is down', () => {
    const stranded = (state) => {
      const map = builtRoute(state);
      const seen = reachable(map);
      const out = [];
      for (let y = 0; y < map.height; y += 1) {
        for (let x = 0; x < map.width; x += 1) {
          const occupied = [...ROUTE.npcs, ...ROUTE.interactables].some((e) => e.x === x && e.y === y);
          if (map.isWalkable(x, y) && !occupied && !seen.has(key(x, y))) out.push(key(x, y));
        }
      }
      return out.sort();
    };
    // Cordon up: the only tiles out of reach are the cave mouth behind it.
    expect(stranded(arrivedState())).toEqual(['14,0', '14,1', '15,0', '15,1']);
    const open = arrivedState();
    open.flags.mistvaultOpen = true;
    expect(stranded(open)).toEqual([]);
  });

  it('lets a player walk up to every person, sign and item', () => {
    const seen = reachable(builtRoute());
    for (const entry of [...ROUTE.npcs, ...ROUTE.interactables]) {
      expect(nextTo(seen, entry), `${entry.id || entry.item || entry.dialogue?.[0]} is out of reach`)
        .toBe(true);
    }
  });

  it('forks round the bramble island: two separate ways to the Brow', () => {
    const map = builtRoute();
    const brow = key(14, 20);
    const side = (x0, x1) => {
      const tiles = [];
      for (let y = 25; y <= 31; y += 1) for (let x = x0; x <= x1; x += 1) tiles.push([x, y]);
      return tiles;
    };
    const west = side(3, 8);
    const east = side(21, 26);

    // Either side on its own is a way through...
    expect(reachable(map, { without: west }).has(brow)).toBe(true);
    expect(reachable(map, { without: east }).has(brow)).toBe(true);
    // ...and they are the ONLY two: the island between them is a wall.
    expect(reachable(map, { without: [...west, ...east] }).has(brow)).toBe(false);
  });

  it('has a loop through the dry spring, not just a dead end', () => {
    const map = builtRoute();
    const spring = key(22, 37);
    // Two trails come up to the spring; either one is enough on its own...
    expect(reachable(map, { without: [[22, 38]] }).has(spring)).toBe(true);
    expect(reachable(map, { without: [[25, 38]] }).has(spring)).toBe(true);
    // ...and they are the only ways in, so walking up one and down the
    // other is a loop.
    expect(reachable(map, { without: [[22, 38], [25, 38]] }).has(spring)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Two habitats
// ---------------------------------------------------------------------------

describe('the Thornway\'s two habitats', () => {
  const map = builtRoute();
  const tilesOf = (id) => {
    const found = [];
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) if (map.getTile(x, y).id === id) found.push(at(x, y));
    }
    return found;
  };

  it('has plenty of both', () => {
    expect(tilesOf('tall_grass').length).toBeGreaterThan(100);
    expect(tilesOf('scree').length).toBeGreaterThan(60);
  });

  it('rolls the thicket table in the tall grass', () => {
    for (const { x, y } of tilesOf('tall_grass')) {
      expect(map.getEncounterTableAt(x, y)).toBe('route2Thicket');
    }
  });

  it('rolls the scree table on the scree', () => {
    for (const { x, y } of tilesOf('scree')) {
      expect(map.getEncounterTableAt(x, y)).toBe('route2Scree');
    }
  });

  it('is safe on the road and the gravel', () => {
    for (const id of ['path', 'path_alt', 'grass']) {
      for (const { x, y } of tilesOf(id)) expect(map.getEncounterTableAt(x, y)).toBeNull();
    }
  });

  it('really turns up scree Aethers on the scree and thicket Aethers in the grass', () => {
    const encounters = new EncounterSystem(getEncounterConfig(ROUTE), createSeededRandom(5));
    const scree = new Set(ENCOUNTER_TABLES.route2Scree.map((e) => e.species));
    const thicket = new Set(ENCOUNTER_TABLES.route2Thicket.map((e) => e.species));
    for (let i = 0; i < 200; i += 1) {
      expect(scree.has(encounters.roll('route2Scree').species)).toBe(true);
      expect(thicket.has(encounters.roll('route2Thicket').species)).toBe(true);
    }
    expect(encounters.roll().species).toSatisfy((id) => thicket.has(id));
  });
});

// ---------------------------------------------------------------------------
// Wild Aethers
// ---------------------------------------------------------------------------

describe('Route 2\'s wild Aethers', () => {
  const tables = { route2Thicket: ENCOUNTER_TABLES.route2Thicket, route2Scree: ENCOUNTER_TABLES.route2Scree };
  const NEW = ['jabbit', 'brawnhare', 'glimmote', 'brambelle', 'delvit', 'ironvole', 'burrzap'];

  for (const [id, table] of Object.entries(tables)) {
    describe(id, () => {
      const total = table.reduce((sum, row) => sum + row.weight, 0);

      it('sits in the Route 2 band the real walk arrives at', () => {
        for (const row of table) {
          expect(row.minLevel).toBeGreaterThanOrEqual(13);
          expect(row.maxLevel).toBeLessThanOrEqual(18);
        }
      });

      it('has commons, and something genuinely rare', () => {
        const shares = table.map((row) => row.weight / total);
        expect(shares.filter((share) => share >= 0.15).length).toBeGreaterThanOrEqual(2);
        expect(Math.min(...shares)).toBeLessThanOrEqual(0.05);
      });

      it('mixes new faces with familiar ones', () => {
        expect(table.some((row) => NEW.includes(row.species))).toBe(true);
        expect(table.some((row) => !NEW.includes(row.species))).toBe(true);
      });
    });
  }

  it('makes every new species obtainable, in the wild or by evolving one', () => {
    const wild = new Set(Object.values(tables).flat().map((row) => row.species));
    for (const id of NEW) {
      const base = getPreEvolution(id) ? getPreEvolution(id) : id;
      expect(wild.has(id) || wild.has(base), `${id} cannot be found anywhere`).toBe(true);
    }
  });

  it('brings the roster past thirty species', () => {
    expect(Object.keys(CREATURES).length).toBeGreaterThan(30);
  });
});

// ---------------------------------------------------------------------------
// People on the road
// ---------------------------------------------------------------------------

describe('trainers on the Thornway', () => {
  const map = builtRoute();
  const isBlocked = (x, y) => !map.isWalkable(x, y);
  const trainers = ROUTE.npcs.filter((npc) => npc.trainer);
  const roadIds = new Set(['path', 'path_alt']);

  it('are four people and Kestrel', () => {
    const ordinary = trainers.filter((npc) => !TRAINERS[npc.trainer].rival);
    expect(ordinary.length).toBeGreaterThanOrEqual(3);
    expect(ordinary.length).toBeLessThanOrEqual(5);
    expect(trainers.some((npc) => npc.trainer === 'kestrelRoute2')).toBe(true);
  });

  it('each watch the road', () => {
    for (const npc of trainers) {
      const lane = getSightTiles({ origin: at(npc.x, npc.y), facing: npc.facing, range: npc.sightRange, isBlocked });
      expect(lane.some((t) => roadIds.has(map.getTile(t.x, t.y).id)), `${npc.id} cannot see the road`).toBe(true);
    }
  });

  it('put Kestrel\'s gaze down the whole gully, so nobody slips past', () => {
    const kestrel = trainers.find((npc) => npc.trainer === 'kestrelRoute2');
    const lane = getSightTiles({
      origin: at(kestrel.x, kestrel.y), facing: kestrel.facing, range: kestrel.sightRange, isBlocked,
    }).map((t) => key(t.x, t.y));
    // Every one-tile-wide gully row must be in the lane.
    for (let y = 0; y < map.height; y += 1) {
      const open = [];
      for (let x = 0; x < map.width; x += 1) if (map.isWalkable(x, y)) open.push(x);
      if (y > kestrel.y && open.length === 1) expect(lane).toContain(key(open[0], y));
    }
  });

  it('send Kestrel back up the gully after a fight, so it is never left blocked', () => {
    const kestrel = trainers.find((npc) => npc.trainer === 'kestrelRoute2');
    expect(kestrel.returnAfterDefeat).toBe(true);
  });

  it('pitch every ordinary trainer between Route 1 and Kestrel', () => {
    const route1Top = Math.max(...Object.values(TRAINERS).filter((t) => t.id.startsWith('route1'))
      .flatMap((t) => t.party.map((e) => e.level)));
    for (const npc of trainers.filter((n) => !TRAINERS[n.trainer].rival)) {
      for (const entry of TRAINERS[npc.trainer].party) {
        expect(entry.level).toBeGreaterThan(route1Top);
        expect(entry.level).toBeLessThanOrEqual(16);
      }
    }
  });
});

describe('the cordon and the way into Mistvault (Phase 12)', () => {
  const cordon = ROUTE.barriers.find((b) => b.id === 'mistvaultCordon');
  const warden = ROUTE.npcs.find((npc) => npc.id === 'cordonWarden');
  const mouthExits = ROUTE.exits.filter((exit) => exit.to === 'mistvaultMouth');

  it('stays up through all of Phase 11, whoever has been beaten', () => {
    const state = arrivedState();
    for (const id of ['kestrelRoute2', 'route2Cutter', 'route2Forager', 'route2Lookout', 'route2ScreeWalker']) {
      recordTrainerVictory(id, state);
    }
    const map = builtRoute(state);
    for (const [x, y] of cordon.tiles) expect(map.isWalkable(x, y)).toBe(false);
    // No trainer opens it: only the Warden does.
    const setters = Object.values(TRAINERS).flatMap((t) => t.setFlags || []);
    expect(setters).not.toContain(cordon.openWhen);
  });

  it('comes down when Warden Corran has word — and only once Kestrel is beaten up here', () => {
    const state = arrivedState();
    const before = resolveDialogue(warden.dialogue, getWorldConditions(state));
    expect(before.setFlags).toEqual([]);
    expect(before.pages.join(' ')).toMatch(/closed/i);

    recordTrainerVictory('kestrelRoute2', state);
    const after = resolveDialogue(warden.dialogue, getWorldConditions(state));
    expect(after.setFlags).toEqual(['mistvaultOpen']);
    expect(after.pages.join(' ')).toMatch(/cordon comes down/);

    // Saying it twice changes nothing: the next conversation sets no flag.
    state.flags.mistvaultOpen = true;
    const again = resolveDialogue(warden.dialogue, getWorldConditions(state));
    expect(again.setFlags).toEqual([]);

    const map = builtRoute(state);
    for (const [x, y] of cordon.tiles) expect(map.isWalkable(x, y)).toBe(true);
  });

  it('is the only way in: the cave mouth behind it holds the map\'s exits to the cavern', () => {
    expect(mouthExits.length).toBe(2);
    for (const exit of mouthExits) {
      expect(exit.y).toBeLessThan(cordon.tiles[0][1]);
      expect(MAPS.mistvaultMouth.spawnPoints[exit.spawn]).toBeDefined();
    }
    // Cordon up: no exit to the cavern can be walked to.
    const seen = reachable(builtRoute());
    for (const exit of mouthExits) expect(seen.has(key(exit.x, exit.y))).toBe(false);
    // And arriving BACK from the cavern puts you behind the cordon, in the mouth.
    const spawn = ROUTE.spawnPoints.fromMistvault;
    expect(spawn.y).toBeLessThan(cordon.tiles[0][1]);
  });

  it('sends Kestrel in first, for good, the moment it comes down', () => {
    const kestrel = ROUTE.npcs.find((npc) => npc.id === 'kestrelCordon');
    expect(kestrel.absentWhen).toBe('mistvaultOpen');
    expect(kestrel.leaveBy).toEqual({ direction: 'up', steps: 3 });
    // Their way out is up through the opened cordon into the mouth.
    const state = arrivedState();
    state.flags.mistvaultOpen = true;
    const map = builtRoute(state);
    for (let step = 1; step <= kestrel.leaveBy.steps; step += 1) {
      expect(map.isWalkable(kestrel.x, kestrel.y - step)).toBe(true);
    }
  });

  it('says so, in person and on a sign — closed, then open', () => {
    expect(warden).toBeDefined();
    const sign = ROUTE.interactables.find((e) => e.type === 'sign' && e.x === 10 && e.y === 3);
    const closed = resolveDialogue(sign.dialogue, getWorldConditions(arrivedState()));
    expect(closed.pages.join(' ')).toMatch(/CLOSED/);
    const state = arrivedState();
    state.flags.mistvaultOpen = true;
    expect(resolveDialogue(sign.dialogue, getWorldConditions(state)).pages.join(' ')).toMatch(/OPEN/);
  });

  it('fills the dry spring again once the siphon is stopped — with nobody left in it', () => {
    const spring = ROUTE.barriers.find((b) => b.id === 'springWater');
    const dry = builtRoute();
    for (const [x, y] of spring.tiles) expect(dry.isWalkable(x, y)).toBe(true);
    const state = arrivedState();
    state.flags.mistvaultOpen = true;
    state.flags.mistvaultSiphonStopped = true;
    const full = builtRoute(state);
    for (const [x, y] of spring.tiles) expect(full.isWalkable(x, y)).toBe(false);
    // Filling the basin cuts nothing off.
    const seen = reachable(full);
    for (const entry of [...ROUTE.npcs, ...ROUTE.interactables]) {
      expect(nextTo(seen, entry), `${entry.id || entry.item} is cut off`).toBe(true);
    }
  });

  it('keeps every ground item flag unique across the whole game', () => {
    const flags = Object.values(MAPS).flatMap((map) =>
      (map.interactables || []).filter((e) => e.type === 'item').map((e) => e.flag));
    expect(new Set(flags).size).toBe(flags.length);
  });
});

// ---------------------------------------------------------------------------
// Walking it
// ---------------------------------------------------------------------------

describe('walking the Thornway with a real team', () => {
  for (const starter of STARTER_IDS) {
    for (const fork of ['west', 'east']) {
      for (const catchAnswer of [true, false]) {
        it(`${starter}, ${fork} road, ${catchAnswer ? 'with' : 'without'} a Route 2 catch: no trainer is a wall`, () => {
          const { tries } = walkRoute2(starter, { fork, catchAnswer });
          for (const [id, count] of Object.entries(tries)) {
            // One loss and a rematch is fine. A trainer that needs five goes
            // with an ordinary team is a wall.
            expect(count, `${id} took ${count} tries`).toBeLessThanOrEqual(4);
          }
        });
      }
    }
  }

  it('evolves nobody\'s starter early, and nobody arrives over-levelled', () => {
    for (const starter of STARTER_IDS) {
      const { team } = walkRoute2(starter);
      for (const creature of team) expect(creature.level).toBeLessThanOrEqual(18);
    }
  });
});
