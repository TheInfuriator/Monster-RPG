/**
 * badges.js
 * ----------------------------------------------------------------------------
 * The Sigils — proof that a Beacon Hall's Leader has been beaten.
 *
 * "Sigil" is this world's word for a badge; the game says Sigil everywhere and
 * so does this file. There is one entry per planned Beacon Hall, including the
 * two that are not built yet, because the Sigil screen shows three slots from
 * the very first game and a locked slot the player can see is a promise the
 * game is going to keep.
 *
 * FIELDS
 *   id               stable key, also what `gameState.badges` records
 *   name             what it is called on screen
 *   order            display order, 1 upwards, unique
 *   hall / town      where it comes from
 *   leader           the Leader's name, for the Sigil screen
 *   leaderTrainerId  the trainer in src/data/trainers.js who awards it, or null
 *                    for a Hall that has not been built yet
 *   description      one or two sentences shown once it has been earned
 *   icon             which shape TextureFactory draws
 *   color            the Sigil's colour
 *
 * TO ADD A SIGIL: an entry here, and `badge: '<id>'` on the Leader's trainer
 * entry. Winning awards it; nothing else needs writing. A Sigil is readable in
 * dialogue as `badge:<id>`, exactly the way a beaten trainer is readable as
 * `trainer:<id>`, so no separate story flag has to be invented for it.
 */

export const BADGES = {
  verdantSigil: {
    id: 'verdantSigil',
    name: 'Verdant Sigil',
    order: 1,
    hall: 'The Verdant Hall',
    town: 'Thistlewood',
    leader: 'Fern',
    leaderTrainerId: 'verdantLeaderFern',
    description:
      'A living seal pressed from hedge-sap. It marks a Warden the Thornway '
      + 'wardens will let through.',
    icon: 'leaf',
    color: 0x6fbf73,
  },

  /**
   * Tidewatch Harbor's Hall. Not built — `leaderTrainerId` is null, which is
   * how the data says "planned, not yet real" without a placeholder trainer
   * that could accidentally be fought.
   */
  tidalSigil: {
    id: 'tidalSigil',
    name: 'Tidal Sigil',
    order: 2,
    hall: 'The Tidal Hall',
    town: 'Tidewatch Harbor',
    leader: null,
    leaderTrainerId: null,
    description: 'Cut from a shell that only opens at the turn of the tide.',
    icon: 'wave',
    color: 0x4a86c4,
  },

  stormSigil: {
    id: 'stormSigil',
    name: 'Storm Sigil',
    order: 3,
    hall: 'The Storm Hall',
    town: 'Voltspire City',
    leader: null,
    leaderTrainerId: null,
    description: 'It hums faintly, even in still air.',
    icon: 'bolt',
    color: 0xe8a33d,
  },
};

/** Every Sigil in display order — what the Sigil screen draws, slot by slot. */
export function getBadgesInOrder() {
  return Object.values(BADGES).sort((a, b) => a.order - b.order);
}

/**
 * Look up a Sigil. Returns null (and warns) for an unknown id rather than
 * throwing, so a typo in trainer data cannot crash a victory.
 */
export function getBadge(id) {
  if (!id) return null;

  const badge = BADGES[id];
  if (!badge) {
    console.warn(
      `[badges] Unknown Sigil "${id}". Known: ${Object.keys(BADGES).join(', ')}.`
    );
    return null;
  }
  return badge;
}

/** The shapes TextureFactory knows how to draw. A new icon needs a new case. */
export const SUPPORTED_BADGE_ICONS = new Set(['leaf', 'wave', 'bolt']);

/**
 * Check one Sigil and list everything wrong with it.
 *
 * A list rather than a throw, so the data tests can run it over every Sigil
 * automatically — one added later is validated the moment it exists.
 *
 * @param {object} badge
 * @param {string} id
 * @param {(trainerId: string) => boolean} trainerExists
 * @returns {string[]} empty when the Sigil is sound
 */
export function findBadgeProblems(badge, id = 'badge', trainerExists = () => true) {
  const problems = [];

  if (!badge || typeof badge !== 'object') return [`${id}: is not a Sigil`];
  if (badge.id !== id) problems.push(`${id}: id field says "${badge.id}"`);

  for (const field of ['name', 'hall', 'description']) {
    if (typeof badge[field] !== 'string' || badge[field].length === 0) {
      problems.push(`${id}: needs a ${field}`);
    }
  }

  if (!Number.isInteger(badge.order) || badge.order < 1) {
    problems.push(`${id}: order must be a whole number from 1 upwards`);
  }

  if (!SUPPORTED_BADGE_ICONS.has(badge.icon)) {
    problems.push(`${id}: icon "${badge.icon}" has no drawing routine`);
  }

  if (!Number.isInteger(badge.color) || badge.color < 0 || badge.color > 0xffffff) {
    problems.push(`${id}: color must be a 0xRRGGBB number`);
  }

  // A Hall that is not built yet says so with null. A Hall that names a Leader
  // has to name one who really exists.
  if (badge.leaderTrainerId !== null && !trainerExists(badge.leaderTrainerId)) {
    problems.push(`${id}: leaderTrainerId "${badge.leaderTrainerId}" is not a trainer`);
  }

  return problems;
}
