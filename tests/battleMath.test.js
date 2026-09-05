/**
 * Tests for the pure battle mathematics: stat stages, damage, accuracy and
 * turn order. Randomness is always injected, so every outcome here is exact.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createStages, clampStage, getStageMultiplier, applyStageChange,
  describeStageChange, getEffectiveStat,
} from '../src/systems/battle/StatStages.js';
import {
  calculateDamage, rollAccuracy, rollCriticalHit, getEffectiveAccuracy,
} from '../src/systems/battle/DamageCalculator.js';
import {
  resolveTurnOrder, getEffectiveSpeed, getActionPriority,
} from '../src/systems/battle/TurnResolver.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { MOVES } from '../src/data/moves.js';
import { BATTLE, STAT_STAGES, STATUS } from '../src/config/balance.js';
import { MODIFIABLE_STATS } from '../src/data/moveEffects.js';

/** A battler wrapper, as BattleEngine builds them. */
const mk = (speciesId, level = 20, overrides = {}) => ({
  creature: Object.assign(createCreature(speciesId, level), overrides),
  side: 'player',
  stages: createStages(),
  sleepTurns: 0,
  isFlinching: false,
});

const ALWAYS = () => 0;        // every chance check succeeds
const NEVER = () => 0.999999;  // every chance check fails

describe('stat stages', () => {
  it('starts every stat neutral', () => {
    const stages = createStages();
    for (const stat of MODIFIABLE_STATS) expect(stages[stat]).toBe(0);
  });

  it('clamps stages to -6..+6', () => {
    expect(clampStage(99)).toBe(STAT_STAGES.max);
    expect(clampStage(-99)).toBe(STAT_STAGES.min);
    expect(clampStage(3)).toBe(3);
    expect(clampStage(NaN)).toBe(0);
  });

  it('has a multiplier for every legal stage', () => {
    for (let stage = STAT_STAGES.min; stage <= STAT_STAGES.max; stage += 1) {
      expect(getStageMultiplier('attack', stage), `attack stage ${stage}`).toBeGreaterThan(0);
      expect(getStageMultiplier('accuracy', stage), `accuracy stage ${stage}`).toBeGreaterThan(0);
    }
  });

  it('is neutral at stage 0 and rises/falls monotonically', () => {
    expect(getStageMultiplier('attack', 0)).toBe(1);
    for (let stage = STAT_STAGES.min; stage < STAT_STAGES.max; stage += 1) {
      expect(getStageMultiplier('attack', stage + 1)).toBeGreaterThan(
        getStageMultiplier('attack', stage)
      );
    }
  });

  it('uses a gentler curve for accuracy than for battle stats', () => {
    expect(getStageMultiplier('accuracy', 6)).toBeLessThan(getStageMultiplier('attack', 6));
    expect(getStageMultiplier('accuracy', -6)).toBeGreaterThan(getStageMultiplier('attack', -6));
  });

  it('applies a change and reports what happened', () => {
    const stages = createStages();
    const result = applyStageChange(stages, 'attack', 2);
    expect(result).toEqual({ applied: 2, stage: 2, atLimit: false });
  });

  it('refuses to go past the cap and says so', () => {
    const stages = createStages();
    applyStageChange(stages, 'attack', 6);
    const result = applyStageChange(stages, 'attack', 1);
    expect(result.applied).toBe(0);
    expect(result.atLimit).toBe(true);
    expect(stages.attack).toBe(6);
  });

  it('partially applies a change that would overshoot', () => {
    const stages = createStages();
    applyStageChange(stages, 'attack', 5);
    const result = applyStageChange(stages, 'attack', 3);
    expect(result.applied).toBe(1);
    expect(stages.attack).toBe(6);
  });

  it('rejects a stat that is not modifiable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const stages = createStages();
    expect(applyStageChange(stages, 'hp', 1).applied).toBe(0);
    warn.mockRestore();
  });

  it('writes readable messages', () => {
    const name = 'Pyrret';
    expect(describeStageChange(name, 'attack', { applied: 1, atLimit: false }, 1))
      .toBe("Pyrret's Attack rose!");
    expect(describeStageChange(name, 'defense', { applied: -2, atLimit: false }, -2))
      .toBe("Pyrret's Defense sharply fell!");
    expect(describeStageChange(name, 'speed', { applied: 0, atLimit: true }, -1))
      .toBe("Pyrret's Speed won't go any lower!");
    expect(describeStageChange(name, 'attack', { applied: 0, atLimit: true }, 1))
      .toBe("Pyrret's Attack won't go any higher!");
  });

  it('multiplies the real stat by the stage', () => {
    const battler = mk('pyrret', 20);
    const base = battler.creature.stats.attack;

    expect(getEffectiveStat(battler, 'attack')).toBe(base);
    battler.stages.attack = 2;
    expect(getEffectiveStat(battler, 'attack')).toBe(Math.floor(base * 2));
    battler.stages.attack = -2;
    expect(getEffectiveStat(battler, 'attack')).toBe(Math.floor(base * 0.5));
  });

  it('never lets a stat fall below 1', () => {
    const battler = mk('drizzle', 1);
    battler.stages.speed = -6;
    expect(getEffectiveStat(battler, 'speed')).toBeGreaterThanOrEqual(1);
  });

  it('can ignore stages, as a critical hit does', () => {
    const battler = mk('pyrret', 20);
    battler.stages.defense = 6;
    expect(getEffectiveStat(battler, 'defense', { ignoreStages: true }))
      .toBe(battler.creature.stats.defense);
  });
});

