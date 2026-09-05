/**
 * Tests for status conditions and the move-effect pipeline.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  applyStatus, canApplyStatus, clearStatus, checkCanAct,
  applyEndOfTurnStatus, getStatusSpeedMultiplier,
} from '../src/systems/battle/StatusSystem.js';
import {
  runEffect, rollHitCount, healCreature, damageCreature,
  SUPPORTED_EFFECT_KINDS,
} from '../src/systems/battle/MoveEffectRunner.js';
import { createStages } from '../src/systems/battle/StatStages.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { MOVES } from '../src/data/moves.js';
import { STATUS_IDS } from '../src/data/statuses.js';
import { STATUS } from '../src/config/balance.js';
import { EFFECT_KINDS } from '../src/data/moveEffects.js';

const mk = (speciesId = 'pyrret', level = 20, overrides = {}) => ({
  creature: Object.assign(createCreature(speciesId, level), overrides),
  side: 'player',
  stages: createStages(),
  sleepTurns: 0,
  isFlinching: false,
});

const ALWAYS = () => 0;
const NEVER = () => 0.999999;

describe('applying a status', () => {
  it('applies each status to a healthy creature', () => {
    for (const status of STATUS_IDS) {
      const battler = mk();
      const result = applyStatus(battler, status, ALWAYS);
      expect(result.applied, `${status} did not apply`).toBe(true);
      expect(battler.creature.status).toBe(status);
      expect(result.message).toBeTruthy();
    }
  });

  it('refuses a second, different status', () => {
    const battler = mk();
    applyStatus(battler, 'burn', ALWAYS);
    const result = applyStatus(battler, 'poison', ALWAYS);

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('other');
    expect(battler.creature.status).toBe('burn');
  });

  it('refuses the same status twice and says so', () => {
    const battler = mk();
    applyStatus(battler, 'poison', ALWAYS);
    const result = applyStatus(battler, 'poison', ALWAYS);

    expect(result.applied).toBe(false);
    expect(result.reason).toBe('already');
    expect(result.message).toMatch(/already/i);
  });

  it('refuses to status a fainted creature', () => {
    const battler = mk();
    battler.creature.currentHp = 0;
    expect(applyStatus(battler, 'burn', ALWAYS).applied).toBe(false);
  });

  it('rejects an unknown status', () => {
    const battler = mk();
    expect(canApplyStatus(battler.creature, 'cursed').ok).toBe(false);
  });

  it('gives sleep a duration inside the configured range', () => {
    for (let i = 0; i < 30; i += 1) {
      const battler = mk();
      applyStatus(battler, 'sleep', () => i / 30);
      expect(battler.sleepTurns).toBeGreaterThanOrEqual(STATUS.sleepMinTurns);
      expect(battler.sleepTurns).toBeLessThanOrEqual(STATUS.sleepMaxTurns);
    }
  });

  it('clears a status and its duration', () => {
    const battler = mk();
    applyStatus(battler, 'sleep', ALWAYS);
    clearStatus(battler);
    expect(battler.creature.status).toBeNull();
    expect(battler.sleepTurns).toBe(0);
  });
});

describe('acting under a status', () => {
  it('lets a healthy creature act', () => {
    expect(checkCanAct(mk(), NEVER).canAct).toBe(true);
  });

  it('costs exactly as many turns as the sleep counter, then wakes', () => {
    for (const roll of [0, 0.5, 0.999999]) {
      const battler = mk();
      applyStatus(battler, 'sleep', () => roll);
      const turns = battler.sleepTurns;

      // Every one of those turns is genuinely lost.
      for (let i = 0; i < turns; i += 1) {
        const asleep = checkCanAct(battler, NEVER);
        expect(asleep.canAct, `turn ${i + 1} of a ${turns}-turn sleep`).toBe(false);
      }

      const waking = checkCanAct(battler, NEVER);
      expect(waking.canAct).toBe(true);
      expect(waking.messages.join(' ')).toMatch(/woke up/i);
      expect(battler.creature.status).toBeNull();
    }
  });

  it('always sleeps for at least one turn', () => {
    const battler = mk();
    applyStatus(battler, 'sleep', () => 0);
    expect(checkCanAct(battler, NEVER).canAct).toBe(false);
  });

  it('sometimes stops a paralysed creature', () => {
    const battler = mk('pyrret', 20, { status: 'paralysis' });
    expect(checkCanAct(battler, ALWAYS).canAct).toBe(false);
    expect(checkCanAct(battler, NEVER).canAct).toBe(true);
  });

  it('stops a flinching creature exactly once', () => {
    const battler = mk();
    battler.isFlinching = true;

    const first = checkCanAct(battler, NEVER);
    expect(first.canAct).toBe(false);
    expect(first.messages.join(' ')).toMatch(/flinched/i);

    expect(checkCanAct(battler, NEVER).canAct).toBe(true);
  });

  it('halves speed only for paralysis', () => {
    expect(getStatusSpeedMultiplier({ status: 'paralysis' })).toBe(STATUS.paralysisSpeedMultiplier);
    expect(getStatusSpeedMultiplier({ status: 'burn' })).toBe(1);
    expect(getStatusSpeedMultiplier({ status: null })).toBe(1);
  });
});

describe('residual status damage', () => {
  it('hurts a poisoned creature at end of turn', () => {
    const battler = mk('drizzle', 30, { status: 'poison' });
    const before = battler.creature.currentHp;
    const result = applyEndOfTurnStatus(battler);

    expect(result.damage).toBeGreaterThan(0);
    expect(battler.creature.currentHp).toBe(before - result.damage);
    expect(result.messages.join(' ')).toMatch(/poison/i);
  });

  it('hurts a burned creature less than a poisoned one', () => {
    const poisoned = mk('drizzle', 30, { status: 'poison' });
    const burned = mk('drizzle', 30, { status: 'burn' });

    expect(applyEndOfTurnStatus(burned).damage)
      .toBeLessThan(applyEndOfTurnStatus(poisoned).damage);
  });

  it('does nothing for paralysis or sleep', () => {
    for (const status of ['paralysis', 'sleep']) {
      const battler = mk('drizzle', 30, { status });
      expect(applyEndOfTurnStatus(battler).damage).toBe(0);
    }
  });

  it('does nothing to a healthy creature', () => {
    expect(applyEndOfTurnStatus(mk()).damage).toBe(0);
  });

  it('can faint a creature and reports it', () => {
    const battler = mk('drizzle', 30, { status: 'poison' });
    battler.creature.currentHp = 1;

    const result = applyEndOfTurnStatus(battler);
    expect(result.fainted).toBe(true);
    expect(battler.creature.currentHp).toBe(0);
    expect(result.messages.join(' ')).toMatch(/fainted/i);
  });

  it('never takes a creature below zero HP', () => {
    const battler = mk('drizzle', 30, { status: 'poison' });
    battler.creature.currentHp = 1;
    applyEndOfTurnStatus(battler);
    expect(battler.creature.currentHp).toBe(0);
  });

  it('always does at least 1 damage, even to a tiny creature', () => {
    const battler = mk('nibbit', 1, { status: 'burn' });
    expect(applyEndOfTurnStatus(battler).damage).toBeGreaterThanOrEqual(1);
  });

  it('skips a creature that has already fainted', () => {
    const battler = mk('drizzle', 30, { status: 'poison' });
    battler.creature.currentHp = 0;
    expect(applyEndOfTurnStatus(battler).damage).toBe(0);
  });
});

describe('HP helpers', () => {
  it('never heals past full', () => {
    const creature = createCreature('pyrret', 20);
    creature.currentHp = creature.stats.hp - 2;
    expect(healCreature(creature, 999)).toBe(2);
    expect(creature.currentHp).toBe(creature.stats.hp);
  });

  it('never damages below zero', () => {
    const creature = createCreature('pyrret', 20);
    creature.currentHp = 3;
    expect(damageCreature(creature, 999)).toBe(3);
    expect(creature.currentHp).toBe(0);
  });

  it('ignores negative amounts', () => {
    const creature = createCreature('pyrret', 20);
    const before = creature.currentHp;
    healCreature(creature, -50);
    damageCreature(creature, -50);
    expect(creature.currentHp).toBe(before);
  });
});

describe('move effects', () => {
  it('supports every effect kind the database uses', () => {
    const used = new Set(
      Object.values(MOVES).filter((m) => m.effect).map((m) => m.effect.kind)
    );
    const missing = [...used].filter((kind) => !SUPPORTED_EFFECT_KINDS.has(kind));
    expect(missing, 'effect kinds with no implementation').toEqual([]);
  });

  it('inflicts a status', () => {
    const user = mk();
    const target = mk('nibbit');
    const result = runEffect({
      effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 1 },
      user, target, random: ALWAYS,
    });
    expect(target.creature.status).toBe('burn');
    expect(result.messages.join(' ')).toMatch(/burned/i);
  });

  it('respects an effect chance', () => {
    const target = mk('nibbit');
    runEffect({
      effect: { kind: EFFECT_KINDS.STATUS, status: 'burn', chance: 0.1 },
      user: mk(), target, random: NEVER,
    });
    expect(target.creature.status).toBeNull();
  });

  it('raises the user own stat', () => {
    const user = mk();
    runEffect({
      effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'self', stat: 'attack', stages: 1, chance: 1 },
      user, target: mk('nibbit'), random: ALWAYS,
    });
    expect(user.stages.attack).toBe(1);
  });

  it('lowers the foe stat', () => {
    const target = mk('nibbit');
    runEffect({
      effect: { kind: EFFECT_KINDS.STAT_CHANGE, target: 'foe', stat: 'defense', stages: -2, chance: 1 },
      user: mk(), target, random: ALWAYS,
    });
    expect(target.stages.defense).toBe(-2);
  });

  it('heals the user and never past full', () => {
    const user = mk('drizzle', 30);
    user.creature.currentHp = 1;
    const result = runEffect({
      effect: { kind: EFFECT_KINDS.HEAL, fraction: 0.5 },
      user, target: mk('nibbit'), random: ALWAYS,
    });

    expect(user.creature.currentHp).toBeGreaterThan(1);
    expect(user.creature.currentHp).toBeLessThanOrEqual(user.creature.stats.hp);
    expect(result.messages.join(' ')).toMatch(/recovered/i);
  });

  it('reports a failed heal at full health', () => {
    const user = mk('drizzle', 30);
    const result = runEffect({
      effect: { kind: EFFECT_KINDS.HEAL, fraction: 0.5 },
      user, target: mk('nibbit'), random: ALWAYS,
    });
    expect(result.messages.join(' ')).toMatch(/already full/i);
  });

  it('drains a share of the damage dealt', () => {
    const user = mk('drizzle', 30);
    user.creature.currentHp = 10;
    runEffect({
      effect: { kind: EFFECT_KINDS.DRAIN, fraction: 0.5 },
      user, target: mk('nibbit'), damageDealt: 20, random: ALWAYS,
    });
    expect(user.creature.currentHp).toBe(20);
  });

  it('drains nothing when no damage was dealt', () => {
    const user = mk('drizzle', 30);
    user.creature.currentHp = 10;
    runEffect({
      effect: { kind: EFFECT_KINDS.DRAIN, fraction: 0.5 },
      user, target: mk('nibbit'), damageDealt: 0, random: ALWAYS,
    });
    expect(user.creature.currentHp).toBe(10);
  });

  it('hurts the user with recoil', () => {
    const user = mk('pyrret', 30);
    const before = user.creature.currentHp;
    runEffect({
      effect: { kind: EFFECT_KINDS.RECOIL, fraction: 0.25 },
      user, target: mk('nibbit'), damageDealt: 40, random: ALWAYS,
    });
    expect(user.creature.currentHp).toBe(before - 10);
  });

  it('reports the user fainting from recoil', () => {
    const user = mk('pyrret', 30);
    user.creature.currentHp = 2;
    const result = runEffect({
      effect: { kind: EFFECT_KINDS.RECOIL, fraction: 0.5 },
      user, target: mk('nibbit'), damageDealt: 40, random: ALWAYS,
    });

    expect(user.creature.currentHp).toBe(0);
    expect(result.fainted).toHaveLength(1);
    expect(result.messages.join(' ')).toMatch(/fainted/i);
  });

  it('makes the target flinch', () => {
    const target = mk('nibbit');
    runEffect({
      effect: { kind: EFFECT_KINDS.FLINCH, chance: 1 },
      user: mk(), target, random: ALWAYS,
    });
    expect(target.isFlinching).toBe(true);
  });

  it('warns about an unimplemented effect kind instead of crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = runEffect({
      effect: { kind: 'teleport' }, user: mk(), target: mk('nibbit'), random: ALWAYS,
    });
    expect(result.messages).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does nothing for a move with no effect', () => {
    expect(runEffect({ effect: null, user: mk(), target: mk('nibbit') }).messages).toEqual([]);
  });
});

describe('multi-hit moves', () => {
  it('returns 1 for an ordinary move', () => {
    expect(rollHitCount(MOVES.tackle, ALWAYS)).toBe(1);
  });

  it('stays inside the declared range', () => {
    const move = MOVES.pebbleVolley;
    expect(move.effect.kind).toBe(EFFECT_KINDS.MULTI_HIT);

    for (let i = 0; i < 50; i += 1) {
      const hits = rollHitCount(move, () => i / 50);
      expect(hits).toBeGreaterThanOrEqual(move.effect.min);
      expect(hits).toBeLessThanOrEqual(move.effect.max);
    }
  });

  it('hits the minimum on the lowest roll and the maximum on the highest', () => {
    const move = MOVES.pebbleVolley;
    expect(rollHitCount(move, () => 0)).toBe(move.effect.min);
    expect(rollHitCount(move, () => 0.999999)).toBe(move.effect.max);
  });
});
