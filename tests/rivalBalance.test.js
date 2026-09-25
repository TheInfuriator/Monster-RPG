/**
 * rivalBalance.test.js
 * ----------------------------------------------------------------------------
 * Is every meeting with Kestrel a real fight that every starter can win?
 *
 * Real battles through BattleEngine, seeded so they are reproducible, played
 * by the same sensible-player policy as tests/gymBalance.test.js (see
 * tests/helpers/battleSim.js). Kestrel always takes the starter that beats
 * the player's, so each measurement runs once per starter with the matching
 * rival team.
 *
 * WHAT THE NUMBERS ESTABLISH (60 seeds each, measured when written)
 * The Thornway, Kestrel's Flittle 12 then their starter 14:
 *
 *                                        Fire   Water  Grass
 *   starter 14 + Flittle 13 (post-Fern)   47%   100%    48%
 *   one level higher (15 + 14)            73%   100%    83%
 *   plus a third Route 1 capture          82%   100%    95%
 *   post-Fern, no potions                 28%   100%    15%
 *   the starter alone                      2%     0%     0%
 *
 * So: a coin flip for the two starters whose Flittle is no answer to
 * Kestrel's, comfortable one level or one creature later, and never
 * something the starter does alone — the rival's starter beats it by design.
 * A Water player's Flittle is super-effective on Kestrel's Sproutle, which is
 * why that column is easy; the Water player paid for it at Fern.
 *
 * The thresholds below sit under the measured numbers with room for the
 * noise of a small tweak, and fail if a change moves a fight into
 * "impossible" or "walkover". See GAME_DESIGN.md section 22.
 */

import { describe, it, expect } from 'vitest';
import { winRate } from './helpers/battleSim.js';
import { STARTER_IDS } from '../src/data/creatures.js';

const SEEDS = 60;
const PARTNER = 'flittle';
const THIRD = 'nibbit';

const rate = (trainerId, party, starter, options = {}) =>
  winRate(trainerId, party, { seeds: SEEDS, starter, ...options });

const percent = (value) => `${Math.round(value * 100)}%`;

describe('Kestrel at the Thornway gate', () => {
  const RIVAL = 'kestrelThornway';

  for (const starter of STARTER_IDS) {
    describe(`a ${starter} player`, () => {
      it('can win straight after Fern, without grinding', () => {
        const won = rate(RIVAL, [[starter, 14], [PARTNER, 13]], starter);
        expect(won, `starter 14 + ${PARTNER} 13 wins ${percent(won)}`).toBeGreaterThanOrEqual(0.35);
      });

      it('is comfortable a level later', () => {
        const won = rate(RIVAL, [[starter, 15], [PARTNER, 14]], starter);
        expect(won, `starter 15 + ${PARTNER} 14 wins ${percent(won)}`).toBeGreaterThanOrEqual(0.6);
      });

      it('is comfortable with a third creature', () => {
        const won = rate(RIVAL, [[starter, 14], [PARTNER, 13], [THIRD, 12]], starter);
        expect(won, `with a ${THIRD} as well it wins ${percent(won)}`).toBeGreaterThanOrEqual(0.7);
      });

      it('cannot do it with the starter alone — Kestrel took the one that beats it', () => {
        const won = rate(RIVAL, [[starter, 14]], starter, { seeds: 30 });
        expect(won, `a lone starter wins ${percent(won)}`).toBeLessThanOrEqual(0.1);
      });
    });
  }

  it('is not a walkover for everyone', () => {
    // Without potions, at least one starter has a genuinely hard time.
    const rates = STARTER_IDS.map((starter) =>
      rate(RIVAL, [[starter, 14], [PARTNER, 13]], starter, { potions: 0 }));
    expect(Math.min(...rates)).toBeLessThan(0.5);
  });

  it('is harder than the last trainer on Route 1, for the starters it counters hardest', () => {
    for (const starter of ['pyrret', 'sproutle']) {
      const team = [[starter, 14], [PARTNER, 13]];
      expect(rate(RIVAL, team, starter)).toBeLessThan(rate('route1Aspirant', team, starter));
    }
  });
});
