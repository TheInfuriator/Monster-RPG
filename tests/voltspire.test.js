/**
 * voltspire.test.js
 * ----------------------------------------------------------------------------
 * Voltspire City (Phase 13): the last town before the championship — its
 * Mender's Hall, Supply Post and landmark, its people, the Storm Hall's door,
 * the post-Sigil Vane hook, and the honest end of Phase 13 at the Aerie Gate.
 */

import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TileMap } from '../src/systems/TileMap.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { getShopStock } from '../src/data/shops.js';
import { getItem } from '../src/data/items.js';
import { TRAINERS } from '../src/data/trainers.js';
import { createNewGameState } from '../src/core/GameState.js';
import { recordTrainerVictory } from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';

const CITY = MAPS.voltspire;
const key = (x, y) => `${x},${y}`;
const npc = (id) => CITY.npcs.find((n) => n.id === id);
const say = (entry, state) => resolveDialogue(entry.dialogue, getWorldConditions(state));

/** A player who has just come over the pass. */
function arrivedState() {
  const state = createNewGameState();
  state.starter = 'pyrret';
  awardBadge('verdantSigil', state);
  awardBadge('tidalSigil', state);
  for (const id of ['kestrelTidewatch', 'vaneOverseer', 'kestrelStormrise']) recordTrainerVictory(id, state);
  Object.assign(state.flags, { stormriseOpen: true, stormriseRelayStopped: true });
  return state;
}

function reachable(state) {
  const map = new TileMap(CITY);
  map.setBarrierState(createBarrierState(CITY, { conditions: getWorldConditions(state), state }));
  const conditions = getWorldConditions(state);
  const blocked = new Set([
    ...CITY.npcs.filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)),
    ...CITY.interactables.map((e) => key(e.x, e.y)),
  ]);
  const start = CITY.spawnPoints.fromStormrise;
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
const nextTo = (seen, { x, y }) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(key(x + dx, y + dy)));

describe('Voltspire City', () => {
  it('is reached only over the Stormrise Climb', () => {
    const into = Object.values(MAPS)
      .filter((map) => !map.interior && map.exits.some((exit) => exit.to === 'voltspire'))
      .map((map) => map.id);
    expect([...new Set(into)]).toEqual(['stormriseSummit']);
  });

  it('has a Mender, a Supply Post and the Storm Hall, each with a way in and a way back', () => {
    for (const id of ['voltspireMendersHall', 'voltspireSupplyPost', 'stormHall']) {
      expect(CITY.exits.some((e) => e.to === id), id).toBe(true);
      expect(MAPS[id].exits.every((e) => e.to === 'voltspire'), id).toBe(true);
    }
  });

  it('lets a player reach every door, person and sign from the pass', () => {
    const state = arrivedState();
    const seen = reachable(state);
    for (const exit of CITY.exits) expect(seen.has(key(exit.x, exit.y)), exit.to).toBe(true);
    const conditions = getWorldConditions(state);
    for (const entry of [...CITY.npcs.filter((n) => isNpcPresent(n, conditions)), ...CITY.interactables]) {
      expect(nextTo(seen, entry), entry.id || `${entry.x},${entry.y}`).toBe(true);
    }
  });

  it('heals with the ordinary Mender action — the fourth place a blackout can send you', () => {
    const mender = MAPS.voltspireMendersHall.npcs.find((n) => n.id === 'voltspireMender');
    expect(mender.dialogue[0].action).toBe('heal');
    expect(mender.dialogue[0].pages.join(' ')).toMatch(/Storm Hall/);
  });

  it('has a landmark: the Voltspire, in the plaza, with words at its foot', () => {
    const tiles = CITY.tiles.join('');
    expect(tiles).toContain('7');
    expect(tiles).toContain('>');
    const plate = CITY.interactables.find((e) => CITY.tiles[e.y][e.x] === '7');
    expect(plate.dialogue.join(' ')).toMatch(/Voltspire/);
  });

  it('has weather: rain, now the storm is back', () => {
    expect(CITY.weather).toEqual({ kind: 'rain', amount: 1 });
  });

  it('remembers the dark month and the morning the lights came back', () => {
    expect(say(npc('spireKeeper'), arrivedState()).pages.join(' ')).toMatch(/lamps/);
  });
});

