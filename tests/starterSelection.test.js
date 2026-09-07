/**
 * Tests for the starter-selection flow.
 *
 * The scene itself needs a browser (it is verified with Playwright), but the
 * RULES it enforces are plain logic and belong here: you get exactly one
 * starter, it goes into your party at the right level, and the flag that
 * changes everyone's dialogue gets set.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createNewGameState,
  setGameState,
  gameState,
  hasFlag,
} from '../src/core/GameState.js';
import { createCreature, getDisplayName } from '../src/systems/CreatureFactory.js';
import { addToParty, getPartySize, getActiveCreature } from '../src/systems/PartySystem.js';
import { STARTER_IDS, STARTER_LEVEL, CREATURES } from '../src/data/creatures.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { wardensLodge } from '../src/data/maps/wardensLodge.js';
import { MAPS } from '../src/data/maps/index.js';
import { SHOPS } from '../src/data/shops.js';
import { TRAINERS } from '../src/data/trainers.js';
import { PARTY } from '../src/config/balance.js';

const STARTER_FLAG = 'gotStarter';

/** What the scene does when a starter is confirmed, as plain logic. */
function grantStarter(state, speciesId) {
  if (state.flags[STARTER_FLAG]) return null;

  const creature = createCreature(speciesId, STARTER_LEVEL, { metAt: "Warden's Lodge" });
  if (!creature) return null;
  if (!addToParty(state, creature)) return null;

  state.flags[STARTER_FLAG] = true;
  return creature;
}

describe('granting a starter', () => {
  beforeEach(() => setGameState(createNewGameState()));

  it('starts with no starter and an empty party', () => {
    expect(hasFlag(STARTER_FLAG)).toBe(false);
    expect(getPartySize(gameState)).toBe(0);
  });

  for (const speciesId of STARTER_IDS) {
    describe(`choosing ${speciesId}`, () => {
      beforeEach(() => setGameState(createNewGameState()));

      it('puts exactly one creature in the party', () => {
        grantStarter(gameState, speciesId);
        expect(getPartySize(gameState)).toBe(1);
      });

      it('creates the species that was chosen', () => {
        grantStarter(gameState, speciesId);
        expect(gameState.party[0].speciesId).toBe(speciesId);
      });

      it('hands it over at the starter level', () => {
        grantStarter(gameState, speciesId);
        expect(gameState.party[0].level).toBe(STARTER_LEVEL);
      });

      it('arrives at full health with usable moves', () => {
        const creature = grantStarter(gameState, speciesId);
        expect(creature.currentHp).toBe(creature.stats.hp);
        expect(creature.moves.length).toBeGreaterThan(0);
        expect(creature.moves.length).toBeLessThanOrEqual(PARTY.maxMoves);
        for (const move of creature.moves) expect(move.pp).toBe(move.maxPp);
      });

      it('becomes the active creature', () => {
        grantStarter(gameState, speciesId);
        expect(getActiveCreature(gameState).speciesId).toBe(speciesId);
      });

      it('records where it was met', () => {
        grantStarter(gameState, speciesId);
        expect(gameState.party[0].metAt).toBe("Warden's Lodge");
      });

      it('sets the progression flag', () => {
        grantStarter(gameState, speciesId);
        expect(hasFlag(STARTER_FLAG)).toBe(true);
      });

      it('is named after its species until nicknamed', () => {
        grantStarter(gameState, speciesId);
        expect(getDisplayName(gameState.party[0])).toBe(CREATURES[speciesId].name);
      });
    });
  }
});

describe('you cannot have two starters', () => {
  beforeEach(() => setGameState(createNewGameState()));

  it('refuses a second grant once the flag is set', () => {
    grantStarter(gameState, 'pyrret');
    const second = grantStarter(gameState, 'drizzle');

    expect(second).toBeNull();
    expect(getPartySize(gameState)).toBe(1);
    expect(gameState.party[0].speciesId).toBe('pyrret');
  });

  it('refuses even the same species twice', () => {
    grantStarter(gameState, 'sproutle');
    grantStarter(gameState, 'sproutle');
    expect(getPartySize(gameState)).toBe(1);
  });

  it('stays refused across many attempts', () => {
    grantStarter(gameState, 'pyrret');
    for (let i = 0; i < 20; i += 1) {
      grantStarter(gameState, STARTER_IDS[i % STARTER_IDS.length]);
    }
    expect(getPartySize(gameState)).toBe(1);
  });
});