describe('damage calculation', () => {
  const mid = () => 0.5;

  it('does real damage with a physical move', () => {
    const result = calculateDamage({
      attacker: mk('pyrret'), defender: mk('nibbit'), move: MOVES.scratch, random: mid,
    });
    expect(result.damage).toBeGreaterThan(0);
  });

  it('does real damage with a special move', () => {
    const result = calculateDamage({
      attacker: mk('drizzle'), defender: mk('nibbit'), move: MOVES.waterJet, random: mid,
    });
    expect(result.damage).toBeGreaterThan(0);
  });

  it('uses Attack for physical and Sp. Atk for special moves', () => {
    // Pyrret has much higher Attack than Sp. Atk. Compare two moves of equal
    // power, one of each category, against the same defender.
    const attacker = mk('pyrret', 30);
    const defender = mk('nibbit', 30);

    const physical = calculateDamage({
      attacker, defender, move: { ...MOVES.scratch, type: 'normal' }, random: mid,
    }).damage;
    const special = calculateDamage({
      attacker, defender,
      move: { ...MOVES.scratch, category: 'special', type: 'normal' },
      random: mid,
    }).damage;

    expect(physical).toBeGreaterThan(special);
  });

  it('gives a same-type move a bonus', () => {
    const attacker = mk('pyrret', 30);
    const defender = mk('nibbit', 30);

    const stab = calculateDamage({
      attacker, defender, move: { ...MOVES.ember, power: 60 }, random: mid,
    });
    const noStab = calculateDamage({
      attacker, defender, move: { ...MOVES.ember, power: 60, type: 'water' }, random: mid,
    });

    expect(stab.hasStab).toBe(true);
    expect(noStab.hasStab).toBe(false);
    expect(stab.damage).toBeGreaterThan(noStab.damage);
  });

  it('doubles for a weakness and halves for a resistance', () => {
    const attacker = mk('pyrret', 30);
    const weak = calculateDamage({
      attacker, defender: mk('sproutle', 30), move: MOVES.ember, random: mid,
    });
    const resisted = calculateDamage({
      attacker, defender: mk('drizzle', 30), move: MOVES.ember, random: mid,
    });

    expect(weak.effectiveness).toBe(2);
    expect(resisted.effectiveness).toBe(0.5);
    expect(weak.damage).toBeGreaterThan(resisted.damage);
  });

  it('compounds a dual-type weakness', () => {
    // Grubbit -> Carapex is Bug/Steel; Fire hits both for x2 = x4.
    const result = calculateDamage({
      attacker: mk('pyrret', 30), defender: mk('carapex', 30), move: MOVES.ember, random: mid,
    });
    expect(result.effectiveness).toBe(4);
  });

  it('deals nothing at all to an immune defender', () => {
    // Normal has no effect on Ghost.
    const result = calculateDamage({
      attacker: mk('nibbit', 30), defender: mk('wispel', 30), move: MOVES.tackle, random: mid,
    });
    expect(result.isImmune).toBe(true);
    expect(result.damage).toBe(0);
  });

  it('never returns negative damage', () => {
    const result = calculateDamage({
      attacker: mk('nibbit', 1), defender: mk('cragmaw', 100), move: MOVES.tackle, random: mid,
    });
    expect(result.damage).toBeGreaterThanOrEqual(0);
  });

  it('always does at least the minimum when it connects', () => {
    const result = calculateDamage({
      attacker: mk('nibbit', 1), defender: mk('cragmaw', 100), move: MOVES.tackle, random: () => 0,
    });
    expect(result.damage).toBeGreaterThanOrEqual(BATTLE.minimumDamage);
  });

  it('does no damage for a status move', () => {
    const result = calculateDamage({
      attacker: mk('pyrret'), defender: mk('nibbit'), move: MOVES.sharpenClaws, random: mid,
    });
    expect(result.damage).toBe(0);
  });

  it('hits harder on a critical', () => {
    const attacker = mk('pyrret', 30);
    const defender = mk('nibbit', 30);

    const normal = calculateDamage({ attacker, defender, move: MOVES.scratch, isCritical: false, random: mid });
    const crit = calculateDamage({ attacker, defender, move: MOVES.scratch, isCritical: true, random: mid });

    expect(crit.damage).toBeGreaterThan(normal.damage);
    expect(crit.isCritical).toBe(true);
  });

  it('ignores the defender defensive buffs on a critical hit', () => {
    const attacker = mk('pyrret', 30);
    const buffed = mk('nibbit', 30);
    buffed.stages.defense = 6;

    const normal = calculateDamage({ attacker, defender: buffed, move: MOVES.scratch, random: mid });
    const crit = calculateDamage({ attacker, defender: buffed, move: MOVES.scratch, isCritical: true, random: mid });

    expect(crit.damage).toBeGreaterThan(normal.damage * 2);
  });

  it('respects the variance band', () => {
    const attacker = mk('pyrret', 30);
    const defender = mk('nibbit', 30);

    const low = calculateDamage({ attacker, defender, move: MOVES.scratch, random: () => 0 }).damage;
    const high = calculateDamage({ attacker, defender, move: MOVES.scratch, random: () => 0.999999 }).damage;

    expect(low).toBeLessThanOrEqual(high);
    // The band is 85%-100%, so the spread can never be more than ~18%.
    expect(high / low).toBeLessThan(1.25);
  });

  it('halves physical damage while burned, but not special damage', () => {
    const healthy = mk('pyrret', 30);
    const burned = mk('pyrret', 30, { status: 'burn' });
    const defender = mk('nibbit', 30);

    const physicalHealthy = calculateDamage({ attacker: healthy, defender, move: MOVES.scratch, random: mid }).damage;
    const physicalBurned = calculateDamage({ attacker: burned, defender, move: MOVES.scratch, random: mid }).damage;
    expect(physicalBurned).toBeLessThan(physicalHealthy);

    const specialHealthy = calculateDamage({ attacker: healthy, defender, move: MOVES.ember, random: mid }).damage;
    const specialBurned = calculateDamage({ attacker: burned, defender, move: MOVES.ember, random: mid }).damage;
    expect(specialBurned).toBe(specialHealthy);
    expect(STATUS.burnAttackMultiplier).toBeLessThan(1);
  });

  it('is stronger when the attacker has an Attack buff', () => {
    const attacker = mk('pyrret', 30);
    const defender = mk('nibbit', 30);
    const before = calculateDamage({ attacker, defender, move: MOVES.scratch, random: mid }).damage;

    attacker.stages.attack = 2;
    const after = calculateDamage({ attacker, defender, move: MOVES.scratch, random: mid }).damage;
    expect(after).toBeGreaterThan(before);
  });
});

