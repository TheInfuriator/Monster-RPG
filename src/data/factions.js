/**
 * factions.js
 * ----------------------------------------------------------------------------
 * The groups people in Aetheria belong to — so far, the one that matters: the
 * Hollow Vane (GAME_DESIGN.md section 9).
 *
 * Like a rival, a faction is IDENTITY, not battles. A Vane grunt is an
 * ordinary trainer in `src/data/trainers.js` with two extra fields:
 *
 *   faction: 'hollowVane'     which group they belong to
 *   rank:    'surveyor'       their place in it — the key of one of `ranks`
 *
 * and their `title` is that rank's title, so "Vane Surveyor Tallis" reads the
 * same everywhere. The trainer tests check every Vane trainer against this
 * file: a real faction, a real rank, the matching title, the faction's look
 * on the map, and at least one Aether of the types the faction is known for.
 *
 * Nothing here is a plan. What the Vane WANT is told a scrap at a time — by
 * their boards and labels and what grunts let slip — and Phase 12 tells only
 * the first scraps: they siphon the aether currents into storage cells, they
 * are surveying the whole valley, and the cells are bound for Stormrise.
 * Phase 13 adds the next: Stormrise is where the third current — the storm's
 * — is drawn, and all three are meant for one place, "the Convergence".
 * What happens there is still not told.
 */

export const FACTIONS = {
  hollowVane: {
    id: 'hollowVane',
    name: 'the Hollow Vane',
    /** Their stamp, on stakes, boards, cells and coats. */
    emblem: 'a hollow ring crossed by a line, like a weathervane with nothing at its heart',
    /** What they claim to be. */
    claims: 'a resource company',
    /** GAME_DESIGN.md section 9: "Grunts use Poison, Dark, and Steel Aethers." */
    types: ['poison', 'dark', 'steel'],
    /** Map looks (CHARACTER_PALETTES) a member of this faction may wear. */
    sprites: ['vane', 'vaneForeman'],
    ranks: {
      surveyor: { title: 'Vane Surveyor' },
      foreman: { title: 'Draw Foreman' },
      // Phase 13: the one running the Stormrise relay.
      overseer: { title: 'Relay Overseer' },
    },
  },
};

/** Look up a faction. Null (with a warning) for an unknown id. */
export function getFaction(id) {
  const faction = typeof id === 'string' && Object.hasOwn(FACTIONS, id) ? FACTIONS[id] : undefined;
  if (!faction) {
    console.warn(`[factions] Unknown faction "${id}". Known: ${Object.keys(FACTIONS).join(', ')}.`);
    return null;
  }
  return faction;
}