describe('the Supply Post (economy audit)', () => {
  const stock = (id) => getShopStock(id, {}).map((item) => item.id);

  it('sells what Tidewatch sells, and adds exactly the Mender\'s Draught', () => {
    const here = stock('voltspireSupplyPost');
    for (const item of stock('tidewatchSupplyPost')) expect(here).toContain(item);
    expect(here.filter((item) => !stock('tidewatchSupplyPost').includes(item))).toEqual(['mendersDraught']);
  });

  it('prices the Draught as a step up: twice a Super Potion\'s healing, for less than twice the price', () => {
    const draught = getItem('mendersDraught');
    const superPotion = getItem('superPotion');
    expect(draught.effect).toEqual({ type: 'heal', amount: 100 });
    expect(draught.price).toBeLessThan(superPotion.price * 2);
    expect(draught.price / draught.effect.amount).toBeLessThan(superPotion.price / superPotion.effect.amount);
  });

  it('is the only shop that sells it', () => {
    for (const id of ['emberhollowSupplyPost', 'thistlewoodSupplyPost', 'tidewatchSupplyPost']) {
      expect(stock(id)).not.toContain('mendersDraught');
    }
  });

  it('is affordable from what the Climb pays out — but not the whole shelf', () => {
    // Every fight from the foot of the Climb to the Storm Hall door.
    const ids = ['stormriseClimber', 'stormriseHerder', 'stormriseMountaineer', 'vaneMarl', 'vaneOverseer',
      'stormriseStormchaser', 'stormriseSkyherd', 'kestrelStormrise'];
    const earned = ids.reduce((sum, id) => sum + TRAINERS[id].rewardMoney, 0);
    // A handful of Draughts and an Ultra Orb or two...
    expect(earned).toBeGreaterThan(getItem('mendersDraught').price * 4 + getItem('ultraOrb').price);
    // ...but not ten of everything.
    const shelf = stock('voltspireSupplyPost').reduce((sum, id) => sum + getItem(id).price * 10, 0);
    expect(earned).toBeLessThan(shelf);
  });

  it('is opened by the shopkeeper with the ordinary shop action', () => {
    const keeper = MAPS.voltspireSupplyPost.npcs.find((n) => n.id === 'voltspireShopkeeper');
    expect(keeper.dialogue[0].action).toBe('shop:voltspireSupplyPost');
  });
});

describe('where Phase 13 ends: the Aerie Gate', () => {
  const gate = CITY.barriers.find((b) => b.id === 'aerieGate');

  it('stays shut whatever the player has done — even with all three Sigils', () => {
    const state = arrivedState();
    for (const id of Object.keys(TRAINERS)) recordTrainerVictory(id, state);
    awardBadge('stormSigil', state);
    const map = new TileMap(CITY);
    map.setBarrierState(createBarrierState(CITY, { conditions: getWorldConditions(state), state }));
    for (const [x, y] of gate.tiles) expect(map.isWalkable(x, y)).toBe(false);
  });

  it('is opened by a flag nothing in the game sets', () => {
    expect(gate.openWhen).toBe('aerieOpen');
    const setters = [];
    for (const map of Object.values(MAPS)) {
      for (const entry of [...(map.npcs || []), ...(map.interactables || [])]) {
        for (const branch of Array.isArray(entry.dialogue) ? entry.dialogue : []) {
          if (branch && (branch.setFlags || []).includes('aerieOpen')) setters.push(entry.id);
        }
      }
    }
    for (const trainer of Object.values(TRAINERS)) {
      if ((trainer.setFlags || []).includes('aerieOpen')) setters.push(trainer.id);
    }
    expect(setters).toEqual([]);
  });

  it('has nothing behind it: no exit, and the road ends in rock', () => {
    expect(CITY.exits.some((exit) => exit.y <= gate.tiles[0][1])).toBe(false);
    expect(CITY.tiles[0]).toMatch(/^%+$/);
    expect(Object.keys(MAPS)).not.toContain('aerie');
  });

  it('says so, in person and on a sign — before and after the third Sigil', () => {
    const sign = CITY.interactables.find((e) => e.x === 16 && e.y === 3);
    expect(sign.dialogue.join(' ')).toMatch(/CLOSED/);
    const warden = npc('aerieWarden');
    const before = arrivedState();
    const after = arrivedState();
    awardBadge('stormSigil', after);
    expect(say(warden, before).pages.join(' ')).toMatch(/three Sigils/);
    expect(say(warden, after).pages.join(' ')).toMatch(/Circle/);
    expect(say(warden, after).pages.join(' ')).not.toBe(say(warden, before).pages.join(' '));
  });
});

describe('the post-Sigil Vane hook', () => {
  const watcher = npc('vaneGateWatcher');

  it('appears only once the Storm Sigil is won', () => {
    const state = arrivedState();
    expect(isNpcPresent(watcher, getWorldConditions(state))).toBe(false);
    awardBadge('stormSigil', state);
    expect(isNpcPresent(watcher, getWorldConditions(state))).toBe(true);
  });

  it('is a Vane in the Vane\'s look — but no battle, and no answers', () => {
    expect(watcher.sprite).toBe('vane');
    expect(watcher.trainer).toBeUndefined();
    const text = watcher.dialogue.flatMap((b) => b.pages).join(' ');
    expect(text).toMatch(/Convergence/);
    expect(text).not.toMatch(/Champion/);
  });
});