describe('critical hit rolls', () => {
  it('happens on a low roll and not on a high one', () => {
    expect(rollCriticalHit(ALWAYS)).toBe(true);
    expect(rollCriticalHit(NEVER)).toBe(false);
  });

  it('uses the configured rate', () => {
    expect(rollCriticalHit(() => BATTLE.critChance - 0.0001)).toBe(true);
    expect(rollCriticalHit(() => BATTLE.critChance + 0.0001)).toBe(false);
  });
});

describe('accuracy', () => {
  const attacker = mk('pyrret', 20);
  const defender = mk('nibbit', 20);

  it('never misses a move with null accuracy', () => {
    expect(rollAccuracy({ attacker, defender, move: MOVES.sharpenClaws, random: NEVER })).toBe(true);
  });

  it('hits on a low roll and misses on a high one', () => {
    const move = { ...MOVES.tackle, accuracy: 50 };
    expect(rollAccuracy({ attacker, defender, move, random: () => 0.1 })).toBe(true);
    expect(rollAccuracy({ attacker, defender, move, random: () => 0.9 })).toBe(false);
  });

  it('always hits a 100-accuracy move except on an impossible roll', () => {
    expect(rollAccuracy({ attacker, defender, move: MOVES.tackle, random: () => 0.999 })).toBe(true);
  });

  it('is helped by an accuracy buff and hurt by an evasion buff', () => {
    const buffed = mk('pyrret', 20);
    buffed.stages.accuracy = 6;
    const evasive = mk('nibbit', 20);
    evasive.stages.evasion = 6;

    expect(getEffectiveAccuracy(buffed, defender)).toBeGreaterThan(1);
    expect(getEffectiveAccuracy(attacker, evasive)).toBeLessThan(1);
  });

  it('makes a lowered-accuracy attacker miss more', () => {
    const blinded = mk('pyrret', 20);
    blinded.stages.accuracy = -6;
    const move = { ...MOVES.tackle, accuracy: 100 };

    expect(rollAccuracy({ attacker: blinded, defender, move, random: () => 0.5 })).toBe(false);
    expect(rollAccuracy({ attacker, defender, move, random: () => 0.5 })).toBe(true);
  });

  it('keeps the hit chance inside 0..1 at extreme stages', () => {
    const buffed = mk('pyrret', 20);
    buffed.stages.accuracy = 6;
    const blind = mk('nibbit', 20);
    blind.stages.evasion = -6;

    // Massively boosted accuracy still cannot exceed a certain hit.
    expect(rollAccuracy({ attacker: buffed, defender: blind, move: MOVES.tackle, random: () => 0.99 })).toBe(true);
  });
});

