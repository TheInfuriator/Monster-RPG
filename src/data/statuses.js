/**
 * statuses.js
 * ----------------------------------------------------------------------------
 * The lasting conditions a creature can suffer from.
 *
 * A creature carries at most ONE of these at a time. The numbers that decide how
 * badly each one hurts live in `src/config/balance.js` under STATUS, so they can
 * be retuned without touching this file.
 *
 * Phase 4 implements what these DO in battle; this file defines what they ARE,
 * so move data can already refer to them and be validated.
 */

export const STATUS_CONDITIONS = {
  poison: {
    id: 'poison',
    name: 'Poisoned',
    /** Three-letter tag shown next to the HP bar. */
    tag: 'PSN',
    color: 0x9257a8,
    description: 'Loses a little HP at the end of every turn.',
  },
  burn: {
    id: 'burn',
    name: 'Burned',
    tag: 'BRN',
    color: 0xe2703a,
    description: 'Loses HP each turn and deals less damage with physical moves.',
  },
  paralysis: {
    id: 'paralysis',
    name: 'Paralysed',
    tag: 'PAR',
    color: 0xe0be3c,
    description: 'Much slower, and sometimes cannot move at all.',
  },
  sleep: {
    id: 'sleep',
    name: 'Asleep',
    tag: 'SLP',
    color: 0x6d5f9c,
    description: 'Cannot act for a few turns.',
  },
};

/** Every valid status id. Used to validate move data. */
export const STATUS_IDS = Object.keys(STATUS_CONDITIONS);

/** A set for fast checks. */
export const STATUS_SET = new Set(STATUS_IDS);

/** Look up a status. Returns null (and warns) for an unknown id. */
export function getStatus(id) {
  if (!id) return null;

  const status = STATUS_CONDITIONS[id];
  if (!status) {
    console.warn(
      `[statuses] Unknown status "${id}". Known: ${STATUS_IDS.join(', ')}.`
    );
    return null;
  }
  return status;
}