describe("the Warden's Lodge dialogue drives the whole thing", () => {
  const wick = wardensLodge.npcs.find((npc) => npc.id === 'professorWick');

  it('exists and is on the Lodge map', () => {
    expect(wick).toBeDefined();
  });

  it('offers the chooser to a brand new player', () => {
    const result = resolveDialogue(wick.dialogue, {});
    expect(result.action).toBe('starterSelect');
    expect(result.pages.length).toBeGreaterThan(0);
  });

  it('sets metWick on that first conversation', () => {
    expect(resolveDialogue(wick.dialogue, {}).setFlags).toContain('metWick');
  });

  it('still offers the chooser to someone who talked but did not choose', () => {
    const result = resolveDialogue(wick.dialogue, { metWick: true });
    expect(result.action).toBe('starterSelect');
  });

  it('stops offering it once a starter has been taken', () => {
    const result = resolveDialogue(wick.dialogue, { metWick: true, gotStarter: true });
    expect(result.action).toBeNull();
    expect(result.pages.length).toBeGreaterThan(0);
  });

  it('is the only place in the game that offers a starter', () => {
    const offers = [];
    for (const [mapId, map] of Object.entries(MAPS)) {
      for (const npc of map.npcs || []) {
        for (const flags of [{}, { metWick: true }]) {
          if (resolveDialogue(npc.dialogue, flags).action === 'starterSelect') {
            offers.push(`${mapId}:${npc.id}`);
          }
        }
      }
    }
    expect(new Set(offers)).toEqual(new Set(["wardensLodge:professorWick"]));
  });
});

describe('the world reacts to gotStarter', () => {
  /** Every NPC whose lines change once you have a starter. */
  function reactingNpcs() {
    const reacting = [];
    for (const [mapId, map] of Object.entries(MAPS)) {
      for (const npc of map.npcs || []) {
        const before = resolveDialogue(npc.dialogue, { metWick: true }).pages.join('|');
        const after = resolveDialogue(npc.dialogue, { metWick: true, gotStarter: true })
          .pages.join('|');
        if (before !== after) reacting.push(`${mapId}:${npc.id}`);
      }
    }
    return reacting;
  }

  it('changes what several different people say', () => {
    expect(reactingNpcs().length).toBeGreaterThanOrEqual(4);
  });

  it('changes people across more than one map', () => {
    const maps = new Set(reactingNpcs().map((entry) => entry.split(':')[0]));
    expect(maps.size).toBeGreaterThanOrEqual(3);
  });

  it('still gives every reacting NPC something to say afterwards', () => {
    for (const [, map] of Object.entries(MAPS)) {
      for (const npc of map.npcs || []) {
        const after = resolveDialogue(npc.dialogue, { metWick: true, gotStarter: true });
        expect(after.pages.length, `${npc.id} falls silent`).toBeGreaterThan(0);
      }
    }
  });
});

describe('dialogue actions across all map data', () => {
  const KNOWN_ACTIONS = new Set([
    'starterSelect', 'practiceBattle', 'practiceBattleDouble', 'heal', 'blackoutTravel',
  ]);

  /**
   * A parameterised action names something in the data, so check that too — a
   * typo in `shop:emberhollowSupplyPost` should fail here rather than opening
   * an empty shop in front of a player.
   */
  const isKnownAction = (action) => {
    if (action.startsWith('shop:')) return Boolean(SHOPS[action.slice('shop:'.length)]);
    if (action.startsWith('trainer:')) return Boolean(TRAINERS[action.slice('trainer:'.length)]);
    return KNOWN_ACTIONS.has(action);
  };

  it('only uses actions the game knows how to run', () => {
    for (const [mapId, map] of Object.entries(MAPS)) {
      const sources = [...(map.npcs || []), ...(map.interactables || [])];
      for (const source of sources) {
        // Try every combination of the flags used in this project's dialogue.
        for (const flags of [{}, { metWick: true }, { metWick: true, gotStarter: true }]) {
          const { action } = resolveDialogue(source.dialogue, flags);
          if (action) {
            expect(
              isKnownAction(action),
              `${mapId}:${source.id || `${source.x},${source.y}`} uses unknown action "${action}"`
            ).toBe(true);
          }
        }
      }
    }
  });
});
