/**
 * Tests for trainers: what they can see, who gets to challenge, what their
 * battle is, and when they count as beaten.
 *
 * The sight geometry is pure, so every boundary — one short of range, exactly
 * at range, one beyond, behind, beside, around a tree — is checked here rather
 * than by walking the map and hoping to notice.
 */

import { describe, it, expect, vi } from 'vitest';
import { canSee, findChallenger, getSightTiles } from '../src/systems/SightSystem.js';
import {
  createTrainerParty, createTrainerBattleConfig, markTrainerDefeated,
  isTrainerDefeated, clearTrainerDefeat, countDefeatedTrainers, getDialogueConditions,
} from '../src/systems/TrainerSystem.js';
import { TRAINERS, getTrainer, getTrainerDisplayName, findTrainerProblems } from '../src/data/trainers.js';
import { BattleEngine, BATTLE_RESULT } from '../src/systems/battle/BattleEngine.js';
import { createNewGameState } from '../src/core/GameState.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { addMoney, getMoney } from '../src/systems/EconomySystem.js';
import { isItemUsableInBattle } from '../src/systems/battle/BattleItems.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { TileMap } from '../src/systems/TileMap.js';
import { MAPS } from '../src/data/maps/index.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { ITEMS } from '../src/data/items.js';
import { PROGRESSION } from '../src/config/balance.js';
import { createSeededRandom } from '../src/utils/rng.js';

const freshState = () => createNewGameState();
const at = (x, y) => ({ x, y });

// ---------------------------------------------------------------------------
// Sight geometry
// ---------------------------------------------------------------------------

describe('what a trainer can see', () => {
  const looker = { origin: at(5, 5), facing: 'up', range: 4 };

  it('sees straight ahead', () => {
    expect(canSee({ ...looker, target: at(5, 4) }).visible).toBe(true);
    expect(canSee({ ...looker, target: at(5, 1) }).visible).toBe(true);
  });

  it('reports how far ahead the target is', () => {
    expect(canSee({ ...looker, target: at(5, 2) }).distance).toBe(3);
  });

  it('does not see behind itself', () => {
    expect(canSee({ ...looker, target: at(5, 6) }).visible).toBe(false);
    expect(canSee({ ...looker, target: at(5, 9) }).visible).toBe(false);
  });

  it('does not see to either side', () => {
    expect(canSee({ ...looker, target: at(4, 5) }).visible).toBe(false);
    expect(canSee({ ...looker, target: at(6, 5) }).visible).toBe(false);
  });

  it('does not see diagonally', () => {
    expect(canSee({ ...looker, target: at(4, 4) }).visible).toBe(false);
    expect(canSee({ ...looker, target: at(6, 3) }).visible).toBe(false);
    expect(canSee({ ...looker, target: at(4, 1) }).visible).toBe(false);
  });

  it('does not see its own tile', () => {
    const result = canSee({ ...looker, target: at(5, 5) });
    expect(result.visible).toBe(false);
    expect(result.distance).toBe(0);
  });

  it('sees the tile exactly at its range, and not one beyond', () => {
    // range 4 means distances 1..4.
    expect(canSee({ ...looker, target: at(5, 1) }).visible).toBe(true);   // 4 away
    expect(canSee({ ...looker, target: at(5, 0) }).visible).toBe(false);  // 5 away
    expect(canSee({ ...looker, target: at(5, 0) }).distance).toBe(5);
  });

  it('works in all four directions', () => {
    expect(canSee({ origin: at(5, 5), facing: 'down', range: 3, target: at(5, 8) }).visible).toBe(true);
    expect(canSee({ origin: at(5, 5), facing: 'left', range: 3, target: at(2, 5) }).visible).toBe(true);
    expect(canSee({ origin: at(5, 5), facing: 'right', range: 3, target: at(8, 5) }).visible).toBe(true);
    expect(canSee({ origin: at(5, 5), facing: 'right', range: 3, target: at(2, 5) }).visible).toBe(false);
  });

  it('sees nothing with no range, or a nonsense one', () => {
    for (const range of [0, -1, NaN, undefined, null]) {
      expect(canSee({ ...looker, range, target: at(5, 4) }).visible).toBe(false);
    }
  });

  it('sees nothing when facing nowhere', () => {
    expect(canSee({ ...looker, facing: 'sideways', target: at(5, 4) }).visible).toBe(false);
    expect(canSee({ ...looker, facing: undefined, target: at(5, 4) }).visible).toBe(false);
  });

  it('is safe with nothing to look at', () => {
    expect(canSee({ ...looker, target: null }).visible).toBe(false);
    expect(canSee({ origin: null, facing: 'up', range: 3, target: at(1, 1) }).visible).toBe(false);
  });
});

