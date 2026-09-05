/**
 * encounters.js
 * ----------------------------------------------------------------------------
 * Which wild Aethers live where, and how likely each one is.
 *
 * A map points at a table by name (`encounterTable: 'route1'`), and stepping in
 * tall grass on that map rolls against this data.
 *
 * TABLE ENTRY FIELDS
 *   species   the creature's id (from src/data/creatures.js, added in Phase 3)
 *   minLevel  lowest level it can appear at
 *   maxLevel  highest level it can appear at
 *   weight    relative chance — a weight of 30 is picked twice as often as 15.
 *             Weights do NOT need to add up to 100; they are relative.
 *
 * TO ADD A NEW AREA: add a table here, then set `encounterTable` on the map.
 */

export const ENCOUNTER_TABLES = {
  /** Route 1 — Cinderpath. Gentle levels; this is the player's first route. */
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
 * Returns null (and warns) for an unknown id rather than throwing, because a
 * missing encounter table should not stop the player walking around.
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
  return table;
}
