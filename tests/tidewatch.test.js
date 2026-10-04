/**
 * tidewatch.test.js
 * ----------------------------------------------------------------------------
 * Tidewatch Harbor (Phase 12): the town out of Mistvault, its services, its
 * people, the rival beside the Hall road — and the Stormrise rockslide, the
 * honest end of Phase 12, which Phase 13 lifts.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { getSightTiles } from '../src/systems/SightSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { getShopStock } from '../src/data/shops.js';
import { TRAINERS } from '../src/data/trainers.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';

const TOWN = MAPS.tidewatch;
const key = (x, y) => `${x},${y}`;

/** A player who has just come up out of Mistvault. */
function arrivedState() {
  const state = createNewGameState();
  state.starter = 'drizzle';
  awardBadge('verdantSigil', state);
  for (const id of ['kestrelThornway', 'kestrelRoute2', 'vaneForeman']) recordTrainerVictory(id, state);
  state.flags.mistvaultOpen = true;
  state.flags.mistvaultSiphonStopped = true;
  return state;
}

function built(state = arrivedState()) {
  const map = new TileMap(TOWN);
  map.setBarrierState(createBarrierState(TOWN, { conditions: getWorldConditions(state), state }));
  return map;
}

function reachable(map, state, { without = [] } = {}) {
  const conditions = getWorldConditions(state);
  const blocked = new Set([
    ...TOWN.npcs.filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)),
    ...TOWN.interactables.map((e) => key(e.x, e.y)),
    ...without.map(([x, y]) => key(x, y)),
  ]);
  const start = TOWN.spawnPoints.fromMistvault;
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
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
const say = (npc, state) => resolveDialogue(npc.dialogue, getWorldConditions(state));
const npc = (id) => TOWN.npcs.find((n) => n.id === id);

describe('Tidewatch Harbor: the town', () => {
  it('is reached through Mistvault and down the Stormrise Climb, and leads back to both', () => {
    const into = Object.values(MAPS)
      .filter((map) => !map.interior && map.exits.some((exit) => exit.to === 'tidewatch'))
      .map((map) => map.id);
    expect([...new Set(into)].sort()).toEqual(['mistvaultCore', 'stormriseLower']);
    for (const exit of TOWN.exits) expect(MAPS[exit.to].spawnPoints[exit.spawn]).toBeDefined();
  });

  it('has a Mender, a Supply Post and the Tidal Hall, each with a way in and a way back', () => {
    for (const id of ['tidewatchMendersHall', 'tidewatchSupplyPost', 'tidalHall']) {
      expect(TOWN.exits.some((exit) => exit.to === id), id).toBe(true);
      const back = MAPS[id].exits.filter((exit) => exit.to === 'tidewatch');
      expect(back.length, id).toBeGreaterThan(0);
      for (const exit of back) expect(TOWN.spawnPoints[exit.spawn]).toBeDefined();
    }
  });

  it('lets a player reach every door, person, sign and item from the cave mouth', () => {
    // With the rockslide lifted: the Stormrise exits are behind it until then
    // (the rockslide tests below check that half).
    const state = arrivedState();
    recordTrainerVictory('kestrelTidewatch', state);
    state.flags.stormriseOpen = true;
    const seen = reachable(built(state), state);
    for (const exit of TOWN.exits) expect(seen.has(key(exit.x, exit.y)), `${exit.to}`).toBe(true);
    const conditions = getWorldConditions(state);
    for (const entry of [...TOWN.npcs.filter((n) => isNpcPresent(n, conditions)), ...TOWN.interactables]) {
      expect(nextTo(seen, entry), entry.id || entry.item || `${entry.x},${entry.y}`).toBe(true);
    }
  });

  it('makes healing here the third place a blackout can send you', () => {
    const mender = MAPS.tidewatchMendersHall.npcs.find((n) => n.id === 'tidewatchMender');
    expect(mender.dialogue[0].action).toBe('heal');
    const healers = Object.values(MAPS).filter((map) => (map.npcs || [])
      .some((n) => (n.dialogue || []).some?.((b) => b && b.action === 'heal')));
    // ...of five, once Voltspire (Phase 13) and the Aerie Lodge (Phase 14) are built.
    expect(healers.map((m) => m.id).sort()).toEqual(
      ['aerieLodge', 'mendersHall', 'thistlewoodMendersHall', 'tidewatchMendersHall', 'voltspireMendersHall'].sort()
    );
  });

  it('has a landmark: the Tidewatch light', () => {
    const tiles = TOWN.tiles.join('');
    expect(tiles).toContain('Z');
    expect(tiles).toContain('9');
    const sign = TOWN.interactables.find((e) => e.x === 4 && e.y === 7);
    expect(resolveDialogue(sign.dialogue, getWorldConditions(arrivedState())).pages.join(' '))
      .toMatch(/Tidewatch light/);
  });
});

