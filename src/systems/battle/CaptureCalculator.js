/**
 * CaptureCalculator.js
 * ----------------------------------------------------------------------------
 * Whether a thrown orb catches a wild Aether.
 *
 * Pure logic with no Phaser and no game state, so every rule below is unit
 * tested and the randomness is injectable.
 *
 * THE FORMULA (ours, not anyone else's)
 *
 *   chance = base * hpFactor * statusBonus * orbModifier * globalModifier
 *
 *   base        catchRate / 255   how catchable the species is at all. Stored
 *                                 per species in creatures.js: a Nibbit is 255
 *                                 (trivial), a starter's line is 45 (stubborn).
 *   hpFactor    1 - hpFraction * 0.7
 *                                 how hurt it is. Full health -> 0.30, half
 *                                 health -> 0.65, one point left -> ~1.00. This
 *                                 is why weakening a creature first is worth
 *                                 doing, and it is the biggest lever the player
 *                                 has.
 *   statusBonus sleep 2.0, paralysis 1.5, poison/burn 1.3, nothing 1.0
 *                                 a creature that cannot struggle is easier to
 *                                 hold.
 *   orbModifier from the item: Basic 1, Great 1.5, Ultra 2. Nothing in this
 *                                 file names an orb — a new tier is one entry
 *                                 in items.js.
 *   globalModifier                a single knob in balance.js for tuning the
 *                                 whole game at once.
 *
 * The result is clamped to 1%..95%: nothing is ever hopeless and nothing is
 * ever a certainty.
 *
 * THE SHAKES
 *
 * A throw performs `CAPTURE.shakeChecks` (4) checks, each at
 * `chance ** (1 / 4)`. Passing all four is a capture, so the overall odds are
 * exactly `chance`, and the number of shakes the player watches is genuinely
 * how close the throw came. The animation is never decided separately from the
 * result — there is only one roll sequence and both come out of it.
 */

import { CAPTURE } from '../../config/balance.js';
import { clamp } from '../../utils/rng.js';
import { getSpecies } from '../../data/creatures.js';

/** Why a throw is not allowed. Exported so the bag can explain itself. */
export const CAPTURE_REFUSAL = {
  NOT_WILD: 'Capture is not allowed in this battle.',
  NO_ITEM: 'That is not something you can throw.',
  NONE_LEFT: 'You have none of those!',
  NO_TARGET: 'There is nothing to catch.',
  FAINTED: 'It has already fainted!',
};

/**
 * How much a major status helps. Unknown or absent statuses give no bonus.
 * @param {string|null} status
 */
export function getStatusCaptureBonus(status) {
  if (!status) return 1;
  return CAPTURE.statusBonuses[status] ?? 1;
}

/** The orb's multiplier, or null if this item is not an orb at all. */
export function getCaptureModifier(item) {
  if (!item || item.effect?.type !== 'capture') return null;

  const modifier = item.effect.modifier;
  if (!Number.isFinite(modifier) || modifier <= 0) {
    console.warn(
      `[capture] Item "${item.id}" is a capture item with no usable modifier.`
    );
    return null;
  }
  return modifier;
}

/**
 * The odds this throw succeeds, as a number between 0 and 1.
 *
 * @param {object} target      the wild creature
 * @param {number} modifier    the orb's multiplier
 * @returns {number} clamped to CAPTURE.minChance..CAPTURE.maxChance, or 0 for a
 *   creature that cannot be caught at all (fainted, or not a real species)
 */
export function calculateCaptureChance(target, modifier = 1) {
  if (!target) return 0;

  // A fainted creature is not caught, it is beaten. Guarding here means every
  // caller gets the rule for free.
  if (target.currentHp <= 0) return 0;

  const species = getSpecies(target.speciesId);
  if (!species) return 0;

  const maxHp = target.stats?.hp || 1;
  const hpFraction = clamp(target.currentHp / maxHp, 0, 1);

  const base = species.catchRate / CAPTURE.catchRateScale;
  const hpFactor = 1 - hpFraction * CAPTURE.hpWeight;
  const statusBonus = getStatusCaptureBonus(target.status);

  const raw = base * hpFactor * statusBonus * modifier * CAPTURE.globalModifier;

  return clamp(raw, CAPTURE.minChance, CAPTURE.maxChance);
}

/**
 * Throw an orb.
 *
 * @param {object} options
 * @param {object} options.target    the wild creature
 * @param {number} options.modifier  the orb's multiplier
 * @param {() => number} [options.random]
 * @returns {{captured: boolean, shakes: number, chance: number}}
 *   `shakes` is 0..shakeChecks. Reaching every check IS the capture, so a
 *   successful throw always reports the full count.
 */
export function attemptCapture({ target, modifier = 1, random = Math.random }) {
  const chance = calculateCaptureChance(target, modifier);

  if (chance <= 0) return { captured: false, shakes: 0, chance: 0 };

  const checks = Math.max(1, CAPTURE.shakeChecks);
  const perCheck = chance ** (1 / checks);

  let shakes = 0;
  for (let i = 0; i < checks; i += 1) {
    if (random() >= perCheck) break;
    shakes += 1;
  }

  return { captured: shakes >= checks, shakes, chance };
}

/**
 * How a failed throw is described, by how close it came. Kept here beside the
 * roll so the words and the numbers can never drift apart.
 */
export function describeShakes(shakes) {
  switch (shakes) {
    case 0:
      return 'Oh no! It broke free immediately!';
    case 1:
      return 'Aargh! Almost had it!';
    case 2:
      return 'Aww! So close!';
    default:
      return 'Shoot! It was so close, too!';
  }
}
