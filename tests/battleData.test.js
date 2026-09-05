/**
 * Data-integrity checks that tie the battle system to the content it consumes.
 *
 * These are the ones that stop a new move, item or scripted battle from
 * shipping in a state the engine cannot handle.
 */

import { describe, it, expect, vi } from 'vitest';
import { SCRIPTED_BATTLES, getScriptedBattle } from '../src/data/battles.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { ITEMS } from '../src/data/items.js';
import { STATUS_SET } from '../src/data/statuses.js';
import { SUPPORTED_EFFECT_KINDS } from '../src/systems/battle/MoveEffectRunner.js';
import { BattleEngine } from '../src/systems/battle/BattleEngine.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { createSeededRandom } from '../src/utils/rng.js';
import { BATTLE } from '../src/config/balance.js';
import { MOVE_CATEGORY_SET } from '../src/data/moveEffects.js';

describe('every move the database defines is battle-ready', () => {
  it('uses only effect kinds the engine implements', () => {
    const unsupported = [];
    for (const move of Object.values(MOVES)) {
      if (move.effect && !SUPPORTED_EFFECT_KINDS.has(move.effect.kind)) {
        unsupported.push(`${move.id}: ${move.effect.kind}`);
      }
    }
    expect(unsupported, 'moves whose effect the engine cannot run').toEqual([]);
  });

  it('only inflicts statuses the status system knows', () => {
    for (const move of Object.values(MOVES)) {
      if (move.effect?.kind === 'status') {
        expect(STATUS_SET.has(move.effect.status), `${move.id}`).toBe(true);
      }
    }
  });

  it('can be used in a real battle without throwing', () => {
    // Give one creature every move in turn and swing it at a punchbag.
    for (const move of Object.values(MOVES)) {
      const engine = new BattleEngine({
        playerParty: [createCreature('pyrret', 40)],
        opponentParty: [createCreature('cragmaw', 40)],
        random: createSeededRandom(9),
      });
      engine.start();

      const entry = { id: move.id, pp: move.pp, maxPp: move.pp };
      engine.player.creature.moves = [entry];

      expect(
        () => engine.submitPlayerAction({ type: 'move', moveEntry: entry }),
        `move "${move.id}" threw during a battle`
      ).not.toThrow();
    }
  });

  it('never leaves HP outside 0..max after being used', () => {
    for (const move of Object.values(MOVES)) {
      const engine = new BattleEngine({
        playerParty: [createCreature('pyrret', 30)],
        opponentParty: [createCreature('nibbit', 30)],
        random: createSeededRandom(4),
      });
      engine.start();

      const entry = { id: move.id, pp: move.pp, maxPp: move.pp };
      engine.player.creature.moves = [entry];
      engine.submitPlayerAction({ type: 'move', moveEntry: entry });

      for (const creature of [engine.player.creature, engine.opponent.creature]) {
        expect(creature.currentHp, `after ${move.id}`).toBeGreaterThanOrEqual(0);
        expect(creature.currentHp).toBeLessThanOrEqual(creature.stats.hp);
      }
    }
  });
});

describe('the Struggle fallback', () => {
  it('is a complete, usable move definition', () => {
    expect(BATTLE.struggle.name).toBeTruthy();
    expect(BATTLE.struggle.power).toBeGreaterThan(0);
    expect(MOVE_CATEGORY_SET.has(BATTLE.struggle.category)).toBe(true);
    expect(BATTLE.struggle.recoilFraction).toBeGreaterThan(0);
  });

  it('is not an id in the move database, so it cannot be learned', () => {
    expect(MOVES[BATTLE.struggle.id]).toBeUndefined();
  });
});