describe('turn order', () => {
  const entry = (battler, action) => ({ battler, action });

  it('sends the faster creature first', () => {
    const fast = mk('pyrret', 20);   // speed 68 base
    const slow = mk('drizzle', 20);  // speed 34 base
    const order = resolveTurnOrder(
      [entry(slow, { type: 'move', move: MOVES.tackle }), entry(fast, { type: 'move', move: MOVES.tackle })],
      () => 0.5
    );
    expect(order[0].battler).toBe(fast);
  });

  it('lets a priority move go first regardless of speed', () => {
    const fast = mk('pyrret', 20);
    const slow = mk('drizzle', 20);
    const order = resolveTurnOrder(
      [entry(fast, { type: 'move', move: MOVES.tackle }), entry(slow, { type: 'move', move: MOVES.quickJab })],
      () => 0.5
    );
    expect(order[0].battler).toBe(slow);
    expect(MOVES.quickJab.priority).toBeGreaterThan(0);
  });

  it('falls back to speed when priorities match', () => {
    const fast = mk('pyrret', 20);
    const slow = mk('drizzle', 20);
    const order = resolveTurnOrder(
      [entry(slow, { type: 'move', move: MOVES.quickJab }), entry(fast, { type: 'move', move: MOVES.quickJab })],
      () => 0.5
    );
    expect(order[0].battler).toBe(fast);
  });

  it('puts switching before any attack', () => {
    const fast = mk('pyrret', 20);
    const slow = mk('drizzle', 20);
    const order = resolveTurnOrder(
      [entry(fast, { type: 'move', move: MOVES.quickJab }), entry(slow, { type: 'switch', index: 1 })],
      () => 0.5
    );
    expect(order[0].battler).toBe(slow);
  });

  it('puts running before everything', () => {
    expect(getActionPriority({ type: 'run' })).toBeGreaterThan(getActionPriority({ type: 'switch' }));
    expect(getActionPriority({ type: 'switch' })).toBeGreaterThan(getActionPriority({ type: 'item' }));
    expect(getActionPriority({ type: 'item' })).toBeGreaterThan(
      getActionPriority({ type: 'move', move: MOVES.tackle })
    );
  });

  it('respects a Speed buff', () => {
    const a = mk('drizzle', 20);
    const b = mk('drizzle', 20);
    a.stages.speed = 2;
    const order = resolveTurnOrder(
      [entry(b, { type: 'move', move: MOVES.tackle }), entry(a, { type: 'move', move: MOVES.tackle })],
      () => 0.5
    );
    expect(order[0].battler).toBe(a);
  });

  it('halves the speed of a paralysed creature', () => {
    const healthy = mk('pyrret', 20);
    const paralysed = mk('pyrret', 20, { status: 'paralysis' });

    expect(getEffectiveSpeed(paralysed)).toBeLessThan(getEffectiveSpeed(healthy));
    expect(getEffectiveSpeed(paralysed)).toBe(
      Math.floor(getEffectiveSpeed(healthy) * STATUS.paralysisSpeedMultiplier)
    );
  });

  it('lets paralysis flip a speed race', () => {
    const fastButParalysed = mk('pyrret', 20, { status: 'paralysis' });
    const steady = mk('sproutle', 20);

    const order = resolveTurnOrder(
      [entry(fastButParalysed, { type: 'move', move: MOVES.tackle }), entry(steady, { type: 'move', move: MOVES.tackle })],
      () => 0.5
    );
    expect(order[0].battler).toBe(steady);
  });

  it('breaks an exact tie with the coin, not with input order', () => {
    const a = mk('drizzle', 20);
    const b = mk('drizzle', 20);
    const move = { type: 'move', move: MOVES.tackle };

    // The lowest coin wins; feed the values in a known sequence.
    const coins = [0.9, 0.1];
    let i = 0;
    const order = resolveTurnOrder([entry(a, move), entry(b, move)], () => coins[i++]);
    expect(order[0].battler).toBe(b);
  });

  it('never loses or duplicates an entry', () => {
    const a = mk('pyrret', 20);
    const b = mk('drizzle', 20);
    const move = { type: 'move', move: MOVES.tackle };
    const order = resolveTurnOrder([entry(a, move), entry(b, move)], () => 0.5);

    expect(order).toHaveLength(2);
    expect(new Set(order.map((e) => e.battler)).size).toBe(2);
  });
});