describe('things that block a view', () => {
  const looker = { origin: at(5, 5), facing: 'up', range: 4 };
  const blockAt = (bx, by) => (x, y) => x === bx && y === by;

  it('a solid tile between them blocks it', () => {
    expect(canSee({ ...looker, target: at(5, 2), isBlocked: blockAt(5, 3) }).visible).toBe(false);
  });

  it('a solid tile immediately in front blocks everything', () => {
    expect(canSee({ ...looker, target: at(5, 3), isBlocked: blockAt(5, 4) }).visible).toBe(false);
    expect(canSee({ ...looker, target: at(5, 1), isBlocked: blockAt(5, 4) }).visible).toBe(false);
  });

  it('a solid tile immediately before the player blocks it', () => {
    expect(canSee({ ...looker, target: at(5, 2), isBlocked: blockAt(5, 3) }).visible).toBe(false);
  });

  it('the tile the player stands on is never tested', () => {
    // They are standing there; whether it would block a view is irrelevant.
    expect(canSee({ ...looker, target: at(5, 3), isBlocked: blockAt(5, 3) }).visible).toBe(true);
  });

  it('a blocker behind the player is irrelevant', () => {
    expect(canSee({ ...looker, target: at(5, 3), isBlocked: blockAt(5, 1) }).visible).toBe(true);
  });

  it('a blocker off to one side is irrelevant', () => {
    expect(canSee({ ...looker, target: at(5, 2), isBlocked: blockAt(4, 3) }).visible).toBe(true);
  });

  it('open ground does not block anything', () => {
    expect(canSee({ ...looker, target: at(5, 1), isBlocked: () => false }).visible).toBe(true);
  });
});

