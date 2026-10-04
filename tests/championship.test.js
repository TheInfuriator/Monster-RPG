/**
 * championship.test.js
 * ----------------------------------------------------------------------------
 * The end of the main story (Phase 14): Kestrel's last meeting, the Circle's
 * Trial, Champion Seren, the ending and the credits — and every guard that
 * keeps them in order and makes them happen exactly once.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MAPS } from '../src/data/maps/index.js';
import { TRAINERS } from '../src/data/trainers.js';
import { STARTER_IDS, CREATURES, STARTER_MET_AT } from '../src/data/creatures.js';
import { TileMap } from '../src/systems/TileMap.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { createNewGameState } from '../src/core/GameState.js';
import {
  recordTrainerVictory, createTrainerBattleConfig, createTrainerParty,
} from '../src/systems/TrainerSystem.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { getRivalStarterBase, speciesAtLevel } from '../src/systems/RivalSystem.js';
import { createCreature, clearReservedInstanceIds } from '../src/systems/CreatureFactory.js';
import {
  shouldPlayEnding, beginEnding, isStoryComplete, buildEndingPages, buildCredits, findPartner,
  POST_STORY_DESTINATION, CHAMPIONSHIP_FLAG, STORY_COMPLETE_FLAG,
} from '../src/systems/EndingSystem.js';
import { createSaveFile, buildSaveMetadata } from '../src/save/SaveSchema.js';
import { validateSaveFile } from '../src/save/SaveValidator.js';
import { describeSlotLines } from '../src/ui/saveText.js';

const AERIE = MAPS.aerie;
const HALL = MAPS.circleHall;
const key = (x, y) => `${x},${y}`;
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const say = (entry, state) => resolveDialogue(entry.dialogue, getWorldConditions(state));
const top = (id) => Math.max(...TRAINERS[id].party.map((e) => e.level));
const WARDENS = ['circleAshby', 'circleIsla', 'circleHale'];

/**
 * The story at a milestone, built through the real systems.
 * Milestones, in order: 'gate', 'aerie', 'stopped', 'kestrel', 'wardens', 'champion', 'complete'.
 */
const MILESTONES = ['gate', 'aerie', 'stopped', 'kestrel', 'wardens', 'champion', 'complete'];
function storyAt(milestone, starter = 'sproutle') {
  const reached = (m) => MILESTONES.indexOf(milestone) >= MILESTONES.indexOf(m);
  const state = createNewGameState();
  state.starter = starter;
  state.party.push(createCreature(speciesAtLevel(starter, 36), 36, { metAt: "Warden's Lodge" }));
  state.party.push(createCreature('voltmane', 33, { nickname: 'Sparky' }));
  for (const sigil of ['verdantSigil', 'tidalSigil', 'stormSigil']) awardBadge(sigil, state);
  for (const id of ['kestrelThornway', 'kestrelRoute2', 'kestrelTidewatch', 'kestrelStormrise']) recordTrainerVictory(id, state);
  Object.assign(state.flags, { mistvaultSiphonStopped: true, stormriseRelayStopped: true });
  if (reached('aerie')) state.flags.aerieOpen = true;
  if (reached('stopped')) recordTrainerVictory('vaneDirector', state);
  if (reached('kestrel')) recordTrainerVictory('kestrelAerie', state);
  if (reached('wardens')) for (const id of WARDENS) recordTrainerVictory(id, state);
  if (reached('champion')) recordTrainerVictory('circleChampion', state);
  if (reached('complete')) beginEnding(state);
  return state;
}

