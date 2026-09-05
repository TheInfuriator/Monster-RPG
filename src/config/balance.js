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

export const ENCOUNTERS = {
  /** Chance per step taken in tall grass that an encounter starts. */
  chancePerStep: 0.11,
  /**
   * Steps of guaranteed safety after an encounter ends. Without this you can be
   * ambushed on two consecutive tiles, which feels unfair rather than random.
   */
  cooldownSteps: 3,
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
