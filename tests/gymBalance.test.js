/**
 * gymBalance.test.js
 * ----------------------------------------------------------------------------
 * Is the first Beacon Hall winnable, whichever starter you chose?
 *
 * This plays REAL battles through BattleEngine — hundreds of them, seeded so
 * they are reproducible — driven by a policy that stands in for a reasonable
 * player: pick the move that will hurt most right now, send out the next
 * creature when one faints, and use a Super Potion when badly hurt. Not an
 * expert, not a button-masher.
 *
 * WHY A TEST AND NOT A ONE-OFF MEASUREMENT
 * Balance rots silently. A tweak to a move's power, a creature's stats or
 * Fern's levels can quietly turn "a real fight" into "impossible", and nothing
 * else in the suite would notice. These numbers are the guard rail.
 *
 * WHAT THEY ESTABLISH
 * The Verdant Hall is a GRASS Hall, so it asks the player to bring an answer.
 * With one ordinary Route 1 capture, every starter beats Fern comfortably.
 * A Fire starter can do it alone; a Water one cannot at the levels the Hall is
 * pitched at, because Water is resisted by all three of her team — which is the
 * point of a type-themed Hall, and which three separate NPCs say out loud. See
 * GAME_DESIGN.md section 20.
 */

import { describe, it, expect } from 'vitest';
import { TRAINERS } from '../src/data/trainers.js';
import { ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { SHOPS } from '../src/data/shops.js';
// The battle driver is shared with the rival and Route 2 balance tests, so all
// of them measure the same player. (Phase 11: it used to live here, and read
// `entry.power` off a creature's move entry — which only holds { id, pp,
// maxPp } — so it never found a damaging move and always used the FIRST one.
// The numbers below were re-measured with the fixed driver.)
import { winRate } from './helpers/battleSim.js';

// The three starters, and the capture the world points every player at.
const STARTERS = [
  ['Fire', 'pyrret'],
  ['Water', 'drizzle'],
  ['Grass', 'sproutle'],
];
/** Route 1's second most common Aether, and it knows Peck from level 1. */
const ROUTE_1_PARTNER = 'flittle';

// ---------------------------------------------------------------------------
// The Hall's own numbers
// ---------------------------------------------------------------------------

describe('the Verdant Hall\'s roster', () => {
  it('fields the canonical Fern team', () => {
    expect(TRAINERS.verdantLeaderFern.party).toEqual([
      { species: 'vinelet', level: 11 },
      { species: 'puffcap', level: 11 },
      { species: 'ivorn', level: 13 },
    ]);
  });

  it('keeps the Gardeners inside the documented 8-10 band', () => {
    for (const id of ['verdantGardenerTeal', 'verdantGardenerBracken']) {
      for (const entry of TRAINERS[id].party) {
        expect(entry.level, `${id} fields a level ${entry.level}`).toBeGreaterThanOrEqual(8);
        expect(entry.level).toBeLessThanOrEqual(10);
      }
    }
  });

  it('puts the Leader above her own Gardeners', () => {
    const gardenerTop = Math.max(
      ...['verdantGardenerTeal', 'verdantGardenerBracken']
        .flatMap((id) => TRAINERS[id].party.map((e) => e.level))
    );
    const fernTop = Math.max(...TRAINERS.verdantLeaderFern.party.map((e) => e.level));
    expect(fernTop).toBeGreaterThan(gardenerTop);
  });

  it('is a step up from Route 1 without being a leap', () => {
    const routeTop = Math.max(
      ...Object.values(TRAINERS)
        .filter((t) => t.id.startsWith('route1'))
        .flatMap((t) => t.party.map((e) => e.level))
    );
    const hallLow = Math.min(
      ...['verdantGardenerTeal', 'verdantGardenerBracken', 'verdantLeaderFern']
        .flatMap((id) => TRAINERS[id].party.map((e) => e.level))
    );
    expect(hallLow).toBeGreaterThanOrEqual(routeTop);
    expect(hallLow).toBeLessThanOrEqual(routeTop + 2);
  });
});

// ---------------------------------------------------------------------------
// The answer the world hands you
// ---------------------------------------------------------------------------

describe('the answer to a Grass Hall is available before you reach it', () => {
  it('Route 1 really does turn up the partner the town keeps mentioning', () => {
    const entry = ENCOUNTER_TABLES.route1.find((row) => row.species === ROUTE_1_PARTNER);
    expect(entry, 'Flittle is not on Route 1 any more').toBeDefined();

    const total = ENCOUNTER_TABLES.route1.reduce((sum, row) => sum + row.weight, 0);
    // Common enough that a player walking the route will meet one.
    expect(entry.weight / total).toBeGreaterThan(0.15);
  });

  it('sells orbs from the first town, so catching one costs nothing but coins', () => {
    expect(SHOPS.emberhollowSupplyPost.stock.some((row) => row.item === 'basicOrb')).toBe(true);
  });

  it('sells the healing that makes the Hall survivable', () => {
    const shelf = SHOPS.thistlewoodSupplyPost.stock.map((row) => row.item);
    expect(shelf).toContain('superPotion');
    expect(shelf).toContain('greatOrb');
  });
});

// ---------------------------------------------------------------------------
// Every starter has a route
// ---------------------------------------------------------------------------

describe('every starter can win the Verdant Sigil', () => {
  // What a player plausibly walks in with: a starter at the top of the
  // documented 10-13 band, one Route 1 capture, and shop potions.
  for (const [type, species] of STARTERS) {
    it(`${type} (${species}) beats Fern with a Route 1 partner`, () => {
      const rate = winRate('verdantLeaderFern', [[species, 13], [ROUTE_1_PARTNER, 12]]);
      expect(
        rate,
        `${species} + ${ROUTE_1_PARTNER} wins only ${Math.round(rate * 100)}% of the time`
      ).toBeGreaterThanOrEqual(0.4);
    });

    it(`${type} (${species}) beats a Gardener with a Route 1 partner`, () => {
      const rate = winRate('verdantGardenerTeal', [[species, 11], [ROUTE_1_PARTNER, 10]], {
        potions: 0,
      });
      expect(rate, `${species} wins only ${Math.round(rate * 100)}% of Teal`)
        .toBeGreaterThanOrEqual(0.5);
    });
  }

  it('is comfortable for everyone two levels later', () => {
    for (const [, species] of STARTERS) {
      const rate = winRate('verdantLeaderFern', [[species, 15], [ROUTE_1_PARTNER, 14]]);
      expect(rate, `${species} at 15 wins only ${Math.round(rate * 100)}%`)
        .toBeGreaterThanOrEqual(0.6);
    }
  });

  it('is not a walkover for anyone at the bottom of the band', () => {
    // A Hall that every starter clears 100% of the time at level 11 with no
    // items would not be a Hall. This is the other side of the guard rail.
    const rates = STARTERS.map(([, species]) =>
      winRate('verdantLeaderFern', [[species, 11], [ROUTE_1_PARTNER, 10]], { potions: 0 }));
    expect(Math.min(...rates)).toBeLessThan(1);
  });
});

describe('a type-themed Hall asks for a second creature', () => {
  it('a Fire starter can do it alone, because Fire is the Hall\'s weakness', () => {
    expect(winRate('verdantLeaderFern', [['pyrret', 15]])).toBeGreaterThan(0.5);
  });

  it('a Water starter cannot, within the levels the Hall is pitched at', () => {
    // Recorded deliberately. It is the designed shape of a type-themed Hall,
    // not an oversight: Water is 0.5x against every creature Fern fields and
    // Drizzle carries no coverage, so levelling alone barely moves the needle.
    // Three NPCs in Thistlewood say to bring something with wings, Route 1
    // supplies it, and the test below proves that answer works. If a solo
    // Water starter ever becomes a real route, the Hall's identity has changed
    // and this file should be revisited.
    for (const level of [13, 15, 17]) {
      const rate = winRate('verdantLeaderFern', [['drizzle', level]], { seeds: 20 });
      expect(
        rate,
        `a solo Drizzle at ${level} now wins ${Math.round(rate * 100)}% — has Fern changed?`
      ).toBeLessThan(0.15);
    }
  });

  it('and the partner turns that around completely', () => {
    expect(winRate('verdantLeaderFern', [['drizzle', 13], [ROUTE_1_PARTNER, 12]]))
      .toBeGreaterThanOrEqual(0.4);
  });
});