describe('battle-usable items', () => {
  it('gives every non-key item an effect the battle scene understands', () => {
    const supported = new Set(['heal', 'cureStatus', 'capture']);
    for (const item of Object.values(ITEMS)) {
      if (item.category === 'key') continue;
      expect(item.effect, `${item.id} has no effect`).toBeTruthy();
      expect(supported.has(item.effect.type), `${item.id}: ${item.effect.type}`).toBe(true);
    }
  });

  it('only cures statuses that exist', () => {
    for (const item of Object.values(ITEMS)) {
      if (item.effect?.type === 'cureStatus') {
        expect(STATUS_SET.has(item.effect.status), `${item.id}`).toBe(true);
      }
    }
  });

  it('gives every healing item a positive amount', () => {
    for (const item of Object.values(ITEMS)) {
      if (item.effect?.type === 'heal') {
        expect(item.effect.amount).toBeGreaterThan(0);
      }
    }
  });
});

describe('scripted battles', () => {
  it('warns for an unknown id instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getScriptedBattle('nope')).toBeNull();
    warn.mockRestore();
  });

  for (const [id, battle] of Object.entries(SCRIPTED_BATTLES)) {
    describe(`battle "${id}"`, () => {
      it('uses its own key as its id', () => {
        expect(battle.id).toBe(id);
      });

      it('has a valid battle type', () => {
        expect(['wild', 'trainer', 'practice']).toContain(battle.battleType);
      });

      it('has a party of real species at legal levels', () => {
        expect(battle.party.length).toBeGreaterThan(0);
        for (const entry of battle.party) {
          expect(CREATURES[entry.species], `unknown species "${entry.species}"`).toBeDefined();
          expect(entry.level).toBeGreaterThan(0);
          expect(entry.level).toBeLessThanOrEqual(100);
        }
      });

      it('builds a working opponent party', () => {
        const party = battle.party.map((e) => createCreature(e.species, e.level));
        expect(party.every(Boolean)).toBe(true);
        for (const creature of party) {
          expect(creature.moves.length).toBeGreaterThan(0);
          expect(creature.currentHp).toBe(creature.stats.hp);
        }
      });

      it('awards nothing if it is repeatable, so it cannot be farmed', () => {
        // Every practice battle in this project is repeatable by design.
        if (battle.battleType === 'practice') {
          expect(battle.awardExperience, `${id} is repeatable but pays experience`).toBe(false);
          expect(battle.rewardMoney).toBe(0);
        }
      });

      it('disables running unless it is a wild battle', () => {
        if (battle.battleType !== 'wild') expect(battle.canRun).toBe(false);
      });

      it('can be played from start to finish', () => {
        const engine = new BattleEngine({
          playerParty: [createCreature('pyrret', 12)],
          opponentParty: battle.party.map((e) => createCreature(e.species, e.level)),
          battleType: battle.battleType,
          opponentName: battle.opponentName,
          canRun: battle.canRun,
          awardExperience: battle.awardExperience,
          random: createSeededRandom(13),
        });
        engine.start();

        let turns = 0;
        while (!engine.isOver() && turns < 300) {
          if (engine.awaitingPlayerSwitch) {
            const index = engine.playerParty.findIndex(
              (c) => c.currentHp > 0 && c !== engine.player.creature
            );
            if (index === -1) break;
            engine.sendOutAfterFaint(index);
            continue;
          }
          const usable = engine.getUsablePlayerMoves();
          engine.submitPlayerAction({
            type: 'move',
            moveEntry: usable[0] || engine.player.creature.moves[0],
          });
          turns += 1;
        }

        expect(engine.isOver(), `${id} never reached a conclusion`).toBe(true);
      });
    });
  }
});

describe('battle references nothing that does not exist', () => {
  it('every creature can build a battler and act', () => {
    for (const id of Object.keys(CREATURES)) {
      const engine = new BattleEngine({
        playerParty: [createCreature(id, 25)],
        opponentParty: [createCreature('nibbit', 25)],
        random: createSeededRandom(6),
      });
      engine.start();

      const usable = engine.getUsablePlayerMoves();
      expect(usable.length, `${id} has no usable move`).toBeGreaterThan(0);
      expect(() => engine.submitPlayerAction({ type: 'move', moveEntry: usable[0] }))
        .not.toThrow();
    }
  });
});
