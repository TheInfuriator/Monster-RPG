/**
 * Tests for what happens after a win: experience, levels, new moves, evolution.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateExperienceReward, grantExperience, teachMove,
  replaceMove, evolveCreature, distributeExperience,
} from '../src/systems/battle/ExperienceSystem.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { CREATURES } from '../src/data/creatures.js';
import { MOVES } from '../src/data/moves.js';
import { experienceForLevel, STAT_KEYS } from '../src/systems/StatCalculator.js';
import { PARTY, PROGRESSION, EXPERIENCE } from '../src/config/balance.js';

describe('experience rewards', () => {
  it('follows the documented formula', () => {
    const defeated = createCreature('nibbit', 10);
    const expected = Math.floor((CREATURES.nibbit.baseExp * 10) / EXPERIENCE.divisor);
    expect(calculateExperienceReward(defeated, 'wild')).toBe(expected);
  });

  it('pays more for a higher-level opponent', () => {
    expect(calculateExperienceReward(createCreature('nibbit', 20), 'wild'))
      .toBeGreaterThan(calculateExperienceReward(createCreature('nibbit', 5), 'wild'));
  });

  it('pays more for a trainer battle', () => {
    const defeated = createCreature('nibbit', 10);
    expect(calculateExperienceReward(defeated, 'trainer'))
      .toBeGreaterThan(calculateExperienceReward(defeated, 'wild'));
    expect(PROGRESSION.trainerExpMultiplier).toBeGreaterThan(1);
  });

  it('never returns a negative reward', () => {
    for (const id of Object.keys(CREATURES)) {
      expect(calculateExperienceReward(createCreature(id, 1), 'wild')).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('gaining experience', () => {
  it('adds experience without levelling when below the threshold', () => {
    const creature = createCreature('pyrret', 5);
    const before = creature.experience;
    const result = grantExperience(creature, 5);

    expect(creature.experience).toBe(before + 5);
    expect(result.levelsGained).toBe(0);
    expect(creature.level).toBe(5);
  });

  it('levels up on reaching the exact threshold', () => {
    const creature = createCreature('pyrret', 5);
    const needed = experienceForLevel(6, CREATURES.pyrret.growthRate) - creature.experience;

    const result = grantExperience(creature, needed);
    expect(creature.level).toBe(6);
    expect(result.levelsGained).toBe(1);
    expect(result.fromLevel).toBe(5);
    expect(result.toLevel).toBe(6);
  });

  it('does not level one point short of the threshold', () => {
    const creature = createCreature('pyrret', 5);
    const needed = experienceForLevel(6, CREATURES.pyrret.growthRate) - creature.experience;
    grantExperience(creature, needed - 1);
    expect(creature.level).toBe(5);
  });

  it('can gain several levels at once', () => {
    const creature = createCreature('pyrret', 5);
    const target = experienceForLevel(12, CREATURES.pyrret.growthRate);
    const result = grantExperience(creature, target - creature.experience);

    expect(creature.level).toBe(12);
    expect(result.levelsGained).toBe(7);
  });

  it('recalculates stats on level-up', () => {
    const creature = createCreature('pyrret', 5);
    const before = { ...creature.stats };
    grantExperience(creature, experienceForLevel(15, 'medium'));

    for (const key of STAT_KEYS) {
      expect(creature.stats[key], `${key} did not grow`).toBeGreaterThan(before[key]);
    }
  });

  it('reports the stat gains', () => {
    const creature = createCreature('pyrret', 5);
    const result = grantExperience(creature, experienceForLevel(10, 'medium'));
    expect(result.statGains.attack).toBeGreaterThan(0);
  });

  it('keeps existing damage and grants the extra max HP as real HP', () => {
    const creature = createCreature('pyrret', 5);
    const maxBefore = creature.stats.hp;
    creature.currentHp = 5;

    grantExperience(creature, experienceForLevel(6, 'medium') - creature.experience);

    const gained = creature.stats.hp - maxBefore;
    expect(creature.currentHp).toBe(5 + gained);
    expect(creature.currentHp).toBeLessThan(creature.stats.hp);
  });

  it('ignores zero and negative amounts', () => {
    const creature = createCreature('pyrret', 5);
    const before = creature.experience;

    expect(grantExperience(creature, 0).gained).toBe(0);
    expect(grantExperience(creature, -500).gained).toBe(0);
    expect(creature.experience).toBe(before);
  });

  it('never exceeds the level cap', () => {
    const creature = createCreature('pyrret', 99);
    grantExperience(creature, 999999999);
    expect(creature.level).toBe(PROGRESSION.maxLevel);
  });

  it('lists every move learned across all the levels crossed', () => {
    const creature = createCreature('pyrret', 5);
    const result = grantExperience(creature, experienceForLevel(20, 'medium'));

    const expected = CREATURES.pyrret.learnset
      .filter((e) => e.level > 5 && e.level <= creature.level)
      .map((e) => e.moveId ?? e.move);

    expect(result.movesToLearn.map((m) => m.moveId)).toEqual(expected);
    expect(result.movesToLearn.length).toBeGreaterThan(1);
  });

  it('flags an evolution when the level is reached', () => {
    const creature = createCreature('pyrret', 15);
    const result = grantExperience(creature, experienceForLevel(16, 'medium') - creature.experience);
    expect(result.evolutionTo).toBe('cindraw');
  });

  it('does not flag an evolution below the level', () => {
    const creature = createCreature('pyrret', 5);
    expect(grantExperience(creature, 10).evolutionTo).toBeNull();
  });
});

describe('sharing experience', () => {
  it('gives every participant the full amount', () => {
    const a = createCreature('pyrret', 5);
    const b = createCreature('drizzle', 5);
    const results = distributeExperience([a, b], 100);

    expect(results).toHaveLength(2);
    expect(a.experience).toBe(createCreature('pyrret', 5).experience + 100);
    expect(b.experience).toBe(createCreature('drizzle', 5).experience + 100);
  });

  it('skips a fainted participant', () => {
    const alive = createCreature('pyrret', 5);
    const fainted = createCreature('drizzle', 5);
    fainted.currentHp = 0;
    const before = fainted.experience;

    const results = distributeExperience([alive, fainted], 100);
    expect(results).toHaveLength(1);
    expect(fainted.experience).toBe(before);
  });
});

describe('learning moves', () => {
  it('learns automatically with room to spare', () => {
    const creature = createCreature('pyrret', 5);
    creature.moves = [{ id: 'tackle', pp: 35, maxPp: 35 }];

    const result = teachMove(creature, 'ember');
    expect(result.learned).toBe(true);
    expect(result.needsChoice).toBe(false);
    expect(creature.moves.map((m) => m.id)).toContain('ember');
    expect(result.message).toMatch(/learned/i);
  });

  it('gives the new move full PP', () => {
    const creature = createCreature('pyrret', 5);
    creature.moves = [];
    teachMove(creature, 'flameBurst');
    const learned = creature.moves.find((m) => m.id === 'flameBurst');
    expect(learned.pp).toBe(MOVES.flameBurst.pp);
    expect(learned.maxPp).toBe(MOVES.flameBurst.pp);
  });

  it('asks for a choice when four moves are known', () => {
    const creature = createCreature('pyrret', 5);
    creature.moves = ['tackle', 'scratch', 'ember', 'quickJab']
      .map((id) => ({ id, pp: 10, maxPp: 10 }));

    const result = teachMove(creature, 'flameBurst');
    expect(result.learned).toBe(false);
    expect(result.needsChoice).toBe(true);
    expect(creature.moves).toHaveLength(PARTY.maxMoves);
  });

  it('never learns the same move twice', () => {
    const creature = createCreature('pyrret', 5);
    creature.moves = [{ id: 'ember', pp: 30, maxPp: 30 }];
    const result = teachMove(creature, 'ember');

    expect(result.learned).toBe(false);
    expect(result.needsChoice).toBe(false);
    expect(creature.moves).toHaveLength(1);
  });

  it('ignores an unknown move id', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const creature = createCreature('pyrret', 5);
    expect(teachMove(creature, 'nonsense').learned).toBe(false);
    warn.mockRestore();
  });
});

describe('replacing a move', () => {
  const fourMoves = () => {
    const creature = createCreature('pyrret', 5);
    creature.moves = ['tackle', 'scratch', 'ember', 'quickJab']
      .map((id) => ({ id, pp: 10, maxPp: 10 }));
    return creature;
  };

  it('swaps the chosen slot', () => {
    const creature = fourMoves();
    const result = replaceMove(creature, 1, 'flameBurst');

    expect(result.replaced).toBe(true);
    expect(creature.moves[1].id).toBe('flameBurst');
    expect(creature.moves).toHaveLength(4);
    expect(result.message).toMatch(/forgot Scratch and learned Flame Burst/);
  });

  it('gives the replacement full PP', () => {
    const creature = fourMoves();
    replaceMove(creature, 0, 'flameBurst');
    expect(creature.moves[0].pp).toBe(MOVES.flameBurst.pp);
  });

  it('rejects an out-of-range slot and changes nothing', () => {
    const creature = fourMoves();
    const before = creature.moves.map((m) => m.id);

    expect(replaceMove(creature, 9, 'flameBurst').replaced).toBe(false);
    expect(replaceMove(creature, -1, 'flameBurst').replaced).toBe(false);
    expect(creature.moves.map((m) => m.id)).toEqual(before);
  });

  it('declining simply leaves the moves alone', () => {
    const creature = fourMoves();
    const before = creature.moves.map((m) => m.id);
    // Declining is the caller not calling replaceMove at all.
    expect(creature.moves.map((m) => m.id)).toEqual(before);
  });
});

describe('evolution', () => {
  it('changes species and keeps identity', () => {
    const creature = createCreature('pyrret', 16, { nickname: 'Sparky' });
    const id = creature.instanceId;
    const exp = creature.experience;
    const moves = creature.moves.map((m) => m.id);

    const result = evolveCreature(creature, 'cindraw');

    expect(result.evolved).toBe(true);
    expect(creature.speciesId).toBe('cindraw');
    expect(creature.instanceId).toBe(id);
    expect(creature.nickname).toBe('Sparky');
    expect(creature.experience).toBe(exp);
    expect(creature.moves.map((m) => m.id)).toEqual(moves);
    expect(creature.level).toBe(16);
  });

  it('raises the stats', () => {
    const creature = createCreature('pyrret', 16);
    const before = { ...creature.stats };
    evolveCreature(creature, 'cindraw');

    for (const key of STAT_KEYS) {
      expect(creature.stats[key], `${key} did not grow`).toBeGreaterThan(before[key]);
    }
  });

  it('keeps the damage the creature had taken', () => {
    const creature = createCreature('pyrret', 16);
    const maxBefore = creature.stats.hp;
    creature.currentHp = 10;

    evolveCreature(creature, 'cindraw');
    const gained = creature.stats.hp - maxBefore;
    expect(creature.currentHp).toBe(10 + gained);
  });

  it('keeps the nickname if there is one, and the species name if not', () => {
    const named = createCreature('pyrret', 16, { nickname: 'Sparky' });
    evolveCreature(named, 'cindraw');
    expect(named.nickname).toBe('Sparky');

    const plain = createCreature('pyrret', 16);
    const result = evolveCreature(plain, 'cindraw');
    expect(result.toName).toBe('Cindraw');
  });

  it('refuses an unknown target species', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const creature = createCreature('pyrret', 16);
    expect(evolveCreature(creature, 'nonsense').evolved).toBe(false);
    expect(creature.speciesId).toBe('pyrret');
    warn.mockRestore();
  });

  it('works for every declared evolution in the database', () => {
    for (const [id, species] of Object.entries(CREATURES)) {
      if (!species.evolution) continue;

      const creature = createCreature(id, species.evolution.level);
      const result = evolveCreature(creature, species.evolution.to);

      expect(result.evolved, `${id} failed to evolve`).toBe(true);
      expect(creature.speciesId).toBe(species.evolution.to);
      expect(creature.currentHp).toBeGreaterThan(0);
    }
  });
});
