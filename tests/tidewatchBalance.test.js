/**
 * tidewatchBalance.test.js
 * ----------------------------------------------------------------------------
 * Can a real player win the Tidal Sigil with the team Mistvault gave them?
 *
 * Measured through the real battle engine, walking on from the breaker in
 * Mistvault (tests/helpers/routeWalk.js, walkToTidalSigil): a few wild
 * Aethers in the Grotto's shallows, Kestrel by the Hall road, the Deckhand,
 * the Diver and Leader Ondine — all with the experience the engine awards,
 * and a loss keeping what it earned, as the game does.
 *
 * Every number in trainers.js's Phase 12 balance notes comes from here.
 */

import { describe, it, expect } from 'vitest';
import { STARTER_IDS } from '../src/data/creatures.js';
import { walkToTidalSigil } from './helpers/routeWalk.js';
import { winRate } from './helpers/battleSim.js';

const HARBOUR = ['kestrelTidewatch', 'tidalDeckhand', 'tidalDiver', 'tidalLeaderOndine'];
const walks = {};
const walk = (starter, options = { optional: false }) => {
  const id = `${starter}:${JSON.stringify(options)}`;
  if (!walks[id]) walks[id] = walkToTidalSigil(starter, options);
  return walks[id];
};
const rate = (id, starter, seeds = 30) =>
  winRate(id, walk(starter).before[id], { seeds, starter });

describe('from the breaker to the Tidal Sigil', () => {
  for (const starter of STARTER_IDS) {
    for (const optional of [false, true]) {
      it(`${starter}${optional ? ', having fought Brede too' : ''}: no fight in Tidewatch is a wall`, () => {
        const { tries } = walk(starter, { optional });
        for (const id of HARBOUR) {
          expect(tries[id], `${id} took ${tries[id]} tries`).toBeLessThanOrEqual(4);
        }
      });
    }

    it(`${starter}: Kestrel's third meeting is winnable more often than not`, () => {
      expect(rate('kestrelTidewatch', starter)).toBeGreaterThanOrEqual(0.6);
    });

    it(`${starter}: the Hall's trainers come before the Leader in difficulty`, () => {
      const leader = rate('tidalLeaderOndine', starter);
      expect(rate('tidalDeckhand', starter)).toBeGreaterThanOrEqual(leader);
      expect(rate('tidalDiver', starter)).toBeGreaterThanOrEqual(leader);
    });

    it(`${starter}: arrives at the Sigil at the levels the plan has always given Hall 2 (about 18-22)`, () => {
      const { team } = walk(starter);
      const top = Math.max(...team.map((c) => c.level));
      expect(top).toBeGreaterThanOrEqual(18);
      expect(top).toBeLessThanOrEqual(23);
    });
  }

  it('makes Ondine hard for exactly one starter — the Fire one — and a wall for none', () => {
    const rates = Object.fromEntries(STARTER_IDS.map((s) => [s, rate('tidalLeaderOndine', s, 40)]));
    expect(rates.pyrret).toBeGreaterThanOrEqual(0.2);
    expect(rates.pyrret).toBeLessThan(0.6);
    expect(rates.drizzle).toBeGreaterThanOrEqual(0.8);
    expect(rates.sproutle).toBeGreaterThanOrEqual(0.8);
  });

  it('makes Ondine a harder Leader than Fern, against the very same teams', () => {
    for (const starter of STARTER_IDS) {
      const team = walk(starter).before.tidalLeaderOndine;
      const fern = winRate('verdantLeaderFern', team, { seeds: 20, starter });
      expect(fern, starter).toBeGreaterThanOrEqual(rate('tidalLeaderOndine', starter));
    }
  });
});
