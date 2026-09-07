/**
 * Tests for catching wild Aethers: the odds, the shakes, the orb being spent,
 * and what a capture does to the battle.
 *
 * All of it runs with injected randomness, so "a 30% chance" is checked exactly
 * rather than by throwing orbs until something happens.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateCaptureChance,
  attemptCapture,
  getStatusCaptureBonus,
  getCaptureModifier,
  describeShakes,
  CAPTURE_REFUSAL,
} from '../src/systems/battle/CaptureCalculator.js';
import { isItemUsableInBattle, isCaptureItem } from '../src/systems/battle/BattleItems.js';
import { BattleEngine, BATTLE_RESULT } from '../src/systems/battle/BattleEngine.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { CAPTURE } from '../src/config/balance.js';
import { ITEMS } from '../src/data/items.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { createSeededRandom } from '../src/utils/rng.js';

const alwaysLucky = () => 0;
const neverLucky = () => 0.999999;

/** A wild creature at a chosen fraction of its health. */
function wild(speciesId = 'nibbit', level = 5, hpFraction = 1) {
  const creature = createCreature(speciesId, level);
  creature.currentHp = Math.max(1, Math.round(creature.stats.hp * hpFraction));
  return creature;
}

// ---------------------------------------------------------------------------
// The odds
// ---------------------------------------------------------------------------

describe('capture chance', () => {
  it('always lands between the configured bounds', () => {
    for (const speciesId of Object.keys(CREATURES)) {
      for (const fraction of [1, 0.5, 0.01]) {
        for (const modifier of [1, 1.5, 2]) {
          const chance = calculateCaptureChance(wild(speciesId, 10, fraction), modifier);
          expect(chance).toBeGreaterThanOrEqual(CAPTURE.minChance);
          expect(chance).toBeLessThanOrEqual(CAPTURE.maxChance);
        }
      }
    }
  });

  it('gets easier as HP falls', () => {
    const full = calculateCaptureChance(wild('vinelet', 5, 1), 1);
    const half = calculateCaptureChance(wild('vinelet', 5, 0.5), 1);
    const sliver = calculateCaptureChance(wild('vinelet', 5, 0.02), 1);

    expect(half).toBeGreaterThan(full);
    expect(sliver).toBeGreaterThan(half);
  });

  it('refuses a fainted creature outright', () => {
    const fainted = wild('nibbit', 5, 1);
    fainted.currentHp = 0;
    expect(calculateCaptureChance(fainted, 2)).toBe(0);
  });

  it('refuses nothing at all', () => {
    expect(calculateCaptureChance(null, 1)).toBe(0);
  });

  it('a stronger orb helps and a weaker one does not', () => {
    const target = () => wild('vinelet', 8, 0.6);
    const basic = calculateCaptureChance(target(), ITEMS.basicOrb.effect.modifier);
    const great = calculateCaptureChance(target(), ITEMS.greatOrb.effect.modifier);
    const ultra = calculateCaptureChance(target(), ITEMS.ultraOrb.effect.modifier);

    expect(great).toBeGreaterThan(basic);
    expect(ultra).toBeGreaterThan(great);
  });

  it('a higher catch rate is easier to catch', () => {
    // Nibbit is 255, Vinelet 235, Emberfly 120 — all on Route 1.
    const easy = calculateCaptureChance(wild('nibbit', 5, 1), 1);
    const harder = calculateCaptureChance(wild('emberfly', 5, 1), 1);
    expect(easy).toBeGreaterThan(harder);
  });

  it('status conditions help, sleep most of all', () => {
    const base = wild('vinelet', 8, 0.8);
    const none = calculateCaptureChance(base, 1);

    const withStatus = (status) => {
      const c = wild('vinelet', 8, 0.8);
      c.status = status;
      return calculateCaptureChance(c, 1);
    };

    const sleep = withStatus('sleep');
    const paralysis = withStatus('paralysis');
    const poison = withStatus('poison');
    const burn = withStatus('burn');

    expect(sleep).toBeGreaterThan(paralysis);
    expect(paralysis).toBeGreaterThan(poison);
    expect(poison).toBeGreaterThan(none);
    expect(burn).toBeGreaterThan(none);
  });

  it('publishes the exact status multipliers it uses', () => {
    expect(getStatusCaptureBonus('sleep')).toBe(CAPTURE.statusBonuses.sleep);
    expect(getStatusCaptureBonus('paralysis')).toBe(CAPTURE.statusBonuses.paralysis);
    expect(getStatusCaptureBonus('poison')).toBe(CAPTURE.statusBonuses.poison);
    expect(getStatusCaptureBonus('burn')).toBe(CAPTURE.statusBonuses.burn);
    expect(getStatusCaptureBonus(null)).toBe(1);
    expect(getStatusCaptureBonus('nonsense')).toBe(1);
  });

  it('is deterministic — the same creature always gives the same number', () => {
    const a = calculateCaptureChance(wild('puffcap', 4, 0.4), 1.5);
    const b = calculateCaptureChance(wild('puffcap', 4, 0.4), 1.5);
    expect(a).toBe(b);
  });

  it('a weakened, sleeping creature with the best orb is close to certain', () => {
    const c = wild('nibbit', 3, 0.05);
    c.status = 'sleep';
    expect(calculateCaptureChance(c, ITEMS.ultraOrb.effect.modifier))
      .toBe(CAPTURE.maxChance);
  });
});

