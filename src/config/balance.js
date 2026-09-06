/**
 * balance.js
 * ----------------------------------------------------------------------------
 * Every gameplay tuning number lives here. Nothing in this file is about how the
 * game *looks* — only how it *plays*. Tweak these to rebalance the game without
 * hunting through system code.
 *
 * Each choice is explained, because a bare number is impossible to re-tune later
 * if you have forgotten why it was picked.
 */

export const MOVEMENT = {
  /** Milliseconds to walk one tile. Lower = faster. 180ms feels brisk but readable. */
  walkDuration: 180,
  /** Milliseconds to run one tile (hold Shift). */
  runDuration: 110,
  /**
   * When the player taps a direction they are not facing, they turn on the spot
   * instead of moving. This is how classic monster RPGs feel, and it stops you
   * bumping into things while trying to turn to talk to them.
   */
  turnDelay: 90,
};

/**
 * Wild encounters.
 *
 * These are the DEFAULTS. A map may override `chancePerStep` and
 * `cooldownSteps` for itself (see `encounters` in a map definition), but the
 * numbers only ever live here and in map data — never inside a scene.
 */
export const ENCOUNTERS = {
  /** Chance per step taken on encounter terrain that an encounter starts. */
  chancePerStep: 0.11,
  /**
   * Steps of guaranteed safety after an encounter starts. Without this you can
   * be ambushed on two consecutive tiles, which feels unfair rather than random.
   */
  cooldownSteps: 3,
  /**
   * Steps of safety re-applied when any battle ENDS. Walking out of a fight
   * straight into another one reads as a bug, so the protection is renewed at
   * one documented point rather than relying on the original roll's cooldown
   * still being there.
   */
  cooldownAfterBattle: 3,
  /** A map's own rate is clamped to this range, so a typo cannot break the game. */
  minChancePerStep: 0,
  maxChancePerStep: 1,
};

export const BATTLE = {
  /** Same-type attack bonus: a move matching the user's type hits harder. */
  stabMultiplier: 1.5,
  /** Damage is multiplied by a random value in this range, so fights feel alive. */
  damageVarianceMin: 0.85,
  damageVarianceMax: 1.0,
  /** Chance any given damaging move lands a critical hit. */
  critChance: 1 / 16,
  /** Damage multiplier on a critical hit. */
  critMultiplier: 1.5,
  /** A damaging move that connects always does at least this much. */
  minimumDamage: 1,

  /**
   * Action priorities. Higher goes first, before any move priority is compared.
   * Switching out and using an item are "free" actions you commit to before the
   * turn's attacks resolve, which is what makes swapping a real tactical choice
   * rather than a way to lose a turn.
   */
  actionPriority: {
    run: 6,
    switch: 5,
    item: 4,
    move: 0,
  },

  /**
   * The move used when a creature has no usable moves left. Without this a
   * battle could soft-lock with both sides unable to act.
   * `null` power means it is defined inline by the engine, not the move database.
   */
  struggle: {
    id: 'struggle',
    name: 'Struggle',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: null,
    priority: 0,
    /** Fraction of the damage dealt that the user takes back. */
    recoilFraction: 0.25,
    description: 'A desperate last resort that hurts the user too.',
  },

  /** Base chance of escaping a wild battle before speed is taken into account. */
  baseEscapeChance: 0.5,
  /** How much faster-than-the-foe helps when running. */
  escapeSpeedFactor: 0.35,
};

/**
 * Stat stages: the temporary buffs and debuffs that only exist inside a battle.
 *
 * A stage runs from -6 to +6. Attack-style stats use (2+n)/2 going up and
 * 2/(2-n) going down, so +1 is x1.5 and -1 is x0.67. Accuracy and evasion use a
 * gentler curve, because a miss is far more frustrating than a weak hit.
 */
export const STAT_STAGES = {
  min: -6,
  max: 6,
  /** Multipliers for stages -6..+6 for Attack, Defense, Sp. Atk, Sp. Def, Speed. */
  battleStatMultipliers: [
    0.25, 0.28, 0.33, 0.40, 0.50, 0.66,
    1,
    1.5, 2, 2.5, 3, 3.5, 4,
  ],
  /** Multipliers for stages -6..+6 for Accuracy and Evasion. */
  accuracyMultipliers: [
    0.33, 0.36, 0.43, 0.50, 0.60, 0.75,
    1,
    1.33, 1.66, 2, 2.33, 2.66, 3,
  ],
};

export const EXPERIENCE = {
  /**
   * Experience for defeating one creature:
   *   floor(baseExp * defeatedLevel / 7) * typeMultiplier
   *
   * Dividing by 7 keeps early levels brisk without making the mid-game trivial.
   */
  divisor: 7,
  /** Only creatures that were sent out during the battle share the reward. */
  participationRule: 'participants',
};

export const BATTLE_UI = {
  /** Milliseconds an HP bar takes to slide to its new value. */
  hpBarDuration: 480,
  /** How long a hit shake lasts. */
  hitShakeDuration: 180,
  /** How long a fainting creature takes to fade out. */
  faintDuration: 520,
  /** Pause after a message finishes before the next one appears, in ms. */
  messagePause: 260,
};

export const STATUS = {
  /** Fraction of max HP lost at end of turn while poisoned. */
  poisonDamageFraction: 1 / 8,
  /** Fraction of max HP lost at end of turn while burned. */
  burnDamageFraction: 1 / 16,
  /** Physical attack multiplier while burned. */
  burnAttackMultiplier: 0.5,
  /** Speed multiplier while paralysed. */
  paralysisSpeedMultiplier: 0.5,
  /** Chance a paralysed creature loses its turn. */
  paralysisSkipChance: 0.25,
  /** Sleep lasts a random number of turns in this inclusive range. */
  sleepMinTurns: 1,
  sleepMaxTurns: 3,
};

export const PARTY = {
  /** Maximum creatures carried at once. Extras go to storage. */
  maxSize: 6,
  /** Maximum moves a single creature can know. */
  maxMoves: 4,
};

export const PROGRESSION = {
  /** Highest level any creature can reach. */
  maxLevel: 100,
  /** Experience multiplier for defeating a trainer's creature vs a wild one. */
  trainerExpMultiplier: 1.5,
};

export const ECONOMY = {
  /** Coins the player starts a new game with. */
  startingMoney: 800,
  /** Fraction of carried coins lost when the whole party faints. */
  faintMoneyLossFraction: 0.05,
  /** Items sell for this fraction of their purchase price. */
  sellPriceFraction: 0.5,
};

export const CAPTURE = {
  /**
   * Scales the whole capture formula. Raise it to make catching easier across the
   * board without editing every creature's individual catch rate.
   */
  globalModifier: 1.0,
  /** How many shake checks a capture attempt performs before succeeding. */
  shakeChecks: 3,
};

/**
 * How fast dialogue text types itself out, in milliseconds per character.
 * The player picks one of these in Settings (Phase 10); the key is stored in
 * the save file, so adding a speed here is all it takes to offer a new option.
 */
export const TEXT_SPEEDS = {
  slow: 55,
  normal: 30,
  fast: 12,
  instant: 0,
};

export const DIALOGUE = {
  /** Which speed a new game starts on. Must be a key of TEXT_SPEEDS. */
  defaultTextSpeed: 'normal',
  /**
   * Ignore advance presses for this long after a page finishes typing. Without
   * it, holding the confirm key blasts through several pages at once and the
   * player never reads them.
   */
  advanceLockoutMs: 120,
};
