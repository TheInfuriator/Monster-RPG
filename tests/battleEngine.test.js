/**
 * Tests for the battle engine: whole battles, played out with seeded
 * randomness, with no browser involved.
 */

import { describe, it, expect, vi } from 'vitest';
import { BattleEngine, BATTLE_RESULT } from '../src/systems/battle/BattleEngine.js';
import { chooseAction, getUsableMoves, scoreMove } from '../src/systems/battle/BattleAI.js';
import { createStages } from '../src/systems/battle/StatStages.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { createSeededRandom } from '../src/utils/rng.js';
import { MOVES } from '../src/data/moves.js';
import { BATTLE } from '../src/config/balance.js';

const seeded = (seed = 1) => createSeededRandom(seed);

/** A battle with one creature a side. */
function makeBattle(overrides = {}) {
  return new BattleEngine({
    playerParty: overrides.playerParty || [createCreature('pyrret', 10)],
    opponentParty: overrides.opponentParty || [createCreature('nibbit', 8)],
    battleType: overrides.battleType || 'wild',
    random: overrides.random || seeded(7),
    ...overrides,
  });
}

const textOf = (events) => events.filter((e) => e.type === 'message').map((e) => e.text).join(' | ');

/**
 * Give the player's creature exactly this one move and return the action that
 * uses it.
 *
 * Deliberately explicit rather than searching the creature's natural learnset:
 * a test that quietly falls back to "whatever move slot 0 happens to be" can
 * end up testing a status move while claiming to test damage, and would break
 * for the wrong reason whenever a learnset is retuned.
 */
function useMove(engine, moveId) {
  const move = MOVES[moveId];
  if (!move) throw new Error(`Test asked for unknown move "${moveId}"`);

  const entry = { id: moveId, pp: move.pp, maxPp: move.pp };
  engine.player.creature.moves = [entry];
  return { type: 'move', moveEntry: entry };
}

describe('starting a battle', () => {
  it('announces a wild creature', () => {
    const battle = makeBattle({ battleType: 'wild' });
    expect(textOf(battle.start())).toMatch(/A wild Nibbit appeared!/);
  });

  it('announces a trainer by name', () => {
    const battle = makeBattle({ battleType: 'trainer', opponentName: 'Kestrel' });
    const text = textOf(battle.start());
    expect(text).toMatch(/Kestrel wants to battle!/);
    expect(text).toMatch(/Kestrel sent out/);
  });

  it('sends out the first healthy creature on each side', () => {
    const fainted = createCreature('drizzle', 10);
    fainted.currentHp = 0;
    const healthy = createCreature('pyrret', 10);

    const battle = makeBattle({ playerParty: [fainted, healthy] });
    expect(battle.player.creature).toBe(healthy);
  });

  it('allows running from a wild battle but not a trainer one', () => {
    expect(makeBattle({ battleType: 'wild' }).canRun).toBe(true);
    expect(makeBattle({ battleType: 'trainer' }).canRun).toBe(false);
    expect(makeBattle({ battleType: 'practice' }).canRun).toBe(false);
  });
});

describe('taking a turn', () => {
  it('reports the move being used', () => {
    const battle = makeBattle();
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));
    expect(textOf(events)).toMatch(/Pyrret used Ember!/);
  });

  it('deals damage to the opponent', () => {
    const battle = makeBattle();
    battle.start();
    const before = battle.opponent.creature.currentHp;
    battle.submitPlayerAction(useMove(battle, 'ember'));
    expect(battle.opponent.creature.currentHp).toBeLessThan(before);
  });

  it('emits damage events the UI can animate', () => {
    const battle = makeBattle();
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));
    expect(events.some((e) => e.type === 'damage')).toBe(true);
  });

  it('spends one PP when a move is used', () => {
    const battle = makeBattle();
    battle.start();
    const move = battle.player.creature.moves.find((m) => m.id === 'ember');
    const before = move.pp;

    battle.submitPlayerAction({ type: 'move', moveEntry: move });
    expect(move.pp).toBe(before - 1);
  });

  it('spends PP even when the move misses', () => {
    // Stone Hammer is 85% accurate, so a maximum roll always misses.
    // (A 100%-accurate move can never miss, which is why Ember is wrong here.)
    const battle = makeBattle({ random: () => 0.999999 });
    battle.start();
    const action = useMove(battle, 'stoneHammer');
    action.moveEntry.pp = 5;

    const events = battle.submitPlayerAction(action);
    expect(action.moveEntry.pp).toBe(4);
    expect(textOf(events)).toMatch(/missed/i);
  });

  it('both sides act in one turn', () => {
    const battle = makeBattle();
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));
    const used = textOf(events).match(/used/g) || [];
    expect(used.length).toBeGreaterThanOrEqual(2);
  });

  it('announces effectiveness', () => {
    const battle = makeBattle({
      playerParty: [createCreature('pyrret', 20)],
      opponentParty: [createCreature('sproutle', 10)],
      random: seeded(3),
    });
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));
    expect(textOf(events)).toMatch(/super effective/i);
  });

  it('says a move had no effect against an immune target', () => {
    const battle = makeBattle({
      playerParty: [createCreature('nibbit', 30)],
      opponentParty: [createCreature('wispel', 10)],
      random: seeded(3),
    });
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'tackle'));
    expect(textOf(events)).toMatch(/no effect/i);
  });
});

