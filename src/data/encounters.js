/**
 * encounters.js
 * ----------------------------------------------------------------------------
 * Which wild Aethers live where, how likely each one is, and how often a map
 * ambushes you at all.
 *
 * A map switches encounters on by naming a table (see "ENABLING A MAP" below),
 * and stepping on encounter terrain there rolls against this data.
 *
 * TABLE ENTRY FIELDS
 *   species   the creature's id (from src/data/creatures.js)
 *   minLevel  lowest level it can appear at
 *   maxLevel  highest level it can appear at
 *   weight    relative chance — a weight of 30 is picked twice as often as 15.
 *             Weights do NOT need to add up to 100; they are relative.
 *
 * ENABLING A MAP
 *   The short form is all most maps need:
 *
 *     encounterTable: 'route1',
 *
 *   The long form adds optional tuning, and is read by `getEncounterConfig()`:
 *
 *     encounters: {
 *       table: 'route1',      // required — a key of ENCOUNTER_TABLES
 *       rate: 0.11,           // optional — chance per step, defaults to balance.js
 *       cooldownSteps: 3,     // optional — safe steps after an encounter
 *       terrain: ['tall_grass'],  // optional — narrow which encounter tiles count
 *     }
 *
 *   `terrain` lists TILE IDS (from src/data/tiles.js). Leave it out and every
 *   tile marked `encounter: true` counts, which is what tall grass already is.
 *
 * TO ADD A SPECIES to an area: add one row to its table. Nothing else changes —
 * no scene, no system, no test. The data tests below pick it up automatically.
 */

import { ENCOUNTERS, PROGRESSION } from '../config/balance.js';
import { clamp } from '../utils/rng.js';
import { CREATURES } from './creatures.js';

export const ENCOUNTER_TABLES = {
  /**
   * Route 1 — Cinderpath. The player's first route, walked with a level 5
   * starter, so nothing here can flatten them and everything gives a useful
   * amount of experience.
   *
   * The spread is deliberately uneven: two commons you will meet constantly,
   * two uncommons, one scarce, and one genuinely rare find.
   */
  route1: [
    { species: 'nibbit', minLevel: 2, maxLevel: 4, weight: 30 },
    { species: 'flittle', minLevel: 2, maxLevel: 4, weight: 25 },
    { species: 'vinelet', minLevel: 3, maxLevel: 5, weight: 20 },
    { species: 'grubbit', minLevel: 2, maxLevel: 4, weight: 15 },
    { species: 'puffcap', minLevel: 3, maxLevel: 5, weight: 7 },
    // Deliberately rare: finding one should feel like a small event.
    { species: 'emberfly', minLevel: 4, maxLevel: 6, weight: 3 },
  ],

  /** The patch on Emberhollow's northern edge — a safe taste of the mechanic. */
  emberhollowEdge: [
    { species: 'nibbit', minLevel: 2, maxLevel: 3, weight: 60 },
    { species: 'flittle', minLevel: 2, maxLevel: 3, weight: 40 },
  ],
};

/**
 * Fetch a table by id.
 * Returns null (and warns) for an unknown or empty id rather than throwing,
 * because a missing encounter table should not stop the player walking around.
 */
export function getEncounterTable(id) {
  if (!id) return null;

  const table = ENCOUNTER_TABLES[id];
  if (!table) {
    console.warn(
      `[encounters] Unknown encounter table "${id}". ` +
        `Known tables: ${Object.keys(ENCOUNTER_TABLES).join(', ')}.`
    );
    return null;
  }

  if (table.length === 0) {
    console.warn(`[encounters] Encounter table "${id}" is empty.`);
    return null;
  }

  return table;
}

/**
 * Read a map definition's encounter settings into one predictable shape.
 *
 * Both the short form (`encounterTable: 'route1'`) and the long form
 * (`encounters: { ... }`) end up here, so nothing downstream has to know which
 * one a map used.
 *
 * @param {object} definition a map definition from src/data/maps/
 * @returns {{tableId: string, rate: number, cooldownSteps: number,
 *            terrain: string[]|null} | null} null if the map has no encounters
 */
export function getEncounterConfig(definition) {
  if (!definition) return null;

  const settings = definition.encounters || null;
  const tableId = settings?.table || definition.encounterTable || null;
  if (!tableId) return null;

  return {
    tableId,
    rate: clamp(
      settings?.rate ?? ENCOUNTERS.chancePerStep,
      ENCOUNTERS.minChancePerStep,
      ENCOUNTERS.maxChancePerStep
    ),
    cooldownSteps: Math.max(0, settings?.cooldownSteps ?? ENCOUNTERS.cooldownSteps),
    // null means "any tile marked encounter: true", which is the normal case.
    terrain: settings?.terrain ? [...settings.terrain] : null,
  };
}

/**
 * Check one encounter table and list everything wrong with it.
 *
 * Returning a list rather than throwing means the same function can be used by
 * the data tests (which check every table automatically, so a new area is
 * validated the moment it is added) and by a human reading the console.
 *
 * @param {object[]} table
 * @param {string} [id] used in the messages
 * @returns {string[]} empty when the table is sound
 */
export function findEncounterTableProblems(table, id = 'table') {
  const problems = [];

  if (!Array.isArray(table)) return [`${id}: is not a list of entries`];
  if (table.length === 0) return [`${id}: is empty`];

  table.forEach((entry, index) => {
    const where = `${id}[${index}]`;

    if (!entry || typeof entry.species !== 'string' || entry.species.length === 0) {
      problems.push(`${where}: needs a species id`);
      return;
    }
    if (!CREATURES[entry.species]) {
      problems.push(`${where}: no such species "${entry.species}"`);
    }
    if (!Number.isInteger(entry.minLevel) || !Number.isInteger(entry.maxLevel)) {
      problems.push(`${where}: levels must be whole numbers`);
      return;
    }
    if (entry.minLevel < 1 || entry.maxLevel > PROGRESSION.maxLevel) {
      problems.push(
        `${where}: levels must be between 1 and ${PROGRESSION.maxLevel}`
      );
    }
    if (entry.minLevel > entry.maxLevel) {
      problems.push(`${where}: minLevel ${entry.minLevel} is above maxLevel ${entry.maxLevel}`);
    }
    if (!(entry.weight > 0)) {
      problems.push(`${where}: weight must be greater than zero`);
    }
  });

  return problems;
}