describe('the Supply Post (economy audit)', () => {
  const stock = (id) => getShopStock(id, {}).map((item) => item.id);

  it('sells what Thistlewood sells, and adds the Clear Tonic and the Ultra Orb', () => {
    const here = stock('tidewatchSupplyPost');
    for (const item of stock('thistlewoodSupplyPost')) expect(here).toContain(item);
    const added = here.filter((item) => !stock('thistlewoodSupplyPost').includes(item));
    expect(added.sort()).toEqual(['clearTonic', 'ultraOrb']);
  });

  it('is the first shop to sell either', () => {
    // The shops of the towns before it. (Voltspire's, further on, keeps both.)
    for (const shop of ['emberhollowSupplyPost', 'thistlewoodSupplyPost']) {
      expect(stock(shop)).not.toContain('ultraOrb');
      expect(stock(shop)).not.toContain('clearTonic');
    }
  });

  it('is opened by the shopkeeper with the ordinary shop action', () => {
    const keeper = MAPS.tidewatchSupplyPost.npcs.find((n) => n.id === 'tidewatchShopkeeper');
    expect(keeper.dialogue[0].action).toBe('shop:tidewatchSupplyPost');
  });

  it('is affordable from what the cavern and the harbour pay out', () => {
    // Prize money from Kestrel at the cordon to Ondine, every fight on the way.
    const ids = ['kestrelRoute2', 'vaneTallis', 'vaneQuill', 'vaneTechnician', 'vaneForeman',
      'kestrelTidewatch', 'tidalDeckhand', 'tidalDiver'];
    const earned = ids.reduce((sum, id) => sum + TRAINERS[id].rewardMoney, 0);
    // Enough for an Ultra Orb and a few Super Potions before the Leader —
    // not enough to buy the shelf.
    expect(earned).toBeGreaterThan(1200 + 3 * 550);
    expect(earned).toBeLessThan(12 * 1200);
  });
});

describe('Kestrel, the third time', () => {
  const kestrel = npc('kestrelHarbor');

  it('is the rival\'s third meeting, and needs the second', () => {
    const trainer = TRAINERS.kestrelTidewatch;
    expect(trainer.rival).toBe('kestrel');
    expect(trainer.stage).toBe(3);
    expect(trainer.requires).toBe('trainer:kestrelRoute2');
    expect(kestrel.presentWhen).toBe(trainer.requires);
  });

  it('watches the only way to the Tidal Hall: the fenced Hall road', () => {
    const lane = getSightTiles({ origin: kestrel, facing: kestrel.facing, range: kestrel.sightRange });
    const state = arrivedState();
    const map = built(state);
    const hallDoors = TOWN.exits.filter((exit) => exit.to === 'tidalHall');
    // Without the tiles Kestrel can see, the Hall cannot be reached at all.
    const seen = reachable(map, state, { without: lane.map((t) => [t.x, t.y]) });
    for (const door of hallDoors) expect(seen.has(key(door.x, door.y))).toBe(false);
  });

  it('walks back to their spot afterwards, out of the road, and stays', () => {
    expect(kestrel.returnAfterDefeat).toBe(true);
    const hallRoad = new Set(['23', '24']);
    expect(hallRoad.has(String(kestrel.x))).toBe(false);
  });

  it('has something new to say after the fight, and after the Sigil', () => {
    const state = arrivedState();
    expect(say(kestrel, state).action).toBe('trainer:kestrelTidewatch');
    recordTrainerVictory('kestrelTidewatch', state);
    expect(say(kestrel, state).action).toBeNull();
    expect(say(kestrel, state).pages.join(' ')).toMatch(/Three for three/);
    awardBadge('tidalSigil', state);
    expect(say(kestrel, state).pages.join(' ')).toMatch(/Stormrise/);
  });
});