describe('struggling', () => {
  it('falls back to Struggle when every move is out of PP', () => {
    const battle = makeBattle({ random: seeded(5) });
    battle.start();
    for (const move of battle.player.creature.moves) move.pp = 0;

    const events = battle.submitPlayerAction({ type: 'move', moveEntry: battle.player.creature.moves[0] });
    expect(textOf(events)).toMatch(/used Struggle!/);
  });

  it('hurts the user with Struggle recoil', () => {
    const battle = makeBattle({ random: seeded(5) });
    battle.start();
    for (const move of battle.player.creature.moves) move.pp = 0;
    const before = battle.player.creature.currentHp;

    battle.submitPlayerAction({ type: 'move', moveEntry: battle.player.creature.moves[0] });
    expect(battle.player.creature.currentHp).toBeLessThan(before);
    expect(BATTLE.struggle.recoilFraction).toBeGreaterThan(0);
  });
});

describe('switching', () => {
  const twoCreatures = () => [createCreature('pyrret', 10), createCreature('drizzle', 10)];

  it('accepts a valid switch', () => {
    const battle = makeBattle({ playerParty: twoCreatures() });
    battle.start();
    expect(battle.canSwitchTo(1).ok).toBe(true);

    const events = battle.submitPlayerAction({ type: 'switch', index: 1 });
    expect(battle.player.creature.speciesId).toBe('drizzle');
    expect(textOf(events)).toMatch(/Go, Drizzle!/);
  });

  it('rejects switching to the creature already out', () => {
    const battle = makeBattle({ playerParty: twoCreatures() });
    battle.start();
    expect(battle.canSwitchTo(0)).toEqual({ ok: false, reason: 'active' });
  });

  it('rejects switching to a fainted creature', () => {
    const party = twoCreatures();
    party[1].currentHp = 0;
    const battle = makeBattle({ playerParty: party });
    battle.start();
    expect(battle.canSwitchTo(1)).toEqual({ ok: false, reason: 'fainted' });
  });

  it('rejects an invalid index', () => {
    const battle = makeBattle({ playerParty: twoCreatures() });
    battle.start();
    for (const index of [-1, 99, 1.5, null, undefined]) {
      expect(battle.canSwitchTo(index).ok, `index ${index}`).toBe(false);
    }
  });

  it('reports no switchable creatures with a party of one', () => {
    const battle = makeBattle();
    battle.start();
    expect(battle.hasHealthyReserves()).toBe(false);
    expect(battle.getSwitchableCreatures()).toEqual([]);
  });

  it('clears stat stages on switching out', () => {
    const battle = makeBattle({ playerParty: twoCreatures() });
    battle.start();
    battle.player.stages.attack = 4;

    battle.submitPlayerAction({ type: 'switch', index: 1 });
    expect(battle.player.stages.attack).toBe(0);
  });

  it('counts the incoming creature as a participant', () => {
    const party = twoCreatures();
    const battle = makeBattle({ playerParty: party });
    battle.start();
    battle.submitPlayerAction({ type: 'switch', index: 1 });
    expect(battle.participants.has(party[1])).toBe(true);
  });
});

