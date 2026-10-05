/**
 * stormriseBalance.test.js
 * ----------------------------------------------------------------------------
 * Can a real player climb the Stormrise Climb and win the Storm Sigil with
 * the team the Tidal Sigil left them?
 *
 * Measured through the real battle engine, walking on from Ondine
 * (tests/helpers/routeWalk.js, walkStormrise and walkToStormSigil): a few
 * wild Aethers on each of the Climb's three grounds, every trainer on the
 * road, the Hollow Vane on the Frost Shelf, Kestrel at the top, the three
 * Stormwrights and Leader Halcyon — with the experience the engine awards,
 * and a loss keeping what it earned, as the game does.
 *
 * The simulated player is a pessimistic one: it only ever switches when its
 * lead faints. Every number in trainers.js's Phase 13 balance notes comes
 * from here.
 */

import { describe, it, expect } from 'vitest';
import { STARTER_IDS } from '../src/data/creatures.js';
import { walkStormrise, walkToStormSigil, walkToTidalSigil, STORMRISE_ANSWER } from './helpers/routeWalk.js';
import { winRate } from './helpers/battleSim.js';

const CLIMB = ['stormriseHerder', 'stormriseClimber', 'stormriseMountaineer', 'vaneMarl', 'vaneOverseer',
  'stormriseSkyherd', 'kestrelStormrise'];
const HALL = ['stormHallAda', 'stormHallFenn', 'stormHallInes', 'stormLeaderHalcyon'];

const walks = {};
const walk = (starter, options = {}) => {
  const id = `${starter}:${JSON.stringify(options)}`;
  if (!walks[id]) walks[id] = walkToStormSigil(starter, options);
  return walks[id];
};
const rate = (id, starter, seeds = 30, options = {}) =>
  winRate(id, walk(starter, options).before[id], { seeds, starter });

describe('from the Tidal Sigil to the Storm Sigil', () => {
  for (const starter of STARTER_IDS) {
    for (const climbOptional of [true, false]) {
      it(`${starter}${climbOptional ? '' : ', skipping the Stormchaser'}: no fight on the Climb or in the Hall is a wall`, () => {
        const { tries } = walk(starter, { climbOptional });
        for (const id of [...CLIMB, ...HALL]) {
          expect(tries[id], `${id} took ${tries[id]} tries`).toBeLessThanOrEqual(4);
        }
      });
    }

    it(`${starter}: the Relay Overseer is a real fight, and a fair one`, () => {
      expect(rate('vaneOverseer', starter)).toBeGreaterThanOrEqual(0.6);
    });

    it(`${starter}: Kestrel's fourth meeting is winnable more often than not`, () => {
      expect(rate('kestrelStormrise', starter)).toBeGreaterThanOrEqual(0.6);
    });

    it(`${starter}: the Hall's trainers come before the Leader in difficulty`, () => {
      const leader = rate('stormLeaderHalcyon', starter);
      for (const id of ['stormHallAda', 'stormHallFenn', 'stormHallInes']) {
        expect(rate(id, starter), id).toBeGreaterThanOrEqual(leader);
      }
    });

    it(`${starter}: arrives at the Storm Sigil at the levels the plan gives Hall 3 (about 25-30)`, () => {
      const { team } = walk(starter);
      const top = Math.max(...team.map((c) => c.level));
      expect(top).toBeGreaterThanOrEqual(25);
      expect(top).toBeLessThanOrEqual(30);
    });

    it(`${starter}: climbs a few levels on the way up — the Climb pays its way`, () => {
      const before = Math.max(...walkToTidalSigil(starter).team.map((c) => c.level));
      const after = Math.max(...walkStormrise(starter).team.map((c) => c.level));
      expect(after - before).toBeGreaterThanOrEqual(2);
    });
  }

  it('makes Halcyon hardest for the Water starter — hard, never a wall — and fair for the others', () => {
    const rates = Object.fromEntries(STARTER_IDS.map((s) => [s, rate('stormLeaderHalcyon', s, 40)]));
    expect(rates.drizzle).toBeGreaterThanOrEqual(0.2);
    expect(rates.drizzle).toBeLessThan(0.6);
    expect(rates.drizzle).toBeLessThan(rates.pyrret);
    expect(rates.drizzle).toBeLessThan(rates.sproutle);
    expect(rates.pyrret).toBeGreaterThanOrEqual(0.6);
    expect(rates.sproutle).toBeGreaterThanOrEqual(0.6);
  });

  it('makes Halcyon a harder Leader than Ondine, against the very same teams', () => {
    for (const starter of STARTER_IDS) {
      const team = walk(starter).before.stormLeaderHalcyon;
      const ondine = winRate('tidalLeaderOndine', team, { seeds: 20, starter });
      expect(ondine, starter).toBeGreaterThanOrEqual(rate('stormLeaderHalcyon', starter));
    }
  });

  it('needs the Frost Shelf\'s catch exactly where the Mountaineer says, and nowhere else', () => {
    // Without it, the Water player can hardly beat Halcyon and the Grass
    // player can hardly beat Kestrel; with it, both are fair fights (above).
    // Measured as win rates over 40 seeds: a single walk's try count can land
    // a lucky first win (Phase 14 measured the Grass walk winning Kestrel at
    // the first try without the catch, at 15%).
    expect(Object.keys(STORMRISE_ANSWER).sort()).toEqual(['drizzle', 'sproutle']);
    const without = (starter, id) => {
      const team = walk(starter, { climbCatch: null }).before[id];
      return winRate(id, team, { seeds: 40, starter });
    };
    expect(without('drizzle', 'stormLeaderHalcyon')).toBeLessThan(0.3);
    expect(without('sproutle', 'kestrelStormrise')).toBeLessThan(0.3);
    expect(rate('stormLeaderHalcyon', 'drizzle', 40)).toBeGreaterThanOrEqual(0.4);
    expect(rate('kestrelStormrise', 'sproutle', 40)).toBeGreaterThanOrEqual(0.6);
    expect(walk('drizzle').tries.stormLeaderHalcyon).toBeLessThanOrEqual(4);
    expect(walk('sproutle').tries.kestrelStormrise).toBeLessThanOrEqual(4);
  });
});
