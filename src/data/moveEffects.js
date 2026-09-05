/**
 * moveEffects.js
 * ----------------------------------------------------------------------------
 * The vocabulary of things a move can DO beyond straightforward damage.
 *
 * Every move's `effect` field uses one of these kinds. Keeping the list here
 * means the battle engine in Phase 4 can handle each kind once, in one place,
 * instead of growing a giant switch full of individual move names.
 *
 * SHAPES
 *   status      { kind:'status', status:'burn', chance:0.1 }
 *   statChange  { kind:'statChange', target:'self'|'foe', stat:'attack', stages:1, chance:1 }
 *   heal        { kind:'heal', fraction:0.5 }
 *   drain       { kind:'drain', fraction:0.5 }   heal for a share of damage dealt
 *   recoil      { kind:'recoil', fraction:0.25 } user takes a share of damage dealt
 *   multiHit    { kind:'multiHit', min:2, max:5 }
 *   flinch      { kind:'flinch', chance:0.3 }
 */

export const EFFECT_KINDS = {
  STATUS: 'status',
  STAT_CHANGE: 'statChange',
  HEAL: 'heal',
  DRAIN: 'drain',
  RECOIL: 'recoil',
  MULTI_HIT: 'multiHit',
  FLINCH: 'flinch',
};

export const EFFECT_KIND_SET = new Set(Object.values(EFFECT_KINDS));

/** Stats a move is allowed to raise or lower. */
export const MODIFIABLE_STATS = [
  'attack',
  'defense',
  'spAttack',
  'spDefense',
  'speed',
  'accuracy',
  'evasion',
];

export const MODIFIABLE_STAT_SET = new Set(MODIFIABLE_STATS);

/** Who a stat change applies to. */
export const EFFECT_TARGETS = ['self', 'foe'];
export const EFFECT_TARGET_SET = new Set(EFFECT_TARGETS);

/** The three ways a move can be categorised. */
export const MOVE_CATEGORIES = {
  PHYSICAL: 'physical',
  SPECIAL: 'special',
  STATUS: 'status',
};

export const MOVE_CATEGORY_SET = new Set(Object.values(MOVE_CATEGORIES));

/**
 * How far a stat can be pushed in either direction.
 * Phase 4's damage calculator turns a stage into a multiplier.
 */
export const MAX_STAT_STAGE = 6;
