/**
 * rivals.js
 * ----------------------------------------------------------------------------
 * Who the rivals are — not their battles.
 *
 * A rival's BATTLES are ordinary trainers in `src/data/trainers.js`: each
 * meeting is one trainer entry with `rival: 'kestrel'` and a `stage`, so the
 * whole Phase 8 pipeline — sight, the "!", the approach, the battle, the prize,
 * the defeat record, the post-battle dialogue — works for them unchanged.
 *
 * This file holds only what is true of the rival across EVERY meeting: their
 * name, their look, and the rule for which starter they took. A party entry
 * written `{ rivalStarter: true, level: 16 }` in a Kestrel encounter becomes
 * "Kestrel's starter, at level 16, in whatever form the species data says it
 * has grown into by then" — see `src/systems/RivalSystem.js`.
 *
 * KESTREL (GAME_DESIGN.md section 8)
 * Confident, competitive, never actually mean — treats the player as the one
 * person worth beating. Another new Warden from Emberhollow, who took the
 * starter strong against the player's (GAME_DESIGN.md section 3) and has been
 * one step ahead ever since. Pronouns: they/them.
 */

export const RIVALS = {
  kestrel: {
    id: 'kestrel',
    name: 'Kestrel',
    pronouns: 'they/them',
    /** The character look used on the map (src/config/assets.js). */
    sprite: 'rival',

    /**
     * The canonical rule: the rival takes the starter STRONG AGAINST the
     * player's. Keyed by the player's starter, valued by the rival's — both
     * as the base species of the family, whatever either has evolved into.
     *
     *   player Fire   -> rival Water   (Water beats Fire)
     *   player Water  -> rival Grass   (Grass beats Water)
     *   player Grass  -> rival Fire    (Fire beats Grass)
     *
     * This is the ONE place that decides it. Nothing else in the game asks
     * which starter the player has in order to choose the rival's.
     */
    starterFor: {
      pyrret: 'drizzle',
      drizzle: 'sproutle',
      sproutle: 'pyrret',
    },

    /**
     * Only for a save that cannot say which starter the player took (one
     * hand-edited, say, or damaged beyond the migration's reach). The game
     * warns loudly and uses this rather than refusing the battle, because
     * refusing would leave the player unable to progress.
     */
    fallbackStarter: 'drizzle',
  },
};

/** Look up a rival. Null (with a warning) for an unknown id. */
export function getRival(id) {
  const rival = typeof id === 'string' && Object.hasOwn(RIVALS, id) ? RIVALS[id] : undefined;
  if (!rival) {
    console.warn(`[rivals] Unknown rival "${id}". Known: ${Object.keys(RIVALS).join(', ')}.`);
    return null;
  }
  return rival;
}
