/**
 * EncounterSystem.js
 * ----------------------------------------------------------------------------
 * Decides whether walking through tall grass turns up a wild Aether, and if so,
 * which one and at what level.
 *
 * This is pure logic with no Phaser code, so every rule below is unit tested —
 * including the "you cannot be ambushed twice in a row" guarantee, which is
 * exactly the sort of thing that is miserable to test by hand.
 *
 * NOTE ON PHASE ORDER: this system is complete and returns a real species and
 * level. What is NOT here is the battle that should follow — battles arrive in
 * Phase 4. Until then WorldScene reports the encounter on screen so the
 * behaviour is visible and verifiable.
 */

import { ENCOUNTERS } from '../config/balance.js';
import { getEncounterTable } from '../data/encounters.js';
import { pickWeighted, randomInt, chance } from '../utils/rng.js';

export class EncounterSystem {
  /**
   * @param {string|null} tableId which encounter table this map uses
   * @param {() => number} [random] injectable randomness, so tests are exact
   */
  constructor(tableId, random = Math.random) {
    this.tableId = tableId;
    this.random = random;
    this.table = getEncounterTable(tableId);

    /**
     * Steps of guaranteed safety remaining. Set after every encounter so the
     * player is never ambushed on two consecutive tiles, which reads as broken
     * rather than random.
     */
    this.cooldown = 0;
  }

  /** True if this map can produce wild encounters at all. */
  get isActive() {
    return Boolean(this.table && this.table.length > 0);
  }

  /**
   * Call once for every step the player takes.
   *
   * @param {boolean} onEncounterTile true if the tile stepped on is tall grass
   * @returns {{species: string, level: number} | null} the encounter, or null
   */
  step(onEncounterTile) {
    if (!this.isActive) return null;

    if (!onEncounterTile) {
      // Walking on safe ground burns off the cooldown too, so crossing a path
      // between two grass patches does not carry a stale grace period.
      if (this.cooldown > 0) this.cooldown -= 1;
      return null;
    }

    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return null;
    }

    if (!chance(ENCOUNTERS.chancePerStep, this.random)) return null;

    this.cooldown = ENCOUNTERS.cooldownSteps;
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
}
