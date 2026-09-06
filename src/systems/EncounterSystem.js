/**
 * EncounterSystem.js
 * ----------------------------------------------------------------------------
 * The one place that decides whether a step turns up a wild Aether, and if so
 * which one and at what level.
 *
 * EVERY encounter rule lives here — the terrain check's result, the cooldown,
 * the rate, and the list of situations where an encounter must not happen at
 * all. WorldScene reports facts ("dialogue is open", "a battle is running") and
 * this decides. That keeps the rules in one testable file instead of scattered
 * through a scene, and it means adding a new suppression rule is a one-line
 * change with a matching test.
 *
 * There is no Phaser code here, so every rule below is unit tested — including
 * the "you cannot be ambushed twice in a row" guarantee, which is exactly the
 * sort of thing that is miserable to check by hand.
 */

import { ENCOUNTERS } from '../config/balance.js';
import { getEncounterTable, getEncounterConfig } from '../data/encounters.js';
import { pickWeighted, randomInt, chance } from '../utils/rng.js';

/**
 * Situations in which a completed step must never be considered for an
 * encounter, in the order they are checked.
 *
 * Pure and exported so the rules can be tested directly, without a scene.
 *
 * @param {object} context facts about the moment the step finished
 * @returns {string|null} why the step is ignored, or null if it counts
 */
export function findEncounterBlocker(context = {}) {
  if (context.battleActive) return 'a battle is already running';
  if (context.transitioning) return 'the map is changing';
  if (context.dialogueOpen) return 'dialogue is open';
  if (context.overlayActive) return 'a menu owns the input';
  if (context.inputLocked) return 'the player is not in control';
  return null;
}

export class EncounterSystem {
  /**
   * @param {object|string|null} config
   *   A map's encounter settings (see `getEncounterConfig`). A bare table id
   *   is accepted too, because that is all a simple map needs.
   * @param {() => number} [random] injectable randomness, so tests are exact
   */
  constructor(config = null, random = Math.random) {
    const settings = normaliseConfig(config);

    this.tableId = settings.tableId;
    this.rate = settings.rate;
    this.cooldownSteps = settings.cooldownSteps;
    this.random = random;
    this.table = getEncounterTable(this.tableId);

    /**
     * Steps of guaranteed safety remaining. Set after every encounter so the
     * player is never ambushed on two consecutive tiles, which reads as broken
     * rather than random.
     */
    this.cooldown = 0;

    /**
     * Debug switches. Normal gameplay never touches these: `disabled` stays
     * false and `forceNext` stays false unless `window.debug` sets them.
     */
    this.disabled = false;
    this.forceNext = false;
  }

  /** True if this map can produce wild encounters at all. */
  get isActive() {
    return Boolean(this.table && this.table.length > 0);
  }

  /**
   * Call once for every step the player COMPLETES. A step that never happened —
   * standing still, or walking into a wall — never reaches here, because the
   * player only announces a step once it has finished moving onto a new tile.
   *
   * @param {object|boolean} context
   *   `{ onEncounterTile, dialogueOpen, transitioning, battleActive,
   *      overlayActive, inputLocked }`. A bare boolean is read as
   *   `onEncounterTile`, which is all a test usually cares about.
   * @returns {{species: string, level: number} | null} the encounter, or null
   */
  step(context = {}) {
    const facts = typeof context === 'boolean' ? { onEncounterTile: context } : context;

    if (!this.isActive || this.disabled) return null;

    // A step taken while something else owns the screen does not count at all —
    // not for an encounter, and not against the cooldown either.
    if (findEncounterBlocker(facts)) return null;

    if (!facts.onEncounterTile) {
      // Walking on safe ground burns off the cooldown too, so crossing a path
      // between two grass patches does not carry a stale grace period.
      this.burnCooldown();
      return null;
    }

    if (this.cooldown > 0) {
      this.burnCooldown();
      return null;
    }

    if (!this.forceNext && !chance(this.rate, this.random)) return null;

    this.forceNext = false;
    this.cooldown = this.cooldownSteps;
    return this.roll();
  }

  /**
   * Pick a species and level from the table. Exposed separately so debug tools
   * and tests can force an encounter without waiting for a lucky roll.
   */
  roll() {
    const entry = pickWeighted(this.table, this.random);
    if (!entry) return null;

    return {
      species: entry.species,
      level: randomInt(entry.minLevel, entry.maxLevel, this.random),
    };
  }

  /**
   * Grant safe steps. Called when a battle ENDS, so returning to the overworld
   * standing in the same patch of grass can never drop the player straight into
   * another fight.
   *
   * @param {number} [steps] defaults to the value in balance.js
   */
  applyCooldown(steps = ENCOUNTERS.cooldownAfterBattle) {
    this.cooldown = Math.max(this.cooldown, Math.max(0, steps));
  }

  /** Spend one safe step, never going below zero. */
  burnCooldown() {
    if (this.cooldown > 0) this.cooldown -= 1;
  }
}

/**
 * Accept a config object, a bare table id, or nothing, and always return the
 * full shape. Defaults come from balance.js so the numbers stay in one place.
 */
function normaliseConfig(config) {
  if (config && typeof config === 'object') {
    return {
      tableId: config.tableId || null,
      rate: config.rate ?? ENCOUNTERS.chancePerStep,
      cooldownSteps: config.cooldownSteps ?? ENCOUNTERS.cooldownSteps,
    };
  }

  // A bare table id: build the same defaults a map with no tuning would get.
  return getEncounterConfig({ encounterTable: config || null }) || {
    tableId: null,
    rate: ENCOUNTERS.chancePerStep,
    cooldownSteps: ENCOUNTERS.cooldownSteps,
  };
}
