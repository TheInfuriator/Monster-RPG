/**
 * badges.test.js
 * ----------------------------------------------------------------------------
 * Sigils: the data, the record, and the one rule that matters — a Sigil is
 * awarded exactly once, only for a win, and never for a loss.
 *
 * The Leader-victory tests fight real battles through BattleEngine rather than
 * poking at flags, because "did beating her award it" is a question about the
 * whole chain: engine result -> trainer data -> BadgeSystem.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  BADGES, getBadge, getBadgesInOrder, findBadgeProblems, SUPPORTED_BADGE_ICONS,
} from '../src/data/badges.js';
import {
  awardBadge, hasBadge, countBadges, removeBadge,
  listEarnedBadges, getBadgeSlots, getBadgeConditions,
} from '../src/systems/BadgeSystem.js';
import { getWorldConditions } from '../src/systems/ProgressionSystem.js';
import {
  createTrainerBattleConfig, markTrainerDefeated,
} from '../src/systems/TrainerSystem.js';
import { TRAINERS } from '../src/data/trainers.js';
import { MAPS } from '../src/data/maps/index.js';
import { BattleEngine, BATTLE_RESULT } from '../src/systems/battle/BattleEngine.js';
import { createCreature } from '../src/systems/CreatureFactory.js';
import { createNewGameState } from '../src/core/GameState.js';
import { resolveDialogue } from '../src/systems/DialogueResolver.js';
import { badgeTextureKey } from '../src/config/assets.js';
import { createSeededRandom } from '../src/utils/rng.js';

const freshState = () => createNewGameState();

// ---------------------------------------------------------------------------
// The data
// ---------------------------------------------------------------------------

describe('Sigil data', () => {
  it('has at least the first Hall\'s Sigil', () => {
    expect(BADGES.verdantSigil).toBeDefined();
    expect(BADGES.verdantSigil.name).toBe('Verdant Sigil');
  });

  it('plans three slots, because the game plans three Beacon Halls', () => {
    expect(getBadgesInOrder()).toHaveLength(3);
  });

  it('uses each key as that Sigil\'s own id', () => {
    for (const [key, badge] of Object.entries(BADGES)) expect(badge.id).toBe(key);
  });

  it('gives every Sigil a unique display order, numbered from one', () => {
    const orders = Object.values(BADGES).map((b) => b.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(Math.min(...orders)).toBe(1);
  });

  it('lists them in display order', () => {
    const orders = getBadgesInOrder().map((b) => b.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('gives every Sigil an icon something can actually draw', () => {
    for (const badge of Object.values(BADGES)) {
      expect(SUPPORTED_BADGE_ICONS.has(badge.icon), `${badge.id}: icon "${badge.icon}"`).toBe(true);
    }
  });

  it('gives every Sigil a texture key of its own', () => {
    const keys = Object.values(BADGES).map((b) => badgeTextureKey(b.id));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('names a Leader who exists, or honestly says the Hall is not built', () => {
    for (const badge of Object.values(BADGES)) {
      if (badge.leaderTrainerId === null) continue;
      expect(
        TRAINERS[badge.leaderTrainerId],
        `${badge.id} names Leader "${badge.leaderTrainerId}"`
      ).toBeDefined();
    }
  });

  it('is awarded by exactly the Leader it names', () => {
    for (const badge of Object.values(BADGES)) {
      if (!badge.leaderTrainerId) continue;
      expect(TRAINERS[badge.leaderTrainerId].badge).toBe(badge.id);
    }
  });

  it('never has two trainers awarding the same Sigil', () => {
    const awarded = Object.values(TRAINERS).map((t) => t.badge).filter(Boolean);
    expect(new Set(awarded).size).toBe(awarded.length);
  });

  it('warns and returns null for an unknown Sigil rather than throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getBadge('nope')).toBeNull();
    expect(getBadge(null)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('every Sigil is well-formed', () => {
  const exists = (id) => Boolean(TRAINERS[id]);

  for (const [id, badge] of Object.entries(BADGES)) {
    it(`${id} has no problems`, () => {
      expect(findBadgeProblems(badge, id, exists)).toEqual([]);
    });
  }
});

describe('Sigil validation catches mistakes', () => {
  const sound = BADGES.verdantSigil;
  const broken = (changes) =>
    findBadgeProblems({ ...sound, ...changes }, 'verdantSigil', (id) => Boolean(TRAINERS[id]))
      .join(' ');

  it('rejects something that is not a Sigil at all', () => {
    expect(findBadgeProblems(null, 'x').join(' ')).toMatch(/is not a Sigil/);
  });

  it('rejects a mismatched id', () => {
    expect(broken({ id: 'other' })).toMatch(/id field says/);
  });

  it('rejects a missing name, hall or description', () => {
    expect(broken({ name: '' })).toMatch(/needs a name/);
    expect(broken({ hall: undefined })).toMatch(/needs a hall/);
    expect(broken({ description: '' })).toMatch(/needs a description/);
  });

  it('rejects a bad display order', () => {
    expect(broken({ order: 0 })).toMatch(/order must be/);
    expect(broken({ order: 1.5 })).toMatch(/order must be/);
  });

  it('rejects an icon nothing can draw', () => {
    expect(broken({ icon: 'sparkle' })).toMatch(/no drawing routine/);
  });

  it('rejects a colour that is not a 0xRRGGBB number', () => {
    expect(broken({ color: 'green' })).toMatch(/color must be/);
    expect(broken({ color: 0x1000000 })).toMatch(/color must be/);
  });

  it('rejects a Leader who does not exist, but accepts an unbuilt Hall', () => {
    expect(broken({ leaderTrainerId: 'ghost' })).toMatch(/is not a trainer/);
    expect(broken({ leaderTrainerId: null })).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Earning them
// ---------------------------------------------------------------------------

describe('awarding a Sigil', () => {
  it('awards one and records it', () => {
    const state = freshState();
    const outcome = awardBadge('verdantSigil', state);

    expect(outcome.awarded).toBe(true);
    expect(outcome.alreadyHeld).toBe(false);
    expect(outcome.badge.id).toBe('verdantSigil');
    expect(hasBadge('verdantSigil', state)).toBe(true);
    expect(state.badges).toEqual(['verdantSigil']);
  });

  it('is harmless the second time, and never produces two', () => {
    const state = freshState();
    awardBadge('verdantSigil', state);
    const again = awardBadge('verdantSigil', state);

    expect(again.awarded).toBe(false);
    expect(again.alreadyHeld).toBe(true);
    expect(again.reason).toBe('alreadyHeld');
    expect(state.badges).toEqual(['verdantSigil']);
    expect(countBadges(state)).toBe(1);
  });

  it('survives being awarded many times over', () => {
    const state = freshState();
    for (let i = 0; i < 25; i += 1) awardBadge('verdantSigil', state);
    expect(state.badges).toEqual(['verdantSigil']);
  });

  it('refuses an unknown Sigil and records nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = freshState();
    const outcome = awardBadge('mysterySigil', state);

    expect(outcome.awarded).toBe(false);
    expect(outcome.reason).toBe('unknownBadge');
    expect(state.badges).toEqual([]);
    warn.mockRestore();
  });

  it('starts a new game with no Sigils', () => {
    const state = freshState();
    expect(state.badges).toEqual([]);
    expect(countBadges(state)).toBe(0);
    expect(hasBadge('verdantSigil', state)).toBe(false);
  });

  it('can be taken back, for tests and debugging', () => {
    const state = freshState();
    awardBadge('verdantSigil', state);

    expect(removeBadge('verdantSigil', state)).toBe(true);
    expect(hasBadge('verdantSigil', state)).toBe(false);
    expect(removeBadge('verdantSigil', state)).toBe(false);
  });

  it('copes with a state whose badges field is missing entirely', () => {
    const state = { ...freshState() };
    delete state.badges;
    expect(awardBadge('verdantSigil', state).awarded).toBe(true);
    expect(state.badges).toEqual(['verdantSigil']);
  });

  it('ignores a stray id in the list rather than counting it', () => {
    const state = freshState();
    state.badges = ['verdantSigil', 'somethingRemoved'];
    expect(countBadges(state)).toBe(1);
    expect(listEarnedBadges(state).map((b) => b.id)).toEqual(['verdantSigil']);
  });
});

describe('reading Sigils back', () => {
  it('lists earned Sigils in display order, not the order they were earned', () => {
    const state = freshState();
    awardBadge('stormSigil', state);
    awardBadge('verdantSigil', state);

    expect(listEarnedBadges(state).map((b) => b.id)).toEqual(['verdantSigil', 'stormSigil']);
  });

  it('gives one slot per planned Hall, earned or not', () => {
    const state = freshState();
    awardBadge('verdantSigil', state);

    const slots = getBadgeSlots(state);
    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({ earned: true });
    expect(slots[0].badge.id).toBe('verdantSigil');
    expect(slots.slice(1).every((s) => s.earned === false)).toBe(true);
  });

  it('keeps slots in display order so the screen never reshuffles', () => {
    const orders = getBadgeSlots(freshState()).map((s) => s.badge.order);
    expect(orders).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// Sigils as dialogue conditions
// ---------------------------------------------------------------------------

describe('Sigils read as conditions', () => {
  it('appears as badge:<id> once earned', () => {
    const state = freshState();
    expect(getBadgeConditions(state)).toEqual({});

    awardBadge('verdantSigil', state);
    expect(getBadgeConditions(state)).toEqual({ 'badge:verdantSigil': true });
  });

  it('joins story flags and beaten trainers in one set of conditions', () => {
    const state = freshState();
    state.flags.gotStarter = true;
    markTrainerDefeated('route1Scout', state);
    awardBadge('verdantSigil', state);

    expect(getWorldConditions(state)).toEqual({
      gotStarter: true,
      'trainer:route1Scout': true,
      'badge:verdantSigil': true,
    });
  });

  it('hands back a fresh object each time, so nobody can edit progress through it', () => {
    const state = freshState();
    awardBadge('verdantSigil', state);

    const conditions = getWorldConditions(state);
    conditions['badge:verdantSigil'] = false;
    expect(getWorldConditions(state)['badge:verdantSigil']).toBe(true);
  });

  it('lets the world react to a Sigil through ordinary conditional dialogue', () => {
    // Not a contrived example — this is exactly how Thistlewood reacts.
    const townsfolk = MAPS.thistlewood.npcs.filter(
      (npc) => JSON.stringify(npc.dialogue).includes('badge:verdantSigil')
    );
    expect(townsfolk.length).toBeGreaterThan(0);

    for (const npc of townsfolk) {
      const before = resolveDialogue(npc.dialogue, {});
      const after = resolveDialogue(npc.dialogue, { 'badge:verdantSigil': true });

      expect(before.pages.length).toBeGreaterThan(0);
      expect(after.pages.length).toBeGreaterThan(0);
      expect(after.pages.join(' ')).not.toBe(before.pages.join(' '));
    }
  });
});

// ---------------------------------------------------------------------------
// The Leader victory chain
// ---------------------------------------------------------------------------

/**
 * Fight a Leader to a decision.
 *
 * `rigged` gives the player an absurd creature so the outcome is certain, which
 * is what these tests are actually about — not the battle maths, which has its
 * own suite.
 */
