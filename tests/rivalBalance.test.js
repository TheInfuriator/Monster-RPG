/**
 * rivalBalance.test.js
 * ----------------------------------------------------------------------------
 * Is every meeting with Kestrel a real fight that every starter can win?
 *
 * Real battles through BattleEngine, seeded so they are reproducible, played
 * by the same sensible-player policy as the Hall's balance test (see
 * tests/helpers/battleSim.js). Kestrel always takes the starter that beats
 * the player's, so each measurement runs once per starter.
 *
 * THE THORNWAY GATE — Kestrel's Flittle 12, then their starter 13
 * (60 seeds each, measured when written):
 *
 *                                        Fire   Water  Grass
 *   starter 14 + Flittle 13 (post-Fern)   52%   100%    70%
 *   one level higher (15 + 14)            83%   100%   100%
 *   plus a third Route 1 capture         100%   100%    98%
 *   post-Fern, no potions                 30%   100%    10%
 *   the starter alone                      0%     0%     0%
 *
 * A coin flip at worst straight after Fern, comfortable one level or one
 * creature later, and never something the starter does alone — Kestrel's
 * starter beats it by design. A Water player's Flittle is super-effective on
 * Kestrel's Sproutle, which is why that column is easy; the Water player paid
 * for it at Fern.
 *
 * BELOW MISTVAULT — Gustwing 14, Grubbit 13, then the evolved starter 16.
 * Measured against the team a player really has at the top of Route 2, from
 * walking it through the engine (tests/helpers/routeWalk.js):
 *
 *   with the Aether the road points them at        87%   97%   97%
 *   with nothing new                                0%   95%    2%
 *
 * Like Fern for a lone Water starter, Kestrel's evolved counter is a wall for
 * a Fire or Grass player who brings nothing else — and Route 2 hands them the
 * answer on the way (Zaplet or Vinelet in the thickets for Fire; Delvit or
 * Pebblit on the scree for Grass), with people on the road saying so.
 *
 * The thresholds sit under the measured numbers with room for the noise of a
 * small tweak, and fail if a change turns a fight impossible or a walkover.
 * See GAME_DESIGN.md section 22.
 */

import { describe, it, expect } from 'vitest';
import { winRate } from './helpers/battleSim.js';
import { walkRoute2, ROUTE_2_ANSWER } from './helpers/routeWalk.js';
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
        expect(won, `starter 14 + ${PARTNER} 13 wins ${percent(won)}`).toBeGreaterThanOrEqual(0.4);
      });

      it('is comfortable a level later', () => {
        const won = rate(RIVAL, [[starter, 15], [PARTNER, 14]], starter);
        expect(won, `starter 15 + ${PARTNER} 14 wins ${percent(won)}`).toBeGreaterThanOrEqual(0.7);
      });

      it('is comfortable with a third creature', () => {
        const won = rate(RIVAL, [[starter, 14], [PARTNER, 13], [THIRD, 12]], starter);
        expect(won, `with a ${THIRD} as well it wins ${percent(won)}`).toBeGreaterThanOrEqual(0.8);
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

describe('Kestrel below Mistvault', () => {
  const RIVAL = 'kestrelRoute2';

  for (const starter of STARTER_IDS) {
    const answer = ROUTE_2_ANSWER[starter].species;

    it(`a ${starter} player who caught the ${answer} the road points at can win`, () => {
      const { team } = walkRoute2(starter);
      const won = rate(RIVAL, team, starter);
      expect(won, `the walked team wins ${percent(won)}`).toBeGreaterThanOrEqual(0.7);
    });
  }

  it('each starter has more than one answer on the road', () => {
    const alternatives = {
      pyrret: { species: 'vinelet', level: 15, habitat: 'route2Thicket' },
      sproutle: { species: 'pebblit', level: 15, habitat: 'route2Scree' },
    };
    for (const [starter, answer] of Object.entries(alternatives)) {
      const { team } = walkRoute2(starter, { answer });
      const won = rate(RIVAL, team, starter);
      expect(won, `${starter} with a ${answer.species} wins ${percent(won)}`).toBeGreaterThanOrEqual(0.7);
    }
  });

  it('asks Fire and Grass players for that answer: nothing new is not enough', () => {
    // Recorded deliberately, like a lone Water starter at Fern. If this
    // starts passing easily, the second meeting has lost its teeth.
    for (const starter of ['pyrret', 'sproutle']) {
      const { team } = walkRoute2(starter, { catchAnswer: false });
      expect(rate(RIVAL, team, starter, { seeds: 30 })).toBeLessThan(0.2);
    }
  });

  it('is winnable for a Water player either way — their Flittle already answers Bramblit', () => {
    const { team } = walkRoute2('drizzle', { catchAnswer: false });
    expect(rate(RIVAL, team, 'drizzle')).toBeGreaterThanOrEqual(0.7);
  });
});