function reachable(map, state, start, blocked = []) {
  const tiles = new TileMap(map);
  const conditions = getWorldConditions(state);
  tiles.setBarrierState(createBarrierState(map, { conditions, state }));
  const walls = new Set([
    ...map.npcs.filter((n) => isNpcPresent(n, conditions)).map((n) => key(n.x, n.y)),
    ...(map.interactables || []).map((e) => key(e.x, e.y)),
    ...blocked,
  ]);
  const seen = new Set([key(start.x, start.y)]);
  const queue = [start];
  while (queue.length > 0) {
    const { x, y } = queue.pop();
    for (const [dx, dy] of SIDES) {
      const id = key(x + dx, y + dy);
      if (seen.has(id) || walls.has(id) || !tiles.isWalkable(x + dx, y + dy)) continue;
      seen.add(id);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}
const nextTo = (seen, { x, y }) => SIDES.some(([dx, dy]) => seen.has(key(x + dx, y + dy)));

beforeEach(() => clearReservedInstanceIds());

// ---------------------------------------------------------------------------

describe('Kestrel, the fifth and last time', () => {
  const kestrel = AERIE.npcs.find((n) => n.id === 'kestrelAerie');
  const trainer = TRAINERS.kestrelAerie;

  it('waits on the Circle\'s Walk only once the Convergence is stopped', () => {
    expect(trainer.requires).toBe('convergenceStopped');
    expect(kestrel.presentWhen).toBe('convergenceStopped');
    expect(isNpcPresent(kestrel, getWorldConditions(storyAt('aerie')))).toBe(false);
    expect(isNpcPresent(kestrel, getWorldConditions(storyAt('stopped')))).toBe(true);
  });

  it('cannot be walked past: every way to the Hall crosses the tiles Kestrel watches', () => {
    const watched = [1, 2].map((d) => key(kestrel.x + d, kestrel.y));
    expect(kestrel.facing).toBe('right');
    expect(kestrel.sightRange).toBe(2);
    // Even with the Hall's gate open, nothing reaches it without crossing them.
    const state = storyAt('kestrel');
    const seen = reachable(AERIE, state, AERIE.spawnPoints.fromAerieRoad, watched);
    for (const exit of AERIE.exits.filter((e) => e.to === 'circleHall')) expect(seen.has(key(exit.x, exit.y))).toBe(false);
  });

  it('brings a full team of six — every old partner grown up, two new ones — and the starter last', () => {
    expect(trainer.party).toHaveLength(6);
    expect(trainer.party[5].rivalStarter).toBe(true);
    for (const species of ['gustwing', 'carapex', 'voltmane']) expect(trainer.party.map((p) => p.species)).toContain(species);
  });

  it('fields the starter in its FINAL form, for every starter the player could have taken', () => {
    const finals = new Set(Object.values(CREATURES).filter((c) => c.id.match(/^(emberax|torrentine|thornmane)$/)).map((c) => c.id));
    for (const starter of STARTER_IDS) {
      const state = { ...createNewGameState(), starter };
      const { base } = getRivalStarterBase('kestrel', state);
      const level = trainer.party[5].level;
      const species = speciesAtLevel(base, level);
      expect(finals.has(species), `${starter} -> ${species}`).toBe(true);
      expect(CREATURES[species].evolution).toBeFalsy();
      const party = createTrainerParty('kestrelAerie', { state });
      expect(party[5].speciesId).toBe(species);
    }
  });

  it('pays off the rivalry, win or lose', () => {
    expect(trainer.outro.join(' ')).toMatch(/kept up/);
    expect(trainer.victoryLines.join(' ')).toMatch(/Lodge/);
    const post = say(kestrel, storyAt('complete')).pages.join(' ');
    expect(post).toMatch(/Champion/);
    expect(post).toMatch(/surveys/);
  });
});

describe('the Circle\'s Trial', () => {
  const gates = { earthGate: 'circleAshby', seaGate: 'circleIsla', skyGate: 'circleHale' };

  it('opens its doors on the Aerie only after Kestrel — so never before the Hollow', () => {
    const doors = AERIE.barriers.find((b) => b.id === 'trialDoors');
    expect(doors.openWhen).toBe('trainer:kestrelAerie');
    const closedFor = (m) => createBarrierState(AERIE, { conditions: getWorldConditions(storyAt(m)), state: storyAt(m) }).trialDoors;
    expect(closedFor('aerie')).toBe(true);
    expect(closedFor('stopped')).toBe(true);
    expect(closedFor('kestrel')).toBe(false);
  });

  it('is fought in order: each chamber\'s gate opens once the Warden before it is beaten', () => {
    for (const [gate, warden] of Object.entries(gates)) {
      expect(HALL.barriers.find((b) => b.id === gate).openWhen).toBe(`trainer:${warden}`);
    }
    const champion = HALL.npcs.find((n) => n.trainer === 'circleChampion');
    const reach = (state) => reachable(HALL, state, HALL.spawnPoints.default);
    let state = storyAt('kestrel');
    const wardens = WARDENS.map((id) => HALL.npcs.find((n) => n.trainer === id));
    // Only the first Warden can be reached from the door...
    expect(wardens.map((w) => nextTo(reach(state), w))).toEqual([true, false, false]);
    expect(nextTo(reach(state), champion)).toBe(false);
    // ...and each win opens the way to the next.
    recordTrainerVictory('circleAshby', state);
    expect(wardens.map((w) => nextTo(reach(state), w))).toEqual([true, true, false]);
    recordTrainerVictory('circleIsla', state);
    expect(wardens.map((w) => nextTo(reach(state), w))).toEqual([true, true, true]);
    expect(nextTo(reach(state), champion)).toBe(false);
    recordTrainerVictory('circleHale', state);
    expect(nextTo(reach(state), champion)).toBe(true);
    // The way out is never shut.
    state = storyAt('wardens');
    expect(reach(state).has(key(HALL.exits[0].x, HALL.exits[0].y))).toBe(true);
  });

  it('has no Mender inside, and its doors lead straight back out to the Aerie and the Lodge', () => {
    const actions = HALL.npcs.flatMap((n) => n.dialogue.map((b) => b.action)).filter(Boolean);
    expect(actions).not.toContain('heal');
    expect(HALL.exits.every((e) => e.to === 'aerie')).toBe(true);
    expect(AERIE.exits.some((e) => e.to === 'aerieLodge')).toBe(true);
  });

  it('says its rules plainly, inside and out', () => {
    const steward = HALL.npcs.find((n) => n.id === 'hallSteward');
    const text = say(steward, storyAt('kestrel')).pages.join(' ');
    for (const rule of [/in order/, /no Mender/, /Bag/, /never lock/, /stays beaten/, /wake/]) expect(text).toMatch(rule);
  });

  it('has three Wardens of the Circle — the earth, the sea, the sky — each spoken to, like a Leader', () => {
    expect(WARDENS.map((id) => TRAINERS[id].title)).toEqual(['Earth Warden', 'Sea Warden', 'Sky Warden']);
    for (const id of WARDENS) {
      const entry = HALL.npcs.find((n) => n.trainer === id);
      expect(entry.sightRange).toBeUndefined();
      expect(TRAINERS[id].party.length).toBe(4);
    }
    // Familiar faces: the Wardens of Mistvault and the Climb.
    expect(TRAINERS.circleAshby.name).toBe('Ashby');
    expect(TRAINERS.circleHale.name).toBe('Hale');
  });

  it('climbs: each Warden stronger than the last, and the Champion strongest of all', () => {
    expect(top('circleIsla')).toBeGreaterThanOrEqual(top('circleAshby'));
    expect(top('circleHale')).toBeGreaterThanOrEqual(top('circleIsla'));
    for (const id of [...WARDENS, 'kestrelAerie', 'vaneDirector']) expect(top('circleChampion')).toBeGreaterThan(top(id));
  });
});

describe('Champion Seren', () => {
  const trainer = TRAINERS.circleChampion;

  it('is original, with a full team of six — no starters, no boosts', () => {
    expect(trainer.name).toBe('Seren');
    expect(trainer.title).toBe('Champion');
    expect(trainer.party).toHaveLength(6);
    for (const entry of trainer.party) {
      expect(Object.keys(entry).sort()).toEqual(['level', 'species']);
      expect(STARTER_IDS.some((s) => speciesAtLevel(s, 100) === entry.species || s === entry.species)).toBe(false);
    }
  });

  it('sets championshipWon by the win, once — and nothing else in the game does', () => {
    expect(trainer.setFlags).toEqual([CHAMPIONSHIP_FLAG]);
    const setters = (flag) => {
      const found = Object.values(TRAINERS).filter((t) => (t.setFlags || []).includes(flag)).map((t) => t.id);
      for (const map of Object.values(MAPS)) {
        for (const entry of [...(map.npcs || []), ...(map.interactables || [])]) {
          for (const branch of Array.isArray(entry.dialogue) ? entry.dialogue : []) {
            if (branch && (branch.setFlags || []).includes(flag)) found.push(`${map.id}:${entry.id}`);
          }
        }
      }
      return found;
    };
    expect(setters(CHAMPIONSHIP_FLAG)).toEqual(['circleChampion']);
    // storyComplete is set only by EndingSystem.beginEnding — no data sets it.
    expect(setters(STORY_COMPLETE_FLAG)).toEqual([]);
  });

  it('is an ordinary battle: a loss is an ordinary blackout, with something to say first', () => {
    const config = createTrainerBattleConfig('circleChampion', [createCreature('drizzle', 36)]);
    expect(config.blackoutOnDefeat).toBe(true);
    expect(config.canRun).toBe(false);
    expect(trainer.victoryLines.join(' ')).toMatch(/Lodge/);
  });
});

describe('the ending', () => {
  it('is owed once the Champion is beaten — and only then', () => {
    for (const m of ['gate', 'aerie', 'stopped', 'kestrel', 'wardens']) expect(shouldPlayEnding(storyAt(m)), m).toBe(false);
    expect(shouldPlayEnding(storyAt('champion'))).toBe(true);
    expect(shouldPlayEnding(storyAt('complete'))).toBe(false);
  });

  it('begins exactly once: it completes the story and heals the team, and refuses a second time', () => {
    const state = storyAt('champion');
    state.party[0].currentHp = 1;
    expect(isStoryComplete(state)).toBe(false);
    expect(beginEnding(state)).toEqual({ started: true });
    expect(isStoryComplete(state)).toBe(true);
    expect(state.party[0].currentHp).toBe(state.party[0].stats.hp);
    state.party[0].currentHp = 1;
    expect(beginEnding(state)).toEqual({ started: false });
    expect(state.party[0].currentHp).toBe(1);
  });

  it('cannot run without the Champion, whatever else is true', () => {
    const state = storyAt('wardens');
    expect(beginEnding(state)).toEqual({ started: false });
    expect(isStoryComplete(state)).toBe(false);
  });

  it('is concise, and names the player\'s own partner', () => {
    const pages = buildEndingPages(storyAt('champion'));
    expect(pages.length).toBeGreaterThanOrEqual(5);
    expect(pages.length).toBeLessThanOrEqual(10);
    expect(pages.map((p) => p.text).join(' ')).toMatch(/Thornmane, who had walked out of the Warden's Lodge/);
    for (const page of pages) expect(['aerie', 'valley', 'wellspring', 'partner']).toContain(page.scene);
  });

  it('names and draws the same partner — the starter, even from storage, else the party\'s lead', () => {
    const state = storyAt('champion');
    const starter = findPartner(state);
    expect(starter.metAt).toBe(STARTER_MET_AT);
    // Deposited: the starter is still the partner, not whoever leads now.
    state.party = state.party.filter((c) => c !== starter);
    state.storage = [...(state.storage || []), starter];
    expect(findPartner(state)).toBe(starter);
    // Released for good: the party's lead stands in, in words and picture alike.
    state.storage = state.storage.filter((c) => c !== starter);
    expect(findPartner(state)).toBe(state.party[0]);
    const words = buildEndingPages(state).map((p) => p.text).join(' ');
    expect(words).toContain(state.party[0].nickname || CREATURES[state.party[0].speciesId].name);
    expect(words).not.toMatch(/walked out of the Warden's Lodge/);
  });

  it('sets the player down outside the Circle Hall, on open ground, free to go anywhere', () => {
    const { mapId, spawn } = POST_STORY_DESTINATION;
    const point = MAPS[mapId].spawnPoints[spawn];
    const state = storyAt('complete');
    const seen = reachable(MAPS[mapId], state, point);
    for (const exit of MAPS[mapId].exits) expect(seen.has(key(exit.x, exit.y)), exit.to).toBe(true);
  });
});

describe('the credits', () => {
  const credits = buildCredits(storyAt('complete'));
  const text = credits.flatMap((b) => [b.heading || '', ...b.lines]).join('\n');

  it('credit only real people and real software — nobody invented', () => {
    // The only people named: the project's author, and Phaser's author (from its licence).
    expect(text).toMatch(/TheInfuriator/);
    expect(text).toMatch(/Claude Code, by Anthropic/);
    expect(text).toMatch(/Phaser 3/);
    expect(text).toMatch(/Richard Davey and Phaser Studio Inc\./);
    for (const tool of ['Vite', 'Vitest', 'ESLint']) expect(text).toContain(tool);
    const headings = credits.map((b) => b.heading);
    expect(headings).not.toContain('Music');
    expect(text).not.toMatch(/Composer|Producer|Artist:|QA Lead/);
  });

  it('close with the player\'s own team, by name', () => {
    const team = credits.find((b) => b.heading === 'Your team');
    expect(team.lines).toEqual(['Thornmane, level 36', 'Sparky the Voltmane, level 33']);
  });
});

describe('the story can only go forward, in order', () => {
  it('opens the Aerie only for three Sigils', () => {
    const envoy = MAPS.voltspire.npcs.find((n) => n.id === 'circleEnvoy');
    const state = storyAt('gate');
    state.badges = state.badges.filter((b) => b !== 'stormSigil');
    expect(isNpcPresent(envoy, getWorldConditions(state))).toBe(false);
  });

  it('keeps the core shut until all three banks are vented, or the Convergence is stopped', () => {
    const door = (puzzles, flags = {}) => createBarrierState(MAPS.hollowWorks, {
      conditions: flags, state: { puzzles: { hollowWorks: puzzles } },
    }).coreDoor;
    expect(door({ earthBank: true, seaBank: true })).toBe(true);
    expect(door({ earthBank: true, seaBank: true, stormBank: true })).toBe(false);
    expect(door({}, { convergenceStopped: true })).toBe(false);
  });

  it('cannot reach the ending without passing every step before it', () => {
    // championshipWon comes only from Seren; Seren only past Hale's gate; the
    // Trial only past Kestrel; Kestrel only after the Convergence is stopped;
    // that only by beating Thale; the Hollow only through the Aerie Gate.
    expect(TRAINERS.circleChampion.setFlags).toEqual(['championshipWon']);
    expect(HALL.barriers.find((b) => b.id === 'skyGate').openWhen).toBe('trainer:circleHale');
    expect(AERIE.barriers.find((b) => b.id === 'trialDoors').openWhen).toBe('trainer:kestrelAerie');
    expect(TRAINERS.kestrelAerie.requires).toBe('convergenceStopped');
    expect(TRAINERS.vaneDirector.setFlags).toEqual(['convergenceStopped']);
    expect(MAPS.voltspire.barriers.find((b) => b.id === 'aerieGate').openWhen).toBe('aerieOpen');
  });
});

describe('the finale persists', () => {
  it('round-trips every milestone through a save file exactly', () => {
    for (const milestone of MILESTONES) {
      const state = storyAt(milestone);
      const file = JSON.parse(JSON.stringify(createSaveFile(state, { savedAt: 1 })));
      const result = validateSaveFile(file);
      expect(result.ok, `${milestone}: ${result.errors.join(' ')}`).toBe(true);
      expect(result.warnings, milestone).toEqual([]);
      expect(result.state.flags).toEqual(state.flags);
      expect(result.state.defeatedTrainers).toEqual(state.defeatedTrainers);
      expect(result.state.badges).toEqual(state.badges);
    }
  });

  it('says "Champion" on the save slot once the story is complete, and not before', () => {
    const line = (m) => describeSlotLines({ slot: 'manual', status: 'valid', metadata: buildSaveMetadata(storyAt(m)) })[0];
    expect(line('champion')).not.toMatch(/Champion/);
    expect(line('complete')).toMatch(/Champion/);
  });

  it('reads an older summary with no champion field as "not yet"', () => {
    const file = JSON.parse(JSON.stringify(createSaveFile(storyAt('wardens'), { savedAt: 1 })));
    delete file.metadata.champion;
    const result = validateSaveFile(file);
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.metadata.champion).toBeUndefined();
  });

  it('leaves the world changed after the story: a modest set of people react', () => {
    const state = storyAt('complete');
    const reacting = [];
    for (const map of Object.values(MAPS)) {
      for (const entry of map.npcs || []) {
        const branches = Array.isArray(entry.dialogue) ? entry.dialogue : [];
        if (branches.some((b) => b && b.when === 'storyComplete')) reacting.push(`${map.id}:${entry.id}`);
      }
    }
    expect(reacting.length).toBeGreaterThanOrEqual(8);
    const wick = AERIE.npcs.find((n) => n.id === 'wickAerie');
    expect(isNpcPresent(wick, getWorldConditions(state))).toBe(true);
    expect(isNpcPresent(wick, getWorldConditions(storyAt('champion')))).toBe(false);
  });
});