describe('the people of Tidewatch follow the story', () => {
  it('react to the Tidal Sigil', () => {
    const before = arrivedState();
    const after = arrivedState();
    awardBadge('tidalSigil', after);
    for (const id of ['harbourmaster', 'lighthouseKeeper', 'pierFisher', 'beachChild', 'stormriseWarden']) {
      const a = say(npc(id), before).pages.join(' ');
      const b = say(npc(id), after).pages.join(' ');
      expect(b, id).not.toBe(a);
    }
  });

  it('keeps the Hollow Vane in town — surveying — until the Sigil, then gone up the coast', () => {
    const vane = npc('vaneHarbourSurveyor');
    expect(vane.sprite).toBe('vane');
    expect(isNpcPresent(vane, getWorldConditions(arrivedState()))).toBe(true);
    const after = arrivedState();
    awardBadge('tidalSigil', after);
    expect(isNpcPresent(vane, getWorldConditions(after))).toBe(false);
    expect(say(npc('harbourmaster'), after).pages.join(' ')).toMatch(/grey coats/);
  });
});

describe('the Stormrise rockslide: Phase 12\'s end, lifted in Phase 13', () => {
  const slide = TOWN.barriers.find((b) => b.id === 'stormriseRockslide');
  const hale = () => npc('stormriseWarden');

  it('stays down, whatever else the player has done, until stormriseOpen is set', () => {
    const state = arrivedState();
    for (const id of Object.keys(TRAINERS)) recordTrainerVictory(id, state);
    awardBadge('tidalSigil', state);
    const map = built(state);
    for (const [x, y] of slide.tiles) expect(map.isWalkable(x, y)).toBe(false);
    state.flags.stormriseOpen = true;
    const open = built(state);
    for (const [x, y] of slide.tiles) expect(open.isWalkable(x, y)).toBe(true);
  });

  it('is opened by exactly one thing: Warden Hale, and only for a Tidal Sigil-holder', () => {
    expect(slide.openWhen).toBe('stormriseOpen');
    const setters = [];
    for (const map of Object.values(MAPS)) {
      for (const entry of [...(map.npcs || []), ...(map.interactables || [])]) {
        for (const branch of Array.isArray(entry.dialogue) ? entry.dialogue : []) {
          if (branch && (branch.setFlags || []).includes('stormriseOpen')) setters.push([map.id, entry.id, branch.when]);
        }
      }
    }
    for (const trainer of Object.values(TRAINERS)) {
      if ((trainer.setFlags || []).includes('stormriseOpen')) setters.push(trainer.id);
    }
    expect(setters).toEqual([['tidewatch', 'stormriseWarden', 'badge:tidalSigil']]);
  });

  it('says why it is shut before the Sigil, opens with it, and says the road is clear after', () => {
    const before = arrivedState();
    expect(say(hale(), before).pages.join(' ')).toMatch(/rockslide/);
    expect(say(hale(), before).setFlags).toEqual([]);

    const holder = arrivedState();
    awardBadge('tidalSigil', holder);
    expect(say(hale(), holder).setFlags).toEqual(['stormriseOpen']);

    holder.flags.stormriseOpen = true;
    expect(say(hale(), holder).setFlags).toEqual([]);
    expect(say(hale(), holder).pages.join(' ')).toMatch(/road is clear/);
  });

  it('has the sign follow it: CLOSED, then OPEN', () => {
    const sign = TOWN.interactables.find((e) => e.x === 16 && e.y === 9);
    const state = arrivedState();
    expect(say(sign, state).pages.join(' ')).toMatch(/CLOSED: rockslide/);
    state.flags.stormriseOpen = true;
    expect(say(sign, state).pages.join(' ')).toMatch(/OPEN/);
  });

  it('leads only up the Stormrise Climb, and nothing behind it is reachable while it is down', () => {
    const north = TOWN.exits.filter((exit) => exit.y <= slide.tiles[0][1]);
    expect(north.map((exit) => exit.to)).toEqual(['stormriseLower', 'stormriseLower']);
    const shut = arrivedState();
    awardBadge('tidalSigil', shut);
    const seen = reachable(built(shut), shut);
    for (const exit of north) expect(seen.has(key(exit.x, exit.y))).toBe(false);
    shut.flags.stormriseOpen = true;
    const open = reachable(built(shut), shut);
    for (const exit of north) expect(open.has(key(exit.x, exit.y))).toBe(true);
  });

  it('sends Hale up the Climb once the Vane\'s relay is grounded', () => {
    const state = arrivedState();
    state.flags.stormriseOpen = true;
    expect(isNpcPresent(hale(), getWorldConditions(state))).toBe(true);
    state.flags.stormriseRelayStopped = true;
    expect(isNpcPresent(hale(), getWorldConditions(state))).toBe(false);
    expect(isNpcPresent(MAPS.stormriseHigh.npcs.find((n) => n.id === 'haleShelf'), getWorldConditions(state))).toBe(true);
  });
});
