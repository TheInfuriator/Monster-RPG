/**
 * InteractionSystem.js
 * ----------------------------------------------------------------------------
 * Works out what the player is trying to talk to, read, or pick up when they
 * press the confirm key.
 *
 * The rule is simple: you interact with whatever is on the tile you are FACING.
 * There is one deliberate extra rule — if you are facing a counter, we also look
 * at the tile behind it. That is what lets you talk to a shopkeeper or the
 * Mender across their desk, exactly as you would expect.
 *
 * This is written as a plain function that takes lookups rather than a scene, so
 * every rule below is unit tested without a browser.
 */

import { DIRECTION_VECTORS } from '../config/controls.js';

/**
 * @param {object} context
 * @param {import('./TileMap.js').TileMap} context.map
 * @param {(x: number, y: number) => object|null} context.getNpcAt
 * @param {number} context.tileX   the player's tile
 * @param {number} context.tileY
 * @param {string} context.facing
 * @returns {{ kind: 'npc', npc: object, x: number, y: number }
 *          | { kind: 'interactable', target: object, x: number, y: number }
 *          | null}
 */
export function findInteractionTarget({ map, getNpcAt, tileX, tileY, facing }) {
  const vector = DIRECTION_VECTORS[facing];
  if (!vector) return null;

  const x = tileX + vector.x;
  const y = tileY + vector.y;

  if (!map.isInBounds(x, y)) return null;

  // 1. Someone standing right in front of you.
  const npc = getNpcAt ? getNpcAt(x, y) : null;
  if (npc) return { kind: 'npc', npc, x, y };

  // 2. A sign, a shelf, or an item on the ground in front of you.
  const interactable = map.getInteractableAt(x, y);
  if (interactable) return { kind: 'interactable', target: interactable, x, y };

  // 3. Someone standing behind a counter you are facing.
  const tile = map.getTile(x, y);
  if (tile && tile.counter) {
    const behindX = x + vector.x;
    const behindY = y + vector.y;

    if (map.isInBounds(behindX, behindY)) {
      const behindNpc = getNpcAt ? getNpcAt(behindX, behindY) : null;
      if (behindNpc) {
        return { kind: 'npc', npc: behindNpc, x: behindX, y: behindY };
      }
      const behindInteractable = map.getInteractableAt(behindX, behindY);
      if (behindInteractable) {
        return {
          kind: 'interactable',
          target: behindInteractable,
          x: behindX,
          y: behindY,
        };
      }
    }
  }

  return null;
}
