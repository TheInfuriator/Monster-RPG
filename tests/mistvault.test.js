/**
 * mistvault.test.js
 * ----------------------------------------------------------------------------
 * Mistvault Cavern (Phase 12): three maps, the valve puzzle, the Hollow Vane
 * and the siphon.
 *
 * The heart of it is the proof in "the valves can never trap anyone": every
 * setting of the valves times every patch of floor the player could be
 * standing in, walked from the way in (tests/helpers/leverProof.js). From
 * every one of those situations both the way out and the way on must still
 * be reachable. That is checked, not hoped.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import {
  createBarrierState, findPuzzleProblems, getLeverPositions, getPuzzleSignals,
  pressLever, getLevers,
} from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { ENCOUNTER_TABLES, getEncounterConfig } from '../src/data/encounters.js';
import { TRAINERS } from '../src/data/trainers.js';
import { FACTIONS } from '../src/data/factions.js';
import { CREATURES } from '../src/data/creatures.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { exploreSituations, situationsThatCannotReach, tileKey as key } from './helpers/leverProof.js';

const MOUTH = MAPS.mistvaultMouth;
const GALLERIES = MAPS.mistvaultGalleries;
const CORE = MAPS.mistvaultCore;
const CAVERN = [MOUTH, GALLERIES, CORE];

/** A player who has just come through the cordon. */
function enteredState() {
  const state = createNewGameState();
  state.starter = 'pyrret';
  recordTrainerVictory('kestrelThornway', state);
  recordTrainerVictory('kestrelRoute2', state);
  state.flags.mistvaultOpen = true;
  return state;
}

/** A map as a player in `state` finds it: barriers set from the story and the valves. */
function built(definition, state = enteredState()) {
  const map = new TileMap(definition);
  map.setBarrierState(createBarrierState(definition, { conditions: getWorldConditions(state), state }));
  return map;
}

/** Everything walkable from a spawn, with people who are there and items as walls. */
function reachable(definition, map, from, { without = [], conditions = {} } = {}) {
  const blocked = new Set([
    ...(definition.npcs || []).filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)),
    ...(definition.interactables || []).map((e) => key(e.x, e.y)),
    ...without.map(([x, y]) => key(x, y)),
  ]);
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

const nextTo = (seen, { x, y }) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(key(x + dx, y + dy)));
const exitsTo = (definition, to) => definition.exits.filter((exit) => exit.to === to);
const reachesAny = (seen, exits) => exits.some((exit) => seen.has(key(exit.x, exit.y)));

/** The Galleries with the valves set: east/west, pocket/deep. */
function galleriesWith(spring, far, state = enteredState()) {
  state.puzzles.mistvaultGalleries = { springValve: spring === 'west', farValve: far === 'deep' };
  return built(GALLERIES, state);
}

// ---------------------------------------------------------------------------
// The shape of the cavern
// ---------------------------------------------------------------------------

