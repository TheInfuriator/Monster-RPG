/**
 * Tests for Kestrel, the rival: who they pick, what they field, when they are
 * standing there, and what beating them does.
 *
 * Everything the rival depends on is pure — the starter mapping, the family
 * walk, the save fallback, NPC presence, the gate — so each rule is checked
 * here directly rather than by playing to the Thornway and hoping to notice.
 * The fights themselves are measured in tests/rivalBalance.test.js.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { RIVALS, getRival } from '../src/data/rivals.js';
import {
  getFamilyBase, speciesAtLevel, findLodgeStarter, getPlayerStarter,
  getRivalStarterBase, resolvePartyEntry,
} from '../src/systems/RivalSystem.js';
import { CREATURES, STARTER_IDS, STARTER_MET_AT, getSpecies } from '../src/data/creatures.js';
import { TRAINERS, findTrainerProblems } from '../src/data/trainers.js';
import {
  createTrainerParty, createTrainerBattleConfig, recordTrainerVictory, isTrainerDefeated,
} from '../src/systems/TrainerSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import { isNpcPresent } from '../src/systems/NpcPresence.js';
import { createBarrierState } from '../src/systems/PuzzleSystem.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { getEffectiveness } from '../src/systems/TypeChart.js';
import { createNewGameState } from '../src/core/GameState.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { awardBadge } from '../src/systems/BadgeSystem.js';
import { TileMap } from '../src/systems/TileMap.js';
import { MAPS } from '../src/data/maps/index.js';
import { DIRECTION_VECTORS } from '../src/config/controls.js';

afterEach(() => vi.restoreAllMocks());

const stateWith = (starter) => ({ ...createNewGameState(), starter });
const lodgeCreature = (speciesId, level = 5) =>
  createCreature(speciesId, level, { metAt: STARTER_MET_AT });
const rivalMeetings = () => Object.values(TRAINERS).filter((trainer) => trainer.rival);

// ---------------------------------------------------------------------------
// The rival's data
// ---------------------------------------------------------------------------

describe('Kestrel\'s data', () => {
  const kestrel = RIVALS.kestrel;

  it('is looked up by id', () => {
    expect(getRival('kestrel')).toBe(kestrel);
    expect(kestrel.id).toBe('kestrel');
    expect(kestrel.name).toBe('Kestrel');
  });

  it('warns and returns null for a rival that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getRival('nobody')).toBeNull();
    expect(getRival(undefined)).toBeNull();
    // Not fooled by names every object has.
    expect(getRival('toString')).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('answers every starter the player could take, and only those', () => {
    expect(Object.keys(kestrel.starterFor).sort()).toEqual([...STARTER_IDS].sort());
  });

  it('always takes a starter, and never the same one as the player', () => {
    for (const [player, rival] of Object.entries(kestrel.starterFor)) {
      expect(STARTER_IDS).toContain(rival);
      expect(rival).not.toBe(player);
    }
  });

  it('takes each starter exactly once, so the three are a cycle', () => {
    expect(new Set(Object.values(kestrel.starterFor)).size).toBe(STARTER_IDS.length);
  });

  it('takes the starter STRONG AGAINST the player\'s, as GAME_DESIGN.md says', () => {
    for (const [player, rival] of Object.entries(kestrel.starterFor)) {
      const rivalType = getSpecies(rival).types[0];
      const playerType = getSpecies(player).types[0];
      expect(
        getEffectiveness(rivalType, getSpecies(player).types),
        `${rival} (${rivalType}) does not beat ${player}`
      ).toBeGreaterThan(1);
      expect(getEffectiveness(playerType, getSpecies(rival).types)).toBeLessThan(1);
    }
  });

  it('matches the canonical Fire -> Water -> Grass -> Fire mapping', () => {
    expect(kestrel.starterFor).toEqual({ pyrret: 'drizzle', drizzle: 'sproutle', sproutle: 'pyrret' });
  });

  it('has a fallback starter and a look that exist', () => {
    expect(STARTER_IDS).toContain(kestrel.fallbackStarter);
    expect(kestrel.sprite).toBe('rival');
  });
});

// ---------------------------------------------------------------------------
// Families and levels
// ---------------------------------------------------------------------------

describe('creature families', () => {
  it('finds the first stage of any family member', () => {
    for (const starter of STARTER_IDS) {
      const second = getSpecies(starter).evolution.to;
      const third = getSpecies(second).evolution.to;
      expect(getFamilyBase(starter)).toBe(starter);
      expect(getFamilyBase(second)).toBe(starter);
      expect(getFamilyBase(third)).toBe(starter);
    }
  });

  it('treats a creature that never evolves as its own family', () => {
    const loner = Object.keys(CREATURES).find(
      (id) => !CREATURES[id].evolution && getFamilyBase(id) === id
    );
    expect(loner).toBeDefined();
  });

  it('returns null for a species that does not exist', () => {
    expect(getFamilyBase('nothing')).toBeNull();
    expect(getFamilyBase(undefined)).toBeNull();
    expect(getFamilyBase('constructor')).toBeNull();
  });
});

describe('what a family looks like at a given level', () => {
  it('follows the species data exactly, stage by stage', () => {
    for (const starter of STARTER_IDS) {
      const first = getSpecies(starter).evolution;
      const second = getSpecies(first.to).evolution;

      expect(speciesAtLevel(starter, 5)).toBe(starter);
      expect(speciesAtLevel(starter, first.level - 1)).toBe(starter);
      expect(speciesAtLevel(starter, first.level)).toBe(first.to);
      expect(speciesAtLevel(starter, second.level - 1)).toBe(first.to);
      expect(speciesAtLevel(starter, second.level)).toBe(second.to);
      expect(speciesAtLevel(starter, 100)).toBe(second.to);
    }
  });

  it('never evolves a creature that does not evolve', () => {
    expect(speciesAtLevel('wispel', 100)).toBe('wispel');
  });

  it('returns null for a species that does not exist', () => {
    expect(speciesAtLevel('nothing', 20)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Which starter did the player take?
// ---------------------------------------------------------------------------

describe('the player\'s starter', () => {
  it('is whatever the save says, when it says something valid', () => {
    for (const starter of STARTER_IDS) {
      expect(getPlayerStarter(stateWith(starter))).toBe(starter);
    }
  });

  it('is recovered from the creature met at the Warden\'s Lodge when the save is silent', () => {
    const state = stateWith(null);
    state.party.push(createCreature('flittle', 8), lodgeCreature('sproutle'));
    expect(getPlayerStarter(state)).toBe('sproutle');
  });

  it('is recovered even after it evolved', () => {
    const state = stateWith(null);
    state.party.push(lodgeCreature('cindraw', 18));
    expect(findLodgeStarter(state)).toBe('pyrret');
  });

  it('is recovered even from storage', () => {
    const state = stateWith(null);
    state.party.push(createCreature('flittle', 8));
    state.storage.push(lodgeCreature('drizzle'));
    expect(findLodgeStarter(state)).toBe('drizzle');
  });

  it('ignores anything else met at the Lodge that is not a starter', () => {
    const state = stateWith(null);
    state.party.push(lodgeCreature('flittle'));
    expect(findLodgeStarter(state)).toBeNull();
  });

  it('ignores a starter species caught somewhere else', () => {
    const state = stateWith(null);
    state.party.push(createCreature('pyrret', 5, { metAt: 'Route 1 — Cinderpath' }));
    expect(findLodgeStarter(state)).toBeNull();
  });

  it('prefers the recorded starter over the creatures', () => {
    const state = stateWith('drizzle');
    state.party.push(lodgeCreature('pyrret'));
    expect(getPlayerStarter(state)).toBe('drizzle');
  });

  it('ignores a recorded starter that is not a starter', () => {
    const state = stateWith('flittle');
    state.party.push(lodgeCreature('sproutle'));
    expect(getPlayerStarter(state)).toBe('sproutle');
  });

  it('is null when nothing can tell, and never throws on junk', () => {
    expect(getPlayerStarter(stateWith(null))).toBeNull();
    expect(findLodgeStarter({})).toBeNull();
    expect(findLodgeStarter(null)).toBeNull();
    expect(findLodgeStarter({ party: [null, 7, {}], storage: 'no' })).toBeNull();
  });

  it('is a world condition, so dialogue and NPCs can follow it', () => {
    expect(getWorldConditions(stateWith('drizzle'))['starter:drizzle']).toBe(true);
    expect(getWorldConditions(stateWith('drizzle'))['starter:pyrret']).toBeUndefined();
    const none = Object.keys(getWorldConditions(stateWith(null)));
    expect(none.some((key) => key.startsWith('starter:'))).toBe(false);
  });
});

describe('the rival\'s starter', () => {
  it('counters the player\'s starter, per the one mapping', () => {
    for (const starter of STARTER_IDS) {
      expect(getRivalStarterBase('kestrel', stateWith(starter)))
        .toEqual({ base: RIVALS.kestrel.starterFor[starter], fallback: false });
    }
  });

  it('warns and falls back, rather than refusing the battle, when nothing can tell', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getRivalStarterBase('kestrel', stateWith(null)))
      .toEqual({ base: RIVALS.kestrel.fallbackStarter, fallback: true });
    expect(warn).toHaveBeenCalledOnce();
  });

  it('is nothing at all for an unknown rival', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getRivalStarterBase('nobody', stateWith('pyrret')).base).toBeNull();
  });
});

describe('a rival party entry', () => {
  const trainer = { id: 'test', rival: 'kestrel' };

  it('resolves the starter slot to the right species at that level', () => {
    const state = stateWith('pyrret');
    expect(resolvePartyEntry({ rivalStarter: true, level: 12 }, trainer, state))
      .toEqual({ species: 'drizzle', level: 12, nickname: null });
    // Past the evolution level, the species data evolves it — nothing else does.
    const evolveAt = getSpecies('drizzle').evolution;
    expect(resolvePartyEntry({ rivalStarter: true, level: evolveAt.level }, trainer, state).species)
      .toBe(evolveAt.to);
  });

  it('passes an ordinary entry straight through', () => {
    expect(resolvePartyEntry({ species: 'flittle', level: 9, nickname: 'Zip' }, trainer, stateWith('pyrret')))
      .toEqual({ species: 'flittle', level: 9, nickname: 'Zip' });
  });

  it('never depends on the player for an ordinary entry', () => {
    const entry = { species: 'grubbit', level: 12 };
    const answers = STARTER_IDS.map((s) => resolvePartyEntry(entry, trainer, stateWith(s)).species);
    expect(new Set(answers)).toEqual(new Set(['grubbit']));
  });
});

// ---------------------------------------------------------------------------
// The meetings
// ---------------------------------------------------------------------------

describe('every rival meeting', () => {
  it('there is at least one', () => {
    expect(rivalMeetings().length).toBeGreaterThan(0);
  });

  for (const trainer of Object.values(TRAINERS).filter((t) => t.rival)) {
    describe(trainer.id, () => {
      it('passes every data rule', () => {
        expect(findTrainerProblems(trainer, trainer.id)).toEqual([]);
      });

      it('fields the rival\'s starter exactly once', () => {
        expect(trainer.party.filter((entry) => entry.rivalStarter)).toHaveLength(1);
      });

      it('saves the starter for last and makes it the strongest', () => {
        // The ace comes out last, at the top level: the fight builds to it.
        const last = trainer.party[trainer.party.length - 1];
        expect(last.rivalStarter).toBe(true);
        const top = Math.max(...trainer.party.map((entry) => entry.level));
        expect(last.level).toBe(top);
      });

      it('is gated by something, so it cannot be fought out of order', () => {
        expect(trainer.requires).toBeTruthy();
      });

      it('builds the counter starter for each player, at the right stage', () => {
        const slot = trainer.party.findIndex((entry) => entry.rivalStarter);
        for (const starter of STARTER_IDS) {
          const party = createTrainerParty(trainer.id, { state: stateWith(starter) });
          const expected = speciesAtLevel(RIVALS[trainer.rival].starterFor[starter], trainer.party[slot].level);
          expect(party[slot].speciesId).toBe(expected);
          expect(party[slot].level).toBe(trainer.party[slot].level);
        }
      });

      it('is an ordinary trainer battle: no running, no catching, blackout on a loss', () => {
        const config = createTrainerBattleConfig(trainer.id, [createCreature('pyrret', 14)], {
          state: stateWith('pyrret'),
        });
        expect(config.battleType).toBe('trainer');
        expect(config.canRun).toBe(false);
        expect(config.allowCapture).toBe(false);
        expect(config.blackoutOnDefeat).toBe(true);
        expect(config.trainerId).toBe(trainer.id);
        expect(config.opponentName).toBe(`Rival ${RIVALS[trainer.rival].name}`);
      });

      it('names the right counter starter to each player', () => {
        for (const starter of STARTER_IDS) {
          const rivalBase = RIVALS[trainer.rival].starterFor[starter];
          const conditions = getWorldConditions(stateWith(starter));
          const text = resolveDialogue(trainer.intro, conditions).pages.join(' ');
          // Every species in the counter family is a fair thing to name.
          const family = Object.keys(CREATURES).filter((id) => getFamilyBase(id) === rivalBase);
          const others = Object.keys(CREATURES).filter(
            (id) => STARTER_IDS.includes(getFamilyBase(id)) && getFamilyBase(id) !== rivalBase
          );
          const named = (id) => text.includes(CREATURES[id].name);
          expect(family.some(named), `${trainer.id} never names ${rivalBase} to a ${starter} player`)
            .toBe(true);
          expect(others.filter(named), `${trainer.id} names the wrong starter`).toEqual([]);
        }
      });

      it('still says something sensible when the starter is unknown', () => {
        expect(resolveDialogue(trainer.intro, {}).pages.length).toBeGreaterThan(0);
      });

      it('has a line for beating the player, before the blackout', () => {
        expect(resolveDialogue(trainer.victoryLines, {}).pages.length).toBeGreaterThan(0);
      });
    });
  }

  it('numbers each rival\'s meetings 1, 2, 3 … with no gaps or repeats', () => {
    const byRival = {};
    for (const trainer of rivalMeetings()) {
      (byRival[trainer.rival] ||= []).push(trainer.stage);
    }
    for (const stages of Object.values(byRival)) {
      expect([...stages].sort((a, b) => a - b)).toEqual(stages.map((_, i) => i + 1));
    }
  });
});

describe('the first meeting, at the Thornway gate', () => {
  const trainer = TRAINERS.kestrelThornway;

  it('is Kestrel\'s first', () => {
    expect(trainer.rival).toBe('kestrel');
    expect(trainer.stage).toBe(1);
  });

  it('only happens once the player holds the Verdant Sigil', () => {
    expect(trainer.requires).toBe('badge:verdantSigil');
  });

  it('opens the Thornway when won', () => {
    expect(trainer.setFlags).toEqual(['thornwayOpen']);
  });

  it('is pitched just above Fern, and below what the Thornway throws at you later', () => {
    const fernTop = Math.max(...TRAINERS.verdantLeaderFern.party.map((e) => e.level));
    const top = Math.max(...trainer.party.map((e) => e.level));
    expect(top).toBeGreaterThan(fernTop);
    expect(top).toBeLessThanOrEqual(fernTop + 2);
  });

  it('fields a first-stage starter: nothing is evolved yet at these levels', () => {
    for (const starter of STARTER_IDS) {
      const party = createTrainerParty(trainer.id, { state: stateWith(starter) });
      for (const creature of party) {
        expect(getFamilyBase(creature.speciesId)).toBe(creature.speciesId);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Winning
// ---------------------------------------------------------------------------

describe('recording a win', () => {
  it('marks the trainer beaten and sets every flag they carry', () => {
    const state = createNewGameState();
    const result = recordTrainerVictory('kestrelThornway', state);
    expect(result).toEqual({ recorded: true, flagsSet: ['thornwayOpen'] });
    expect(isTrainerDefeated('kestrelThornway', state)).toBe(true);
    expect(state.flags.thornwayOpen).toBe(true);
  });

  it('sets no flags for an ordinary trainer', () => {
    const state = createNewGameState();
    expect(recordTrainerVictory('route1Scout', state)).toEqual({ recorded: true, flagsSet: [] });
    expect(isTrainerDefeated('route1Scout', state)).toBe(true);
    expect(state.flags).toEqual({});
  });

  it('is harmless to repeat', () => {
    const state = createNewGameState();
    recordTrainerVictory('kestrelThornway', state);
    const before = JSON.stringify(state);
    recordTrainerVictory('kestrelThornway', state);
    expect(JSON.stringify(state)).toBe(before);
  });

  it('records nothing for a trainer that does not exist', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = createNewGameState();
    expect(recordTrainerVictory('nobody', state)).toEqual({ recorded: false, flagsSet: [] });
    expect(state.defeatedTrainers).toEqual({});
  });

  it('copes with a state that has no flags object yet', () => {
    const state = createNewGameState();
    delete state.flags;
    recordTrainerVictory('kestrelThornway', state);
    expect(state.flags).toEqual({ thornwayOpen: true });
  });
});

// ---------------------------------------------------------------------------
// The gate, and who is standing in front of it
// ---------------------------------------------------------------------------

describe('the Thornway gate', () => {
  const map = MAPS.thistlewood;
  const gateClosed = (state) =>
    createBarrierState(map, { conditions: getWorldConditions(state), state }).thornwayGate;

  it('is shut on a new game', () => {
    expect(gateClosed(createNewGameState())).toBe(true);
  });

  it('stays shut with the Sigil alone — Kestrel is in the way', () => {
    const state = createNewGameState();
    awardBadge('verdantSigil', state);
    expect(gateClosed(state)).toBe(true);
  });

  it('opens once Kestrel is beaten', () => {
    const state = createNewGameState();
    awardBadge('verdantSigil', state);
    recordTrainerVictory('kestrelThornway', state);
    expect(gateClosed(state)).toBe(false);
  });

  it('opens from the flag alone, so an old save that has it still works', () => {
    const state = createNewGameState();
    state.flags.thornwayOpen = true;
    expect(gateClosed(state)).toBe(false);
  });
});

describe('Kestrel on the map', () => {
  const placements = [];
  for (const [mapId, map] of Object.entries(MAPS)) {
    for (const npc of map.npcs || []) {
      const trainer = TRAINERS[npc.trainer];
      if (trainer?.rival) placements.push({ mapId, map, npc, trainer });
    }
  }

  it('stands somewhere for every meeting', () => {
    expect(placements.map((p) => p.trainer.id).sort())
      .toEqual(rivalMeetings().map((t) => t.id).sort());
  });

  for (const { mapId, map, npc, trainer } of placements) {
    describe(`${mapId}:${npc.id} (${trainer.id})`, () => {
      const before = Object.fromEntries([].concat(trainer.requires).map((key) => [key, true]));
      const beaten = { ...before, [`trainer:${trainer.id}`]: true };

      it('is there exactly when the fight is allowed — no sooner', () => {
        expect(npc.presentWhen).toEqual(trainer.requires);
        expect(isNpcPresent(npc, {})).toBe(false);
        expect(isNpcPresent(npc, before)).toBe(true);
      });

      it('is gone once beaten, so there is never a second fight', () => {
        expect(isNpcPresent(npc, beaten)).toBe(false);
      });

      it('uses the rival\'s own look', () => {
        expect(npc.sprite).toBe(RIVALS[trainer.rival].sprite);
      });

      it('says the same thing when spoken to as when they spot you, then fights', () => {
        for (const starter of [...STARTER_IDS, null]) {
          const conditions = { ...before, ...(starter ? { [`starter:${starter}`]: true } : {}) };
          const talk = resolveDialogue(npc.dialogue, conditions);
          expect(talk.pages).toEqual(resolveDialogue(trainer.intro, conditions).pages);
          expect(talk.action).toBe(`trainer:${trainer.id}`);
        }
      });

      it('walks off along open ground once the flags they set are in place', () => {
        const exit = npc.exitAfterDefeat;
        expect(exit, 'a rival who leaves needs somewhere to go').toBeDefined();

        const state = createNewGameState();
        for (const flag of trainer.setFlags || []) state.flags[flag] = true;
        const tiles = new TileMap(map);
        if (tiles.barriers.length > 0) {
          tiles.setBarrierState(createBarrierState(map, { conditions: getWorldConditions(state), state }));
        }

        const step = DIRECTION_VECTORS[exit.direction];
        for (let i = 1; i <= exit.steps; i += 1) {
          const x = npc.x + step.x * i;
          const y = npc.y + step.y * i;
          expect(tiles.isWalkable(x, y), `(${x}, ${y}) on the way out is blocked`).toBe(true);
          expect((map.npcs || []).some((other) => other.x === x && other.y === y)).toBe(false);
        }
      });
    });
  }
});

describe('the keeper and the sign follow the story', () => {
  const map = MAPS.thistlewood;
  const keeper = map.npcs.find((npc) => npc.id === 'thornwayKeeper');
  const sign = map.interactables.find((entry) => entry.type === 'sign' && entry.x === 25 && entry.y === 4);
  const say = (dialogue, conditions) => resolveDialogue(dialogue, conditions).pages.join(' ');

  it('the keeper sends a new player to the Hall', () => {
    expect(say(keeper.dialogue, {})).toMatch(/Verdant Hall/);
  });

  it('the keeper points a Sigil-holder at Kestrel', () => {
    expect(say(keeper.dialogue, { 'badge:verdantSigil': true })).toMatch(/Kestrel/);
  });

  it('the keeper says the road is open once it is', () => {
    const text = say(keeper.dialogue, { 'badge:verdantSigil': true, thornwayOpen: true });
    expect(text).toMatch(/open/i);
    expect(text).not.toMatch(/Kestrel/);
  });

  it('the sign changes once the gate opens', () => {
    expect(say(sign.dialogue, {})).not.toBe(say(sign.dialogue, { thornwayOpen: true }));
  });
});