// ---------------------------------------------------------------------------
// The throw
// ---------------------------------------------------------------------------

describe('throwing an orb', () => {
  it('catches it when every check passes', () => {
    const outcome = attemptCapture({ target: wild(), modifier: 1, random: alwaysLucky });
    expect(outcome.captured).toBe(true);
    expect(outcome.shakes).toBe(CAPTURE.shakeChecks);
  });

  it('breaks out immediately when the first check fails', () => {
    const outcome = attemptCapture({ target: wild(), modifier: 1, random: neverLucky });
    expect(outcome.captured).toBe(false);
    expect(outcome.shakes).toBe(0);
  });

  it('reports the shakes that were actually rolled, not a decoration', () => {
    // Pass twice, then fail: exactly two shakes and no capture.
    const rolls = [0, 0, 0.999999, 0];
    let i = 0;
    const outcome = attemptCapture({
      target: wild(), modifier: 1, random: () => rolls[i++],
    });
    expect(outcome.shakes).toBe(2);
    expect(outcome.captured).toBe(false);
  });

  it('can produce every shake count', () => {
    const seen = new Set();
    for (let n = 0; n <= CAPTURE.shakeChecks; n += 1) {
      // n passes, then a failure (unless n is a full capture).
      const rolls = [...Array(n).fill(0), 0.999999];
      let i = 0;
      const outcome = attemptCapture({
        target: wild(), modifier: 1, random: () => rolls[i++],
      });
      seen.add(outcome.shakes);
      expect(outcome.captured).toBe(n >= CAPTURE.shakeChecks);
    }
    expect(seen.size).toBe(CAPTURE.shakeChecks + 1);
  });

  it('never captures a fainted creature however lucky the roll', () => {
    const fainted = wild();
    fainted.currentHp = 0;
    const outcome = attemptCapture({ target: fainted, modifier: 2, random: alwaysLucky });
    expect(outcome.captured).toBe(false);
    expect(outcome.shakes).toBe(0);
    expect(outcome.chance).toBe(0);
  });

  it('is deterministic for a given seed', () => {
    const run = () => {
      const random = createSeededRandom(31);
      return Array.from({ length: 40 }, () =>
        attemptCapture({ target: wild('vinelet', 6, 0.5), modifier: 1, random }));
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it('succeeds about as often as the chance says it will', () => {
    const random = createSeededRandom(2024);
    const target = wild('vinelet', 8, 0.5);
    const chance = calculateCaptureChance(target, 1);

    let caught = 0;
    const runs = 6000;
    for (let i = 0; i < runs; i += 1) {
      if (attemptCapture({ target, modifier: 1, random }).captured) caught += 1;
    }

    // Within 4 percentage points of the stated odds: the shake sequence is the
    // roll, not a separate lottery on top of it.
    expect(Math.abs(caught / runs - chance)).toBeLessThan(0.04);
  });

  it('describes each failure differently', () => {
    const said = new Set([0, 1, 2, 3].map(describeShakes));
    expect(said.size).toBe(4);
    for (const line of said) expect(line.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

describe('capture items as data', () => {
  const orbs = Object.values(ITEMS).filter((item) => item.category === 'capture');

  it('there are several tiers, and each is stronger than the last', () => {
    expect(orbs.length).toBeGreaterThanOrEqual(3);
    const modifiers = orbs.map((orb) => orb.effect.modifier).sort((a, b) => a - b);
    expect(new Set(modifiers).size).toBe(modifiers.length);
  });

  it('every capture item has a usable modifier', () => {
    for (const orb of orbs) {
      const modifier = getCaptureModifier(orb);
      expect(modifier, `${orb.id} has no modifier`).not.toBeNull();
      expect(modifier).toBeGreaterThan(0);
    }
  });

  it('every capture item is complete enough to show in a bag', () => {
    for (const orb of orbs) {
      expect(typeof orb.id).toBe('string');
      expect(typeof orb.name).toBe('string');
      expect(orb.name.length).toBeGreaterThan(0);
      expect(typeof orb.description).toBe('string');
      expect(orb.description.length).toBeGreaterThan(0);
      expect(orb.price).toBeGreaterThanOrEqual(0);
      expect(isCaptureItem(orb)).toBe(true);
    }
  });

  it('a non-capture item is not an orb and has no modifier', () => {
    expect(isCaptureItem(ITEMS.potion)).toBe(false);
    expect(getCaptureModifier(ITEMS.potion)).toBeNull();
    expect(getCaptureModifier(null)).toBeNull();
  });

  it('warns about a capture item with a broken modifier rather than guessing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = { id: 'brokenOrb', category: 'capture', effect: { type: 'capture', modifier: 0 } };
    expect(getCaptureModifier(broken)).toBeNull();
    expect(warn).toHaveBeenCalled();
    expect(isItemUsableInBattle(broken, { allowCapture: true }).ok).toBe(false);
    warn.mockRestore();
  });
});

describe('every creature can be caught in principle', () => {
  it('has a catch rate inside the scale the formula expects', () => {
    for (const [id, species] of Object.entries(CREATURES)) {
      expect(Number.isFinite(species.catchRate), `${id} has no catch rate`).toBe(true);
      expect(species.catchRate, `${id} catch rate too low`).toBeGreaterThan(0);
      expect(species.catchRate, `${id} catch rate above the scale`)
        .toBeLessThanOrEqual(CAPTURE.catchRateScale);
    }
  });
});

// ---------------------------------------------------------------------------
// The battle
// ---------------------------------------------------------------------------

/** A battle with an orb or two in the bag. */
function captureBattle(overrides = {}) {
  const inventory = overrides.inventory ?? { basicOrb: 2 };
  return new BattleEngine({
    playerParty: overrides.playerParty || [createCreature('pyrret', 20)],
    opponentParty: overrides.opponentParty || [wild('nibbit', 3, 0.2)],
    battleType: overrides.battleType || 'wild',
    random: overrides.random || alwaysLucky,
    inventory,
    ...overrides,
  });
}

describe('throwing an orb in a battle', () => {
  it('is allowed in a wild battle', () => {
    expect(captureBattle({ battleType: 'wild' }).allowCapture).toBe(true);
  });

  it('is refused in a trainer battle', () => {
    expect(captureBattle({ battleType: 'trainer' }).allowCapture).toBe(false);
  });

  it('is refused in a practice battle', () => {
    expect(captureBattle({ battleType: 'practice' }).allowCapture).toBe(false);
  });

  it('can be turned off explicitly for a scripted wild battle', () => {
    expect(captureBattle({ battleType: 'wild', allowCapture: false }).allowCapture).toBe(false);
  });

  it('ends the battle immediately on a catch', () => {
    const battle = captureBattle({ random: alwaysLucky });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(battle.isOver()).toBe(true);
    expect(battle.result.outcome).toBe(BATTLE_RESULT.CAPTURED);
    expect(events.some((e) => e.type === 'end')).toBe(true);
  });

  it('gives the opponent its turn when the catch fails', () => {
    const battle = captureBattle({ random: neverLucky });
    battle.start();
    const hpBefore = battle.player.creature.currentHp;
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(battle.isOver()).toBe(false);
    // The opponent acted: either it attacked, or it used a move and said so.
    const text = events.filter((e) => e.type === 'message').map((e) => e.text).join(' ');
    expect(text).toMatch(/Nibbit used/i);
    expect(battle.player.creature.currentHp).toBeLessThanOrEqual(hpBefore);
  });

  it('hands back the creature that was actually fought', () => {
    const target = wild('nibbit', 3, 0.2);
    const battle = captureBattle({ opponentParty: [target], random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(battle.result.captured).toBe(target);
  });

  it('awards no experience and no money for a capture', () => {
    const battle = captureBattle({ random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(battle.result.experience).toEqual([]);
    expect(battle.result.money).toBe(0);
  });

  it('reports a shake event the scene can animate', () => {
    const battle = captureBattle({ random: alwaysLucky });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    const throwEvent = events.find((e) => e.type === 'captureThrow');
    expect(throwEvent).toBeDefined();
    expect(throwEvent.captured).toBe(true);
    expect(throwEvent.shakes).toBe(CAPTURE.shakeChecks);
    expect(throwEvent.chance).toBeGreaterThan(0);
  });

  it('the shake event matches the outcome on a failure too', () => {
    const battle = captureBattle({ random: neverLucky });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    const throwEvent = events.find((e) => e.type === 'captureThrow');
    expect(throwEvent.captured).toBe(false);
    expect(throwEvent.shakes).toBe(0);
    expect(battle.isOver()).toBe(false);
  });
});

describe('spending the orb', () => {
  it('consumes exactly one on a successful throw', () => {
    const inventory = { basicOrb: 3 };
    const battle = captureBattle({ inventory, random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(inventory.basicOrb).toBe(2);
  });

  it('consumes exactly one on a failed throw too', () => {
    const inventory = { basicOrb: 3 };
    const battle = captureBattle({ inventory, random: neverLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(inventory.basicOrb).toBe(2);
  });

  it('consumes nothing when the battle forbids catching', () => {
    const inventory = { basicOrb: 3 };
    const battle = captureBattle({ battleType: 'trainer', inventory, random: alwaysLucky });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(inventory.basicOrb).toBe(3);
    expect(battle.isOver()).toBe(false);
    expect(events.map((e) => e.text).join(' ')).toContain(CAPTURE_REFUSAL.NOT_WILD);
  });

  it('consumes nothing when the bag is empty', () => {
    const inventory = { basicOrb: 0 };
    const battle = captureBattle({ inventory, random: alwaysLucky });
    battle.start();
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(inventory.basicOrb).toBe(0);
    expect(battle.isOver()).toBe(false);
    expect(events.map((e) => e.text).join(' ')).toContain(CAPTURE_REFUSAL.NONE_LEFT);
  });

  it('consumes nothing for an item that is not an orb', () => {
    const inventory = { potion: 2 };
    const battle = captureBattle({ inventory, random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'potion' });

    expect(inventory.potion).toBe(2);
    expect(battle.isOver()).toBe(false);
  });

  it('consumes nothing for an item that does not exist', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const inventory = { basicOrb: 2 };
    const battle = captureBattle({ inventory, random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'nonsenseOrb' });

    expect(inventory.basicOrb).toBe(2);
    expect(battle.isOver()).toBe(false);
    warn.mockRestore();
  });

  it('consumes nothing when the target has already fainted', () => {
    const target = wild('nibbit', 3, 1);
    const inventory = { basicOrb: 2 };
    const battle = captureBattle({ opponentParty: [target], inventory, random: alwaysLucky });
    battle.start();
    target.currentHp = 0;
    const events = battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(inventory.basicOrb).toBe(2);
    expect(events.map((e) => e.text).join(' ')).toContain(CAPTURE_REFUSAL.FAINTED);
  });

  it('a refusal does not cost the turn either', () => {
    const battle = captureBattle({ battleType: 'trainer', random: alwaysLucky });
    battle.start();
    const hpBefore = battle.player.creature.currentHp;
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    expect(battle.player.creature.currentHp).toBe(hpBefore);
  });

  it('explains itself the same way the bag would', () => {
    const battle = captureBattle({ battleType: 'practice', inventory: { basicOrb: 1 } });
    const check = battle.canCapture('basicOrb');
    expect(check.ok).toBe(false);
    expect(check.reason).toBe(CAPTURE_REFUSAL.NOT_WILD);
    expect(isItemUsableInBattle(ITEMS.basicOrb, { allowCapture: battle.allowCapture }).reason)
      .toBe(CAPTURE_REFUSAL.NOT_WILD);
  });
});

describe('the creature that comes out of the orb', () => {
  it('is the same individual, in the same condition', () => {
    const target = wild('vinelet', 7, 0.3);
    target.status = 'sleep';
    target.moves[0].pp -= 3;

    const before = {
      speciesId: target.speciesId,
      level: target.level,
      experience: target.experience,
      currentHp: target.currentHp,
      status: target.status,
      instanceId: target.instanceId,
      moves: target.moves.map((m) => `${m.id}:${m.pp}/${m.maxPp}`),
      metAt: target.metAt,
      nickname: target.nickname,
    };

    const battle = captureBattle({ opponentParty: [target], random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    const caught = battle.result.captured;
    expect(caught).toBe(target);
    expect(caught.speciesId).toBe(before.speciesId);
    expect(caught.level).toBe(before.level);
    expect(caught.experience).toBe(before.experience);
    expect(caught.currentHp).toBe(before.currentHp);
    expect(caught.status).toBe(before.status);
    expect(caught.instanceId).toBe(before.instanceId);
    expect(caught.moves.map((m) => `${m.id}:${m.pp}/${m.maxPp}`)).toEqual(before.moves);
    expect(caught.metAt).toBe(before.metAt);
    expect('nickname' in caught).toBe(true);
    expect(caught.nickname).toBe(before.nickname);
  });

  it('knows real moves with real PP', () => {
    const battle = captureBattle({ random: alwaysLucky });
    battle.start();
    battle.submitPlayerAction({ type: 'capture', itemId: 'basicOrb' });

    const caught = battle.result.captured;
    expect(caught.moves.length).toBeGreaterThan(0);
    for (const move of caught.moves) {
      expect(MOVES[move.id], `unknown move "${move.id}"`).toBeDefined();
      expect(move.pp).toBeGreaterThanOrEqual(0);
      expect(move.pp).toBeLessThanOrEqual(move.maxPp);
    }
  });
});