describe('Mistvault Cavern: three maps, one way through', () => {
  it('chains Route 2 -> Mouth -> Galleries -> Draw Site, with a way back at every step', () => {
    const links = [
      [MAPS.route2, MOUTH], [MOUTH, GALLERIES], [GALLERIES, CORE],
    ];
    for (const [a, b] of links) {
      const there = exitsTo(a, b.id);
      const back = exitsTo(b, a.id);
      expect(there.length, `${a.id} -> ${b.id}`).toBeGreaterThan(0);
      expect(back.length, `${b.id} -> ${a.id}`).toBeGreaterThan(0);
      for (const exit of there) expect(b.spawnPoints[exit.spawn]).toBeDefined();
      for (const exit of back) expect(a.spawnPoints[exit.spawn]).toBeDefined();
    }
  });

  it('is three distinct places, each sound by the puzzle rules', () => {
    for (const map of CAVERN) expect(findPuzzleProblems(map)).toEqual([]);
    expect(new Set(CAVERN.map((m) => m.name)).size).toBe(3);
  });

  it('walks every map from its way in to its way on, and to every person, sign and item', () => {
    const state = enteredState();
    state.puzzles.mistvaultGalleries = { springValve: true, farValve: true };
    const checks = [
      [MOUTH, 'fromRoute2', 'mistvaultGalleries'],
      [GALLERIES, 'fromMouth', 'mistvaultCore'],
    ];
    for (const [map, spawn, onward] of checks) {
      const seen = reachable(map, built(map, state), map.spawnPoints[spawn]);
      expect(reachesAny(seen, exitsTo(map, onward)), `${map.id}: way on`).toBe(true);
    }
    // Every person, sign and item in the cavern, once the siphon is stopped
    // and every way is open.
    state.flags.mistvaultSiphonStopped = true;
    recordTrainerVictory('vaneForeman', state);
    for (const map of CAVERN) {
      const spawn = map.spawnPoints.default;
      const seen = reachable(map, built(map, state), spawn, { conditions: getWorldConditions(state) });
      for (const entry of [...map.npcs, ...map.interactables]) {
        expect(nextTo(seen, entry), `${map.id}: ${entry.id || entry.item || entry.x + ',' + entry.y}`).toBe(true);
      }
    }
  });

  it('puts the cave\'s wild Aethers on its rubble and shallows, from cave tables', () => {
    expect(getEncounterConfig(MOUTH).tableId).toBe('mistvaultCave');
    expect(getEncounterConfig(GALLERIES).tableId).toBe('mistvaultGalleries');
    expect(getEncounterConfig(CORE).tableId).toBe('mistvaultGalleries');
    expect(getEncounterConfig(CORE).terrainTables).toEqual({ shallows: 'mistvaultShallows' });

    const core = new TileMap(CORE);
    expect(core.getEncounterTableAt(3, 2)).toBe('mistvaultShallows');   // shallows
    expect(core.getEncounterTableAt(4, 20)).toBe('mistvaultGalleries'); // rubble
    expect(core.getEncounterTableAt(9, 15)).toBeNull();                 // plain floor
  });

  it('keeps the new cave species and the Vane\'s types in the cave tables', () => {
    const species = (id) => ENCOUNTER_TABLES[id].map((e) => e.species);
    expect(species('mistvaultCave')).toContain('gloamite');
    expect(species('mistvaultGalleries')).toContain('corrodit');
    expect(species('mistvaultShallows')).toEqual(expect.arrayContaining(['minnet', 'barnaclaw']));
    // Dark and Rock, as GAME_DESIGN.md promised for Mistvault.
    const types = new Set(species('mistvaultCave').flatMap((s) => CREATURES[s].types));
    expect(types.has('dark') && types.has('rock')).toBe(true);
  });

  it('pitches the cave a little above Route 2\'s scree', () => {
    const top = (id) => Math.max(...ENCOUNTER_TABLES[id].map((e) => e.maxLevel));
    const bottom = (id) => Math.min(...ENCOUNTER_TABLES[id].map((e) => e.minLevel));
    expect(bottom('mistvaultCave')).toBeGreaterThanOrEqual(bottom('route2Scree'));
    expect(top('mistvaultGalleries')).toBeGreaterThanOrEqual(top('mistvaultCave'));
    expect(top('mistvaultShallows')).toBeLessThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// The Mouth
// ---------------------------------------------------------------------------

describe('the Mouth', () => {
  it('puts the Vane Surveyor across the only way north', () => {
    const tallis = MOUTH.npcs.find((n) => n.id === 'vaneTallis');
    const lane = getSightTiles({ origin: tallis, facing: tallis.facing, range: tallis.sightRange });
    const map = built(MOUTH);
    // Take away every tile Tallis can see: the way north is gone.
    const seen = reachable(MOUTH, map, MOUTH.spawnPoints.fromRoute2, { without: lane.map((t) => [t.x, t.y]) });
    expect(reachesAny(seen, exitsTo(MOUTH, 'mistvaultGalleries'))).toBe(false);
  });

  it('gives the objective plainly, and changes as the player gets on', () => {
    const ashby = MOUTH.npcs.find((n) => n.id === 'circleWarden');
    const say = (state) => resolveDialogue(ashby.dialogue, getWorldConditions(state)).pages.join(' ');
    const state = enteredState();
    expect(say(state)).toMatch(/shut it off/);
    recordTrainerVictory('vaneTallis', state);
    expect(say(state)).toMatch(/Hollow Vane/);
    state.flags.mistvaultSiphonStopped = true;
    expect(say(state)).toMatch(/Tidewatch/);
  });

  it('lights its dry wall channels only once the siphon is stopped', () => {
    expect(MOUTH.glows.every((glow) => glow.when === 'mistvaultSiphonStopped')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The Galleries — the valve puzzle
// ---------------------------------------------------------------------------

describe('the Galleries\' valves', () => {
  const bridges = ['deepBridge', 'westBridge', 'eastBridge', 'pocketBridge'];
  const openBridges = (spring, far) => {
    const state = enteredState();
    state.puzzles.mistvaultGalleries = { springValve: spring === 'west', farValve: far === 'deep' };
    const closed = createBarrierState(GALLERIES, { conditions: getWorldConditions(state), state });
    return bridges.filter((id) => !closed[id]).sort();
  };

  it('starts as found: the spring sent east, the far valve to the pocket', () => {
    const state = enteredState();
    expect(getLeverPositions(GALLERIES, state)).toEqual({ springValve: 'east', farValve: 'pocket' });
    expect(openBridges('east', 'pocket')).toEqual(['eastBridge']);
  });

  it('holds a bridge exactly where the current runs — every setting', () => {
    expect(openBridges('east', 'pocket')).toEqual(['eastBridge']);
    expect(openBridges('east', 'deep')).toEqual(['eastBridge']);
    expect(openBridges('west', 'pocket')).toEqual(['pocketBridge', 'westBridge']);
    expect(openBridges('west', 'deep')).toEqual(['deepBridge', 'westBridge']);
  });

  it('makes the far valve depend on the spring valve: with no current, it turns and does nothing', () => {
    const state = enteredState();
    const conditions = getWorldConditions(state);
    // Spring valve east: the far valve is dry.
    const dry = pressLever(GALLERIES, 'farValve', { state, conditions });
    expect(dry.changed).toBe(true);
    expect(dry.dry).toBe(true);
    expect(dry.opened).toEqual([]);
    expect(dry.closed).toEqual([]);
    // Spring valve west: now it matters.
    const west = pressLever(GALLERIES, 'springValve', { state, conditions });
    expect(west.position).toBe('west');
    expect(west.opened.sort()).toEqual(['deepBridge', 'westBridge']);   // far valve already on deep
    expect(west.closed).toEqual(['eastBridge']);
    const back = pressLever(GALLERIES, 'farValve', { state, conditions });
    expect(back.dry).toBe(false);
    expect(back.position).toBe('pocket');
    expect(back.opened).toEqual(['pocketBridge']);
    expect(back.closed).toEqual(['deepBridge']);
  });

  it('opens the way north with ONE setting only: spring west, far deep', () => {
    for (const spring of ['east', 'west']) {
      for (const far of ['pocket', 'deep']) {
        const map = galleriesWith(spring, far);
        // Fully open (no people in the way) — this is about the bridges alone.
        const seen = reachable({ npcs: [], interactables: [] }, map, GALLERIES.spawnPoints.fromMouth);
        expect(reachesAny(seen, exitsTo(GALLERIES, 'mistvaultCore')), `${spring}/${far}`)
          .toBe(spring === 'west' && far === 'deep');
      }
    }
  });

  it('reaches the east wing only with the spring east, and the pocket only with west + pocket', () => {
    const where = (spring, far) => {
      const seen = reachable({ npcs: [], interactables: [] }, galleriesWith(spring, far),
        GALLERIES.spawnPoints.fromMouth);
      return { east: seen.has(key(30, 13)), pocket: seen.has(key(5, 2)) };
    };
    expect(where('east', 'pocket')).toEqual({ east: true, pocket: false });
    expect(where('west', 'pocket')).toEqual({ east: false, pocket: true });
    expect(where('west', 'deep')).toEqual({ east: false, pocket: false });
  });

  it('lights the channel of every run with current in it, and no other', () => {
    const state = enteredState();
    state.puzzles.mistvaultGalleries = { springValve: true, farValve: true };
    const signals = getPuzzleSignals(GALLERIES, { state, conditions: getWorldConditions(state) });
    const lit = GALLERIES.glows.filter((g) => signals.has(g.signal)).map((g) => g.signal).sort();
    expect(lit).toEqual(['current:deepRun', 'current:westRun']);
  });

  it('holds every bridge for good once the siphon is stopped, whatever the valves say', () => {
    for (const spring of ['east', 'west']) {
      for (const far of ['pocket', 'deep']) {
        const state = enteredState();
        state.flags.mistvaultSiphonStopped = true;
        state.puzzles.mistvaultGalleries = { springValve: spring === 'west', farValve: far === 'deep' };
        const closed = createBarrierState(GALLERIES, { conditions: getWorldConditions(state), state });
        expect(bridges.every((id) => !closed[id]), `${spring}/${far}`).toBe(true);
      }
    }
  });

  it('keeps every valve off and away from every bridge, so turning one never strands anyone', () => {
    const bridgeTiles = new Set(GALLERIES.barriers.flatMap((b) => b.tiles.map(([x, y]) => key(x, y))));
    for (const lever of getLevers(GALLERIES)) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        expect(bridgeTiles.has(key(lever.x + dx, lever.y + dy))).toBe(false);
      }
    }
  });

  it('refuses to drop a bridge from under somebody standing on it', () => {
    const state = enteredState();
    state.puzzles.mistvaultGalleries = { springValve: true, farValve: true };
    // Someone on the deep bridge; the far valve would send the current away.
    const outcome = pressLever(GALLERIES, 'farValve', {
      state, conditions: getWorldConditions(state), occupants: [{ x: 16, y: 7 }],
    });
    expect(outcome.changed).toBe(false);
    expect(outcome.reason).toBe('occupied');
    expect(state.puzzles.mistvaultGalleries.farValve).toBe(true);
  });

  it('points every valve handle the way its current goes', () => {
    // A handle pointing left while the light runs right was a real bug.
    for (const lever of getLevers(GALLERIES)) {
      for (const position of lever.positions) {
        const glow = GALLERIES.glows.find((g) => g.signal === `current:${lever.outputs[position]}`);
        const meanX = glow.tiles.reduce((sum, [x]) => sum + x, 0) / glow.tiles.length;
        const picture = lever.art?.[position] ?? lever.positions.indexOf(position);
        expect(picture, `${lever.id} ${position}`).toBe(meanX > lever.x ? 1 : 0);   // 1 points right
      }
    }
  });

  it('answers every turn in its own words', () => {
    for (const lever of getLevers(GALLERIES)) {
      for (const position of lever.positions) expect(lever.says[position]).toMatch(/\w/);
    }
  });

  it('puts the far valve where it can only be reached once current reaches it', () => {
    // Which is why neither valve needs a "dry" line: no player ever turns one dry.
    const far = getLevers(GALLERIES).find((l) => l.id === 'farValve');
    for (const spring of ['east', 'west']) {
      const seen = reachable({ npcs: [], interactables: [] }, galleriesWith(spring, 'pocket'),
        GALLERIES.spawnPoints.fromMouth);
      expect(nextTo(seen, far), spring).toBe(spring === 'west');
    }
  });
});

describe('the valves can never trap anyone (every setting x every place to stand)', () => {
  const south = exitsTo(GALLERIES, 'mistvaultMouth');
  const north = exitsTo(GALLERIES, 'mistvaultCore');
  const touches = (exits) => (node) => exits.some((exit) => node.region.has(key(exit.x, exit.y)));

  /** Every situation, from the way in and — with any setting that lets them get there — the way back from the Core. */
  function allSituations(conditions) {
    const fromMouth = exploreSituations(GALLERIES, { starts: [GALLERIES.spawnPoints.fromMouth], conditions });
    const throughNorth = fromMouth.nodes.filter(touches(north)).map((node) => node.stored);
    expect(throughNorth.length).toBeGreaterThan(0);
    return exploreSituations(GALLERIES, {
      starts: [
        GALLERIES.spawnPoints.fromMouth,
        ...throughNorth.map((stored) => ({ ...GALLERIES.spawnPoints.fromCore, stored })),
      ],
      conditions,
    });
  }

  it('finds every setting, and never a player cut off from the spring valve', () => {
    const graph = allSituations(getWorldConditions(enteredState()));
    const settings = new Set(graph.nodes.map((n) => JSON.stringify(n.stored)));
    expect(settings.size).toBe(4);
    // WHY it is safe: whatever the valves say and wherever the player went,
    // the spring valve is still in reach — every bridge leads back to it.
    const valve = getLevers(GALLERIES).find((l) => l.id === 'springValve');
    for (const node of graph.nodes) expect(nextTo(node.region, valve)).toBe(true);
  });

  it('from EVERY situation, the way back out to the Mouth can still be reached', () => {
    const graph = allSituations(getWorldConditions(enteredState()));
    expect(situationsThatCannotReach(graph, touches(south))).toEqual([]);
  });

  it('from EVERY situation, the way on to the Draw Site can still be reached', () => {
    const graph = allSituations(getWorldConditions(enteredState()));
    expect(situationsThatCannotReach(graph, touches(north))).toEqual([]);
  });

  it('and once the siphon is stopped, both ways are open from everywhere', () => {
    const state = enteredState();
    state.flags.mistvaultSiphonStopped = true;
    const graph = allSituations(getWorldConditions(state));
    for (const node of graph.nodes) {
      expect(touches(south)(node) && touches(north)(node)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// The Draw Site — the Hollow Vane and the siphon
// ---------------------------------------------------------------------------

describe('the Draw Site and the siphon', () => {
  const foreman = CORE.npcs.find((n) => n.id === 'vaneForeman');
  const breaker = CORE.interactables.find((e) => e.x === 15 && e.y === 12);

  it('can only be reached from the tile the Foreman stands on', () => {
    const faces = [[0, 1], [0, -1], [1, 0], [-1, 0]]
      .map(([dx, dy]) => ({ x: breaker.x + dx, y: breaker.y + dy }))
      .filter(({ x, y }) => new TileMap(CORE).isWalkable(x, y));
    expect(faces).toEqual([{ x: foreman.x, y: foreman.y }]);
  });

  it('has the Foreman watching the cables up to the rig', () => {
    const lane = getSightTiles({ origin: foreman, facing: foreman.facing, range: foreman.sightRange });
    const map = built(CORE);
    for (const tile of lane) expect(map.isWalkable(tile.x, tile.y)).toBe(true);
    expect(lane.length).toBe(foreman.sightRange);
  });

  it('sends the beaten Foreman away for good, along a clear way, from wherever they stopped', () => {
    expect(foreman.absentWhen).toBe('trainer:vaneForeman');
    const map = built(CORE);
    const lane = [{ x: foreman.x, y: foreman.y },
      ...getSightTiles({ origin: foreman, facing: foreman.facing, range: foreman.sightRange })];
    for (const start of lane) {
      for (let step = 1; step <= foreman.exitAfterDefeat.steps; step += 1) {
        expect(map.isWalkable(start.x - step, start.y), `from ${start.x},${start.y}`).toBe(true);
      }
    }
  });

  it('stops the siphon only once the Foreman is beaten, and only once', () => {
    const state = enteredState();
    const use = () => resolveDialogue(breaker.dialogue, getWorldConditions(state));
    expect(use().setFlags).toEqual([]);
    recordTrainerVictory('vaneForeman', state);
    expect(use().setFlags).toEqual(['mistvaultSiphonStopped']);
    state.flags.mistvaultSiphonStopped = true;
    expect(use().setFlags).toEqual([]);
    expect(use().pages.join(' ')).toMatch(/silent/);
  });

  it('is the ONLY thing in the game that stops the siphon, and Corran the only one who opens the cordon', () => {
    const setters = (flag) => {
      const found = [];
      for (const map of Object.values(MAPS)) {
        for (const entry of [...(map.npcs || []), ...(map.interactables || [])]) {
          for (const branch of Array.isArray(entry.dialogue) ? entry.dialogue : []) {
            if (branch && (branch.setFlags || []).includes(flag)) found.push(`${map.id}:${entry.id || entry.x + ',' + entry.y}`);
          }
        }
      }
      for (const trainer of Object.values(TRAINERS)) {
        if ((trainer.setFlags || []).includes(flag)) found.push(`trainer:${trainer.id}`);
      }
      return found;
    };
    expect(setters('mistvaultSiphonStopped')).toEqual(['mistvaultCore:15,12']);
    expect(setters('mistvaultOpen')).toEqual(['route2:cordonWarden']);
  });

  it('clears the mist to the Grotto, and the way on, once it is stopped — not before', () => {
    const before = enteredState();
    recordTrainerVictory('vaneForeman', before);
    const blocked = reachable(CORE, built(CORE, before), CORE.spawnPoints.fromGalleries);
    expect(blocked.has(key(6, 4))).toBe(false);

    const after = enteredState();
    recordTrainerVictory('vaneForeman', after);
    after.flags.mistvaultSiphonStopped = true;
    const open = reachable(CORE, built(CORE, after), CORE.spawnPoints.fromGalleries);
    expect(open.has(key(6, 4))).toBe(true);
    expect(open.has(key(26, 2))).toBe(true);
  });

  it('darkens the intake channels when it stops', () => {
    expect(CORE.glows).toEqual([expect.objectContaining({ when: 'mistvaultSiphonStopped', tile: 'q' })]);
  });

  it('leaves the Vane beaten here, not finished', () => {
    const outro = TRAINERS.vaneForeman.outro.join(' ');
    expect(outro).toMatch(/bigger than one cave/);
    const label = CORE.interactables.find((e) => e.x === 22 && e.y === 19);
    expect(label.dialogue.join(' ')).toMatch(/STORMRISE/);
  });
});

// ---------------------------------------------------------------------------
// The Hollow Vane, as data
// ---------------------------------------------------------------------------

describe('the Hollow Vane', () => {
  const placed = CAVERN.flatMap((map) => (map.npcs || []).filter((n) => n.trainer)
    .map((npc) => ({ map: map.id, npc, trainer: TRAINERS[npc.trainer] })));
  // The Vane in MISTVAULT. Later operations (Stormrise, Phase 13) have their
  // own members, checked in tests/stormrise.test.js.
  const vane = placed.map(({ trainer }) => trainer).filter((t) => t.faction === 'hollowVane');

  it('is a faction in data, with the types GAME_DESIGN.md gives it', () => {
    expect(FACTIONS.hollowVane.types).toEqual(['poison', 'dark', 'steel']);
  });

  it('has five members in Mistvault: four Surveyors and the Draw Foreman', () => {
    expect(vane.map((t) => t.id).sort()).toEqual(
      ['vaneBrede', 'vaneForeman', 'vaneQuill', 'vaneTallis', 'vaneTechnician']
    );
    expect(vane.filter((t) => t.rank === 'foreman').map((t) => t.id)).toEqual(['vaneForeman']);
    for (const { trainer } of placed) expect(trainer.faction).toBe('hollowVane');
    expect(placed.length).toBe(vane.length);
  });

  it('dresses every member in the Vane\'s look and gives each a Vane-typed Aether', () => {
    for (const { npc, trainer } of placed) {
      expect(FACTIONS.hollowVane.sprites).toContain(npc.sprite);
      const types = trainer.party.flatMap((entry) => CREATURES[entry.species].types);
      expect(types.some((type) => FACTIONS.hollowVane.types.includes(type)), trainer.id).toBe(true);
    }
  });

  it('makes the Foreman the strongest of them, with three Aethers', () => {
    const top = (t) => Math.max(...t.party.map((e) => e.level));
    const foreman = TRAINERS.vaneForeman;
    expect(foreman.party.length).toBe(3);
    for (const t of vane.filter((x) => x.rank !== 'foreman')) {
      expect(top(foreman)).toBeGreaterThan(top(t));
      expect(foreman.rewardMoney).toBeGreaterThan(t.rewardMoney);
    }
  });

  it('meets the player in order, each a little stronger', () => {
    const order = ['vaneTallis', 'vaneQuill', 'vaneTechnician', 'vaneForeman'];
    const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
    for (let i = 1; i < order.length; i += 1) expect(top(order[i])).toBeGreaterThanOrEqual(top(order[i - 1]));
  });
});
