/**
 * mistvaultBalance.test.js
 * ----------------------------------------------------------------------------
 * Can a real player get through Mistvault Cavern with the team Route 2 gave
 * them? Measured, through the real battle engine, by walking on from the top
 * of the Thornway (tests/helpers/routeWalk.js): Kestrel at the cordon, a few
 * wild Aethers in each part of the cave, every Vane Surveyor on the way and
 * the Draw Foreman at the breaker — with the experience the engine awards.
 *
 * "Viable" means no fight is a wall: a reasonable player who loses goes back
 * to the Mender and wins within a few tries. All three starters, both roads
 * round Route 2's bramble island, with and without the optional Brede.
 */

import { describe, it, expect } from 'vitest';
import { STARTER_IDS, CREATURES } from '../src/data/creatures.js';
import { ENCOUNTER_TABLES } from '../src/data/encounters.js';
import { MAPS } from '../src/data/maps/index.js';
import { getEffectiveness } from '../src/systems/TypeChart.js';
import { walkMistvault, MISTVAULT_ANSWER } from './helpers/routeWalk.js';
import { winRate } from './helpers/battleSim.js';

const VANE = ['vaneTallis', 'vaneBrede', 'vaneQuill', 'vaneTechnician', 'vaneForeman'];
const walks = {};
const walk = (starter, options = {}) => {
  const id = `${starter}:${JSON.stringify(options)}`;
  if (!walks[id]) walks[id] = walkMistvault(starter, options);
  return walks[id];
};

describe('walking Mistvault with the team Route 2 gave you', () => {
  for (const starter of STARTER_IDS) {
    for (const fork of ['west', 'east']) {
      it(`${starter}, ${fork} road on Route 2, every Vane trainer: no wall`, () => {
        const { tries } = walk(starter, { fork, optional: true });
        for (const id of ['kestrelRoute2', ...VANE]) {
          expect(tries[id], `${id} took ${tries[id]} tries`).toBeLessThanOrEqual(4);
        }
      });
    }

    it(`${starter}, skipping Brede: still no wall`, () => {
      const { tries } = walk(starter, { optional: false });
      expect(tries.vaneBrede).toBeUndefined();
      for (const id of ['vaneTallis', 'vaneQuill', 'vaneTechnician', 'vaneForeman']) {
        expect(tries[id], `${id} took ${tries[id]} tries`).toBeLessThanOrEqual(4);
      }
    });

    it(`${starter}: comes out of the cave at the levels the next leg is pitched for`, () => {
      const { team } = walk(starter, { optional: false });
      expect(team[0].level).toBeGreaterThanOrEqual(17);
      expect(team[0].level).toBeLessThanOrEqual(21);
    });
  }

  it('makes the Draw Foreman the hardest Vane fight, without being a wall', () => {
    for (const starter of STARTER_IDS) {
      const { team } = walk(starter, { optional: false });
      const foreman = winRate('vaneForeman', team, { seeds: 30, starter });
      expect(foreman, starter).toBeGreaterThanOrEqual(0.5);
      for (const id of ['vaneTallis', 'vaneQuill', 'vaneTechnician']) {
        expect(winRate(id, team, { seeds: 30, starter }), `${starter} ${id}`).toBeGreaterThanOrEqual(foreman);
      }
    }
  });
});

describe('the answer the Fire player is pointed at', () => {
  const answer = MISTVAULT_ANSWER.pyrret;

  it('is really there, at that level, in the Mouth\'s rubble', () => {
    const row = ENCOUNTER_TABLES[answer.habitat].find((entry) => entry.species === answer.species);
    expect(row).toBeDefined();
    expect(answer.level).toBeGreaterThanOrEqual(row.minLevel);
    expect(answer.level).toBeLessThanOrEqual(row.maxLevel);
    expect(MAPS.mistvaultMouth.encounters.table).toBe(answer.habitat);
  });

  it('is what Warden Ashby tells them to catch', () => {
    const ashby = MAPS.mistvaultMouth.npcs.find((n) => n.id === 'circleWarden');
    const said = ashby.dialogue.map((branch) => branch.pages.join(' ')).join(' ');
    expect(said).toMatch(/Delvit/);
  });

  it('really is the answer: Ground hits both Vane cave species hard', () => {
    const types = CREATURES[answer.species].types;
    for (const foe of ['gloamite', 'corrodit']) {
      expect(getEffectiveness(types[0], CREATURES[foe].types)).toBeGreaterThanOrEqual(2);
    }
  });

  it('is needed: without it, a Fire team that never switches is walled in the cave', () => {
    // This is WHY the hint exists — measured, so it stays honest if the cave
    // is rebalanced: if this starts failing, the hint can go.
    const { tries } = walk('pyrret', { optional: false, caveAnswer: false });
    const worst = Math.max(tries.vaneTechnician, tries.vaneForeman);
    expect(worst).toBeGreaterThan(4);
  });
});
