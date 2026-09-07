/**
 * SightSystem.js
 * ----------------------------------------------------------------------------
 * Whether a trainer can see the player, and which one gets to say so.
 *
 * Pure geometry with no Phaser and no game state: it is handed positions, a
 * facing, a range and a way to ask "does this tile block a view", and it
 * answers. That means every boundary — one tile short, exactly at range, one
 * tile beyond, around a corner, through a tree — is a unit test rather than a
 * walk around the map hoping to notice.
 *
 * THE RULES
 *   A trainer sees only along the ONE direction they face. No diagonals, no
 *   peripheral vision, no seeing behind themselves.
 *
 *   `sightRange: 4` means the four tiles directly ahead: distance 1, 2, 3 and 4
 *   are all visible, distance 5 is not. Distance 0 — standing on the trainer —
 *   is never "seen", because that cannot happen and treating it as a sighting
 *   would make a bad situation worse.
 *
 *   Anything solid between the two blocks the view. The tile the PLAYER stands
 *   on is never tested: they are standing there, so it is obviously reachable
 *   by eye. Only the tiles strictly in between matter.
 */

import { DIRECTION_VECTORS } from '../config/controls.js';

/**
 * Can something at `origin` facing `facing` see the tile at `target`?
 *
 * @param {object} options
 * @param {{x: number, y: number}} options.origin   where the looker stands
 * @param {string} options.facing                   'up' | 'down' | 'left' | 'right'
 * @param {number} options.range                    how many tiles ahead they can see
 * @param {{x: number, y: number}} options.target   where the player stands
 * @param {(x: number, y: number) => boolean} [options.isBlocked]
 *        true if a tile stops a view passing through it
 * @returns {{visible: boolean, distance: number}}
 *          `distance` is how many tiles ahead the target is, whether or not it
 *          is visible — useful for picking the nearest of several trainers.
 */
export function canSee({ origin, facing, range, target, isBlocked = () => false }) {
  const miss = { visible: false, distance: 0 };

  if (!origin || !target) return miss;
  if (!Number.isFinite(range) || range < 1) return miss;

  const vector = DIRECTION_VECTORS[facing];
  if (!vector) return miss;

  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  // The target has to be on the ray, not merely near it. Exactly one axis may
  // differ, and it has to be the axis being looked along.
  const along = vector.x !== 0 ? dx : dy;
  const across = vector.x !== 0 ? dy : dx;
  if (across !== 0) return miss;

  // Facing matters: something behind is not seen however close it is.
  const direction = vector.x !== 0 ? vector.x : vector.y;
  const distance = along * direction;
  if (distance < 1) return miss;
  if (distance > Math.floor(range)) return { visible: false, distance };

  // Everything strictly between has to be see-through. The player's own tile is
  // not tested — they are standing on it.
  for (let step = 1; step < distance; step += 1) {
    const x = origin.x + vector.x * step;
    const y = origin.y + vector.y * step;
    if (isBlocked(x, y)) return { visible: false, distance };
  }

  return { visible: true, distance };
}

/**
 * Of everyone who could see the player, who actually challenges?
 *
 * Exactly one, chosen deterministically: the NEAREST, and on a tie the one
 * whose id sorts first. Nothing random decides it, so the same step always
 * produces the same challenger and a test can rely on it. Everyone else simply
 * waits — they get their turn when the player walks into their lane later.
 *
 * @param {Array<{id: string, x: number, y: number, facing: string, sightRange: number}>} watchers
 * @param {{x: number, y: number}} player
 * @param {(x: number, y: number) => boolean} [isBlocked]
 * @returns {{watcher: object, distance: number}|null}
 */
export function findChallenger(watchers, player, isBlocked = () => false) {
  let best = null;

  for (const watcher of watchers || []) {
    if (!watcher) continue;

    const { visible, distance } = canSee({
      origin: { x: watcher.x, y: watcher.y },
      facing: watcher.facing,
      range: watcher.sightRange,
      target: player,
      isBlocked,
    });
    if (!visible) continue;

    if (
      !best
      || distance < best.distance
      || (distance === best.distance && String(watcher.id) < String(best.watcher.id))
    ) {
      best = { watcher, distance };
    }
  }

  return best;
}

/**
 * Every tile a watcher can currently see, nearest first.
 * Only used by the debug overlay, but it shares the same walk as `canSee`, so
 * what it draws is what the rule actually does.
 */
export function getSightTiles({ origin, facing, range, isBlocked = () => false }) {
  const vector = DIRECTION_VECTORS[facing];
  if (!vector || !Number.isFinite(range)) return [];

  const tiles = [];
  for (let step = 1; step <= Math.floor(range); step += 1) {
    const x = origin.x + vector.x * step;
    const y = origin.y + vector.y * step;

    tiles.push({ x, y });
    // A blocker is the last tile seen — the view stops AT it, not before.
    if (isBlocked(x, y)) break;
  }
  return tiles;
}
