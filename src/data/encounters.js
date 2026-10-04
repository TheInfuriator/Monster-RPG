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
 *       byTerrain: { scree: 'route2Scree' },  // optional — another table on
 *     }                                        // some encounter tiles
 *
 *   `terrain` lists TILE IDS (from src/data/tiles.js). Leave it out and every
 *   tile marked `encounter: true` counts, which is what tall grass already is.
 *
 *   `byTerrain` (Phase 11) maps a TILE ID to a table, for a map with more than
 *   one habitat: Route 2's thickets and its scree slope turn up different
 *   Aethers. Encounter tiles it does not name use `table`. The rate and the
 *   cooldown are shared — it is one route, walked in one go.
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

  /**
   * Route 2 — the Thornway, in its THICKETS (tall grass). Phase 11.
   *
   * Pitched from real progression: a player arrives from Kestrel's first
   * fight with a starter around 15 and partners around 14 (see
   * tests/route2.test.js), and GAME_DESIGN.md puts Route 2 at 14-18. Two of
   * the new families are the commons; the old Route 1 faces return a few
   * levels on; Zaplet is the canonical Route 2 find; Gustwing and the new
   * Burrzap are the rare ones.
   */
  route2Thicket: [
    { species: 'jabbit', minLevel: 13, maxLevel: 16, weight: 24 },
    { species: 'glimmote', minLevel: 13, maxLevel: 15, weight: 18 },
    { species: 'flittle', minLevel: 14, maxLevel: 16, weight: 16 },
    { species: 'vinelet', minLevel: 14, maxLevel: 16, weight: 14 },
    { species: 'grubbit', minLevel: 14, maxLevel: 16, weight: 12 },
    { species: 'zaplet', minLevel: 14, maxLevel: 16, weight: 10 },
    // Deliberately rare.
    { species: 'gustwing', minLevel: 17, maxLevel: 18, weight: 3 },
    { species: 'burrzap', minLevel: 15, maxLevel: 17, weight: 3 },
  ],

  /**
   * Route 2 — the Thornway, on its SCREE slope below Mistvault. Phase 11.
   *
   * A different habitat on the same map (encounters.byTerrain): rock and
   * earth, a level higher than the thickets because it is further up the
   * road. Umbrat, a cave-dweller, has come OUT of Mistvault — one of the
   * signs that something in there is wrong.
   */
  route2Scree: [
    { species: 'delvit', minLevel: 14, maxLevel: 17, weight: 28 },
    { species: 'pebblit', minLevel: 14, maxLevel: 17, weight: 24 },
    { species: 'jabbit', minLevel: 15, maxLevel: 17, weight: 14 },
    { species: 'zaplet', minLevel: 15, maxLevel: 17, weight: 12 },
    { species: 'carapex', minLevel: 16, maxLevel: 18, weight: 10 },
    { species: 'umbrat', minLevel: 15, maxLevel: 17, weight: 8 },
    // Deliberately rare.
    { species: 'gustwing', minLevel: 17, maxLevel: 18, weight: 4 },
  ],

  /**
   * Mistvault Cavern — the Mouth's rubble. Phase 12.
   *
   * GAME_DESIGN.md promised Mistvault "Dark/Rock creatures": Umbrat is home at
   * last, Gloamite is the cavern's own, and the scree's diggers come in from
   * outside. A Corrodit got loose from the Vane's cable runs. Pitched a little
   * above the scree, at what a player really has at the top of Route 2.
   */
  mistvaultCave: [
    { species: 'umbrat', minLevel: 15, maxLevel: 17, weight: 26 },
    { species: 'gloamite', minLevel: 15, maxLevel: 17, weight: 20 },
    { species: 'delvit', minLevel: 15, maxLevel: 17, weight: 16 },
    { species: 'pebblit', minLevel: 15, maxLevel: 17, weight: 14 },
    { species: 'wispel', minLevel: 16, maxLevel: 18, weight: 10 },
    // Deliberately scarce: it does not belong here.
    { species: 'corrodit', minLevel: 16, maxLevel: 17, weight: 6 },
  ],

  /**
   * Mistvault Cavern — the Galleries and the Draw Site. Phase 12.
   *
   * Deeper, a level up, and more Corrodit the closer the Vane's rig gets.
   */
  mistvaultGalleries: [
    { species: 'gloamite', minLevel: 16, maxLevel: 18, weight: 24 },
    { species: 'umbrat', minLevel: 16, maxLevel: 18, weight: 20 },
    { species: 'corrodit', minLevel: 16, maxLevel: 18, weight: 14 },
    { species: 'pebblit', minLevel: 16, maxLevel: 18, weight: 12 },
    { species: 'delvit', minLevel: 16, maxLevel: 18, weight: 10 },
    { species: 'wispel', minLevel: 17, maxLevel: 19, weight: 10 },
    // Deliberately rare.
    { species: 'carapex', minLevel: 17, maxLevel: 19, weight: 5 },
  ],

  /**
   * Mistvault Cavern — the Tideward Grotto's SHALLOWS. Phase 12.
   *
   * A second habitat on the Core (encounters.byTerrain), only reachable once
   * the siphon is stopped: sea water seeping in from Tidewatch, and the fish
   * and crabs that came with it. The game's first Water habitat.
   */
  mistvaultShallows: [
    { species: 'minnet', minLevel: 17, maxLevel: 19, weight: 34 },
    { species: 'dampling', minLevel: 17, maxLevel: 19, weight: 22 },
    { species: 'barnaclaw', minLevel: 17, maxLevel: 19, weight: 18 },
    { species: 'gloamite', minLevel: 17, maxLevel: 19, weight: 12 },
    // Deliberately rare.
    { species: 'brookel', minLevel: 19, maxLevel: 20, weight: 6 },
  ],

  /**
   * The Stormrise Climb — the lower terraces' HEATH. Phase 13.
   *
   * Pitched from real progression: walking the road to the Tidal Sigil
   * through the real engine (tests/helpers/routeWalk.js) leaves a starter at
   * 17-22 and the team's best at 21-22, so the Climb opens at 20-22 and rises
   * a level per map. The Thornway's faces come back up a few levels, and
   * Cirrup, the Climb's own bird, is the common new face.
   */
  stormriseHeath: [
    { species: 'cirrup', minLevel: 20, maxLevel: 22, weight: 24 },
    { species: 'jabbit', minLevel: 20, maxLevel: 22, weight: 20 },
    { species: 'gustwing', minLevel: 20, maxLevel: 22, weight: 14 },
    { species: 'delvit', minLevel: 20, maxLevel: 22, weight: 14 },
    { species: 'zaplet', minLevel: 20, maxLevel: 22, weight: 14 },
    { species: 'glimmote', minLevel: 20, maxLevel: 21, weight: 10 },
    // Deliberately rare.
    { species: 'burrzap', minLevel: 21, maxLevel: 23, weight: 4 },
  ],

  /**
   * The Stormrise Climb — the Frost Shelf's FROST SCREE. Phase 13.
   *
   * Rimelet's ground: the game's first Ice type, and the natural answer to
   * the fliers further up. A Corrodit or two have wandered off the Vane's
   * cable runs, as they did in Mistvault.
   */
  stormriseScree: [
    { species: 'rimelet', minLevel: 21, maxLevel: 23, weight: 28 },
    { species: 'pebblit', minLevel: 21, maxLevel: 23, weight: 18 },
    { species: 'cirrup', minLevel: 21, maxLevel: 23, weight: 16 },
    { species: 'delvit', minLevel: 21, maxLevel: 23, weight: 14 },
    { species: 'corrodit', minLevel: 21, maxLevel: 23, weight: 10 },
    { species: 'carapex', minLevel: 22, maxLevel: 23, weight: 8 },
    // Deliberately rare.
    { species: 'cragmaw', minLevel: 24, maxLevel: 24, weight: 4 },
  ],

  /**
   * The Stormrise Climb — the summit's STORMGRASS. Phase 13.
   *
   * Where the lightning comes down: the Climb's highest levels, its electric
   * Aethers, and the rare one the whole route is known for. Thundrel is rare
   * but FAIR: about one encounter in twenty-three, on ground the road crosses,
   * at a level a player can catch with the Orbs they can buy.
   */
  stormriseSummit: [
    { species: 'cirrup', minLevel: 22, maxLevel: 24, weight: 28 },
    { species: 'zaplet', minLevel: 22, maxLevel: 23, weight: 20 },
    { species: 'rimelet', minLevel: 22, maxLevel: 24, weight: 16 },
    { species: 'gustwing', minLevel: 22, maxLevel: 24, weight: 14 },
    { species: 'voltmane', minLevel: 24, maxLevel: 25, weight: 8 },
    // The rare-but-fair find.
    { species: 'thundrel', minLevel: 23, maxLevel: 24, weight: 4 },
  ],

  /**
   * The Aerie Road — stormgrass and frost scree, one table. Phase 14.
   *
   * The strongest wild Aethers in the valley: the Climb's faces, several
   * grown up, at the levels a player brings to the top of the valley. Two
   * things stay where Phase 13 put them: Thundrel is the summit's own rare
   * find, and Stormcrest is only ever met grown, never wild.
   */
  aerieRoad: [
    { species: 'cirrup', minLevel: 25, maxLevel: 27, weight: 24 },
    { species: 'gustwing', minLevel: 25, maxLevel: 27, weight: 18 },
    { species: 'rimelet', minLevel: 25, maxLevel: 27, weight: 16 },
    { species: 'cragmaw', minLevel: 26, maxLevel: 27, weight: 12 },
    { species: 'voltmane', minLevel: 26, maxLevel: 27, weight: 10 },
    { species: 'brambelle', minLevel: 26, maxLevel: 27, weight: 10 },
    { species: 'ironvole', minLevel: 26, maxLevel: 27, weight: 6 },
    { species: 'marlance', minLevel: 27, maxLevel: 28, weight: 4 },
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

  const table = Object.hasOwn(ENCOUNTER_TABLES, id) ? ENCOUNTER_TABLES[id] : undefined;
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
 *            terrain: string[]|null, terrainTables: object|null} | null}
 *          null if the map has no encounters
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
    // null means "every encounter tile uses tableId", also the normal case.
    terrainTables: settings?.byTerrain ? { ...settings.byTerrain } : null,
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
