/**
 * aerieBalance.test.js
 * ----------------------------------------------------------------------------
 * Can a real player get from the Storm Sigil to the Champion — and is the
 * Champion the hardest fight of the game, but never a wall? (Phase 14)
 *
 * Measured through the real battle engine, walking on from Halcyon
 * (tests/helpers/routeWalk.js, walkToChampion): a few wild Aethers and the
 * three trainers on the Aerie Road; a stop at the Aerie Lodge, where the team
 * is rounded out to six and trained up together; the Hollow's six Vane;
 * Kestrel's last meeting; the three Wardens of the Trial and Champion Seren.
 * A loss keeps what it earned, as in the game.
 *
 * TWO PLAYERS (battleSim.js). Every number up to Phase 13 is the PESSIMISTIC
 * player, who never switches of their own accord. At the end of the game that
 * player meets six-strong teams built to punish exactly that, so from the
 * Lodge on the measured player is the CONSERVATIVE SWITCHER — it trades a
 * badly matched Aether for a clearly better one, at most once per foe. The
 * Aerie Road, fought before the Lodge, is held to the old standard: no wall
 * even for the pessimist. The comparison between the two is recorded in
 * GAME_DESIGN.md section 25.
 */

import { describe, it, expect } from 'vitest';
import { STARTER_IDS } from '../src/data/creatures.js';
import { walkToChampion, AERIE_CATCHES } from './helpers/routeWalk.js';
import { winRate } from './helpers/battleSim.js';

const ROAD = ['aerieAce', 'aerieGuide', 'aerieHopeful'];
const HOLLOW = ['vaneOdile', 'vaneVosslerHollow', 'vaneBrack', 'vaneCraleHollow', 'vaneRusk', 'vaneDirector'];
const TRIAL = ['circleAshby', 'circleMerrow', 'circleHale', 'circleChampion'];
const FINALE = [...HOLLOW, 'kestrelAerie', ...TRIAL];

const walks = {};
const walk = (starter, options = {}) => {
  const id = `${starter}:${JSON.stringify(options)}`;
  walks[id] ??= walkToChampion(starter, options);
  return walks[id];
};
const SWITCHER = { switching: true };
const rate = (id, starter, seeds = 20) =>
  winRate(id, walk(starter, SWITCHER).before[id], { seeds, starter, switching: true });

describe('from the Storm Sigil to the Champion', () => {
  for (const starter of STARTER_IDS) {
    it(`${starter}: the Aerie Road is no wall — not even for a player who never switches`, () => {
      for (const options of [{}, SWITCHER]) {
        const { tries } = walk(starter, options);
        for (const id of ROAD) expect(tries[id], `${id} (${JSON.stringify(options)})`).toBeLessThanOrEqual(4);
      }
    });

    it(`${starter}: from the Lodge on, no fight is a wall`, () => {
      const { tries } = walk(starter, SWITCHER);
      for (const id of FINALE) expect(tries[id], `${id} took ${tries[id]} tries`).toBeLessThanOrEqual(4);
    });

    it(`${starter}: arrives at the Lodge with its team far behind its best, and leaves with six`, () => {
      const { before } = walk(starter, SWITCHER);
      const best = Math.max(...before.atTheAerie.map((c) => c.level));
      const worst = Math.min(...before.atTheAerie.map((c) => c.level));
      expect(best - worst).toBeGreaterThan(8);
      expect(before.afterLodge).toHaveLength(6);
      expect(AERIE_CATCHES[starter]).toHaveLength(5);
    });

    it(`${starter}: the Director is a real fight, and below the climax`, () => {
      const director = rate('vaneDirector', starter);
      expect(director).toBeGreaterThanOrEqual(0.5);
      expect(director).toBeGreaterThanOrEqual(rate('circleChampion', starter));
    });

    it(`${starter}: Kestrel's last meeting is a real fight — never a wall`, () => {
      const kestrel = rate('kestrelAerie', starter);
      expect(kestrel).toBeGreaterThanOrEqual(0.3);
      expect(kestrel).toBeLessThan(1);
    });

    it(`${starter}: the Trial climbs to the Champion — the hardest of the four, never a wall`, () => {
      const champion = rate('circleChampion', starter);
      expect(champion).toBeGreaterThanOrEqual(0.3);
      for (const id of ['circleAshby', 'circleMerrow', 'circleHale']) {
        expect(rate(id, starter), id).toBeGreaterThanOrEqual(champion);
      }
    });

    it(`${starter}: meets the Champion with its best Aether at the plan's level (about 35-42)`, () => {
      const best = Math.max(...walk(starter, SWITCHER).before.circleChampion.map((c) => c.level));
      expect(best).toBeGreaterThanOrEqual(35);
      expect(best).toBeLessThanOrEqual(42);
    });

    it(`${starter}: switching never makes the finale harder than not switching`, () => {
      const total = (options) => FINALE.reduce((sum, id) => sum + walk(starter, options).tries[id], 0);
      expect(total(SWITCHER)).toBeLessThanOrEqual(total({}));
    });
  }

  it('makes no starter\'s Champion a walk-over for all three — somebody is pushed hard', () => {
    const rates = STARTER_IDS.map((starter) => rate('circleChampion', starter));
    expect(Math.min(...rates)).toBeLessThanOrEqual(0.7);
  });
});