describe('real Route 1 sight lanes', () => {
  const map = new TileMap(MAPS.route1);
  const isBlocked = (x, y) => !map.isWalkable(x, y);

  const trainers = MAPS.route1.npcs.filter((npc) => npc.trainer);

  it('places every trainer on ground they can stand on', () => {
    for (const npc of trainers) {
      expect(map.isWalkable(npc.x, npc.y), `${npc.id} is inside something solid`).toBe(true);
    }
  });

  it('gives every trainer a lane that reaches the path', () => {
    for (const npc of trainers) {
      const tiles = getSightTiles({
        origin: at(npc.x, npc.y), facing: npc.facing, range: npc.sightRange, isBlocked,
      });
      const reachesPath = tiles.some((tile) => map.getTile(tile.x, tile.y).id === 'path');
      expect(reachesPath, `${npc.id} cannot see the path from where they stand`).toBe(true);
    }
  });

  it('does not let a trainer see through the treeline', () => {
    // Looking left from the western path would run into the border trees.
    const blocked = canSee({
      origin: at(6, 20), facing: 'left', range: 8, target: at(0, 20), isBlocked,
    });
    expect(blocked.visible).toBe(false);
  });

  it('leaves the path itself walkable — no trainer stands in a corridor', () => {
    for (const npc of trainers) {
      expect(map.getTile(npc.x, npc.y).id, `${npc.id} is standing on the path`)
        .not.toBe('path');
    }
  });

  it('never places two trainers where one blocks the other', () => {
    for (const npc of trainers) {
      const tiles = getSightTiles({
        origin: at(npc.x, npc.y), facing: npc.facing, range: npc.sightRange, isBlocked,
      });
      for (const other of trainers) {
        if (other.id === npc.id) continue;
        expect(
          tiles.some((tile) => tile.x === other.x && tile.y === other.y),
          `${npc.id} is staring at ${other.id}`
        ).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Who challenges
// ---------------------------------------------------------------------------

describe('choosing which trainer challenges', () => {
  const near = { id: 'near', x: 5, y: 8, facing: 'up', sightRange: 4 };
  const far = { id: 'far', x: 5, y: 10, facing: 'up', sightRange: 6 };
  const player = at(5, 5);

  it('picks nobody when nobody can see', () => {
    expect(findChallenger([{ id: 'a', x: 0, y: 0, facing: 'up', sightRange: 3 }], player))
      .toBeNull();
    expect(findChallenger([], player)).toBeNull();
    expect(findChallenger(null, player)).toBeNull();
  });

  it('picks the only one who can', () => {
    const result = findChallenger([near], player);
    expect(result.watcher.id).toBe('near');
    expect(result.distance).toBe(3);
  });

  it('picks the nearest of several', () => {
    expect(findChallenger([far, near], player).watcher.id).toBe('near');
    expect(findChallenger([near, far], player).watcher.id).toBe('near');
  });

  it('breaks a tie the same way every time, with no randomness', () => {
    const left = { id: 'zed', x: 2, y: 5, facing: 'right', sightRange: 5 };
    const right = { id: 'abe', x: 8, y: 5, facing: 'left', sightRange: 5 };

    // Both exactly three tiles away; the id decides, and it decides stably.
    for (let i = 0; i < 20; i += 1) {
      expect(findChallenger([left, right], player).watcher.id).toBe('abe');
      expect(findChallenger([right, left], player).watcher.id).toBe('abe');
    }
  });

  it('returns exactly one challenger, never a list', () => {
    const result = findChallenger([near, far], player);
    expect(result.watcher).toBeDefined();
    expect(Array.isArray(result)).toBe(false);
  });

  it('ignores a trainer whose view is blocked', () => {
    const isBlocked = (x, y) => x === 5 && y === 7;
    expect(findChallenger([near], player, isBlocked)).toBeNull();
  });

  it('lets the further one challenge when the nearer is blocked', () => {
    // A wall at (5,7) stops `near`; `far` is behind it and equally stopped, so
    // move the far one to a clear lane.
    const clear = { id: 'clear', x: 2, y: 5, facing: 'right', sightRange: 5 };
    const isBlocked = (x, y) => x === 5 && y === 7;
    expect(findChallenger([near, clear], player, isBlocked).watcher.id).toBe('clear');
  });

  it('ignores anyone with no sight range at all', () => {
    expect(findChallenger([{ ...near, sightRange: 0 }], player)).toBeNull();
  });
});

describe('the sight overlay', () => {
  it('lists the tiles ahead, nearest first', () => {
    const tiles = getSightTiles({ origin: at(3, 3), facing: 'right', range: 3 });
    expect(tiles).toEqual([at(4, 3), at(5, 3), at(6, 3)]);
  });

  it('stops at a blocker, including it', () => {
    const tiles = getSightTiles({
      origin: at(3, 3), facing: 'right', range: 4, isBlocked: (x) => x === 5,
    });
    expect(tiles).toEqual([at(4, 3), at(5, 3)]);
  });

  it('is empty for a nonsense facing', () => {
    expect(getSightTiles({ origin: at(1, 1), facing: 'nowhere', range: 3 })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Trainer data
// ---------------------------------------------------------------------------

describe('trainer data', () => {
  it('defines some trainers', () => {
    expect(Object.keys(TRAINERS).length).toBeGreaterThan(0);
  });

  // Auto-generated, so a trainer added later is validated without new test code.
  for (const [id, trainer] of Object.entries(TRAINERS)) {
    describe(`trainer "${id}"`, () => {
      it('passes every data rule', () => {
        expect(findTrainerProblems(trainer, id)).toEqual([]);
      });

      it('has a party of real species at sensible levels', () => {
        expect(trainer.party.length).toBeGreaterThan(0);
        for (const entry of trainer.party) {
          expect(CREATURES[entry.species], `unknown species "${entry.species}"`).toBeDefined();
          expect(entry.level).toBeGreaterThanOrEqual(1);
          expect(entry.level).toBeLessThanOrEqual(PROGRESSION.maxLevel);
        }
      });

      it('has something to say before and after', () => {
        expect(trainer.intro.length).toBeGreaterThan(0);
        expect(trainer.outro.length).toBeGreaterThan(0);
      });

      it('builds a usable party through CreatureFactory', () => {
        const party = createTrainerParty(id);
        expect(party).toHaveLength(trainer.party.length);

        party.forEach((creature, index) => {
          expect(creature.speciesId).toBe(trainer.party[index].species);
          expect(creature.level).toBe(trainer.party[index].level);
          expect(creature.stats.hp).toBeGreaterThan(0);
          expect(creature.currentHp).toBe(creature.stats.hp);
          expect(creature.moves.length).toBeGreaterThan(0);
          for (const move of creature.moves) {
            expect(MOVES[move.id], `unknown move "${move.id}"`).toBeDefined();
            expect(move.pp).toBe(move.maxPp);
          }
        });
      });

      it('makes a battle that runs without throwing', () => {
        const config = createTrainerBattleConfig(id, [createCreature('pyrret', 10)]);
        expect(config).not.toBeNull();
        const engine = new BattleEngine({ ...config, random: createSeededRandom(3) });
        expect(() => engine.start()).not.toThrow();
      });
    });
  }

  it('gives every trainer a unique id', () => {
    const ids = Object.values(TRAINERS).map((trainer) => trainer.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('warns and returns null for a trainer that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getTrainer('nobody')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('announces a trainer with their title', () => {
    expect(getTrainerDisplayName(TRAINERS.route1Scout)).toBe('Pathfinder Wren');
    expect(getTrainerDisplayName({ name: 'Solo' })).toBe('Solo');
    expect(getTrainerDisplayName(null)).toBe('Trainer');
  });

  it('rewards run in a sensible early-game band', () => {
    for (const trainer of Object.values(TRAINERS)) {
      // Enough to feel worth it against a 200-coin Potion, not enough to make
      // the economy meaningless.
      expect(trainer.rewardMoney).toBeGreaterThanOrEqual(100);
      expect(trainer.rewardMoney).toBeLessThanOrEqual(1000);
    }
  });
});

describe('trainer data validation catches mistakes', () => {
  const sound = TRAINERS.route1Scout;

  it('rejects a missing party', () => {
    expect(findTrainerProblems({ ...sound, party: [] }, 'route1Scout').join(' '))
      .toMatch(/at least one creature/);
  });

  it('rejects a species that does not exist', () => {
    const bad = { ...sound, party: [{ species: 'notacreature', level: 5 }] };
    expect(findTrainerProblems(bad, 'route1Scout').join(' ')).toMatch(/no such species/);
  });

  it('rejects a level outside the game bounds', () => {
    const low = { ...sound, party: [{ species: 'nibbit', level: 0 }] };
    const high = { ...sound, party: [{ species: 'nibbit', level: 101 }] };
    expect(findTrainerProblems(low, 'route1Scout').join(' ')).toMatch(/level must be between/);
    expect(findTrainerProblems(high, 'route1Scout').join(' ')).toMatch(/level must be between/);
  });

  it('rejects a negative or fractional reward', () => {
    expect(findTrainerProblems({ ...sound, rewardMoney: -5 }, 'route1Scout').join(' '))
      .toMatch(/rewardMoney/);
    expect(findTrainerProblems({ ...sound, rewardMoney: 12.5 }, 'route1Scout').join(' '))
      .toMatch(/rewardMoney/);
  });

  it('rejects missing dialogue', () => {
    expect(findTrainerProblems({ ...sound, intro: [] }, 'route1Scout').join(' '))
      .toMatch(/needs intro/);
    expect(findTrainerProblems({ ...sound, outro: undefined }, 'route1Scout').join(' '))
      .toMatch(/needs outro/);
  });

  it('rejects an id that disagrees with its key', () => {
    expect(findTrainerProblems(sound, 'somethingElse').join(' ')).toMatch(/id field says/);
  });
});

// ---------------------------------------------------------------------------
// Trainer NPCs on maps
// ---------------------------------------------------------------------------

describe('every trainer NPC on every map', () => {
  const trainerNpcs = [];
  for (const [mapId, map] of Object.entries(MAPS)) {
    for (const npc of map.npcs || []) {
      if (npc.trainer) trainerNpcs.push({ mapId, npc, map });
    }
  }

  it('there is at least one', () => {
    expect(trainerNpcs.length).toBeGreaterThan(0);
  });

  for (const { mapId, npc, map } of trainerNpcs) {
    describe(`${mapId}:${npc.id}`, () => {
      it('references a trainer that exists', () => {
        expect(TRAINERS[npc.trainer], `unknown trainer "${npc.trainer}"`).toBeDefined();
      });

      it('has a valid sight range', () => {
        expect(Number.isInteger(npc.sightRange)).toBe(true);
        expect(npc.sightRange).toBeGreaterThanOrEqual(1);
        expect(npc.sightRange).toBeLessThanOrEqual(8);
      });

      it('faces a real direction', () => {
        expect(['up', 'down', 'left', 'right']).toContain(npc.facing);
      });

      it('stands on a tile it can actually stand on', () => {
        expect(new TileMap(map).isWalkable(npc.x, npc.y)).toBe(true);
      });

      it('stays put, so it cannot wander out of its own sight lane', () => {
        expect(npc.movement ?? 'static').toBe('static');
      });

      it('has something to say before and after being beaten', () => {
        const before = resolveDialogue(npc.dialogue, {});
        const after = resolveDialogue(npc.dialogue, { [`trainer:${npc.trainer}`]: true });

        expect(before.pages.length).toBeGreaterThan(0);
        expect(before.action).toBe(`trainer:${npc.trainer}`);

        expect(after.pages.length).toBeGreaterThan(0);
        // Beaten trainers must not offer another fight.
        expect(after.action).toBeNull();
        expect(after.pages.join(' ')).not.toBe(before.pages.join(' '));
      });
    });
  }

  it('never points two NPCs at the same trainer', () => {
    const ids = trainerNpcs.map((entry) => entry.npc.trainer);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every defined trainer somewhere to stand', () => {
    const placed = new Set(trainerNpcs.map((entry) => entry.npc.trainer));
    for (const id of Object.keys(TRAINERS)) {
      expect(placed.has(id), `trainer "${id}" is defined but nowhere on any map`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// The battle
// ---------------------------------------------------------------------------

describe('a trainer battle', () => {
  const party = () => [createCreature('pyrret', 12)];
  const config = () => createTrainerBattleConfig('route1Treader', party());

  it('is a trainer battle, named after the trainer', () => {
    const built = config();
    expect(built.battleType).toBe('trainer');
    expect(built.opponentName).toBe('Grass-Treader Osrin');
  });

  it('cannot be run from', () => {
    expect(config().canRun).toBe(false);
    expect(new BattleEngine(config()).canRun).toBe(false);
  });

  it('does not allow catching someone else\'s Aethers', () => {
    const engine = new BattleEngine(config());
    expect(engine.allowCapture).toBe(false);
    expect(isItemUsableInBattle(ITEMS.basicOrb, { allowCapture: engine.allowCapture }).ok)
      .toBe(false);
  });

  it('awards experience and prize money', () => {
    const built = config();
    expect(built.awardExperience).toBe(true);
    expect(built.rewardMoney).toBe(TRAINERS.route1Treader.rewardMoney);
  });

  it('blacks the player out on defeat', () => {
    expect(config().blackoutOnDefeat).toBe(true);
    expect(new BattleEngine(config()).blackoutOnDefeat).toBe(true);
  });

  it('carries the trainer id through to the result', () => {
    const engine = new BattleEngine({ ...config(), random: () => 0 });
    engine.start();
    for (const creature of engine.opponentParty) creature.currentHp = 0;
    const events = engine.submitPlayerAction({
      type: 'move', moveEntry: engine.player.creature.moves[0],
    });
    expect(events.some((e) => e.type === 'end')).toBe(true);
    expect(engine.result.trainerId).toBe('route1Treader');
  });

  it('brings out the whole party in order', () => {
    const built = config();
    expect(built.opponentParty).toHaveLength(2);
    expect(built.opponentParty.map((c) => c.speciesId)).toEqual(['grubbit', 'vinelet']);
  });

  it('sends out the next creature when one faints', () => {
    const engine = new BattleEngine({ ...config(), random: createSeededRandom(5) });
    engine.start();

    const first = engine.opponent.creature;
    first.currentHp = 0;
    const events = engine.submitPlayerAction({
      type: 'move', moveEntry: engine.player.creature.moves[0],
    });

    expect(engine.isOver()).toBe(false);
    expect(engine.opponent.creature).not.toBe(first);
    expect(events.some((e) => e.type === 'switch' && e.side === 'opponent')).toBe(true);
  });

  it('is only over once every one of them is down', () => {
    const engine = new BattleEngine({ ...config(), random: createSeededRandom(9) });
    engine.start();

    for (let turn = 0; turn < 40 && !engine.isOver(); turn += 1) {
      for (const creature of engine.opponentParty) creature.currentHp = 0;
      const entry = engine.player.creature.moves.find((m) => m.pp > 0);
      engine.submitPlayerAction({ type: 'move', moveEntry: entry });
    }

    expect(engine.isOver()).toBe(true);
    expect(engine.result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(engine.result.money).toBe(TRAINERS.route1Treader.rewardMoney);
  });

  it('pays nothing when the player loses', () => {
    const team = [createCreature('pyrret', 2)];
    team[0].currentHp = 1;
    const engine = new BattleEngine({
      ...createTrainerBattleConfig('route1Aspirant', team), random: createSeededRandom(2),
    });
    engine.start();

    for (let turn = 0; turn < 30 && !engine.isOver(); turn += 1) {
      team[0].currentHp = 1;
      const entry = engine.player.creature.moves.find((m) => m.pp > 0);
      engine.submitPlayerAction({ type: 'move', moveEntry: entry });
    }

    expect(engine.result.outcome).toBe(BATTLE_RESULT.LOSS);
    expect(engine.result.money).toBe(0);
    expect(engine.result.blackoutOnDefeat).toBe(true);
  });

  it('refuses to build with an empty party', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(createTrainerBattleConfig('route1Scout', [])).toBeNull();
    warn.mockRestore();
  });

  it('refuses to build for a trainer that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(createTrainerBattleConfig('nobody', party())).toBeNull();
    expect(createTrainerParty('nobody')).toEqual([]);
    warn.mockRestore();
  });

  it('builds a fresh team each time, never touching the database', () => {
    const first = createTrainerParty('route1Treader');
    first[0].currentHp = 1;
    first[0].level = 99;

    const second = createTrainerParty('route1Treader');
    expect(second[0]).not.toBe(first[0]);
    expect(second[0].currentHp).toBe(second[0].stats.hp);
    expect(second[0].level).toBe(TRAINERS.route1Treader.party[0].level);
    expect(TRAINERS.route1Treader.party[0].level).toBe(7);

    // Different individuals, every time.
    expect(second[0].instanceId).not.toBe(first[0].instanceId);
  });

  it('is different from a practice battle, which stays consequence-free', () => {
    const trainerBattle = new BattleEngine(config());
    const practice = new BattleEngine({
      playerParty: party(), opponentParty: [createCreature('nibbit', 5)],
      battleType: 'practice', canRun: false, awardExperience: false, rewardMoney: 0,
      blackoutOnDefeat: false,
    });

    expect(trainerBattle.blackoutOnDefeat).toBe(true);
    expect(practice.blackoutOnDefeat).toBe(false);
    expect(practice.rewardMoney).toBe(0);
    expect(practice.allowCapture).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Being beaten
// ---------------------------------------------------------------------------

describe('remembering who has been beaten', () => {
  it('starts with nobody beaten', () => {
    const state = freshState();
    expect(countDefeatedTrainers(state)).toBe(0);
    expect(isTrainerDefeated('route1Scout', state)).toBe(false);
  });

  it('records a win', () => {
    const state = freshState();
    expect(markTrainerDefeated('route1Scout', state)).toBe(true);
    expect(isTrainerDefeated('route1Scout', state)).toBe(true);
  });

  it('is idempotent — winning twice is still one fact', () => {
    const state = freshState();
    markTrainerDefeated('route1Scout', state);
    markTrainerDefeated('route1Scout', state);
    expect(countDefeatedTrainers(state)).toBe(1);
  });

  it('refuses a trainer that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = freshState();
    expect(markTrainerDefeated('nobody', state)).toBe(false);
    expect(countDefeatedTrainers(state)).toBe(0);
    warn.mockRestore();
  });

  it('keeps one trainer separate from another', () => {
    const state = freshState();
    markTrainerDefeated('route1Scout', state);
    expect(isTrainerDefeated('route1Treader', state)).toBe(false);
  });

  it('can be undone, for debugging', () => {
    const state = freshState();
    markTrainerDefeated('route1Scout', state);
    clearTrainerDefeat('route1Scout', state);
    expect(isTrainerDefeated('route1Scout', state)).toBe(false);
  });

  it('survives an older save with no record at all', () => {
    const state = freshState();
    delete state.defeatedTrainers;
    expect(isTrainerDefeated('route1Scout', state)).toBe(false);
    expect(markTrainerDefeated('route1Scout', state)).toBe(true);
  });

  it('is plain serialisable data', () => {
    const state = freshState();
    markTrainerDefeated('route1Scout', state);
    expect(JSON.parse(JSON.stringify(state)).defeatedTrainers)
      .toEqual({ route1Scout: true });
  });

  it('turns into a dialogue condition, so post-defeat lines are ordinary data', () => {
    const state = freshState();
    state.flags.gotStarter = true;
    markTrainerDefeated('route1Scout', state);

    const conditions = getDialogueConditions(state);
    expect(conditions.gotStarter).toBe(true);
    expect(conditions['trainer:route1Scout']).toBe(true);
    expect(conditions['trainer:route1Treader']).toBeUndefined();
  });

  it('hands out a fresh conditions object each time', () => {
    const state = freshState();
    const first = getDialogueConditions(state);
    first.tampered = true;
    expect(getDialogueConditions(state).tampered).toBeUndefined();
    expect(state.flags.tampered).toBeUndefined();
  });

  it('switches a trainer NPC to their post-defeat lines', () => {
    const state = freshState();
    const npc = MAPS.route1.npcs.find((entry) => entry.trainer === 'route1Scout');

    const before = resolveDialogue(npc.dialogue, getDialogueConditions(state));
    expect(before.action).toBe('trainer:route1Scout');

    markTrainerDefeated('route1Scout', state);
    const after = resolveDialogue(npc.dialogue, getDialogueConditions(state));
    expect(after.action).toBeNull();
    expect(after.pages.join(' ')).not.toBe(before.pages.join(' '));
  });
});

describe('prize money', () => {
  it('is paid once for a win', () => {
    const state = freshState();
    const before = getMoney(state);
    addMoney(state, TRAINERS.route1Scout.rewardMoney);
    expect(getMoney(state)).toBe(before + 240);
  });

  it('accumulates across several trainers', () => {
    const state = freshState();
    const before = getMoney(state);
    const total = Object.values(TRAINERS).reduce((sum, t) => sum + t.rewardMoney, 0);

    for (const trainer of Object.values(TRAINERS)) addMoney(state, trainer.rewardMoney);
    expect(getMoney(state)).toBe(before + total);
  });

  it('funds a useful number of Potions without trivialising them', () => {
    const total = Object.values(TRAINERS).reduce((sum, t) => sum + t.rewardMoney, 0);
    const potions = Math.floor(total / ITEMS.potion.price);
    expect(potions).toBeGreaterThanOrEqual(3);
    expect(potions).toBeLessThanOrEqual(8);
  });
});