describe('fainting', () => {
  it('asks the player for a replacement when one is available', () => {
    const party = [createCreature('pyrret', 5), createCreature('drizzle', 20)];
    party[0].currentHp = 1;

    const battle = makeBattle({
      playerParty: party,
      opponentParty: [createCreature('cragmaw', 40)],
      random: seeded(11),
    });
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(events.some((e) => e.type === 'requestSwitch')).toBe(true);
    expect(battle.awaitingPlayerSwitch).toBe(true);
    expect(battle.isOver()).toBe(false);
  });

  it('will not take another turn until the replacement is chosen', () => {
    const party = [createCreature('pyrret', 5), createCreature('drizzle', 20)];
    party[0].currentHp = 1;
    const battle = makeBattle({
      playerParty: party, opponentParty: [createCreature('cragmaw', 40)], random: seeded(11),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(battle.submitPlayerAction(useMove(battle, 'ember'))).toEqual([]);
    warn.mockRestore();
  });

  it('sends out the replacement and resumes', () => {
    const party = [createCreature('pyrret', 5), createCreature('drizzle', 20)];
    party[0].currentHp = 1;
    const battle = makeBattle({
      playerParty: party, opponentParty: [createCreature('cragmaw', 40)], random: seeded(11),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    const events = battle.sendOutAfterFaint(1);
    expect(battle.awaitingPlayerSwitch).toBe(false);
    expect(battle.player.creature.speciesId).toBe('drizzle');
    expect(textOf(events)).toMatch(/Go, Drizzle!/);
  });

  it('sends out the opponent next creature', () => {
    const opponents = [createCreature('nibbit', 3), createCreature('flittle', 8)];
    opponents[0].currentHp = 1;

    const battle = makeBattle({
      playerParty: [createCreature('pyrret', 30)],
      opponentParty: opponents,
      battleType: 'trainer',
      opponentName: 'Kestrel',
      random: seeded(2),
    });
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.opponent.creature.speciesId).toBe('flittle');
    expect(textOf(events)).toMatch(/Kestrel sent out Flittle!/);
    expect(battle.isOver()).toBe(false);
  });
});

describe('finishing a battle', () => {
  it('is a win when the last opponent faints', () => {
    const opponent = createCreature('nibbit', 3);
    opponent.currentHp = 1;

    const battle = makeBattle({
      playerParty: [createCreature('pyrret', 30)],
      opponentParty: [opponent],
      random: seeded(2),
    });
    battle.start();
    const events = battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(events.some((e) => e.type === 'end')).toBe(true);
    expect(textOf(events)).toMatch(/won the battle/i);
  });

  it('is a loss when the last player creature faints', () => {
    const player = createCreature('pyrret', 3);
    player.currentHp = 1;

    const battle = makeBattle({
      playerParty: [player],
      opponentParty: [createCreature('cragmaw', 40)],
      random: seeded(4),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.result.outcome).toBe(BATTLE_RESULT.LOSS);
  });

  it('awards experience on a win', () => {
    const player = createCreature('pyrret', 10);
    const opponent = createCreature('nibbit', 5);
    opponent.currentHp = 1;
    const before = player.experience;

    const battle = makeBattle({
      playerParty: [player], opponentParty: [opponent], random: seeded(2),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.result.experience.length).toBeGreaterThan(0);
    expect(player.experience).toBeGreaterThan(before);
  });

  it('awards no experience on a loss', () => {
    const player = createCreature('pyrret', 3);
    player.currentHp = 1;
    const battle = makeBattle({
      playerParty: [player], opponentParty: [createCreature('cragmaw', 40)], random: seeded(4),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.result.experience).toEqual([]);
  });

  it('can be configured to award nothing, for a repeatable practice battle', () => {
    const player = createCreature('pyrret', 10);
    const opponent = createCreature('nibbit', 5);
    opponent.currentHp = 1;
    const before = player.experience;

    const battle = makeBattle({
      playerParty: [player], opponentParty: [opponent],
      battleType: 'practice', awardExperience: false, random: seeded(2),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(battle.result.experience).toEqual([]);
    expect(player.experience).toBe(before);
  });

  it('ignores further actions once it is over', () => {
    const opponent = createCreature('nibbit', 3);
    opponent.currentHp = 1;
    const battle = makeBattle({
      playerParty: [createCreature('pyrret', 30)], opponentParty: [opponent], random: seeded(2),
    });
    battle.start();
    battle.submitPlayerAction(useMove(battle, 'ember'));

    expect(battle.submitPlayerAction(useMove(battle, 'ember'))).toEqual([]);
  });
});

describe('running', () => {
  it('can escape a wild battle on a lucky roll', () => {
    const battle = makeBattle({ battleType: 'wild', random: () => 0 });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'run' });

    expect(battle.result.outcome).toBe(BATTLE_RESULT.FLED);
    expect(textOf(events)).toMatch(/Got away safely/i);
  });

  it('fails to escape on an unlucky roll and loses the turn', () => {
    const battle = makeBattle({ battleType: 'wild', random: () => 0.999999 });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'run' });

    expect(battle.result).toBeNull();
    expect(textOf(events)).toMatch(/Couldn't get away/i);
    expect(textOf(events)).toMatch(/used/); // the opponent still attacked
  });

  it('refuses outright in a trainer battle', () => {
    const battle = makeBattle({ battleType: 'trainer', random: () => 0 });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'run' });

    expect(battle.result).toBeNull();
    expect(textOf(events)).toMatch(/no running/i);
  });

  it('refuses in a practice battle', () => {
    const battle = makeBattle({ battleType: 'practice', random: () => 0 });
    battle.start();
    expect(textOf(battle.submitPlayerAction({ type: 'run' }))).toMatch(/no running/i);
  });

  it('gets easier with repeated attempts', () => {
    const battle = makeBattle({ battleType: 'wild', random: () => 0.999999 });
    battle.start();
    battle.submitPlayerAction({ type: 'run' });
    expect(battle.escapeAttempts).toBe(1);
  });
});

describe('a whole battle plays to a conclusion', () => {
  it('always ends within a reasonable number of turns', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const battle = new BattleEngine({
        playerParty: [createCreature('pyrret', 12), createCreature('drizzle', 12)],
        opponentParty: [createCreature('nibbit', 10), createCreature('grubbit', 10)],
        battleType: 'trainer',
        opponentName: 'Tester',
        random: seeded(seed),
      });
      battle.start();

      let turns = 0;
      while (!battle.isOver() && turns < 200) {
        if (battle.awaitingPlayerSwitch) {
          const index = battle.playerParty.findIndex(
            (c) => c.currentHp > 0 && c !== battle.player.creature
          );
          battle.sendOutAfterFaint(index);
          continue;
        }
        const usable = battle.getUsablePlayerMoves();
        battle.submitPlayerAction({
          type: 'move',
          moveEntry: usable[0] || battle.player.creature.moves[0],
        });
        turns += 1;
      }

      expect(battle.isOver(), `seed ${seed} never finished`).toBe(true);
      expect([BATTLE_RESULT.WIN, BATTLE_RESULT.LOSS]).toContain(battle.result.outcome);
    }
  });

  it('never leaves a creature with negative HP', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const battle = new BattleEngine({
        playerParty: [createCreature('sproutle', 15)],
        opponentParty: [createCreature('emberfly', 14)],
        random: seeded(seed),
      });
      battle.start();

      let turns = 0;
      while (!battle.isOver() && turns < 200) {
        const usable = battle.getUsablePlayerMoves();
        battle.submitPlayerAction({
          type: 'move', moveEntry: usable[0] || battle.player.creature.moves[0],
        });
        turns += 1;
      }

      for (const creature of [...battle.playerParty, ...battle.opponentParty]) {
        expect(creature.currentHp).toBeGreaterThanOrEqual(0);
        expect(creature.currentHp).toBeLessThanOrEqual(creature.stats.hp);
      }
    }
  });
});