function fightLeader(trainerId, { win }) {
  const state = freshState();
  const trainer = TRAINERS[trainerId];

  const hero = createCreature('pyrret', win ? 60 : 2);
  const config = createTrainerBattleConfig(trainerId, [hero]);
  const engine = new BattleEngine({ ...config, random: createSeededRandom(7) });
  engine.start();

  for (let turn = 0; turn < 60 && !engine.isOver(); turn += 1) {
    // Rigged so the OUTCOME is certain: this suite is about what a win and a
    // loss do afterwards, not about the damage formula, which has its own.
    if (win) for (const creature of engine.opponentParty) creature.currentHp = 0;
    else hero.currentHp = 1;

    const entry = engine.player.creature.moves.find((m) => m.pp > 0);
    if (!entry) break;
    engine.submitPlayerAction({ type: 'move', moveEntry: entry });
  }

  return { state, trainer, engine, result: engine.result };
}

describe('beating a Leader', () => {
  it('produces a win, and the result carries the trainer id', () => {
    const { result } = fightLeader('verdantLeaderFern', { win: true });
    expect(result.outcome).toBe(BATTLE_RESULT.WIN);
    expect(result.trainerId).toBe('verdantLeaderFern');
  });

  it('awards the Verdant Sigil once the win is resolved', () => {
    const { state, trainer, result } = fightLeader('verdantLeaderFern', { win: true });
    expect(result.outcome).toBe(BATTLE_RESULT.WIN);

    // What WorldScene does on a win: mark, then award what the trainer carries.
    markTrainerDefeated(trainer.id, state);
    const outcome = awardBadge(trainer.badge, state);

    expect(outcome.awarded).toBe(true);
    expect(hasBadge('verdantSigil', state)).toBe(true);
  });

  it('does NOT award it a second time when the victory lines are read again', () => {
    const { state, trainer } = fightLeader('verdantLeaderFern', { win: true });
    markTrainerDefeated(trainer.id, state);

    awardBadge(trainer.badge, state);
    const again = awardBadge(trainer.badge, state);

    expect(again.awarded).toBe(false);
    expect(state.badges).toEqual(['verdantSigil']);
  });

  it('pays the prize money exactly once, and only on a win', () => {
    const won = fightLeader('verdantLeaderFern', { win: true });
    expect(won.result.money).toBe(TRAINERS.verdantLeaderFern.rewardMoney);

    const lost = fightLeader('verdantLeaderFern', { win: false });
    expect(lost.result.outcome).toBe(BATTLE_RESULT.LOSS);
    expect(lost.result.money ?? 0).toBe(0);
  });
});

describe('losing to a Leader', () => {
  it('awards no Sigil, because WorldScene never gets past the outcome check', () => {
    const { state, trainer, result } = fightLeader('verdantLeaderFern', { win: false });
    expect(result.outcome).toBe(BATTLE_RESULT.LOSS);

    // The real handler returns before marking or awarding anything on a loss.
    if (result.outcome === BATTLE_RESULT.WIN) {
      markTrainerDefeated(trainer.id, state);
      awardBadge(trainer.badge, state);
    }

    expect(hasBadge('verdantSigil', state)).toBe(false);
    expect(state.defeatedTrainers.verdantLeaderFern).toBeUndefined();
    expect(state.badges).toEqual([]);
  });

  it('leaves the Leader standing, so the Hall can be tried again', () => {
    const { state, result } = fightLeader('verdantLeaderFern', { win: false });
    expect(result.outcome).toBe(BATTLE_RESULT.LOSS);
    expect(state.defeatedTrainers).toEqual({});
  });

  it('blacks the player out, exactly like any other real trainer', () => {
    const config = createTrainerBattleConfig('verdantLeaderFern', [createCreature('pyrret', 5)]);
    expect(config.blackoutOnDefeat).toBe(true);
    expect(config.canRun).toBe(false);
    expect(config.allowCapture).toBe(false);
  });
});

describe('an ordinary trainer awards nothing', () => {
  it('carries no Sigil at all', () => {
    expect(TRAINERS.verdantGardenerTeal.badge).toBeUndefined();
    expect(TRAINERS.route1Scout.badge).toBeUndefined();
  });

  it('awarding "no Sigil" is a no-op rather than an error', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const state = freshState();
    expect(awardBadge(TRAINERS.route1Scout.badge, state).awarded).toBe(false);
    expect(state.badges).toEqual([]);
    warn.mockRestore();
  });
});