describe('opponent AI', () => {
  const mk = (id, level) => ({
    creature: createCreature(id, level), stages: createStages(), sleepTurns: 0, isFlinching: false,
  });

  it('never picks a move with no PP', () => {
    const battler = mk('pyrret', 20);
    for (const move of battler.creature.moves) move.pp = 0;
    battler.creature.moves[1].pp = 3;

    for (let i = 0; i < 40; i += 1) {
      const action = chooseAction(battler, mk('nibbit', 20), seeded(i));
      expect(action.type).toBe('move');
      expect(action.moveEntry.pp).toBeGreaterThan(0);
    }
  });

  it('struggles when nothing is usable', () => {
    const battler = mk('pyrret', 20);
    for (const move of battler.creature.moves) move.pp = 0;
    expect(chooseAction(battler, mk('nibbit', 20), seeded(1)).type).toBe('struggle');
  });

  it('is deterministic for a given seed', () => {
    const a = chooseAction(mk('pyrret', 20), mk('sproutle', 20), seeded(42));
    const b = chooseAction(mk('pyrret', 20), mk('sproutle', 20), seeded(42));
    expect(a.move.id).toBe(b.move.id);
  });

  it('prefers a super-effective move over a resisted one', () => {
    const attacker = mk('pyrret', 20);
    const grassDefender = mk('sproutle', 20);

    const emberEntry = { id: 'ember', pp: 30, maxPp: 30 };
    const waterEntry = { id: 'waterJet', pp: 30, maxPp: 30 };

    expect(scoreMove(emberEntry, attacker, grassDefender))
      .toBeGreaterThan(scoreMove(waterEntry, attacker, grassDefender));
  });

  it('lists only usable moves', () => {
    const battler = mk('pyrret', 20);
    battler.creature.moves[0].pp = 0;
    expect(getUsableMoves(battler)).toHaveLength(battler.creature.moves.length - 1);
  });
});

describe('status inside a real battle', () => {
  it('burns the opponent and then hurts it at end of turn', () => {
    const battle = makeBattle({
      playerParty: [createCreature('pyrret', 25)],
      opponentParty: [createCreature('cragmaw', 25)],
      random: () => 0, // every chance succeeds, every roll is the low end
    });
    battle.start();

    const cinderSpray = { id: 'cinderSpray', pp: 20, maxPp: 20 };
    battle.player.creature.moves = [cinderSpray];

    const events = battle.submitPlayerAction({ type: 'move', moveEntry: cinderSpray });
    expect(battle.opponent.creature.status).toBe('burn');
    expect(textOf(events)).toMatch(/burned/i);
    expect(textOf(events)).toMatch(/hurt by its burn/i);
  });
});
